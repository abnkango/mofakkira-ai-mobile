const assert = require('node:assert/strict')
const path = require('node:path')

const buildDir = process.argv[2]
if (!buildDir) throw new Error('Pass the temporary TypeScript build directory as the first argument.')
const { boundNotes, latestCandidates, parseRelevantIds, retrievalPath, buildAnswerMessages } = require(path.join(buildDir, 'assistant', 'assistantService.js'))
const { DEV_TEST_PREFIX, DEV_TEST_FOLDER_ID, makeAssistantTestNotes } = require(path.join(buildDir, 'assistant', 'devTestNotes.js'))

const rows = Array.from({ length: 305 }, (_, index) => ({
  id: `note-${index}`,
  title: `عنوان ${index}`,
  body: `متن ${index}`,
  folderId: null,
  originalFolderId: null,
  createdAt: 10_000 - index,
  updatedAt: 10_000 - index,
  deletedAt: null,
}))
const candidates = latestCandidates(rows, [], { mode: 'all', selectedFolderId: 'all' }, 300)
assert.equal(candidates.length, 300)
assert.equal(candidates[0].id, 'note-0')
assert.equal(candidates[299].id, 'note-299')

const perNoteBound = boundNotes([{ id: 'long', title: '', body: 'x'.repeat(2_500), folderId: null, updatedAt: 1 }])
assert.equal(perNoteBound[0].body.length, 2_000)
const totalBound = boundNotes(Array.from({ length: 6 }, (_, index) => ({ id: `part-${index}`, title: '', body: 'y'.repeat(5_000), folderId: null, updatedAt: index })))
assert.equal(totalBound.reduce((sum, note) => sum + note.body.length, 0), 12_000)
assert.equal(totalBound[0].body.length, 2_000)

assert.equal(retrievalPath(5_999), 'single')
assert.equal(retrievalPath(6_000), 'two-step')
assert.equal(retrievalPath(6_001), 'two-step')
assert.deepEqual(parseRelevantIds('{"ids":[]}', new Set(['a'])), [])
assert.equal(parseRelevantIds('not JSON', new Set(['a'])), null)
const noNotesMessages = buildAnswerMessages('ما الجواب؟', [], [], [])
assert.match(noNotesMessages[0].content, /لا توجد أي ملاحظات مرفقة/)
assert.equal(noNotesMessages.length, 2)
assert.doesNotMatch(noNotesMessages[1].content, /UNTRUSTED_NOTES|<<<NOTE/)

let stableProbeSnapshot = null
for (const count of [15, 100]) {
  const dataset = makeAssistantTestNotes(count, 1_800_000_000_000)
  assert.equal(dataset.notes.length, count)
  assert.ok(dataset.notes.every((note) => note.id.startsWith(DEV_TEST_PREFIX)))
  assert.ok(dataset.notes.every((note) => note.body.length >= 150 && note.body.length <= 900))
  assert.ok(dataset.notes.every((note) => note.folderId === DEV_TEST_FOLDER_ID || note.folderId === null))
  assert.equal(dataset.notes.filter((note) => note.folderId === DEV_TEST_FOLDER_ID).length, Math.round(count * 0.4))
  assert.ok(dataset.notes.reduce((sum, note) => sum + note.title.length + note.body.length, 0) > 6_000)
  const currentProbeSnapshot = new Map()
  for (const id of ['dev-test-probe-order-77231', 'dev-test-probe-car-service', 'dev-test-probe-meeting-salma', 'dev-test-probe-order-77213', 'dev-test-probe-electric-bill']) {
    const probe = dataset.notes.find((note) => note.id === id)
    assert.ok(probe, `missing reference probe ${id} for ${count}`)
    currentProbeSnapshot.set(id, { title: probe.title, body: probe.body })
  }
  if (stableProbeSnapshot) assert.deepEqual(currentProbeSnapshot, stableProbeSnapshot, 'probe text must be stable across dataset sizes')
  else stableProbeSnapshot = currentProbeSnapshot
  assert.ok(dataset.notes.filter((note) => note.id.includes('-filler-')).every((note) => !/77231|77213|51804|ورشة الأمين|سلمى/u.test(note.title + note.body)))
}

console.log('PASS: candidate cap/order, per-note and total bounds, retrieval threshold, empty IDs, no-note prompt, and 15/100 DEV fixtures')

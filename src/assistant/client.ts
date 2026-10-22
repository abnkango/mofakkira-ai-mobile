export type ChatRole = 'system' | 'user' | 'assistant'
export type ChatMessage = { role: ChatRole; content: string }
export type AssistantErrorKind = 'invalid_key' | 'model_unavailable' | 'rate_limit' | 'provider' | 'network' | 'cancelled' | 'response'

const errorMessages: Record<AssistantErrorKind, string> = {
  invalid_key: 'مفتاح API غير صالح أو مرفوض. تحقّق من المفتاح في الإعدادات.',
  model_unavailable: 'النموذج غير متاح. غيّر اسمه من الإعدادات.',
  rate_limit: 'تم تجاوز الحد أو الحصة المتاحة لدى المزود. حاول لاحقًا.',
  provider: 'حدث خلل لدى مزود الذكاء الاصطناعي. حاول مرة أخرى لاحقًا.',
  network: 'تعذّر الاتصال أو انتهت مهلة الطلب. تحقّق من الإنترنت وحاول مجددًا.',
  cancelled: 'أُلغي الطلب.',
  response: 'تعذّر قراءة رد المزود. حاول مرة أخرى.',
}

export class AssistantError extends Error {
  readonly kind: AssistantErrorKind
  readonly status?: number

  constructor(kind: AssistantErrorKind, status?: number) {
    super(errorMessages[kind])
    this.name = 'AssistantError'
    this.kind = kind
    this.status = status
  }
}

export type ChatOptions = {
  baseUrl: string
  apiKey: string
  model: string
  messages: ChatMessage[]
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
}

type CompletionResponse = { choices?: { message?: { content?: unknown } }[] }

const endpointFor = (baseUrl: string): string => `${baseUrl.trim().replace(/\/+$/, '')}/chat/completions`

const errorKindForStatus = (status: number): AssistantErrorKind => {
  if (status === 401 || status === 403) return 'invalid_key'
  if (status === 404) return 'model_unavailable'
  if (status === 429) return 'rate_limit'
  if (status >= 500) return 'provider'
  return 'response'
}

export const chat = async ({ baseUrl, apiKey, model, messages, signal, temperature, maxTokens }: ChatOptions): Promise<string> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45_000)
  const cancel = (): void => controller.abort()
  if (signal?.aborted) controller.abort()
  else signal?.addEventListener('abort', cancel, { once: true })
  try {
    let response: Response
    try {
      response = await fetch(endpointFor(baseUrl), {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, ...(temperature === undefined ? {} : { temperature }), ...(maxTokens === undefined ? {} : { max_tokens: maxTokens }) }),
        signal: controller.signal,
      })
    } catch {
      if (signal?.aborted) throw new AssistantError('cancelled')
      throw new AssistantError('network')
    }
    if (!response.ok) throw new AssistantError(errorKindForStatus(response.status), response.status)
    let payload: CompletionResponse
    try { payload = await response.json() as CompletionResponse } catch { throw new AssistantError('response') }
    const content = payload.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) throw new AssistantError('response')
    return content
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', cancel)
  }
}

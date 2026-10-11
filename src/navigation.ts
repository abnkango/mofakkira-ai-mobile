import { useCallback } from 'react'
import { useRouter } from 'expo-router'

export type AppRouter = {
  canGoBack: () => boolean
  back: () => void
  replace: (href: '/notes') => void
}

export const goBackOrNotes = (router: AppRouter): void => {
  if (router.canGoBack()) router.back()
  else router.replace('/notes')
}

export const useGoBackOrNotes = (): (() => void) => {
  const router = useRouter()
  return useCallback(() => goBackOrNotes(router), [router])
}

import { useEffect } from 'react'

const APP_NAME = 'AlaSpace'

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title === APP_NAME ? APP_NAME : `${title} · ${APP_NAME}`
  }, [title])
}

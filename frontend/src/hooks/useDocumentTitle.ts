import { useEffect } from 'react'
import { useTranslation } from '../i18n/useTranslation'

/** Sets the browser tab title; `pageTitle` is already translated. `null` shows only the app name. */
export function useDocumentTitle(pageTitle: string | null): void {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = pageTitle ? t('app.documentTitle', { page: pageTitle }) : t('app.name')
  }, [pageTitle, t])
}

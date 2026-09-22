import { useContext } from 'react'
import { I18nContext, type I18nContextValue } from './I18nContext'

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useTranslation must be used within an I18nProvider')
  return context
}

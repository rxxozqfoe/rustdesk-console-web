import { useTranslation } from 'react-i18next'

export default function TokensPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('settings.tokens.title')}</h1>
    </div>
  )
}

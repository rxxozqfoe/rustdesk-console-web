import { useTranslation } from 'react-i18next'

export default function ShareRecordsPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('settings.share_records.title')}</h1>
    </div>
  )
}

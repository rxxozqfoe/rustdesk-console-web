import { useTranslation } from 'react-i18next'

export default function LoginLogsPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('settings.login_logs.title')}</h1>
    </div>
  )
}

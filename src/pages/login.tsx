import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh items-center justify-center">
      <h1 className="text-2xl font-bold">{t('login.title')}</h1>
    </div>
  )
}

import { useTranslation } from 'react-i18next'

export default function UsersPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('users.title')}</h1>
    </div>
  )
}

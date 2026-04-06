import { useTranslation } from 'react-i18next'

export default function GroupsPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('groups.title')}</h1>
    </div>
  )
}

import { useTranslation } from 'react-i18next'

export default function CommandsPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('settings.commands.title')}</h1>
    </div>
  )
}

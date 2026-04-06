import { useTranslation } from 'react-i18next'

export default function CustomClientsPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('custom_clients.title')}</h1>
      <p className="text-muted-foreground mt-2">{t('custom_clients.pro_only')}</p>
    </div>
  )
}

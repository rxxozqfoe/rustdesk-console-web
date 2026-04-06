import { useTranslation } from 'react-i18next'

export default function DevicesPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('devices.title')}</h1>
    </div>
  )
}

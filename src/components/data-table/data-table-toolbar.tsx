import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FilterField {
  key: string
  label: string
  value: string
  onChange: (value: string) => void
}

interface DataTableToolbarProps {
  filters?: FilterField[]
  onSearch: () => void
  onReset: () => void
  actions?: ReactNode
}

export function DataTableToolbar({ filters, onSearch, onReset, actions }: DataTableToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      {filters?.map((filter) => (
        <Input
          key={filter.key}
          placeholder={filter.label}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="h-8 w-[150px]"
          onKeyDown={(e) => { if (e.key === 'Enter') onSearch() }}
        />
      ))}
      {filters && filters.length > 0 && (
        <>
          <Button variant="outline" size="sm" onClick={onSearch}>
            <Search className="size-4" />
            {t('common.query')}
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset}>
            {t('common.reset')}
          </Button>
        </>
      )}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}

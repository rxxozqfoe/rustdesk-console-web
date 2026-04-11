import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { Badge } from '@/components/ui/badge'
import { getWorkers } from '@/services/worker.service'
import type { Worker } from '@/types/worker'

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function WorkersPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data, isLoading } = useQuery({
    queryKey: ['workers', page, pageSize],
    queryFn: () => getWorkers({ page, page_size: pageSize }),
    refetchInterval: 15000,
  })

  const workers = data?.list ?? []
  const total = data?.total ?? 0

  const columns: ColumnDef<Worker>[] = [
    {
      accessorKey: 'name',
      header: t('workers.name'),
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.name}</span>,
    },
    {
      id: 'status',
      header: t('workers.status'),
      cell: ({ row }) => {
        const online = row.original.status === 'online'
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-block size-2 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`}
            />
            <Badge
              variant={online ? 'secondary' : 'outline'}
              className={
                online
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400'
                  : 'text-muted-foreground'
              }
            >
              {t(online ? 'workers.online' : 'workers.offline')}
            </Badge>
          </div>
        )
      },
    },
    {
      id: 'platforms',
      header: t('workers.platforms'),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.platforms || []).map((p, i) => (
            <Badge key={i} variant="outline" className="font-mono text-xs">
              {p.platform}/{p.arch}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'versions',
      header: t('workers.versions'),
      cell: ({ row }) => {
        const count = row.original.versions?.length ?? 0
        return (
          <span className="text-muted-foreground text-sm">
            {count > 0 ? `${count} ${t('workers.versions_available')}` : '—'}
          </span>
        )
      },
    },
    {
      id: 'last_seen',
      header: t('workers.last_seen'),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatRelativeTime(row.original.last_seen_at)}
        </span>
      ),
    },
  ]

  const table = useReactTable({
    data: workers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('workers.title')}</h1>

      <DataTable table={table} columns={columns} isLoading={isLoading} />

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { getMyPeers } from '@/services/my-peer.service'
import type { MyPeer, MyPeerQuery } from '@/types/my-peer'

const THIRTY_MINUTES_MS = 30 * 60 * 1000

function isOnline(lastOnlineTime: string | number): boolean {
  const ts = Number(lastOnlineTime)
  if (!ts) return false
  return Date.now() - ts * 1000 < THIRTY_MINUTES_MS
}

function formatOnlineTime(lastOnlineTime: string | number): string {
  const ts = Number(lastOnlineTime)
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString()
}

export default function MyDevicesPage() {
  const { t } = useTranslation()

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Search filters
  const [filterIdInput, setFilterIdInput] = useState('')
  const [filterHostnameInput, setFilterHostnameInput] = useState('')
  const [searchParams, setSearchParams] = useState({ id: '', hostname: '' })

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ['my-peers', page, pageSize, searchParams],
    queryFn: () =>
      getMyPeers({
        page,
        page_size: pageSize,
        id: searchParams.id || undefined,
        hostname: searchParams.hostname || undefined,
      } as MyPeerQuery),
  })

  const peers = data?.list ?? []
  const total = data?.total ?? 0

  // Handlers
  function handleSearch() {
    setPage(1)
    setSearchParams({
      id: filterIdInput,
      hostname: filterHostnameInput,
    })
  }

  function handleReset() {
    setFilterIdInput('')
    setFilterHostnameInput('')
    setPage(1)
    setSearchParams({ id: '', hostname: '' })
  }

  // Columns
  const columns: ColumnDef<MyPeer>[] = [
    {
      accessorKey: 'id',
      header: t('devices.id'),
    },
    {
      accessorKey: 'hostname',
      header: t('devices.hostname'),
    },
    {
      accessorKey: 'alias',
      header: t('devices.alias'),
    },
    {
      accessorKey: 'os',
      header: t('devices.os'),
    },
    {
      accessorKey: 'version',
      header: t('devices.version'),
    },
    {
      id: 'last_online',
      header: t('devices.last_online'),
      cell: ({ row }) => {
        const online = isOnline(row.original.last_online_time)
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-block size-2 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`}
            />
            <span>{formatOnlineTime(row.original.last_online_time)}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'last_online_ip',
      header: t('devices.last_ip'),
    },
  ]

  const table = useReactTable({
    data: peers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('my.devices_title')}</h1>

      <DataTableToolbar
        filters={[
          {
            key: 'id',
            label: t('devices.id'),
            value: filterIdInput,
            onChange: setFilterIdInput,
          },
          {
            key: 'hostname',
            label: t('devices.hostname'),
            value: filterHostnameInput,
            onChange: setFilterHostnameInput,
          },
        ]}
        onSearch={handleSearch}
        onReset={handleReset}
      />

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

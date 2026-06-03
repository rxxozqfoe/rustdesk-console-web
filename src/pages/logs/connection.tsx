import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { Trash2, Unplug } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  getAuditConns,
  deleteAuditConn,
  batchDeleteAuditConns,
  disconnectAuditConn,
} from '@/services/audit.service'
import type { AuditConn } from '@/types/audit'

function formatDate(value: string | number): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

export default function ConnectionLogsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Filters (input state)
  const [filterPeerId, setFilterPeerId] = useState('')
  const [filterFromPeer, setFilterFromPeer] = useState('')

  // Filters (applied/search state)
  const [searchPeerId, setSearchPeerId] = useState('')
  const [searchFromPeer, setSearchFromPeer] = useState('')

  // Row selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Dialog state
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [disconnectTarget, setDisconnectTarget] = useState<AuditConn | null>(null)

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ['audit-conns', page, pageSize, searchPeerId, searchFromPeer],
    queryFn: () =>
      getAuditConns({
        page,
        page_size: pageSize,
        peer_id: searchPeerId || undefined,
        from_peer: searchFromPeer || undefined,
      }),
  })

  const records = data?.list ?? []
  const total = data?.total ?? 0

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAuditConn(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['audit-conns'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const disconnectMutation = useMutation({
    mutationFn: (record: AuditConn) => disconnectAuditConn(record.peer_id, [record.conn_id]),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['audit-conns'] })
      setDisconnectTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => batchDeleteAuditConns(ids),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['audit-conns'] })
      setSelectedIds(new Set())
      setBatchDeleteOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Selection helpers
  const isAllSelected = records.length > 0 && records.every((r) => selectedIds.has(r.id))
  const isIndeterminate = records.some((r) => selectedIds.has(r.id)) && !isAllSelected

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        records.forEach((r) => next.add(r.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        records.forEach((r) => next.delete(r.id))
        return next
      })
    }
  }

  function toggleRow(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  // Columns
  const columns: ColumnDef<AuditConn>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onCheckedChange={(val) => toggleAll(!!val)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={(val) => toggleRow(row.original.id, !!val)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: 'peer_id',
      header: t('logs.connection.peer_id'),
    },
    {
      accessorKey: 'from_peer',
      header: t('logs.connection.from_peer'),
    },
    {
      accessorKey: 'from_name',
      header: t('logs.connection.from_name'),
    },
    {
      accessorKey: 'ip',
      header: t('logs.connection.ip'),
    },
    {
      accessorKey: 'action',
      header: t('logs.connection.action'),
    },
    {
      accessorKey: 'type',
      header: t('logs.connection.type'),
    },
    {
      accessorKey: 'session_id',
      header: t('logs.connection.session_id'),
    },
    {
      id: 'created_at',
      header: t('common.created_at'),
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {!row.original.close_time && (
            <Button variant="ghost" size="sm" onClick={() => setDisconnectTarget(row.original)}>
              <Unplug className="text-destructive size-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original.id)}>
            <Trash2 className="text-destructive size-4" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('logs.connection.title')}</h1>

      <DataTableToolbar
        filters={[
          {
            key: 'peer_id',
            label: t('logs.connection.peer_id'),
            value: filterPeerId,
            onChange: setFilterPeerId,
          },
          {
            key: 'from_peer',
            label: t('logs.connection.from_peer'),
            value: filterFromPeer,
            onChange: setFilterFromPeer,
          },
        ]}
        onSearch={() => {
          setSearchPeerId(filterPeerId)
          setSearchFromPeer(filterFromPeer)
          setPage(1)
        }}
        onReset={() => {
          setFilterPeerId('')
          setFilterFromPeer('')
          setSearchPeerId('')
          setSearchFromPeer('')
          setPage(1)
        }}
        actions={
          selectedIds.size > 0 ? (
            <Button variant="destructive" size="sm" onClick={() => setBatchDeleteOpen(true)}>
              <Trash2 className="size-4" />
              {t('common.batch_delete')} ({selectedIds.size})
            </Button>
          ) : undefined
        }
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

      {/* Single Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={() => {
          if (deleteTarget !== null) deleteMutation.mutate(deleteTarget)
        }}
        loading={deleteMutation.isPending}
      />

      {/* Disconnect Confirmation */}
      <ConfirmDialog
        open={disconnectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDisconnectTarget(null)
        }}
        description={t('logs.connection.confirm_disconnect')}
        onConfirm={() => {
          if (disconnectTarget !== null) disconnectMutation.mutate(disconnectTarget)
        }}
        loading={disconnectMutation.isPending}
      />

      {/* Batch Delete Confirmation */}
      <ConfirmDialog
        open={batchDeleteOpen}
        onOpenChange={setBatchDeleteOpen}
        description={t('common.confirm_batch_delete')}
        onConfirm={() => batchDeleteMutation.mutate(Array.from(selectedIds))}
        loading={batchDeleteMutation.isPending}
      />
    </div>
  )
}

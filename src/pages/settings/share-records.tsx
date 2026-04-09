import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  getShareRecords,
  deleteShareRecord,
  batchDeleteShareRecords,
} from '@/services/share-record.service'
import type { ShareRecord } from '@/types/share-record'

function formatDate(value: string | number): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

function formatTimestamp(ts: number): string {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString()
}

export default function ShareRecordsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Row selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Dialog state
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ['share-records', page, pageSize],
    queryFn: () => getShareRecords({ page, page_size: pageSize }),
  })

  const list = data?.list ?? []
  const total = data?.total ?? 0

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteShareRecord(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['share-records'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => batchDeleteShareRecords(ids),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['share-records'] })
      setSelectedIds(new Set())
      setBatchDeleteOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Row selection helpers
  const isAllSelected = list.length > 0 && list.every((r) => selectedIds.has(r.id))
  const isIndeterminate = list.some((r) => selectedIds.has(r.id)) && !isAllSelected

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        list.forEach((r) => next.add(r.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        list.forEach((r) => next.delete(r.id))
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
  const columns: ColumnDef<ShareRecord>[] = [
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
      accessorKey: 'user_id',
      header: t('settings.share_records.user_id'),
    },
    {
      accessorKey: 'peer_id',
      header: t('settings.share_records.peer_id'),
    },
    {
      accessorKey: 'share_token',
      header: t('settings.share_records.share_token'),
    },
    {
      accessorKey: 'password_type',
      header: t('settings.share_records.password_type'),
    },
    {
      accessorKey: 'expire',
      header: t('settings.share_records.expire'),
      cell: ({ row }) => formatTimestamp(row.original.expire),
    },
    {
      accessorKey: 'created_at',
      header: t('common.created_at'),
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original.id)}>
          <Trash2 className="text-destructive size-4" />
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: list,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('settings.share_records.title')}</h1>
        {selectedIds.size > 0 && (
          <Button variant="destructive" size="sm" onClick={() => setBatchDeleteOpen(true)}>
            <Trash2 className="size-4" />
            {t('common.batch_delete')} ({selectedIds.size})
          </Button>
        )}
      </div>

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

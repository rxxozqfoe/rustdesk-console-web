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
  getMyShareRecords,
  deleteMyShareRecord,
  batchDeleteMyShareRecords,
} from '@/services/my-share-record.service'
import type { MyShareRecord } from '@/types/my-share-record'

function formatTimestamp(ts: number): string {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString()
}

function formatDate(value: string | number): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

export default function MyShareRecordsPage() {
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
    queryKey: ['my-share-records', page, pageSize],
    queryFn: () => getMyShareRecords({ page, page_size: pageSize }),
  })

  const records = data?.list ?? []
  const total = data?.total ?? 0

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMyShareRecord(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-share-records'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => batchDeleteMyShareRecords(ids),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-share-records'] })
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
  const columns: ColumnDef<MyShareRecord>[] = [
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
      header: t('my.share_peer_id'),
    },
    {
      accessorKey: 'share_token',
      header: t('my.share_token'),
    },
    {
      accessorKey: 'password_type',
      header: t('my.share_password_type'),
    },
    {
      id: 'expire',
      header: t('my.share_expire'),
      cell: ({ row }) => formatTimestamp(row.original.expire),
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
      <h1 className="text-2xl font-bold">{t('my.share_records_title')}</h1>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={() => setBatchDeleteOpen(true)}>
            <Trash2 className="size-4" />
            {t('common.batch_delete')} ({selectedIds.size})
          </Button>
        </div>
      )}

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

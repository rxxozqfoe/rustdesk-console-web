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
import { getUserTokens, deleteUserToken, batchDeleteUserTokens } from '@/services/user-token.service'
import type { UserToken } from '@/types/user-token'

function formatDate(value: string | number): string {
  if (!value) return '—'
  try { return new Date(value).toLocaleString() } catch { return String(value) }
}

function formatTimestamp(ts: number): string {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString()
}

export default function TokensPage() {
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
    queryKey: ['user-tokens', page, pageSize],
    queryFn: () => getUserTokens({ page, page_size: pageSize }),
  })

  const list = data?.list ?? []
  const total = data?.total ?? 0

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUserToken(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['user-tokens'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => batchDeleteUserTokens(ids),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['user-tokens'] })
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
  const columns: ColumnDef<UserToken>[] = [
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
      header: t('settings.tokens.user_id'),
    },
    {
      accessorKey: 'device_id',
      header: t('settings.tokens.device_id'),
    },
    {
      accessorKey: 'device_uuid',
      header: t('settings.tokens.device_uuid'),
    },
    {
      accessorKey: 'token',
      header: t('settings.tokens.token'),
      cell: ({ row }) => {
        const token = row.original.token
        if (!token) return '—'
        return token.length > 20 ? token.slice(0, 20) + '...' : token
      },
    },
    {
      accessorKey: 'expired_at',
      header: t('settings.tokens.expired_at'),
      cell: ({ row }) => formatTimestamp(row.original.expired_at),
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteTarget(row.original.id)}
        >
          <Trash2 className="size-4 text-destructive" />
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
        <h1 className="text-2xl font-bold">{t('settings.tokens.title')}</h1>
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBatchDeleteOpen(true)}
          >
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
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={() => { if (deleteTarget !== null) deleteMutation.mutate(deleteTarget) }}
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

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { getAuditFiles, deleteAuditFile, batchDeleteAuditFiles } from '@/services/audit.service'
import type { AuditFile } from '@/types/audit'

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export default function FileLogsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Search filters
  const [filterPeerIdInput, setFilterPeerIdInput] = useState('')
  const [filterFromPeerInput, setFilterFromPeerInput] = useState('')
  const [searchPeerId, setSearchPeerId] = useState('')
  const [searchFromPeer, setSearchFromPeer] = useState('')

  // Row selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Dialog state
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ['audit-files', page, pageSize, searchPeerId, searchFromPeer],
    queryFn: () =>
      getAuditFiles({
        page,
        page_size: pageSize,
        peer_id: searchPeerId || undefined,
        from_peer: searchFromPeer || undefined,
      }),
  })

  const files = data?.list ?? []
  const total = data?.total ?? 0

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAuditFile(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['audit-files'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => batchDeleteAuditFiles(ids),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['audit-files'] })
      setSelectedIds(new Set())
      setBatchDeleteOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Handlers
  function handleSearch() {
    setPage(1)
    setSearchPeerId(filterPeerIdInput)
    setSearchFromPeer(filterFromPeerInput)
  }

  function handleReset() {
    setFilterPeerIdInput('')
    setFilterFromPeerInput('')
    setPage(1)
    setSearchPeerId('')
    setSearchFromPeer('')
  }

  const isAllSelected = files.length > 0 && files.every((f) => selectedIds.has(f.id))
  const isIndeterminate = files.some((f) => selectedIds.has(f.id)) && !isAllSelected

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        files.forEach((f) => next.add(f.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        files.forEach((f) => next.delete(f.id))
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
  const columns: ColumnDef<AuditFile>[] = [
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
      accessorKey: 'path',
      header: t('logs.file.path'),
    },
    {
      accessorKey: 'is_file',
      header: t('logs.file.is_file'),
      cell: ({ row }) => (row.original.is_file ? 'Yes' : 'No'),
    },
    {
      accessorKey: 'ip',
      header: t('logs.connection.ip'),
    },
    {
      accessorKey: 'num',
      header: t('logs.file.num'),
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
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original.id)}>
            <Trash2 className="text-destructive size-4" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: files,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('logs.file.title')}</h1>

      <DataTableToolbar
        filters={[
          {
            key: 'peer_id',
            label: t('logs.connection.peer_id'),
            value: filterPeerIdInput,
            onChange: setFilterPeerIdInput,
          },
          {
            key: 'from_peer',
            label: t('logs.connection.from_peer'),
            value: filterFromPeerInput,
            onChange: setFilterFromPeerInput,
          },
        ]}
        onSearch={handleSearch}
        onReset={handleReset}
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

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from '@tanstack/react-table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getPeers, createPeer, updatePeer, deletePeer, batchDeletePeers } from '@/services/peer.service'
import { getGroups } from '@/services/group.service'
import type { Peer, PeerForm } from '@/types/peer'
import type { DeviceGroup } from '@/types/group'

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

const peerSchema = z.object({
  id: z.string().min(1),
  alias: z.string().optional(),
  device_group_id: z.number().optional(),
  note: z.string().optional(),
})

type PeerSchemaValues = z.infer<typeof peerSchema>

export default function DevicesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Search filters
  const [filterIdInput, setFilterIdInput] = useState('')
  const [filterHostnameInput, setFilterHostnameInput] = useState('')
  const [filterUsernameInput, setFilterUsernameInput] = useState('')
  const [searchParams, setSearchParams] = useState({ id: '', hostname: '', username: '' })

  // Row selection (Set of row_id)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPeer, setEditingPeer] = useState<Peer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)

  // Queries
  const { data: peersData, isLoading } = useQuery({
    queryKey: ['peers', page, pageSize, searchParams],
    queryFn: () =>
      getPeers({
        page,
        page_size: pageSize,
        id: searchParams.id || undefined,
        hostname: searchParams.hostname || undefined,
        username: searchParams.username || undefined,
      }),
  })

  const { data: groupsData } = useQuery({
    queryKey: ['device-groups-all'],
    queryFn: () => getGroups({ page: 1, page_size: 1000 }),
  })

  const peers = peersData?.list ?? []
  const total = peersData?.total ?? 0
  const groups = (groupsData?.list ?? []) as DeviceGroup[]

  // Form
  const form = useForm<PeerSchemaValues, unknown, PeerSchemaValues>({
    resolver: zodResolver(peerSchema),
    defaultValues: { id: '', alias: '', device_group_id: undefined, note: '' },
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: PeerForm) => createPeer(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['peers'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (data: PeerForm) => updatePeer(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['peers'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (rowId: number) => deletePeer(rowId),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['peers'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (rowIds: number[]) => batchDeletePeers(rowIds),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['peers'] })
      setSelectedIds(new Set())
      setBatchDeleteOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Handlers
  function handleSearch() {
    setPage(1)
    setSearchParams({
      id: filterIdInput,
      hostname: filterHostnameInput,
      username: filterUsernameInput,
    })
  }

  function handleReset() {
    setFilterIdInput('')
    setFilterHostnameInput('')
    setFilterUsernameInput('')
    setPage(1)
    setSearchParams({ id: '', hostname: '', username: '' })
  }

  function openAddDialog() {
    setEditingPeer(null)
    form.reset({ id: '', alias: '', device_group_id: undefined, note: '' })
    setDialogOpen(true)
  }

  function openEditDialog(peer: Peer) {
    setEditingPeer(peer)
    form.reset({
      id: peer.id,
      alias: peer.alias ?? '',
      device_group_id: peer.device_group_id || undefined,
      note: peer.note ?? '',
    })
    setDialogOpen(true)
  }

  function handleSubmit(values: PeerSchemaValues) {
    if (editingPeer) {
      updateMutation.mutate({ ...values, row_id: editingPeer.row_id })
    } else {
      createMutation.mutate(values)
    }
  }

  const isAllSelected = peers.length > 0 && peers.every((p) => selectedIds.has(p.row_id))
  const isIndeterminate = peers.some((p) => selectedIds.has(p.row_id)) && !isAllSelected

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        peers.forEach((p) => next.add(p.row_id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        peers.forEach((p) => next.delete(p.row_id))
        return next
      })
    }
  }

  function toggleRow(rowId: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(rowId)
      else next.delete(rowId)
      return next
    })
  }

  // Columns
  const columns: ColumnDef<Peer>[] = [
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
          checked={selectedIds.has(row.original.row_id)}
          onCheckedChange={(val) => toggleRow(row.original.row_id, !!val)}
          aria-label="Select row"
        />
      ),
    },
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
      id: 'username',
      header: t('devices.username'),
      cell: ({ row }) => row.original.user?.username ?? row.original.username ?? '—',
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
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(row.original.row_id)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: peers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  const isMutating =
    createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('devices.title')}</h1>

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
          {
            key: 'username',
            label: t('devices.username'),
            value: filterUsernameInput,
            onChange: setFilterUsernameInput,
          },
        ]}
        onSearch={handleSearch}
        onReset={handleReset}
        actions={
          <>
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
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="size-4" />
              {t('common.add')}
            </Button>
          </>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPeer ? t('common.edit') : t('common.add')}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('devices.id')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!editingPeer} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('devices.alias')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="device_group_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('devices.group')}</FormLabel>
                    <Select
                      value={field.value != null ? String(field.value) : ''}
                      onValueChange={(val) =>
                        field.onChange(val === '' ? undefined : Number(val))
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">—</SelectItem>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('devices.note')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isMutating}>
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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

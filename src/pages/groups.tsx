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
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from '@/services/group.service'
import type { Group, GroupForm } from '@/types/group'

function formatDate(value: string | number): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

const groupSchema = z.object({
  name: z.string().min(1),
  type: z.coerce.number().optional(),
})

type GroupSchemaValues = z.infer<typeof groupSchema>

export default function GroupsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  // Query
  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['groups', page, pageSize],
    queryFn: () => getGroups({ page, page_size: pageSize }),
  })

  const groups = groupsData?.list ?? []
  const total = groupsData?.total ?? 0

  // Form
  const form = useForm<GroupSchemaValues, unknown, GroupSchemaValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '', type: undefined },
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: GroupForm) => createGroup(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (data: GroupForm) => updateGroup(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteGroup(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Handlers
  function openAddDialog() {
    setEditingGroup(null)
    form.reset({ name: '', type: undefined })
    setDialogOpen(true)
  }

  function openEditDialog(group: Group) {
    setEditingGroup(group)
    form.reset({ name: group.name, type: group.type })
    setDialogOpen(true)
  }

  function handleSubmit(values: GroupSchemaValues) {
    if (editingGroup) {
      updateMutation.mutate({ ...values, id: editingGroup.id })
    } else {
      createMutation.mutate(values)
    }
  }

  // Columns
  const columns: ColumnDef<Group>[] = [
    {
      accessorKey: 'name',
      header: t('groups.name'),
    },
    {
      accessorKey: 'type',
      header: t('groups.type'),
      cell: ({ row }) => {
        const groupType = row.original.type
        if (groupType === 1) {
          return <Badge variant="default">{t('groups.common_group')}</Badge>
        }
        if (groupType === 2) {
          return <Badge variant="secondary">{t('groups.shared_group')}</Badge>
        }
        return '—'
      },
    },
    {
      accessorKey: 'created_at',
      header: t('groups.created_at'),
      cell: ({ row }) => formatDate(row.original.created_at),
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
            onClick={() => setDeleteTarget(row.original.id)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: groups,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('groups.title')}</h1>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="size-4" />
          {t('common.add')}
        </Button>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? t('common.edit') : t('common.add')}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('groups.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('groups.type')}</FormLabel>
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
                        <SelectItem value="1">{t('groups.common_group')}</SelectItem>
                        <SelectItem value="2">{t('groups.shared_group')}</SelectItem>
                      </SelectContent>
                    </Select>
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

      {/* Delete Confirmation */}
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
    </div>
  )
}

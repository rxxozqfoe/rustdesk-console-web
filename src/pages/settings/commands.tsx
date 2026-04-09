import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Send } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  getServerCmds,
  createServerCmd,
  deleteServerCmd,
  sendCmd,
} from '@/services/server-cmd.service'
import type { ServerCmd, ServerCmdForm } from '@/types/server-cmd'

// ─── Zod schema ──────────────────────────────────────────────────────────────

const cmdSchema = z.object({
  cmd: z.string().min(1),
  alias: z.string().optional().or(z.literal('')),
  option: z.string().optional().or(z.literal('')),
  explain: z.string().optional().or(z.literal('')),
  target: z.string().min(1),
})

type CmdSchemaValues = z.infer<typeof cmdSchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value: string | number): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommandsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  // ─── Queries ─────────────────────────────────────────────────────────────

  const { data: cmdsData, isLoading } = useQuery({
    queryKey: ['server-cmds', page, pageSize],
    queryFn: () => getServerCmds({ page, page_size: pageSize }),
  })

  const cmds = cmdsData?.list ?? []
  const total = cmdsData?.total ?? 0

  // ─── Form ────────────────────────────────────────────────────────────────

  const form = useForm<CmdSchemaValues, unknown, CmdSchemaValues>({
    resolver: zodResolver(cmdSchema),
    defaultValues: { cmd: '', alias: '', option: '', explain: '', target: '' },
  })

  // ─── Mutations ───────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: ServerCmdForm) => createServerCmd(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['server-cmds'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteServerCmd(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['server-cmds'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const sendMutation = useMutation({
    mutationFn: (data: { cmd: string; target: string }) => sendCmd(data),
    onSuccess: (result) => {
      toast.success(result || t('common.success'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ─── Handlers ────────────────────────────────────────────────────────────

  function openAddDialog() {
    form.reset({ cmd: '', alias: '', option: '', explain: '', target: '' })
    setDialogOpen(true)
  }

  function handleSubmit(values: CmdSchemaValues) {
    createMutation.mutate(values)
  }

  function handleSend(row: ServerCmd) {
    sendMutation.mutate({
      cmd: row.cmd + ' ' + (row.option || ''),
      target: row.target,
    })
  }

  // ─── Columns ─────────────────────────────────────────────────────────────

  const columns: ColumnDef<ServerCmd>[] = [
    {
      accessorKey: 'cmd',
      header: t('settings.commands.cmd'),
    },
    {
      accessorKey: 'alias',
      header: t('settings.commands.alias'),
    },
    {
      accessorKey: 'option',
      header: t('settings.commands.option'),
    },
    {
      accessorKey: 'explain',
      header: t('settings.commands.explain'),
    },
    {
      accessorKey: 'target',
      header: t('settings.commands.target'),
      cell: ({ row }) => {
        const target = row.original.target
        if (target === '21115') return t('settings.commands.id_server')
        if (target === '21117') return t('settings.commands.relay_server')
        return target
      },
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
          <Button
            variant="ghost"
            size="sm"
            title={t('settings.commands.send')}
            onClick={() => handleSend(row.original)}
          >
            <Send className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title={t('common.delete')}
            onClick={() => setDeleteTarget(row.original.id)}
          >
            <Trash2 className="text-destructive size-4" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: cmds,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('settings.commands.title')}</h1>
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

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.add')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cmd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.commands.cmd')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>{t('settings.commands.alias')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="option"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.commands.option')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="explain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.commands.explain')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.commands.target')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="21115">{t('settings.commands.id_server')}</SelectItem>
                        <SelectItem value="21117">{t('settings.commands.relay_server')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
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

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
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
import { Switch } from '@/components/ui/switch'

import {
  getOAuthProviders,
  createOAuthProvider,
  updateOAuthProvider,
  deleteOAuthProvider,
} from '@/services/oauth.service'
import type { OAuth, OAuthForm } from '@/types/oauth'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: string | number): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const oauthSchema = z.object({
  op: z.string().min(1),
  oauth_type: z.string().optional().or(z.literal('')),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  issuer: z.string().optional().or(z.literal('')),
  scopes: z.string().optional().or(z.literal('')),
  auto_register: z.boolean().optional(),
  pkce_enable: z.boolean().optional(),
  pkce_method: z.string().optional().or(z.literal('')),
})

type OAuthFormValues = z.infer<typeof oauthSchema>

// ─── Component ────────────────────────────────────────────────────────────────

export default function OAuthPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog state
  const [editingOAuth, setEditingOAuth] = useState<OAuth | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<OAuth | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: oauthData, isLoading } = useQuery({
    queryKey: ['oauth-providers', page, pageSize],
    queryFn: () => getOAuthProviders({ page, page_size: pageSize }),
  })

  const providers = oauthData?.list ?? []
  const total = oauthData?.total ?? 0

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: createOAuthProvider,
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['oauth-providers'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: updateOAuthProvider,
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['oauth-providers'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOAuthProvider(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['oauth-providers'] })
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ─── Form ─────────────────────────────────────────────────────────────────

  const form = useForm<OAuthFormValues>({
    resolver: zodResolver(oauthSchema),
    defaultValues: {
      op: '',
      oauth_type: '',
      client_id: '',
      client_secret: '',
      issuer: '',
      scopes: '',
      auto_register: false,
      pkce_enable: false,
      pkce_method: '',
    },
  })

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function handleAdd() {
    setEditingOAuth(null)
    form.reset({
      op: '',
      oauth_type: '',
      client_id: '',
      client_secret: '',
      issuer: '',
      scopes: '',
      auto_register: false,
      pkce_enable: false,
      pkce_method: '',
    })
    setDialogOpen(true)
  }

  function handleEdit(oauth: OAuth) {
    setEditingOAuth(oauth)
    form.reset({
      op: oauth.op,
      oauth_type: oauth.oauth_type,
      client_id: oauth.client_id,
      client_secret: oauth.client_secret,
      issuer: oauth.issuer,
      scopes: oauth.scopes,
      auto_register: oauth.auto_register,
      pkce_enable: oauth.pkce_enable,
      pkce_method: oauth.pkce_method,
    })
    setDialogOpen(true)
  }

  function handleDelete(oauth: OAuth) {
    setDeleteTarget(oauth)
    setDeleteDialogOpen(true)
  }

  function onSubmit(values: OAuthFormValues) {
    if (editingOAuth) {
      updateMutation.mutate({ ...values, id: editingOAuth.id } as OAuthForm)
    } else {
      createMutation.mutate(values as OAuthForm)
    }
  }

  // ─── Columns ──────────────────────────────────────────────────────────────

  const columns: ColumnDef<OAuth>[] = [
    {
      accessorKey: 'op',
      header: t('settings.oauth.provider'),
    },
    {
      accessorKey: 'oauth_type',
      header: t('settings.oauth.type'),
    },
    {
      accessorKey: 'client_id',
      header: t('settings.oauth.client_id'),
      cell: ({ row }) => {
        const val = row.original.client_id
        return val && val.length > 20 ? `${val.slice(0, 20)}...` : val || '—'
      },
    },
    {
      accessorKey: 'auto_register',
      header: t('settings.oauth.auto_register'),
      cell: ({ row }) =>
        row.original.auto_register ? t('common.yes') : t('common.no'),
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
            size="icon"
            title={t('common.edit')}
            onClick={() => handleEdit(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={t('common.delete')}
            onClick={() => handleDelete(row.original)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: providers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  const isMutating = createMutation.isPending || updateMutation.isPending

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('settings.oauth.title')}</h1>
        <Button size="sm" onClick={handleAdd}>
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
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingOAuth ? t('common.edit') : t('common.add')}{' '}
              {t('settings.oauth.provider')}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Provider name */}
              <FormField
                control={form.control}
                name="op"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.oauth.provider')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="github, google, oidc" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* OAuth Type */}
              <FormField
                control={form.control}
                name="oauth_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.oauth.type')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client ID */}
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.oauth.client_id')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Secret */}
              <FormField
                control={form.control}
                name="client_secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.oauth.client_secret')}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Issuer */}
              <FormField
                control={form.control}
                name="issuer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.oauth.issuer')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Scopes */}
              <FormField
                control={form.control}
                name="scopes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.oauth.scopes')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Auto Register */}
              <FormField
                control={form.control}
                name="auto_register"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3">
                    <FormLabel className="mt-0">
                      {t('settings.oauth.auto_register')}
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PKCE Enable */}
              <FormField
                control={form.control}
                name="pkce_enable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3">
                    <FormLabel className="mt-0">
                      {t('settings.oauth.pkce_enable')}
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PKCE Method */}
              <FormField
                control={form.control}
                name="pkce_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.oauth.pkce_method')}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S256">S256</SelectItem>
                          <SelectItem value="plain">plain</SelectItem>
                        </SelectContent>
                      </Select>
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

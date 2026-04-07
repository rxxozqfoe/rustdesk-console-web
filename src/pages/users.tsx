import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from '@tanstack/react-table'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, KeyRound } from 'lucide-react'

import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
} from '@/services/user.service'
import { getGroups } from '@/services/group.service'
import type { User } from '@/types/user'
import type { Group } from '@/types/group'

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const userSchema = z.object({
  username: z.string().min(2).max(32),
  email: z.string().email().optional().or(z.literal('')),
  nickname: z.string().optional(),
  group_id: z.coerce.number().optional(),
  is_admin: z.boolean().optional(),
  status: z.coerce.number().optional(),
  remark: z.string().optional(),
  password: z.string().min(4).max(32).optional().or(z.literal('')),
})

const pwdSchema = z.object({
  password: z.string().min(4).max(32),
})

type UserFormValues = z.infer<typeof userSchema>
type PwdFormValues = z.infer<typeof pwdSchema>

// ─── Component ───────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Pagination & filter state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filterUsername, setFilterUsername] = useState('')
  const [searchUsername, setSearchUsername] = useState('')

  // Dialog state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pwdDialogUser, setPwdDialogUser] = useState<User | null>(null)
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', page, pageSize, searchUsername],
    queryFn: () => getUsers({ page, page_size: pageSize, username: searchUsername || undefined }),
  })

  const { data: groupsData } = useQuery({
    queryKey: ['groups-all'],
    queryFn: () => getGroups(),
  })

  const groups: Group[] = groupsData?.list ?? []
  const users = usersData?.list ?? []
  const total = usersData?.total ?? 0

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDialogOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDialogOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    },
  })

  const changePwdMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      changePassword(id, password),
    onSuccess: () => {
      toast.success(t('common.success'))
      setPwdDialogOpen(false)
      setPwdDialogUser(null)
    },
  })

  // ─── Forms ─────────────────────────────────────────────────────────────────

  const userForm = useForm<UserFormValues>({
    resolver: standardSchemaResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      nickname: '',
      group_id: undefined,
      is_admin: false,
      status: 1,
      remark: '',
      password: '',
    },
  })

  const pwdForm = useForm<PwdFormValues>({
    resolver: standardSchemaResolver(pwdSchema),
    defaultValues: { password: '' },
  })

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function handleSearch() {
    setSearchUsername(filterUsername)
    setPage(1)
  }

  function handleReset() {
    setFilterUsername('')
    setSearchUsername('')
    setPage(1)
  }

  function handleAdd() {
    setEditingUser(null)
    userForm.reset({
      username: '',
      email: '',
      nickname: '',
      group_id: undefined,
      is_admin: false,
      status: 1,
      remark: '',
      password: '',
    })
    setDialogOpen(true)
  }

  function handleEdit(user: User) {
    setEditingUser(user)
    userForm.reset({
      username: user.username,
      email: user.email ?? '',
      nickname: user.nickname ?? '',
      group_id: user.group_id || undefined,
      is_admin: user.is_admin,
      status: user.status,
      remark: user.remark ?? '',
      password: '',
    })
    setDialogOpen(true)
  }

  function handleDelete(user: User) {
    setDeleteTarget(user)
    setDeleteDialogOpen(true)
  }

  function handleChangePassword(user: User) {
    setPwdDialogUser(user)
    pwdForm.reset({ password: '' })
    setPwdDialogOpen(true)
  }

  function onUserSubmit(values: UserFormValues) {
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        username: values.username,
        email: values.email || undefined,
        nickname: values.nickname,
        group_id: values.group_id,
        is_admin: values.is_admin,
        status: values.status,
        remark: values.remark,
      })
    } else {
      createMutation.mutate({
        username: values.username,
        password: values.password || undefined,
        email: values.email || undefined,
        nickname: values.nickname,
        group_id: values.group_id,
        is_admin: values.is_admin,
        status: values.status,
        remark: values.remark,
      })
    }
  }

  function onPwdSubmit(values: PwdFormValues) {
    if (!pwdDialogUser) return
    changePwdMutation.mutate({ id: pwdDialogUser.id, password: values.password })
  }

  // ─── Columns ───────────────────────────────────────────────────────────────

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.id}</span>,
    },
    {
      accessorKey: 'username',
      header: t('users.username'),
    },
    {
      accessorKey: 'email',
      header: t('users.email'),
      cell: ({ row }) => row.original.email || '—',
    },
    {
      accessorKey: 'nickname',
      header: t('users.nickname'),
      cell: ({ row }) => row.original.nickname || '—',
    },
    {
      accessorKey: 'group_id',
      header: t('users.group'),
      cell: ({ row }) => {
        const group = groups.find((g) => g.id === row.original.group_id)
        return group ? group.name : '—'
      },
    },
    {
      accessorKey: 'is_admin',
      header: t('users.admin'),
      cell: ({ row }) =>
        row.original.is_admin ? (
          <Badge variant="default">{t('common.yes')}</Badge>
        ) : (
          <Badge variant="secondary">{t('common.no')}</Badge>
        ),
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      cell: ({ row }) =>
        row.original.status === 1 ? (
          <Badge variant="default">{t('common.enabled')}</Badge>
        ) : (
          <Badge variant="secondary">{t('common.disabled')}</Badge>
        ),
    },
    {
      accessorKey: 'created_at',
      header: t('common.created_at'),
      cell: ({ row }) => {
        try {
          return new Date(row.original.created_at).toLocaleString()
        } catch {
          return row.original.created_at
        }
      },
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
            title={t('common.change_password')}
            onClick={() => handleChangePassword(row.original)}
          >
            <KeyRound className="size-4" />
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
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  const isMutating =
    createMutation.isPending || updateMutation.isPending

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('users.title')}</h1>

      <DataTableToolbar
        filters={[
          {
            key: 'username',
            label: t('users.username'),
            value: filterUsername,
            onChange: setFilterUsername,
          },
        ]}
        onSearch={handleSearch}
        onReset={handleReset}
        actions={
          <Button size="sm" onClick={handleAdd}>
            <Plus className="size-4" />
            {t('common.add')}
          </Button>
        }
      />

      <DataTable table={table} columns={columns} isLoading={usersLoading} />

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
              {editingUser ? t('common.edit') : t('common.add')} {t('users.title').replace(/s$/, '')}
            </DialogTitle>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
              {/* Username */}
              <FormField
                control={userForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.username')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!editingUser} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password — only on create */}
              {!editingUser && (
                <FormField
                  control={userForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.password')}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Email */}
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.email')}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nickname */}
              <FormField
                control={userForm.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.nickname')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Group */}
              <FormField
                control={userForm.control}
                name="group_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.group')}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={String(g.id)}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Admin */}
              <FormField
                control={userForm.control}
                name="is_admin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3">
                    <FormLabel className="mt-0">{t('users.admin')}</FormLabel>
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

              {/* Status */}
              <FormField
                control={userForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.status')}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value !== undefined ? String(field.value) : '1'}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">{t('common.enabled')}</SelectItem>
                          <SelectItem value="0">{t('common.disabled')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remark */}
              <FormField
                control={userForm.control}
                name="remark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.remark')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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

      {/* Change Password Dialog */}
      <Dialog open={pwdDialogOpen} onOpenChange={setPwdDialogOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>
              {t('common.change_password')}
              {pwdDialogUser ? ` — ${pwdDialogUser.username}` : ''}
            </DialogTitle>
          </DialogHeader>
          <Form {...pwdForm}>
            <form onSubmit={pwdForm.handleSubmit(onPwdSubmit)} className="space-y-4">
              <FormField
                control={pwdForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.new_password')}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPwdDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={changePwdMutation.isPending}>
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

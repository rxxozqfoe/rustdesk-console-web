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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  getMyAddressBooks,
  createMyAddressBook,
  updateMyAddressBook,
  deleteMyAddressBook,
  getMyTags,
  createMyTag,
  updateMyTag,
  deleteMyTag,
  getMyCollections,
  createMyCollection,
  updateMyCollection,
  deleteMyCollection,
  getMyCollectionRules,
  createMyCollectionRule,
  updateMyCollectionRule,
  deleteMyCollectionRule,
} from '@/services/my-address-book.service'
import type {
  MyAddressBook,
  MyTag,
  MyAddressBookCollection,
  MyAddressBookCollectionRule,
} from '@/types/my-address-book'

// ─── Entries Tab ─────────────────────────────────────────────────────────────

const entrySchema = z.object({
  id: z.string().min(1),
  alias: z.string().optional(),
  hostname: z.string().optional(),
  platform: z.string().optional(),
  note: z.string().optional(),
  collection_id: z.coerce.number().optional(),
})

type EntryFormValues = z.infer<typeof entrySchema>

function EntriesTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filterIdInput, setFilterIdInput] = useState('')
  const [filterHostnameInput, setFilterHostnameInput] = useState('')
  const [searchParams, setSearchParams] = useState({ id: '', hostname: '' })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MyAddressBook | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-address-books', page, pageSize, searchParams],
    queryFn: () =>
      getMyAddressBooks({
        page,
        page_size: pageSize,
        id: searchParams.id || undefined,
        hostname: searchParams.hostname || undefined,
      }),
  })

  const { data: collectionsData } = useQuery({
    queryKey: ['my-collections-all'],
    queryFn: () => getMyCollections({ page: 1, page_size: 1000 }),
  })

  const entries = data?.list ?? []
  const total = data?.total ?? 0
  const collections = collectionsData?.list ?? []

  const form = useForm<EntryFormValues, unknown, EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: { id: '', alias: '', hostname: '', platform: '', note: '', collection_id: undefined },
  })

  const createMutation = useMutation({
    mutationFn: (data: EntryFormValues) => createMyAddressBook(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-address-books'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (data: EntryFormValues & { row_id: number }) => updateMyAddressBook(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-address-books'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMyAddressBook(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-address-books'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleSearch() {
    setPage(1)
    setSearchParams({ id: filterIdInput, hostname: filterHostnameInput })
  }

  function handleReset() {
    setFilterIdInput('')
    setFilterHostnameInput('')
    setPage(1)
    setSearchParams({ id: '', hostname: '' })
  }

  function openAddDialog() {
    setEditingEntry(null)
    form.reset({ id: '', alias: '', hostname: '', platform: '', note: '', collection_id: undefined })
    setDialogOpen(true)
  }

  function openEditDialog(entry: MyAddressBook) {
    setEditingEntry(entry)
    form.reset({
      id: entry.id,
      alias: entry.alias ?? '',
      hostname: entry.hostname ?? '',
      platform: entry.platform ?? '',
      note: entry.note ?? '',
      collection_id: entry.collection_id || undefined,
    })
    setDialogOpen(true)
  }

  function handleSubmit(values: EntryFormValues) {
    if (editingEntry) {
      updateMutation.mutate({ ...values, row_id: editingEntry.row_id })
    } else {
      createMutation.mutate(values)
    }
  }

  const columns: ColumnDef<MyAddressBook>[] = [
    { accessorKey: 'id', header: t('my.ab_id') },
    { accessorKey: 'alias', header: t('my.ab_alias') },
    { accessorKey: 'hostname', header: t('my.ab_hostname') },
    {
      id: 'tags',
      header: t('my.ab_tags_label'),
      cell: ({ row }) => {
        const tags = row.original.tags
        if (!tags || tags.length === 0) return '—'
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )
      },
    },
    { accessorKey: 'platform', header: t('my.ab_platform') },
    { accessorKey: 'note', header: t('my.ab_note') },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditDialog(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original.row_id)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <DataTableToolbar
        filters={[
          { key: 'id', label: t('my.ab_id'), value: filterIdInput, onChange: setFilterIdInput },
          { key: 'hostname', label: t('my.ab_hostname'), value: filterHostnameInput, onChange: setFilterHostnameInput },
        ]}
        onSearch={handleSearch}
        onReset={handleReset}
        actions={
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="size-4" />
            {t('common.add')}
          </Button>
        }
      />

      <DataTable table={table} columns={columns} isLoading={isLoading} />

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? t('common.edit') : t('common.add')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_id')}</FormLabel>
                    <FormControl><Input {...field} disabled={!!editingEntry} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_alias')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hostname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_hostname')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_platform')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_note')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="collection_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_rule_collection')}</FormLabel>
                    <Select
                      value={field.value != null ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(val === '' ? undefined : Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">—</SelectItem>
                        {collections.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
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
                <Button type="submit" disabled={isMutating}>{t('common.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={() => { if (deleteTarget !== null) deleteMutation.mutate(deleteTarget) }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

// ─── Tags Tab ────────────────────────────────────────────────────────────────

const tagSchema = z.object({
  name: z.string().min(1),
  color: z.coerce.number(),
})

type TagFormValues = z.infer<typeof tagSchema>

function TagsTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<MyTag | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-tags', page, pageSize],
    queryFn: () => getMyTags({ page, page_size: pageSize }),
  })

  const tags = data?.list ?? []
  const total = data?.total ?? 0

  const form = useForm<TagFormValues, unknown, TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: '', color: 0 },
  })

  const createMutation = useMutation({
    mutationFn: (data: TagFormValues) => createMyTag(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-tags'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (data: TagFormValues & { id: number }) => updateMyTag(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-tags'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMyTag(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-tags'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function openAddDialog() {
    setEditingTag(null)
    form.reset({ name: '', color: 0 })
    setDialogOpen(true)
  }

  function openEditDialog(tag: MyTag) {
    setEditingTag(tag)
    form.reset({ name: tag.name, color: tag.color })
    setDialogOpen(true)
  }

  function handleSubmit(values: TagFormValues) {
    if (editingTag) {
      updateMutation.mutate({ ...values, id: editingTag.id })
    } else {
      createMutation.mutate(values)
    }
  }

  const columns: ColumnDef<MyTag>[] = [
    { accessorKey: 'name', header: t('my.ab_tag_name') },
    {
      id: 'color',
      header: t('my.ab_tag_color'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-4 rounded-full border"
            style={{ backgroundColor: '#' + row.original.color.toString(16).padStart(6, '0') }}
          />
          <span className="text-muted-foreground text-sm">
            #{row.original.color.toString(16).padStart(6, '0')}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditDialog(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original.id)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: tags,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? t('common.edit') : t('common.add')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_tag_name')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_tag_color')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value != null ? field.value.toString(16).padStart(6, '0') : ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 16) || 0)}
                        placeholder="ff0000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isMutating}>{t('common.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={() => { if (deleteTarget !== null) deleteMutation.mutate(deleteTarget) }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

// ─── Collections Tab ─────────────────────────────────────────────────────────

const collectionSchema = z.object({
  name: z.string().min(1),
})

type CollectionFormValues = z.infer<typeof collectionSchema>

function CollectionsTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<MyAddressBookCollection | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-collections', page, pageSize],
    queryFn: () => getMyCollections({ page, page_size: pageSize }),
  })

  const collections = data?.list ?? []
  const total = data?.total ?? 0

  const form = useForm<CollectionFormValues, unknown, CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: { name: '' },
  })

  const createMutation = useMutation({
    mutationFn: (data: CollectionFormValues) => createMyCollection(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-collections'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (data: CollectionFormValues & { id: number }) => updateMyCollection(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-collections'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMyCollection(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-collections'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function openAddDialog() {
    setEditingCollection(null)
    form.reset({ name: '' })
    setDialogOpen(true)
  }

  function openEditDialog(collection: MyAddressBookCollection) {
    setEditingCollection(collection)
    form.reset({ name: collection.name })
    setDialogOpen(true)
  }

  function handleSubmit(values: CollectionFormValues) {
    if (editingCollection) {
      updateMutation.mutate({ ...values, id: editingCollection.id })
    } else {
      createMutation.mutate(values)
    }
  }

  function formatDate(value: string | number): string {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleString()
    } catch {
      return String(value)
    }
  }

  const columns: ColumnDef<MyAddressBookCollection>[] = [
    { accessorKey: 'name', header: t('my.ab_collection_name') },
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
          <Button variant="ghost" size="sm" onClick={() => openEditDialog(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original.id)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: collections,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCollection ? t('common.edit') : t('common.add')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_collection_name')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isMutating}>{t('common.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={() => { if (deleteTarget !== null) deleteMutation.mutate(deleteTarget) }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

// ─── Rules Tab ───────────────────────────────────────────────────────────────

const ruleSchema = z.object({
  collection_id: z.coerce.number(),
  type: z.coerce.number(),
  to_id: z.coerce.number(),
  rule: z.coerce.number(),
})

type RuleFormValues = z.infer<typeof ruleSchema>

const RULE_TYPE_MAP: Record<number, string> = { 1: 'User', 2: 'Group' }
const RULE_LEVEL_MAP: Record<number, string> = { 1: 'Read', 2: 'Read/Write', 3: 'Full Control' }

function RulesTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<MyAddressBookCollectionRule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-collection-rules', page, pageSize],
    queryFn: () => getMyCollectionRules({ page, page_size: pageSize }),
  })

  const { data: collectionsData } = useQuery({
    queryKey: ['my-collections-all'],
    queryFn: () => getMyCollections({ page: 1, page_size: 1000 }),
  })

  const rules = data?.list ?? []
  const total = data?.total ?? 0
  const collections = collectionsData?.list ?? []

  const collectionMap = new Map(collections.map((c) => [c.id, c.name]))

  const form = useForm<RuleFormValues, unknown, RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { collection_id: 0, type: 1, to_id: 0, rule: 1 },
  })

  const createMutation = useMutation({
    mutationFn: (data: RuleFormValues) => createMyCollectionRule(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-collection-rules'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (data: RuleFormValues & { id: number }) => updateMyCollectionRule(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-collection-rules'] })
      setDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMyCollectionRule(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['my-collection-rules'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function openAddDialog() {
    setEditingRule(null)
    form.reset({ collection_id: 0, type: 1, to_id: 0, rule: 1 })
    setDialogOpen(true)
  }

  function openEditDialog(rule: MyAddressBookCollectionRule) {
    setEditingRule(rule)
    form.reset({
      collection_id: rule.collection_id,
      type: rule.type,
      to_id: rule.to_id,
      rule: rule.rule,
    })
    setDialogOpen(true)
  }

  function handleSubmit(values: RuleFormValues) {
    if (editingRule) {
      updateMutation.mutate({ ...values, id: editingRule.id })
    } else {
      createMutation.mutate(values)
    }
  }

  const columns: ColumnDef<MyAddressBookCollectionRule>[] = [
    {
      id: 'collection_id',
      header: t('my.ab_rule_collection'),
      cell: ({ row }) => collectionMap.get(row.original.collection_id) ?? String(row.original.collection_id),
    },
    {
      id: 'type',
      header: t('my.ab_rule_type'),
      cell: ({ row }) => (
        <Badge variant="secondary">{RULE_TYPE_MAP[row.original.type] ?? String(row.original.type)}</Badge>
      ),
    },
    {
      accessorKey: 'to_id',
      header: t('my.ab_rule_target'),
    },
    {
      id: 'rule',
      header: t('my.ab_rule_level'),
      cell: ({ row }) => (
        <Badge variant="outline">{RULE_LEVEL_MAP[row.original.rule] ?? String(row.original.rule)}</Badge>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditDialog(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original.id)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: rules,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? t('common.edit') : t('common.add')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="collection_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_rule_collection')}</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {collections.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_rule_type')}</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">User</SelectItem>
                        <SelectItem value="2">Group</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="to_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_rule_target')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('my.ab_rule_level')}</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Read</SelectItem>
                        <SelectItem value="2">Read/Write</SelectItem>
                        <SelectItem value="3">Full Control</SelectItem>
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
                <Button type="submit" disabled={isMutating}>{t('common.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={() => { if (deleteTarget !== null) deleteMutation.mutate(deleteTarget) }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MyAddressBooksPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('my.address_books_title')}</h1>
      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">{t('my.ab_entries')}</TabsTrigger>
          <TabsTrigger value="tags">{t('my.ab_tags')}</TabsTrigger>
          <TabsTrigger value="collections">{t('my.ab_collections')}</TabsTrigger>
          <TabsTrigger value="rules">{t('my.ab_rules')}</TabsTrigger>
        </TabsList>
        <TabsContent value="entries"><EntriesTab /></TabsContent>
        <TabsContent value="tags"><TagsTab /></TabsContent>
        <TabsContent value="collections"><CollectionsTab /></TabsContent>
        <TabsContent value="rules"><RulesTab /></TabsContent>
      </Tabs>
    </div>
  )
}

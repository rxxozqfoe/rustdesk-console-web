import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, ArrowLeft, Download, Eye, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getCustomClients,
  createCustomClient,
  updateCustomClient,
  deleteCustomClient,
  previewCustomTxt,
  getBuildArtifacts,
} from '@/services/custom-client.service'
import type { CustomClient, CustomClientForm, BuildArtifact } from '@/types/custom-client'
import {
  ALL_CUSTOM_CLIENT_SECTIONS,
  getDefaultConfig,
  configToState,
  stateToConfig,
  type OptionSection,
} from '@/lib/rustdesk-options'

const DEFAULT_CONFIG = getDefaultConfig(ALL_CUSTOM_CLIENT_SECTIONS)

// ─── Inline option cells (reused from strategies pattern) ─────────────────

function ToggleCell({
  optKey,
  value,
  onChange,
  t,
}: {
  optKey: string
  value: string
  onChange: (v: string) => void
  t: (key: string) => string
}) {
  const triState = value === '' ? 'unset' : value === 'Y' ? 'Y' : 'N'
  const triggerClass =
    triState === 'Y'
      ? 'h-8 w-24 border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
      : triState === 'N'
        ? 'h-8 w-24 border-red-500/50 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
        : 'h-8 w-24'
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground truncate text-xs">
        {t(`strategies.opt.${optKey}`)}
      </Label>
      <Select value={triState} onValueChange={(v) => onChange(!v || v === 'unset' ? '' : v)}>
        <SelectTrigger className={triggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">—</SelectItem>
          <SelectItem value="Y">
            <span className="text-green-600 dark:text-green-400">{t('common.yes')}</span>
          </SelectItem>
          <SelectItem value="N">
            <span className="text-red-600 dark:text-red-400">{t('common.no')}</span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function SelectCell({
  optKey,
  value,
  choices,
  onChange,
  t,
}: {
  optKey: string
  value: string
  choices: string[]
  onChange: (v: string) => void
  t: (key: string) => string
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground truncate text-xs">
        {t(`strategies.opt.${optKey}`)}
      </Label>
      <Select
        value={value || 'unset'}
        onValueChange={(v) => onChange(!v || v === 'unset' ? '' : v)}
      >
        <SelectTrigger
          className={
            value
              ? 'h-8 w-44 border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
              : 'h-8 w-44'
          }
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">—</SelectItem>
          {choices.map((c) => (
            <SelectItem key={c} value={c}>
              {t(`strategies.choice.${optKey}.${c}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function TextCell({
  optKey,
  value,
  onChange,
  t,
}: {
  optKey: string
  value: string
  onChange: (v: string) => void
  t: (key: string) => string
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground truncate text-xs">
        {t(`strategies.opt.${optKey}`)}
      </Label>
      <Input
        className={
          value
            ? 'h-8 w-44 border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
            : 'h-8 w-44'
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function OptionSectionCards({
  sections,
  config,
  onConfigChange,
  t,
}: {
  sections: OptionSection[]
  config: Record<string, string>
  onConfigChange: (key: string, value: string) => void
  t: (key: string) => string
}) {
  return (
    <>
      {sections.map((section) => (
        <Card key={section.titleKey}>
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="text-sm">{t(section.titleKey)}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 pb-4">
            {section.options.map((opt) => {
              const val = config[opt.key] ?? ''
              if (opt.type === 'toggle') {
                return (
                  <ToggleCell
                    key={opt.key}
                    optKey={opt.key}
                    value={val}
                    onChange={(v) => onConfigChange(opt.key, v)}
                    t={t}
                  />
                )
              }
              if (opt.type === 'select') {
                return (
                  <SelectCell
                    key={opt.key}
                    optKey={opt.key}
                    value={val}
                    choices={opt.choices!}
                    onChange={(v) => onConfigChange(opt.key, v)}
                    t={t}
                  />
                )
              }
              return (
                <TextCell
                  key={opt.key}
                  optKey={opt.key}
                  value={val}
                  onChange={(v) => onConfigChange(opt.key, v)}
                  t={t}
                />
              )
            })}
          </CardContent>
        </Card>
      ))}
    </>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function CustomClientsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // List view state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  // Edit view state
  const [editing, setEditing] = useState<CustomClient | null | 'new'>(null)
  const [formName, setFormName] = useState('')
  const [formAppName, setFormAppName] = useState('')
  const [formEnabled, setFormEnabled] = useState(true)
  const [formServerHost, setFormServerHost] = useState('')
  const [formServerKey, setFormServerKey] = useState('')
  const [formApiServer, setFormApiServer] = useState('')
  const [formRelayServer, setFormRelayServer] = useState('')
  const [formDefaultSettings, setFormDefaultSettings] = useState<Record<string, string>>({})
  const [formOverrideSettings, setFormOverrideSettings] = useState<Record<string, string>>({})

  // Preview dialog
  const [previewContent, setPreviewContent] = useState<string | null>(null)

  // ─── Queries ────────────────────────────────────────────────────────────

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['custom-clients', page, pageSize],
    queryFn: () => getCustomClients({ page, page_size: pageSize }),
  })

  const clients = clientsData?.list ?? []
  const total = clientsData?.total ?? 0

  const { data: artifactsData } = useQuery({
    queryKey: ['build-artifacts'],
    queryFn: () => getBuildArtifacts({ page: 1, page_size: 100 }),
  })

  const artifacts = artifactsData?.list ?? []

  // ─── Mutations ──────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: CustomClientForm) => createCustomClient(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['custom-clients'] })
      setEditing(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (data: CustomClientForm) => updateCustomClient(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['custom-clients'] })
      setEditing(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCustomClient(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['custom-clients'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ─── Handlers ───────────────────────────────────────────────────────────

  function openAdd() {
    setFormName('')
    setFormAppName('')
    setFormEnabled(true)
    setFormServerHost('')
    setFormServerKey('')
    setFormApiServer('')
    setFormRelayServer('')
    setFormDefaultSettings({ ...DEFAULT_CONFIG })
    setFormOverrideSettings({})
    setEditing('new')
  }

  function openEdit(client: CustomClient) {
    setFormName(client.name)
    setFormAppName(client.app_name)
    setFormEnabled(client.enabled)
    setFormServerHost(client.server_host || '')
    setFormServerKey(client.server_key || '')
    setFormApiServer(client.api_server || '')
    setFormRelayServer(client.relay_server || '')
    setFormDefaultSettings(configToState(client.default_settings, ALL_CUSTOM_CLIENT_SECTIONS))
    setFormOverrideSettings(client.override_settings || {})
    setEditing(client)
  }

  function handleDefaultChange(key: string, value: string) {
    setFormDefaultSettings((prev) => ({ ...prev, [key]: value }))
  }

  function handleOverrideChange(key: string, value: string) {
    setFormOverrideSettings((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!formName.trim() || !formAppName.trim()) return
    const data: CustomClientForm = {
      name: formName,
      app_name: formAppName,
      enabled: formEnabled,
      server_host: formServerHost,
      server_key: formServerKey,
      api_server: formApiServer,
      relay_server: formRelayServer,
      default_settings: stateToConfig(formDefaultSettings),
      override_settings: stateToConfig(formOverrideSettings),
    }
    if (editing !== 'new') {
      updateMutation.mutate({ ...data, id: editing!.id })
    } else {
      createMutation.mutate(data)
    }
  }

  async function handlePreview(id: number) {
    try {
      const result = await previewCustomTxt(id)
      setPreviewContent(result.custom_txt)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to preview')
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  // ─── Build Artifact helper ──────────────────────────────────────────────

  function ArtifactBadges() {
    if (artifacts.length === 0) {
      return <span className="text-muted-foreground text-sm">{t('custom_clients.no_artifacts')}</span>
    }
    return (
      <div className="flex flex-wrap gap-2">
        {artifacts.map((a: BuildArtifact) => (
          <Badge key={a.id} variant="outline">
            {a.platform}/{a.arch} ({a.format}) {a.version && `v${a.version}`}
          </Badge>
        ))}
      </div>
    )
  }

  // ─── Columns ────────────────────────────────────────────────────────────

  const columns: ColumnDef<CustomClient>[] = [
    {
      accessorKey: 'name',
      header: t('custom_clients.name'),
    },
    {
      accessorKey: 'app_name',
      header: t('custom_clients.app_name'),
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.app_name}</span>,
    },
    {
      id: 'server',
      header: t('custom_clients.server'),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.server_host || '—'}
        </span>
      ),
    },
    {
      id: 'enabled',
      header: t('common.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.enabled ? 'default' : 'secondary'}>
          {row.original.enabled ? t('common.enabled') : t('common.disabled')}
        </Badge>
      ),
    },
    {
      id: 'settings_count',
      header: t('custom_clients.settings_count'),
      cell: ({ row }) => {
        const dc = Object.keys(row.original.default_settings || {}).length
        const oc = Object.keys(row.original.override_settings || {}).length
        return (
          <div className="flex gap-2">
            {dc > 0 && <Badge variant="outline">{dc} default</Badge>}
            {oc > 0 && <Badge variant="destructive">{oc} override</Badge>}
            {dc === 0 && oc === 0 && <span className="text-muted-foreground">—</span>}
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: t('common.created_at'),
      cell: ({ row }) =>
        row.original.created_at ? new Date(row.original.created_at).toLocaleString() : '—',
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePreview(row.original.id)}
            title={t('custom_clients.preview')}
          >
            <Eye className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original.id)}>
            <Trash2 className="text-destructive size-4" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: clients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (editing !== null) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {editing === 'new' ? t('custom_clients.add') : t('custom_clients.edit')}
          </h1>
        </div>

        {/* Basic info */}
        <Card>
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="text-sm">{t('custom_clients.basic_info')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-6">
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">{t('custom_clients.name')}</Label>
              <Input
                className="h-9 w-64"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('custom_clients.name_placeholder')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">{t('custom_clients.app_name')}</Label>
              <Input
                className="h-9 w-64"
                value={formAppName}
                onChange={(e) => setFormAppName(e.target.value)}
                placeholder="MyCompany Remote"
              />
            </div>
            <div className="flex items-center gap-3 pb-1">
              <Label className="text-muted-foreground text-xs">{t('common.enabled')}</Label>
              <Switch checked={formEnabled} onCheckedChange={setFormEnabled} />
            </div>
            <div className="ml-auto flex gap-2 pb-0.5">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isMutating || !formName.trim() || !formAppName.trim()}
              >
                {t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Server settings */}
        <Card>
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="text-sm">{t('custom_clients.server_settings')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">{t('custom_clients.server_host')}</Label>
              <Input
                className="h-8 w-64"
                value={formServerHost}
                onChange={(e) => setFormServerHost(e.target.value)}
                placeholder="your-server.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">{t('custom_clients.server_key')}</Label>
              <Input
                className="h-8 w-80"
                value={formServerKey}
                onChange={(e) => setFormServerKey(e.target.value)}
                placeholder="base64 public key"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">{t('custom_clients.api_server')}</Label>
              <Input
                className="h-8 w-64"
                value={formApiServer}
                onChange={(e) => setFormApiServer(e.target.value)}
                placeholder="http://your-server:21114"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">{t('custom_clients.relay_server')}</Label>
              <Input
                className="h-8 w-64"
                value={formRelayServer}
                onChange={(e) => setFormRelayServer(e.target.value)}
                placeholder="your-relay.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings tabs: Default vs Override */}
        <Tabs defaultValue="default">
          <TabsList>
            <TabsTrigger value="default">{t('custom_clients.default_settings')}</TabsTrigger>
            <TabsTrigger value="override">{t('custom_clients.override_settings')}</TabsTrigger>
          </TabsList>
          <TabsContent value="default" className="space-y-4">
            <p className="text-muted-foreground text-xs">
              {t('custom_clients.default_settings_desc')}
            </p>
            <OptionSectionCards
              sections={ALL_CUSTOM_CLIENT_SECTIONS}
              config={formDefaultSettings}
              onConfigChange={handleDefaultChange}
              t={t}
            />
          </TabsContent>
          <TabsContent value="override" className="space-y-4">
            <p className="text-muted-foreground text-xs">
              {t('custom_clients.override_settings_desc')}
            </p>
            <OptionSectionCards
              sections={ALL_CUSTOM_CLIENT_SECTIONS}
              config={formOverrideSettings}
              onConfigChange={handleOverrideChange}
              t={t}
            />
          </TabsContent>
        </Tabs>

        {/* Bottom save bar */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setEditing(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isMutating || !formName.trim() || !formAppName.trim()}
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('custom_clients.title')}</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="size-4" />
          {t('common.add')}
        </Button>
      </div>

      {/* Build Artifacts summary */}
      <Card>
        <CardHeader className="pt-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{t('custom_clients.build_artifacts')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ArtifactBadges />
        </CardContent>
      </Card>

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

      {/* Preview Dialog */}
      {previewContent !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-h-[80vh] w-[600px] overflow-auto">
            <CardHeader>
              <CardTitle className="text-sm">custom.txt {t('custom_clients.preview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted max-h-[50vh] overflow-auto rounded p-4 font-mono text-xs break-all whitespace-pre-wrap">
                {previewContent}
              </pre>
              <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={() => setPreviewContent(null)}>
                  {t('common.close')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

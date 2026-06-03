import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { Plus, Trash2, ArrowLeft, Download, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  deleteCustomClient,
  previewCustomTxt,
  getBuildArtifacts,
  getDownloadUrl,
  getServerConfig,
} from '@/services/custom-client.service'
import type { CustomClient, CustomClientForm, BuildArtifact } from '@/types/custom-client'
import {
  ALL_CUSTOM_CLIENT_SECTIONS,
  getDefaultConfig,
  stateToConfig,
  type OptionSection,
} from '@/lib/rustdesk-options'

const DEFAULT_CONFIG = getDefaultConfig(ALL_CUSTOM_CLIENT_SECTIONS)

// ─── Reusable option cells ────────────────────────────────────────────────

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
              if (opt.type === 'toggle')
                return (
                  <ToggleCell
                    key={opt.key}
                    optKey={opt.key}
                    value={val}
                    onChange={(v) => onConfigChange(opt.key, v)}
                    t={t}
                  />
                )
              if (opt.type === 'select')
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

// ─── Status Badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'bundling')
    return (
      <Badge variant="outline" className="animate-pulse border-blue-500 text-blue-600">
        <Loader2 className="mr-1 size-3 animate-spin" />
        {status}
      </Badge>
    )
  if (status === 'completed')
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400">
        {status}
      </Badge>
    )
  if (status === 'failed') return <Badge variant="destructive">{status}</Badge>
  return <Badge variant="outline">{status}</Badge>
}

// ─── Platform format map ──────────────────────────────────────────────────

const PLATFORM_FORMATS: Record<string, string[]> = {
  linux: ['deb', 'zip'],
  windows: ['zip'],
  macos: ['zip'],
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Main page ────────────────────────────────────────────────────────────

export default function CustomClientsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // List state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)

  // Edit/Create state
  const [editing, setEditing] = useState(false)
  const [formName, setFormName] = useState('')
  const [useCustomServer, setUseCustomServer] = useState(false)
  const [formServerHost, setFormServerHost] = useState('')
  const [formServerKey, setFormServerKey] = useState('')
  const [formApiServer, setFormApiServer] = useState('')
  const [formRelayServer, setFormRelayServer] = useState('')
  const [formDefaultSettings, setFormDefaultSettings] = useState<Record<string, string>>({})
  const [formOverrideSettings, setFormOverrideSettings] = useState<Record<string, string>>({})
  const [formPlatformArch, setFormPlatformArch] = useState('')
  const [formVersion, setFormVersion] = useState('')
  const [formFormat, setFormFormat] = useState('')

  // ─── Queries ──────────────────────────────────────────────────────────

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['custom-clients', page, pageSize],
    queryFn: () => getCustomClients({ page, page_size: pageSize }),
    refetchInterval: (query) => {
      const list = query.state.data?.list ?? []
      return list.some((c) => c.status === 'bundling') ? 3000 : false
    },
  })

  const clients = clientsData?.list ?? []
  const total = clientsData?.total ?? 0

  const { data: serverConfig } = useQuery({
    queryKey: ['server-config'],
    queryFn: getServerConfig,
  })

  const { data: artifactsData } = useQuery({
    queryKey: ['build-artifacts'],
    queryFn: () => getBuildArtifacts({ page: 1, page_size: 100 }),
  })

  const artifacts: BuildArtifact[] = artifactsData?.list ?? []

  // Derive available options from artifacts
  const platformArchOptions = [...new Set(artifacts.map((a) => `${a.platform}/${a.arch}`))]
  const [formPlatform, formArch] = formPlatformArch ? formPlatformArch.split('/') : ['', '']
  const versionOptions = artifacts
    .filter((a) => a.platform === formPlatform && a.arch === formArch)
    .map((a) => a.version)
    .filter((v, i, arr) => arr.indexOf(v) === i)
  const formatOptions = formPlatform ? PLATFORM_FORMATS[formPlatform] || ['zip'] : []

  // ─── Mutations ────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: CustomClientForm) => createCustomClient(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['custom-clients'] })
      setEditing(false)
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

  // ─── Handlers ─────────────────────────────────────────────────────────

  function openCreate() {
    setFormName('')
    setUseCustomServer(false)
    setFormServerHost(serverConfig?.id_server || '')
    setFormServerKey(serverConfig?.key || '')
    setFormApiServer(serverConfig?.api_server || '')
    setFormRelayServer(serverConfig?.relay_server || '')
    setFormDefaultSettings({ ...DEFAULT_CONFIG })
    setFormOverrideSettings({ 'access-mode': 'custom' })
    const defaultPA = platformArchOptions[0] || ''
    setFormPlatformArch(defaultPA)
    // Pre-select first version and format for the default platform
    const [dp, da] = defaultPA ? defaultPA.split('/') : ['', '']
    const defaultVersions = artifacts
      .filter((a) => a.platform === dp && a.arch === da)
      .map((a) => a.version)
    setFormVersion(defaultVersions[0] || '')
    const defaultFormats = dp ? PLATFORM_FORMATS[dp] || ['zip'] : []
    setFormFormat(defaultFormats[0] || '')
    setEditing(true)
  }

  function handleSave() {
    if (!formName.trim() || !formPlatform || !formArch || !formVersion || !formFormat) return
    createMutation.mutate({
      name: formName,
      server_host: formServerHost,
      server_key: formServerKey,
      api_server: formApiServer,
      relay_server: formRelayServer,
      default_settings: stateToConfig(formDefaultSettings),
      override_settings: stateToConfig(formOverrideSettings),
      platform: formPlatform,
      arch: formArch,
      version: formVersion,
      format: formFormat,
    })
  }

  async function handlePreview(id: number) {
    try {
      const result = await previewCustomTxt(id)
      setPreviewContent(result.custom_txt)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to preview')
    }
  }

  // ─── Columns ──────────────────────────────────────────────────────────

  const columns: ColumnDef<CustomClient>[] = [
    {
      accessorKey: 'name',
      header: t('custom_clients.name'),
    },
    {
      id: 'target',
      header: t('custom_clients.target'),
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.platform}/{row.original.arch} v{row.original.version} ({row.original.format}
          )
        </span>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={row.original.status} />
          {row.original.status === 'failed' && row.original.error && (
            <span className="text-destructive text-xs" title={row.original.error}>
              {row.original.error.length > 30
                ? row.original.error.substring(0, 30) + '...'
                : row.original.error}
            </span>
          )}
          {row.original.status === 'completed' && row.original.file_size > 0 && (
            <span className="text-muted-foreground text-xs">
              {formatFileSize(row.original.file_size)}
            </span>
          )}
        </div>
      ),
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
          {row.original.status === 'completed' && (
            <a
              href={getDownloadUrl(row.original)}
              className="hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md p-2 text-sm font-medium"
              title={t('custom_clients.download')}
            >
              <Download className="size-4" />
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePreview(row.original.id)}
            title={t('custom_clients.preview')}
          >
            <Eye className="size-4" />
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

  // ═══════════════════════════════════════════════════════════════════════
  // CREATE VIEW
  // ═══════════════════════════════════════════════════════════════════════

  if (editing) {
    const canSave = formName.trim() && formPlatform && formArch && formVersion && formFormat

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t('custom_clients.add')}</h1>
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
            <div className="flex flex-col gap-1"></div>
          </CardContent>
        </Card>

        {/* Server */}
        <Card>
          <CardHeader className="pt-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{t('custom_clients.server_settings')}</CardTitle>
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={useCustomServer}
                  onChange={(e) => {
                    setUseCustomServer(e.target.checked)
                    if (!e.target.checked) {
                      setFormServerHost(serverConfig?.id_server || '')
                      setFormServerKey(serverConfig?.key || '')
                      setFormApiServer(serverConfig?.api_server || '')
                      setFormRelayServer(serverConfig?.relay_server || '')
                    }
                  }}
                  className="rounded"
                />
                <span className="text-muted-foreground">{t('custom_clients.custom_server')}</span>
              </label>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">
                {t('custom_clients.server_host')}
              </Label>
              <Input
                className="h-8 w-64"
                value={formServerHost}
                onChange={(e) => setFormServerHost(e.target.value)}
                disabled={!useCustomServer}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">
                {t('custom_clients.server_key')}
              </Label>
              <Input
                className="h-8 w-80"
                value={formServerKey}
                onChange={(e) => setFormServerKey(e.target.value)}
                disabled={!useCustomServer}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">
                {t('custom_clients.api_server')}
              </Label>
              <Input
                className="h-8 w-64"
                value={formApiServer}
                onChange={(e) => setFormApiServer(e.target.value)}
                disabled={!useCustomServer}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">
                {t('custom_clients.relay_server')}
              </Label>
              <Input
                className="h-8 w-64"
                value={formRelayServer}
                onChange={(e) => setFormRelayServer(e.target.value)}
                disabled={!useCustomServer}
              />
            </div>
          </CardContent>
        </Card>

        {/* Target platform */}
        <Card>
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="text-sm">{t('custom_clients.target')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-6">
            {artifacts.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('custom_clients.no_pre_builds')}</p>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs">
                    {t('custom_clients.select_platform')}
                  </Label>
                  <Select
                    value={formPlatformArch}
                    onValueChange={(value) => {
                      const v = value ?? ''
                      setFormPlatformArch(v)
                      const [p, a] = v.split('/')
                      const vers = artifacts
                        .filter((ar) => ar.platform === p && ar.arch === a)
                        .map((ar) => ar.version)
                      setFormVersion(vers[0] || '')
                      const fmts = p ? PLATFORM_FORMATS[p] || ['zip'] : []
                      setFormFormat(fmts[0] || '')
                    }}
                  >
                    <SelectTrigger className="h-9 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platformArchOptions.map((pa) => (
                        <SelectItem key={pa} value={pa}>
                          {pa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs">
                    {t('custom_clients.select_version')}
                  </Label>
                  <Select value={formVersion} onValueChange={(v) => setFormVersion(v ?? '')}>
                    <SelectTrigger className="h-9 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {versionOptions.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs">
                    {t('custom_clients.select_format')}
                  </Label>
                  <Select value={formFormat} onValueChange={(v) => setFormFormat(v ?? '')}>
                    <SelectTrigger className="h-9 w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formatOptions.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
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
              onConfigChange={(k, v) => setFormDefaultSettings((p) => ({ ...p, [k]: v }))}
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
              onConfigChange={(k, v) => setFormOverrideSettings((p) => ({ ...p, [k]: v }))}
              t={t}
            />
          </TabsContent>
        </Tabs>

        {/* Save */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setEditing(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!canSave || createMutation.isPending}>
            {t('custom_clients.generate')}
          </Button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('custom_clients.title')}</h1>
        <Button size="sm" onClick={openCreate}>
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

      {/* Preview modal */}
      {previewContent !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPreviewContent(null)}
        >
          <Card
            className="flex max-h-[85vh] w-[600px] flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="text-sm">{t('custom_clients.preview')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col overflow-hidden">
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

      {/* Delete confirmation */}
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

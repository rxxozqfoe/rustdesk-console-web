import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Link, ArrowLeft, Monitor, Users, FolderOpen } from 'lucide-react'
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
import {
  getStrategies,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  getStrategyAssignments,
} from '@/services/strategy.service'
import { AssignmentDialog } from '@/components/strategy/assignment-dialog'
import type { Strategy, StrategyForm } from '@/types/strategy'

// ─── Config option definitions ──────────────────────────────────────────────

type OptionType = 'toggle' | 'select' | 'text'

interface OptionDef {
  key: string
  type: OptionType
  choices?: string[]
  defaultVal?: string // default value for toggle: 'Y' or 'N'
}

interface OptionSection {
  titleKey: string
  options: OptionDef[]
}

// Defaults follow RustDesk client option2bool() logic:
//   enable-* → default Y    allow-* → default N
//   hide-*   → default N    disable-* → default N
const Y = 'Y'
const N = 'N'

const STRATEGY_SECTIONS: OptionSection[] = [
  {
    titleKey: 'strategies.section_access_control',
    options: [
      { key: 'enable-keyboard', type: 'toggle', defaultVal: Y },
      { key: 'enable-clipboard', type: 'toggle', defaultVal: Y },
      { key: 'enable-file-transfer', type: 'toggle', defaultVal: Y },
      { key: 'enable-file-copy-paste', type: 'toggle', defaultVal: Y },
      { key: 'enable-camera', type: 'toggle', defaultVal: Y },
      { key: 'enable-terminal', type: 'toggle', defaultVal: Y },
      { key: 'enable-remote-printer', type: 'toggle', defaultVal: Y },
      { key: 'enable-audio', type: 'toggle', defaultVal: Y },
      { key: 'enable-tunnel', type: 'toggle', defaultVal: Y },
      { key: 'enable-remote-restart', type: 'toggle', defaultVal: Y },
      { key: 'enable-record-session', type: 'toggle', defaultVal: Y },
      { key: 'enable-block-input', type: 'toggle', defaultVal: Y },
    ],
  },
  {
    titleKey: 'strategies.section_security',
    options: [
      { key: 'access-mode', type: 'select', choices: ['custom', 'full', 'view'] },
      { key: 'approve-mode', type: 'select', choices: ['password', 'click', 'password-click'] },
      {
        key: 'verify-method',
        type: 'select',
        choices: ['use-temporary-password', 'use-permanent-password', 'use-both-passwords'],
      },
      { key: 'temporary-password-length', type: 'text' },
      { key: 'whitelist', type: 'text' },
      { key: 'allow-remote-config-modification', type: 'toggle', defaultVal: N },
    ],
  },
  {
    titleKey: 'strategies.section_network',
    options: [
      { key: 'custom-rendezvous-server', type: 'text' },
      { key: 'api-server', type: 'text' },
      { key: 'relay-server', type: 'text' },
      { key: 'key', type: 'text' },
      { key: 'ice-servers', type: 'text' },
      { key: 'enable-lan-discovery', type: 'toggle', defaultVal: Y },
      { key: 'direct-server', type: 'toggle', defaultVal: N },
      { key: 'direct-access-port', type: 'text' },
      { key: 'disable-udp', type: 'toggle', defaultVal: N },
      { key: 'allow-websocket', type: 'toggle', defaultVal: N },
      { key: 'allow-insecure-tls-fallback', type: 'toggle', defaultVal: N },
    ],
  },
  {
    titleKey: 'strategies.section_connection',
    options: [
      { key: 'allow-auto-disconnect', type: 'toggle', defaultVal: N },
      { key: 'auto-disconnect-timeout', type: 'text' },
      { key: 'allow-only-conn-window-open', type: 'toggle', defaultVal: N },
      { key: 'allow-auto-record-incoming', type: 'toggle', defaultVal: N },
      { key: 'enable-abr', type: 'toggle', defaultVal: Y },
      { key: 'allow-remove-wallpaper', type: 'toggle', defaultVal: N },
      { key: 'allow-always-software-render', type: 'toggle', defaultVal: N },
      { key: 'allow-linux-headless', type: 'toggle', defaultVal: N },
      { key: 'enable-hwcodec', type: 'toggle', defaultVal: Y },
      { key: 'enable-directx-capture', type: 'toggle', defaultVal: Y },
      { key: 'keep-awake-during-incoming-sessions', type: 'toggle', defaultVal: N },
    ],
  },
  {
    titleKey: 'strategies.section_presets',
    options: [
      { key: 'preset-address-book-name', type: 'text' },
      { key: 'preset-address-book-tag', type: 'text' },
      { key: 'preset-address-book-alias', type: 'text' },
      { key: 'preset-address-book-password', type: 'text' },
      { key: 'preset-address-book-note', type: 'text' },
      { key: 'preset-device-username', type: 'text' },
      { key: 'preset-device-name', type: 'text' },
    ],
  },
  {
    titleKey: 'strategies.section_proxy',
    options: [
      { key: 'proxy-url', type: 'text' },
      { key: 'proxy-username', type: 'text' },
      { key: 'proxy-password', type: 'text' },
    ],
  },
  {
    titleKey: 'strategies.section_ui',
    options: [
      { key: 'hide-security-settings', type: 'toggle', defaultVal: N },
      { key: 'hide-network-settings', type: 'toggle', defaultVal: N },
      { key: 'hide-server-settings', type: 'toggle', defaultVal: N },
      { key: 'hide-proxy-settings', type: 'toggle', defaultVal: N },
      { key: 'hide-remote-printer-settings', type: 'toggle', defaultVal: N },
      { key: 'hide-websocket-settings', type: 'toggle', defaultVal: N },
      { key: 'hide-stop-service', type: 'toggle', defaultVal: N },
    ],
  },
  {
    titleKey: 'strategies.section_builtin',
    options: [
      { key: 'preset-device-group-name', type: 'text' },
      { key: 'preset-user-name', type: 'text' },
      { key: 'preset-strategy-name', type: 'text' },
      { key: 'default-connect-password', type: 'text' },
      { key: 'disable-change-permanent-password', type: 'toggle', defaultVal: N },
      { key: 'disable-change-id', type: 'toggle', defaultVal: N },
      { key: 'disable-unlock-pin', type: 'toggle', defaultVal: N },
      { key: 'one-way-clipboard-redirection', type: 'toggle', defaultVal: N },
      { key: 'one-way-file-transfer', type: 'toggle', defaultVal: N },
      { key: 'display-name', type: 'text' },
      { key: 'avatar', type: 'text' },
      { key: 'remove-preset-password-warning', type: 'toggle', defaultVal: N },
    ],
  },
  {
    titleKey: 'strategies.section_other',
    options: [
      { key: 'allow-numeric-one-time-password', type: 'toggle', defaultVal: N },
      { key: 'allow-auto-update', type: 'toggle', defaultVal: N },
    ],
  },
]

// Build default config from all toggle options
function getDefaultConfig(): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const section of STRATEGY_SECTIONS) {
    for (const opt of section.options) {
      if (opt.type === 'toggle' && opt.defaultVal) {
        defaults[opt.key] = opt.defaultVal
      }
    }
  }
  return defaults
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function configToState(config?: Record<string, string>): Record<string, string> {
  const defaults = getDefaultConfig()
  return { ...defaults, ...(config || {}) }
}

function stateToConfig(state: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(state)) {
    if (v !== '') result[k] = v
  }
  return result
}

const DEFAULT_CONFIG = getDefaultConfig()

// ─── Inline option cells (compact, horizontal-friendly) ─────────────────────

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

// ─── Main page ──────────────────────────────────────────────────────────────

export default function StrategiesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // List view state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  // Edit view state (null = list view)
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null | 'new'>(null)
  const [formName, setFormName] = useState('')
  const [formEnabled, setFormEnabled] = useState(true)
  const [formConfig, setFormConfig] = useState<Record<string, string>>({})

  // Assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<Strategy | null>(null)

  // ─── Queries ────────────────────────────────────────────────────────────

  const { data: strategiesData, isLoading } = useQuery({
    queryKey: ['strategies', page, pageSize],
    queryFn: () => getStrategies({ page, page_size: pageSize }),
  })

  const strategies = strategiesData?.list ?? []
  const total = strategiesData?.total ?? 0


  // ─── Mutations ──────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: StrategyForm) => createStrategy(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
      setEditingStrategy(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (data: StrategyForm) => updateStrategy(data),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
      setEditingStrategy(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStrategy(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ─── Handlers ───────────────────────────────────────────────────────────

  function openAdd() {
    setFormName('')
    setFormEnabled(true)
    setFormConfig({ ...DEFAULT_CONFIG })
    setEditingStrategy('new')
  }

  function openEdit(strategy: Strategy) {
    setFormName(strategy.name)
    setFormEnabled(strategy.enabled)
    setFormConfig(configToState(strategy.config_options))
    setEditingStrategy(strategy)
  }

  function openAssign(strategy: Strategy) {
    setAssignTarget(strategy)
    setAssignDialogOpen(true)
  }

  function handleConfigChange(key: string, value: string) {
    setFormConfig((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!formName.trim()) return
    const data: StrategyForm = {
      name: formName,
      enabled: formEnabled,
      config_options: stateToConfig(formConfig),
    }
    if (editingStrategy !== 'new') {
      updateMutation.mutate({ ...data, id: editingStrategy!.id })
    } else {
      createMutation.mutate(data)
    }
  }


  const isMutating = createMutation.isPending || updateMutation.isPending

  // ─── Assignment count cell ──────────────────────────────────────────

  function AssignmentCounts({ strategyId }: { strategyId: number }) {
    const { data } = useQuery({
      queryKey: ['strategy-assignments', strategyId],
      queryFn: () => getStrategyAssignments(strategyId),
    })
    if (!data) return <span className="text-muted-foreground">—</span>
    const peerCount = data.filter((a) => a.type === 'peer').length
    const userCount = data.filter((a) => a.type === 'user').length
    const groupCount = data.filter((a) => a.type === 'device_group').length
    if (peerCount === 0 && userCount === 0 && groupCount === 0) {
      return <span className="text-muted-foreground">—</span>
    }
    return (
      <div className="flex items-center gap-3 text-xs">
        {peerCount > 0 && (
          <span className="flex items-center gap-1">
            <Monitor className="size-3.5" /> {peerCount}
          </span>
        )}
        {userCount > 0 && (
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {userCount}
          </span>
        )}
        {groupCount > 0 && (
          <span className="flex items-center gap-1">
            <FolderOpen className="size-3.5" /> {groupCount}
          </span>
        )}
      </div>
    )
  }

  // ─── Columns & table (must be before any early return to satisfy hooks rule)
  const columns: ColumnDef<Strategy>[] = [
    {
      accessorKey: 'name',
      header: t('strategies.name'),
    },
    {
      accessorKey: 'guid',
      header: t('strategies.guid'),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.guid}</span>,
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
      id: 'options_count',
      header: t('strategies.config_options'),
      cell: ({ row }) => {
        const count = Object.keys(row.original.config_options || {}).length
        return count > 0 ? (
          <Badge variant="outline">{count}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      id: 'assignment_counts',
      header: t('strategies.assignments'),
      cell: ({ row }) => <AssignmentCounts strategyId={row.original.id} />,
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
            onClick={() => openAssign(row.original)}
            title={t('strategies.assignments')}
          >
            <Link className="size-4" />
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
    data: strategies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT VIEW — full page, options spread horizontally
  // ═══════════════════════════════════════════════════════════════════════════

  if (editingStrategy !== null) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setEditingStrategy(null)}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {editingStrategy === 'new' ? t('common.add') : t('common.edit')}
          </h1>
        </div>

        {/* Basic info row */}
        <Card>
          <CardContent className="flex flex-wrap items-end gap-6 pt-4">
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">{t('strategies.name')}</Label>
              <Input
                className="h-9 w-64"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 pb-1">
              <Label className="text-muted-foreground text-xs">{t('common.enabled')}</Label>
              <Switch checked={formEnabled} onCheckedChange={setFormEnabled} />
            </div>
            <div className="ml-auto flex gap-2 pb-0.5">
              <Button variant="outline" size="sm" onClick={() => setEditingStrategy(null)}>
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isMutating || !formName.trim()}>
                {t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Config sections — options flow horizontally */}
        {STRATEGY_SECTIONS.map((section) => (
          <Card key={section.titleKey}>
            <CardHeader className="pt-4 pb-2">
              <CardTitle className="text-sm">{t(section.titleKey)}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 pb-4">
              {section.options.map((opt) => {
                const val = formConfig[opt.key] ?? ''
                if (opt.type === 'toggle') {
                  return (
                    <ToggleCell
                      key={opt.key}
                      optKey={opt.key}
                      value={val}
                      onChange={(v) => handleConfigChange(opt.key, v)}
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
                      onChange={(v) => handleConfigChange(opt.key, v)}
                      t={t}
                    />
                  )
                }
                return (
                  <TextCell
                    key={opt.key}
                    optKey={opt.key}
                    value={val}
                    onChange={(v) => handleConfigChange(opt.key, v)}
                    t={t}
                  />
                )
              })}
            </CardContent>
          </Card>
        ))}

        {/* Bottom save bar */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setEditingStrategy(null)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isMutating || !formName.trim()}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW — data table
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('strategies.title')}</h1>
        <Button size="sm" onClick={openAdd}>
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

      {/* Assignment Dialog */}
      <AssignmentDialog
        strategy={assignTarget}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        allStrategies={strategies}
      />

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

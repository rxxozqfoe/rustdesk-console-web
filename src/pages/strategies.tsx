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
import {
  STRATEGY_SECTIONS,
  getDefaultConfig,
  configToState,
  stateToConfig,
} from '@/lib/rustdesk-options'

const DEFAULT_CONFIG = getDefaultConfig(STRATEGY_SECTIONS)

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
    setFormConfig(configToState(strategy.config_options, STRATEGY_SECTIONS))
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

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table'
import { Play, Trash2, XCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getBuildVersions,
  triggerBuild,
  getBuildJobs,
  getBuildJobLog,
  cancelBuildJob,
  deleteBuildJob,
} from '@/services/build-job.service'
import type { BuildJob } from '@/types/build-job'

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    building: 'default',
    completed: 'secondary',
    failed: 'destructive',
  }
  const colors: Record<string, string> = {
    pending: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
    building: 'animate-pulse bg-blue-500 text-white',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400',
    failed: '',
  }
  return (
    <Badge variant={variants[status] || 'outline'} className={colors[status] || ''}>
      {status}
    </Badge>
  )
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '—'
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  const seconds = Math.floor((e - s) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainSeconds = seconds % 60
  return `${minutes}m ${remainSeconds}s`
}

// ─── Log Viewer Modal ─────────────────────────────────────────────────────

function LogViewerModal({
  jobId,
  status,
  onClose,
}: {
  jobId: number
  status: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [log, setLog] = useState('')
  const [offset, setOffset] = useState(0)
  const preRef = useRef<HTMLPreElement>(null)
  const isActive = status === 'pending' || status === 'building'

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    const fetchLog = async () => {
      try {
        const result = await getBuildJobLog(jobId, offset)
        if (result.log) {
          setLog((prev) => prev + result.log)
          setOffset(result.offset)
        }
      } catch {
        // ignore fetch errors
      }
    }

    fetchLog()
    if (isActive) {
      timer = setInterval(fetchLog, 2000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [jobId, isActive]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight
    }
  }, [log])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="max-h-[85vh] w-[800px] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">{t('build_jobs.build_log')}</CardTitle>
          {isActive && (
            <Badge variant="outline" className="animate-pulse border-blue-500 text-blue-600">
              {t('build_jobs.live')}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <pre
            ref={preRef}
            className="bg-muted max-h-[60vh] overflow-auto rounded p-4 font-mono text-xs whitespace-pre-wrap"
          >
            {log || t('build_jobs.no_log')}
          </pre>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function BuildJobsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Trigger form state
  const [selectedVersion, setSelectedVersion] = useState('')
  const [selectedPlatform] = useState('linux')
  const [selectedArch] = useState('x86_64')
  const [selectedFormat] = useState('deb')

  // List state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [logViewJob, setLogViewJob] = useState<BuildJob | null>(null)

  // ─── Queries ──────────────────────────────────────────────────────────

  const { data: versions } = useQuery({
    queryKey: ['build-versions'],
    queryFn: getBuildVersions,
  })

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['build-jobs', page, pageSize],
    queryFn: () => getBuildJobs({ page, page_size: pageSize }),
    refetchInterval: (query) => {
      const jobs = query.state.data?.list ?? []
      const hasActive = jobs.some(
        (j) => j.status === 'pending' || j.status === 'building',
      )
      return hasActive ? 5000 : false
    },
  })

  const jobs = jobsData?.list ?? []
  const total = jobsData?.total ?? 0
  const hasActiveJob = jobs.some(
    (j) => j.status === 'pending' || j.status === 'building',
  )

  // ─── Mutations ────────────────────────────────────────────────────────

  const triggerMutation = useMutation({
    mutationFn: () =>
      triggerBuild({
        version: selectedVersion,
        platform: selectedPlatform,
        arch: selectedArch,
        format: selectedFormat,
      }),
    onSuccess: () => {
      toast.success(t('build_jobs.triggered'))
      queryClient.invalidateQueries({ queryKey: ['build-jobs'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelBuildJob(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['build-jobs'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBuildJob(id),
    onSuccess: () => {
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['build-jobs'] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ─── Columns ──────────────────────────────────────────────────────────

  const columns: ColumnDef<BuildJob>[] = [
    {
      accessorKey: 'version',
      header: t('build_jobs.version'),
      cell: ({ row }) => <span className="font-mono">{row.original.version}</span>,
    },
    {
      id: 'target',
      header: t('build_jobs.target'),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.platform}/{row.original.arch} ({row.original.format})
        </span>
      ),
    },
    {
      id: 'status',
      header: t('build_jobs.status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'started',
      header: t('build_jobs.started'),
      cell: ({ row }) =>
        row.original.started_at
          ? new Date(row.original.started_at).toLocaleString()
          : '—',
    },
    {
      id: 'duration',
      header: t('build_jobs.duration'),
      cell: ({ row }) =>
        formatDuration(row.original.started_at, row.original.completed_at),
    },
    {
      id: 'error',
      header: t('build_jobs.error'),
      cell: ({ row }) =>
        row.original.error ? (
          <span className="text-destructive text-xs" title={row.original.error}>
            {row.original.error.length > 40
              ? row.original.error.substring(0, 40) + '...'
              : row.original.error}
          </span>
        ) : (
          '—'
        ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLogViewJob(row.original)}
            title={t('build_jobs.view_log')}
          >
            <FileText className="size-4" />
          </Button>
          {(row.original.status === 'pending' || row.original.status === 'building') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cancelMutation.mutate(row.original.id)}
              title={t('build_jobs.cancel')}
            >
              <XCircle className="text-destructive size-4" />
            </Button>
          )}
          {(row.original.status === 'completed' || row.original.status === 'failed') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(row.original.id)}
            >
              <Trash2 className="text-destructive size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('build_jobs.title')}</h1>

      {/* Trigger Build Card */}
      <Card>
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="text-sm">{t('build_jobs.trigger_build')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-1">
            <Label className="text-muted-foreground text-xs">{t('build_jobs.version')}</Label>
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder={t('build_jobs.select_version')} />
              </SelectTrigger>
              <SelectContent>
                {(versions || []).map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-muted-foreground text-xs">{t('build_jobs.platform')}</Label>
            <Select value={selectedPlatform} disabled>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linux">Linux</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-muted-foreground text-xs">{t('build_jobs.arch')}</Label>
            <Select value={selectedArch} disabled>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="x86_64">x86_64</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-muted-foreground text-xs">{t('build_jobs.format')}</Label>
            <Select value={selectedFormat} disabled>
              <SelectTrigger className="h-9 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deb">DEB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={() => triggerMutation.mutate()}
            disabled={!selectedVersion || hasActiveJob || triggerMutation.isPending}
          >
            <Play className="mr-1 size-4" />
            {t('build_jobs.start_build')}
          </Button>

          {hasActiveJob && (
            <span className="text-muted-foreground text-xs">{t('build_jobs.build_in_progress')}</span>
          )}
        </CardContent>
      </Card>

      {/* Build Jobs Table */}
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

      {/* Log Viewer */}
      {logViewJob && (
        <LogViewerModal
          jobId={logViewJob.id}
          status={logViewJob.status}
          onClose={() => setLogViewJob(null)}
        />
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

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { assignStrategy, getStrategyAssignments } from '@/services/strategy.service'
import { getPeers } from '@/services/peer.service'
import { getUsers } from '@/services/user.service'
import { getGroups } from '@/services/group.service'
import type { Strategy } from '@/types/strategy'

interface AssignmentDialogProps {
  strategy: Strategy | null
  open: boolean
  onOpenChange: (open: boolean) => void
  allStrategies: Strategy[]
}

type TabType = 'peer' | 'user' | 'device_group'

export function AssignmentDialog({
  strategy,
  open,
  onOpenChange,
  allStrategies,
}: AssignmentDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<TabType>('peer')
  const [search, setSearch] = useState('')
  const [selectedPeers, setSelectedPeers] = useState<Set<string>>(new Set())
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  // ─── Queries ──────────────────────────────────────────────────────────

  const { data: currentAssignments } = useQuery({
    queryKey: ['strategy-assignments', strategy?.id],
    queryFn: () => getStrategyAssignments(strategy!.id),
    enabled: open && !!strategy,
  })

  // Fetch all strategies' assignments to detect cross-strategy conflicts
  const { data: allAssignmentsMap } = useQuery({
    queryKey: ['all-strategy-assignments', allStrategies.map((s) => s.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        allStrategies.map(async (s) => {
          const assignments = await getStrategyAssignments(s.id)
          return { strategy: s, assignments }
        }),
      )
      const map = new Map<string, { strategyId: number; strategyName: string }>()
      for (const { strategy: s, assignments } of results) {
        for (const a of assignments) {
          map.set(`${a.type}:${a.id}`, {
            strategyId: s.id,
            strategyName: s.name,
          })
        }
      }
      return map
    },
    enabled: open && allStrategies.length > 0,
  })

  const { data: peersData } = useQuery({
    queryKey: ['peers-all-for-assign'],
    queryFn: () => getPeers({ page: 1, page_size: 1000 }),
    enabled: open,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-all-for-assign'],
    queryFn: () => getUsers({ page: 1, page_size: 1000 }),
    enabled: open,
  })

  const { data: groupsData } = useQuery({
    queryKey: ['groups-all-for-assign'],
    queryFn: () => getGroups({ page: 1, page_size: 1000 }),
    enabled: open,
  })

  // ─── Initialize selections from current assignments ────────────────────

  useEffect(() => {
    if (!open || !currentAssignments) return
    setSelectedPeers(
      new Set(currentAssignments.filter((a) => a.type === 'peer').map((a) => String(a.id))),
    )
    setSelectedUsers(
      new Set(currentAssignments.filter((a) => a.type === 'user').map((a) => String(a.id))),
    )
    setSelectedGroups(
      new Set(currentAssignments.filter((a) => a.type === 'device_group').map((a) => String(a.id))),
    )
  }, [open, currentAssignments])

  useEffect(() => {
    if (open) {
      setTab('peer')
      setSearch('')
    }
  }, [open])

  // ─── Filtered lists ───────────────────────────────────────────────────

  const peers = useMemo(() => {
    const list = peersData?.list ?? []
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        (p.hostname || '').toLowerCase().includes(q) ||
        (p.alias || '').toLowerCase().includes(q) ||
        (p.username || '').toLowerCase().includes(q),
    )
  }, [peersData, search])

  const users = useMemo(() => {
    const list = usersData?.list ?? []
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.nickname || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q),
    )
  }, [usersData, search])

  const groups = useMemo(() => {
    const list = (groupsData?.list ?? []).filter((g) => g.type === 2)
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter((g) => g.name.toLowerCase().includes(q))
  }, [groupsData, search])

  // ─── Toggle helpers ───────────────────────────────────────────────────

  function toggleSet<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  function togglePeer(id: string) {
    setSelectedPeers((s) => toggleSet(s, id))
  }
  function toggleUser(id: string) {
    setSelectedUsers((s) => toggleSet(s, id))
  }
  function toggleGroup(id: string) {
    setSelectedGroups((s) => toggleSet(s, id))
  }

  // Select all visible in current tab
  function toggleSelectAll() {
    if (tab === 'peer') {
      const visibleIds = peers.map((p) => p.id)
      const allSelected = visibleIds.every((id) => selectedPeers.has(id))
      if (allSelected) {
        setSelectedPeers((s) => {
          const next = new Set(s)
          for (const id of visibleIds) next.delete(id)
          return next
        })
      } else {
        setSelectedPeers((s) => new Set([...s, ...visibleIds]))
      }
    } else if (tab === 'user') {
      const visibleIds = users.map((u) => String(u.id))
      const allSelected = visibleIds.every((id) => selectedUsers.has(id))
      if (allSelected) {
        setSelectedUsers((s) => {
          const next = new Set(s)
          for (const id of visibleIds) next.delete(id)
          return next
        })
      } else {
        setSelectedUsers((s) => new Set([...s, ...visibleIds]))
      }
    } else {
      const visibleIds = groups.map((g) => String(g.id))
      const allSelected = visibleIds.every((id) => selectedGroups.has(id))
      if (allSelected) {
        setSelectedGroups((s) => {
          const next = new Set(s)
          for (const id of visibleIds) next.delete(id)
          return next
        })
      } else {
        setSelectedGroups((s) => new Set([...s, ...visibleIds]))
      }
    }
  }

  // ─── Conflict lookup ──────────────────────────────────────────────────

  function getConflict(type: TabType, id: string | number) {
    if (!allAssignmentsMap || !strategy) return null
    const info = allAssignmentsMap.get(`${type}:${id}`)
    if (!info) return null
    if (info.strategyId === strategy.id) return 'self'
    return info.strategyName
  }

  // ─── Is select-all checked? ───────────────────────────────────────────

  function isAllSelected(): boolean | 'indeterminate' {
    let visibleIds: string[]
    let selectedSet: Set<string>
    if (tab === 'peer') {
      visibleIds = peers.map((p) => p.id)
      selectedSet = selectedPeers
    } else if (tab === 'user') {
      visibleIds = users.map((u) => String(u.id))
      selectedSet = selectedUsers
    } else {
      visibleIds = groups.map((g) => String(g.id))
      selectedSet = selectedGroups
    }
    if (visibleIds.length === 0) return false
    const selectedCount = visibleIds.filter((id) => selectedSet.has(id)).length
    if (selectedCount === 0) return false
    if (selectedCount === visibleIds.length) return true
    return 'indeterminate'
  }

  // ─── Save ─────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!strategy) return
    const guid = strategy.guid

    const serverPeers = new Set(
      (currentAssignments ?? []).filter((a) => a.type === 'peer').map((a) => String(a.id)),
    )
    const serverUsers = new Set(
      (currentAssignments ?? []).filter((a) => a.type === 'user').map((a) => String(a.id)),
    )
    const serverGroups = new Set(
      (currentAssignments ?? []).filter((a) => a.type === 'device_group').map((a) => String(a.id)),
    )

    const addPeers = [...selectedPeers].filter((id) => !serverPeers.has(id))
    const removePeers = [...serverPeers].filter((id) => !selectedPeers.has(id))
    const addUsers = [...selectedUsers].filter((id) => !serverUsers.has(id))
    const removeUsers = [...serverUsers].filter((id) => !selectedUsers.has(id))
    const addGroups = [...selectedGroups].filter((id) => !serverGroups.has(id))
    const removeGroups = [...serverGroups].filter((id) => !selectedGroups.has(id))

    const ops: Promise<unknown>[] = []

    if (addPeers.length || addUsers.length || addGroups.length) {
      ops.push(
        assignStrategy({
          strategy: guid,
          ...(addPeers.length ? { peers: addPeers } : {}),
          ...(addUsers.length ? { users: addUsers.map(Number) } : {}),
          ...(addGroups.length ? { groups: addGroups.map(Number) } : {}),
        }),
      )
    }

    if (removePeers.length || removeUsers.length || removeGroups.length) {
      ops.push(
        assignStrategy({
          strategy: '',
          ...(removePeers.length ? { peers: removePeers } : {}),
          ...(removeUsers.length ? { users: removeUsers.map(Number) } : {}),
          ...(removeGroups.length ? { groups: removeGroups.map(Number) } : {}),
        }),
      )
    }

    if (ops.length === 0) {
      onOpenChange(false)
      return
    }

    setSubmitting(true)
    try {
      await Promise.all(ops)
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: ['strategy-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['all-strategy-assignments'] })
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render helpers ───────────────────────────────────────────────────

  function renderConflictBadge(type: TabType, id: string | number) {
    const conflict = getConflict(type, id)
    if (!conflict) return <span className="text-muted-foreground">—</span>
    if (conflict === 'self') {
      return <Badge variant="default">{t('strategies.this_strategy')}</Badge>
    }
    return (
      <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">
        {conflict}
      </Badge>
    )
  }

  const allChecked = isAllSelected()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[95vw] flex-col sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>
            {t('strategies.assignments')} — {strategy?.name}
          </DialogTitle>
        </DialogHeader>

        {/* Summary badges */}
        <div className="flex gap-2">
          <Badge variant="secondary">
            {t('strategies.type_peer')} {selectedPeers.size}
          </Badge>
          <Badge variant="secondary">
            {t('strategies.type_user')} {selectedUsers.size}
          </Badge>
          <Badge variant="secondary">
            {t('strategies.type_device_group')} {selectedGroups.size}
          </Badge>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {(['peer', 'user', 'device_group'] as const).map((t_) => {
            const count =
              t_ === 'peer'
                ? selectedPeers.size
                : t_ === 'user'
                  ? selectedUsers.size
                  : selectedGroups.size
            return (
              <button
                key={t_}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t_
                    ? 'text-foreground after:bg-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => {
                  setTab(t_)
                  setSearch('')
                }}
              >
                {t(`strategies.type_${t_}`)}
                {count > 0 && <span className="ml-1.5 text-xs opacity-70">({count})</span>}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="h-9 pl-9"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="w-10 px-3 py-2">
                  <Checkbox
                    checked={allChecked === true}
                    indeterminate={allChecked === 'indeterminate'}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                {tab === 'peer' && (
                  <>
                    <th className="px-3 py-2 text-left font-medium">{t('devices.id')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('devices.hostname')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('devices.alias')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('devices.username')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('devices.os')}</th>
                    <th className="px-3 py-2 text-left font-medium">
                      {t('strategies.current_strategy')}
                    </th>
                  </>
                )}
                {tab === 'user' && (
                  <>
                    <th className="px-3 py-2 text-left font-medium">ID</th>
                    <th className="px-3 py-2 text-left font-medium">{t('users.username')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('users.nickname')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('users.email')}</th>
                    <th className="px-3 py-2 text-left font-medium">
                      {t('strategies.current_strategy')}
                    </th>
                  </>
                )}
                {tab === 'device_group' && (
                  <>
                    <th className="px-3 py-2 text-left font-medium">ID</th>
                    <th className="px-3 py-2 text-left font-medium">{t('groups.name')}</th>
                    <th className="px-3 py-2 text-left font-medium">{t('common.created_at')}</th>
                    <th className="px-3 py-2 text-left font-medium">
                      {t('strategies.current_strategy')}
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tab === 'peer' &&
                peers.map((p) => {
                  const checked = selectedPeers.has(p.id)
                  return (
                    <tr
                      key={p.row_id}
                      className={`hover:bg-muted/50 cursor-pointer border-b transition-colors ${checked ? 'bg-green-50 dark:bg-green-950/20' : ''}`}
                      onClick={() => togglePeer(p.id)}
                    >
                      <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={checked} onCheckedChange={() => togglePeer(p.id)} />
                      </td>
                      <td className="px-3 py-2 font-mono">{p.id}</td>
                      <td className="px-3 py-2">{p.hostname || '—'}</td>
                      <td className="px-3 py-2">{p.alias || '—'}</td>
                      <td className="px-3 py-2">{p.username || '—'}</td>
                      <td className="px-3 py-2">{p.os || '—'}</td>
                      <td className="px-3 py-2">{renderConflictBadge('peer', p.id)}</td>
                    </tr>
                  )
                })}
              {tab === 'user' &&
                users.map((u) => {
                  const checked = selectedUsers.has(String(u.id))
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-muted/50 cursor-pointer border-b transition-colors ${checked ? 'bg-green-50 dark:bg-green-950/20' : ''}`}
                      onClick={() => toggleUser(String(u.id))}
                    >
                      <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleUser(String(u.id))}
                        />
                      </td>
                      <td className="px-3 py-2">{u.id}</td>
                      <td className="px-3 py-2">{u.username}</td>
                      <td className="px-3 py-2">{u.nickname || '—'}</td>
                      <td className="px-3 py-2">{u.email || '—'}</td>
                      <td className="px-3 py-2">{renderConflictBadge('user', u.id)}</td>
                    </tr>
                  )
                })}
              {tab === 'device_group' &&
                groups.map((g) => {
                  const checked = selectedGroups.has(String(g.id))
                  return (
                    <tr
                      key={g.id}
                      className={`hover:bg-muted/50 cursor-pointer border-b transition-colors ${checked ? 'bg-green-50 dark:bg-green-950/20' : ''}`}
                      onClick={() => toggleGroup(String(g.id))}
                    >
                      <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleGroup(String(g.id))}
                        />
                      </td>
                      <td className="px-3 py-2">{g.id}</td>
                      <td className="px-3 py-2">{g.name}</td>
                      <td className="px-3 py-2">
                        {g.created_at ? new Date(g.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2">{renderConflictBadge('device_group', g.id)}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

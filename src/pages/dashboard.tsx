import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Users, Monitor, ArrowRightLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getUsers } from '@/services/user.service'
import { getPeers } from '@/services/peer.service'
import { getAuditConns } from '@/services/audit.service'

export default function DashboardPage() {
  const { t } = useTranslation()

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: () => getUsers({ page: 1, page_size: 1 }),
  })

  const { data: peersData, isLoading: peersLoading } = useQuery({
    queryKey: ['dashboard-peers'],
    queryFn: () => getPeers({ page: 1, page_size: 1 }),
  })

  const { data: connsData, isLoading: connsLoading } = useQuery({
    queryKey: ['dashboard-conns'],
    queryFn: () => getAuditConns({ page: 1, page_size: 1 }),
  })

  const stats = [
    {
      title: t('dashboard.total_users'),
      value: usersData?.total ?? 0,
      loading: usersLoading,
      icon: Users,
    },
    {
      title: t('dashboard.total_devices'),
      value: peersData?.total ?? 0,
      loading: peersLoading,
      icon: Monitor,
    },
    {
      title: t('dashboard.total_connections'),
      value: connsData?.total ?? 0,
      loading: connsLoading,
      icon: ArrowRightLeft,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="text-muted-foreground size-5" />
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { useLocation, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Home,
  Monitor,
  FileText,
  Users,
  FolderTree,
  BookOpen,
  Shield,
  Package,
  Settings,
  ChevronRight,
  Share2,
  ClipboardList,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { useAuthStore } from '@/stores/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavItem {
  labelKey: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  path: string
  adminOnly?: boolean
}

interface NavGroup {
  labelKey: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  children: NavItem[]
  adminOnly?: boolean
}

type NavEntry = NavItem | NavGroup

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry
}

const navItems: NavEntry[] = [
  { labelKey: 'sidebar.welcome', icon: Home, path: '/' },
  {
    labelKey: 'sidebar.my_space',
    icon: Users,
    children: [
      { labelKey: 'sidebar.my_devices', icon: Monitor, path: '/my/devices' },
      { labelKey: 'sidebar.my_address_books', icon: BookOpen, path: '/my/address-books' },
      { labelKey: 'sidebar.my_share_records', icon: Share2, path: '/my/share-records' },
      { labelKey: 'sidebar.my_login_logs', icon: ClipboardList, path: '/my/login-logs' },
    ],
  },
  { labelKey: 'sidebar.devices', icon: Monitor, path: '/devices', adminOnly: true },
  {
    labelKey: 'sidebar.logs',
    icon: FileText,
    adminOnly: true,
    children: [
      { labelKey: 'sidebar.logs_connection', icon: FileText, path: '/logs/connection' },
      { labelKey: 'sidebar.logs_file', icon: FileText, path: '/logs/file' },
    ],
  },
  { labelKey: 'sidebar.users', icon: Users, path: '/users', adminOnly: true },
  { labelKey: 'sidebar.groups', icon: FolderTree, path: '/groups', adminOnly: true },
  { labelKey: 'sidebar.address_books', icon: BookOpen, path: '/address-books', adminOnly: true },
  { labelKey: 'sidebar.strategies', icon: Shield, path: '/strategies', adminOnly: true },
  { labelKey: 'sidebar.custom_clients', icon: Package, path: '/custom-clients', adminOnly: true },
  {
    labelKey: 'sidebar.settings',
    icon: Settings,
    adminOnly: true,
    children: [
      { labelKey: 'sidebar.settings_oauth', icon: Settings, path: '/settings/oauth' },
      { labelKey: 'sidebar.settings_tokens', icon: Settings, path: '/settings/tokens' },
      { labelKey: 'sidebar.settings_login_logs', icon: Settings, path: '/settings/login-logs' },
      { labelKey: 'sidebar.settings_share_records', icon: Settings, path: '/settings/share-records' },
      { labelKey: 'sidebar.settings_commands', icon: Settings, path: '/settings/commands' },
    ],
  },
]

function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.children.some((child) => child.path === pathname)
}

export function AppSidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const pathname = location.pathname

  const visibleNavItems = navItems.filter((entry) => !entry.adminOnly || isAdmin)

  const userInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'U'

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            R
          </div>
          <span className="text-sm font-semibold">{t('app.title')}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.welcome')}</SidebarGroupLabel>
          <SidebarMenu>
            {visibleNavItems.map((entry) => {
              if (isNavGroup(entry)) {
                const groupActive = isGroupActive(entry, pathname)
                const Icon = entry.icon
                return (
                  <Collapsible
                    key={entry.labelKey}
                    defaultOpen={groupActive}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger
                        render={
                          <SidebarMenuButton tooltip={t(entry.labelKey)}>
                            <Icon />
                            <span>{t(entry.labelKey)}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 [[data-panel-open]_&]:rotate-90" />
                          </SidebarMenuButton>
                        }
                      />
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {entry.children.map((child) => (
                            <SidebarMenuSubItem key={child.path}>
                              <SidebarMenuSubButton
                                isActive={pathname === child.path}
                                render={<Link to={child.path} />}
                              >
                                <span>{t(child.labelKey)}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              }

              const Icon = entry.icon
              return (
                <SidebarMenuItem key={entry.path}>
                  <SidebarMenuButton
                    isActive={pathname === entry.path}
                    tooltip={t(entry.labelKey)}
                    render={<Link to={entry.path} />}
                  >
                    <Icon />
                    <span>{t(entry.labelKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-2">
          <Avatar size="sm">
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-medium truncate">
              {user?.nickname || user?.username || 'User'}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {user?.email || ''}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

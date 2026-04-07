import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, Link } from 'react-router'
import { Sun, Moon, Globe, LogOut } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const routeLabels: Record<string, string> = {
  '': 'sidebar.welcome',
  devices: 'sidebar.devices',
  users: 'sidebar.users',
  groups: 'sidebar.groups',
  logs: 'sidebar.logs',
  connection: 'sidebar.logs_connection',
  file: 'sidebar.logs_file',
  'address-books': 'sidebar.address_books',
  strategies: 'sidebar.strategies',
  'custom-clients': 'sidebar.custom_clients',
  settings: 'sidebar.settings',
  oauth: 'sidebar.settings_oauth',
  tokens: 'sidebar.settings_tokens',
  'login-logs': 'sidebar.settings_login_logs',
  'share-records': 'sidebar.settings_share_records',
  commands: 'sidebar.settings_commands',
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
]

export function AppHeader() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const segments = location.pathname.split('/').filter(Boolean)

  const userInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'U'

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {segments.length === 0 ? (
            <BreadcrumbItem>
              <BreadcrumbPage>{t('sidebar.welcome')}</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            segments.map((segment, index) => {
              const isLast = index === segments.length - 1
              const labelKey = routeLabels[segment] || segment
              const path = '/' + segments.slice(0, index + 1).join('/')

              return (
                <BreadcrumbItem key={path}>
                  {index > 0 && <BreadcrumbSeparator />}
                  {isLast ? (
                    <BreadcrumbPage>{t(labelKey)}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link to={path} />}>{t(labelKey)}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              )
            })
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm">
                <Globe className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onSelect={() => i18n.changeLanguage(lang.code)}
              >
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="rounded-full">
                <Avatar size="sm">
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar size="sm">
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-sm leading-tight">
                <span className="font-medium">
                  {user?.nickname || user?.username || 'User'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.email || ''}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="size-4" />
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

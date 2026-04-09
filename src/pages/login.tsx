import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User, Lock, Eye, EyeOff, GitBranch } from 'lucide-react'

import { useAuthStore } from '@/stores/auth'
import { login, getLoginOptions, getCaptcha } from '@/services/auth.service'
import type { LoginOptions } from '@/types/user'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupText,
} from '@/components/ui/input-group'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  captcha: z.string().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const setAuthFromLogin = useAuthStore((s) => s.setAuthFromLogin)

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loginOptions, setLoginOptions] = useState<LoginOptions | null>(null)
  const [captcha, setCaptcha] = useState<{ id: string; b64: string } | null>(null)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      captcha: '',
    },
  })

  const isSubmitting = form.formState.isSubmitting

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/', { replace: true })
    }
  }, [token, navigate])

  // Load login options on mount
  useEffect(() => {
    getLoginOptions()
      .then((opts) => {
        setLoginOptions(opts)
        if (opts.need_captcha) {
          loadCaptcha()
        }
      })
      .catch(() => {
        // Non-fatal: render without options
      })
  }, [])

  async function loadCaptcha() {
    try {
      const data = await getCaptcha()
      setCaptcha(data)
    } catch {
      // Silently fail captcha load
    }
  }

  async function onSubmit(values: LoginForm) {
    try {
      const payload: Parameters<typeof login>[0] = {
        username: values.username,
        password: values.password,
      }
      if (loginOptions?.need_captcha && captcha) {
        payload.captcha = values.captcha
        payload.captcha_id = captcha.id
      }
      const res = await login(payload)
      setAuthFromLogin(res)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common.error', 'Login failed')
      toast.error(message)
      if (loginOptions?.need_captcha) {
        loadCaptcha()
        form.setValue('captcha', '')
      }
    }
  }

  function handleOAuthClick(providerName: string) {
    toast.info(t('login.login_with', { provider: providerName }))
  }

  function getOAuthIcon(type: string) {
    const lower = type.toLowerCase()
    if (lower === 'github') return <GitBranch className="size-4" />
    return null
  }

  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl text-2xl font-bold">
            R
          </div>
          <h1 className="text-xl font-semibold tracking-tight">RustDesk</h1>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-base">{t('login.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Username */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.username')}</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon>
                            <InputGroupText>
                              <User />
                            </InputGroupText>
                          </InputGroupAddon>
                          <InputGroupInput
                            placeholder={t('login.username')}
                            autoComplete="username"
                            {...field}
                          />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.password')}</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon>
                            <InputGroupText>
                              <Lock />
                            </InputGroupText>
                          </InputGroupAddon>
                          <InputGroupInput
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('login.password')}
                            autoComplete="current-password"
                            {...field}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? (
                                <EyeOff className="size-3.5" />
                              ) : (
                                <Eye className="size-3.5" />
                              )}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Captcha (conditional) */}
                {loginOptions?.need_captcha && (
                  <FormField
                    control={form.control}
                    name="captcha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Captcha</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <InputGroup className="flex-1">
                              <InputGroupInput
                                placeholder="Enter captcha"
                                autoComplete="off"
                                {...field}
                              />
                            </InputGroup>
                          </FormControl>
                          {captcha?.b64 && (
                            <button
                              type="button"
                              onClick={loadCaptcha}
                              title="Click to refresh captcha"
                              className="border-input flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border"
                            >
                              <img
                                src={`data:image/png;base64,${captcha.b64}`}
                                alt="captcha"
                                className="h-8 w-24 object-cover"
                              />
                            </button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Remember me */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked)}
                  />
                  <label
                    htmlFor="remember-me"
                    className="text-muted-foreground cursor-pointer text-sm select-none"
                  >
                    {t('login.remember_me')}
                  </label>
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t('login.login')}
                    </span>
                  ) : (
                    t('login.login')
                  )}
                </Button>

                {/* OAuth section */}
                {loginOptions?.ops && loginOptions.ops.length > 0 && (
                  <div className="space-y-3">
                    <div className="relative flex items-center">
                      <div className="border-border flex-1 border-t" />
                      <span className="text-muted-foreground mx-3 text-xs">{t('login.or')}</span>
                      <div className="border-border flex-1 border-t" />
                    </div>
                    <div className="flex flex-col gap-2">
                      {loginOptions.ops.map((provider) => (
                        <Button
                          key={provider.name}
                          type="button"
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => handleOAuthClick(provider.name)}
                        >
                          {getOAuthIcon(provider.type)}
                          {t('login.login_with', { provider: provider.name })}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-muted-foreground text-center text-xs">
          &copy; {new Date().getFullYear()} RustDesk. All rights reserved.
        </p>
      </div>
    </div>
  )
}

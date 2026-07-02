import { redirect } from 'next/navigation'
import { getCurrentRole } from '@/lib/auth/role'

interface RootPageProps {
  searchParams: Promise<{ login?: string; next?: string }>
}

export default async function RootPage({ searchParams }: RootPageProps) {
  const role = await getCurrentRole()
  if (role === 'ADMIN') redirect('/admin/dashboard')

  const { login, next } = await searchParams
  const params = new URLSearchParams()
  if (login) params.set('login', login)
  if (next) params.set('next', next)
  const query = params.toString()

  redirect(query ? `/inicio?${query}` : '/inicio')
}

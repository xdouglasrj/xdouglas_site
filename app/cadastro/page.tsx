import type { Metadata } from 'next'
import { SignupForm } from '@/components/signup/SignupForm'

export const metadata: Metadata = {
  title: 'Criar conta',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ convite?: string }>
}

export default async function CadastroPage({ searchParams }: PageProps) {
  const { convite } = await searchParams
  return <SignupForm initialInviteCode={convite ?? ''} />
}

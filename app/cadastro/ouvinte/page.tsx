import type { Metadata } from 'next'
import { SignupForm } from '@/components/signup/SignupForm'

export const metadata: Metadata = {
  title: 'Cadastro de ouvinte',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ convite?: string }>
}

export default async function CadastroOuvintePage({ searchParams }: PageProps) {
  const { convite } = await searchParams
  return <SignupForm type="visitor" initialInviteCode={convite ?? ''} />
}

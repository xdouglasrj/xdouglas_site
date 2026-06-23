import type { Metadata } from 'next'
import { SignupForm } from '@/components/signup/SignupForm'

export const metadata: Metadata = {
  title: 'Cadastro de músico/produtor',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ convite?: string }>
}

export default async function CadastroMusicoPage({ searchParams }: PageProps) {
  const { convite } = await searchParams
  return <SignupForm type="artist" initialInviteCode={convite ?? ''} />
}

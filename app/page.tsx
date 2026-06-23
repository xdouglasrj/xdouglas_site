import { redirect } from 'next/navigation'
import { getCurrentRole } from '@/lib/auth/role'
import { GateContent } from '@/components/gate/GateContent'

export default async function GatePage() {
  const role = await getCurrentRole()

  // Já está logado (em outra aba, por exemplo) — não mostra o portão de
  // login de novo, manda direto para a área correspondente
  if (role) {
    redirect(role === 'ADMIN' ? '/admin/dashboard' : '/inicio')
  }

  return <GateContent />
}

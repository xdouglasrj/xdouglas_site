import { redirect } from 'next/navigation'

interface PageProps {
  searchParams: Promise<{ convite?: string }>
}

// Rota antiga — mantida porque há emails já enviados apontando para cá.
// Redireciona para a página única de cadastro preservando o convite.
export default async function CadastroMusicoPage({ searchParams }: PageProps) {
  const { convite } = await searchParams
  redirect(convite ? `/cadastro?convite=${encodeURIComponent(convite)}` : '/cadastro')
}

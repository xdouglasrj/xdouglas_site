import { PublicHeader } from '@/components/layout/public-header'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-950">
      <PublicHeader />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-neutral-800 py-6 px-4">
        <p className="text-center text-xs text-neutral-600">
          xDouglas © {new Date().getFullYear()} ·{' '}
          <a
            href="/privacidade"
            className="hover:text-neutral-400 transition-colors"
          >
            Política de Privacidade
          </a>
        </p>
      </footer>
    </div>
  )
}

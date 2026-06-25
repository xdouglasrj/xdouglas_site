export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gate-bg">
      <div className="flex-1">
        {children}
      </div>
      <footer className="border-t border-gate-azure py-6 px-4">
        <p className="text-center text-xs text-gate-blue">
          xDouglas © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}

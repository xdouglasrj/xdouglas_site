import Link from 'next/link'

export function InviteCard() {
  return (
    <section className="bg-[#0B0B0F] py-24 px-4 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div
          className="relative overflow-hidden rounded-3xl border border-white/10 p-10 md:p-14 text-center"
          style={{
            background: 'linear-gradient(135deg, #4F8CFF0D 0%, #67E8F908 50%, #080808 100%)',
          }}
        >
          {/* Glow de fundo */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
            style={{
              width: '500px',
              height: '200px',
              background: 'radial-gradient(ellipse at top, rgba(79,140,255,0.12) 0%, transparent 70%)',
            }}
          />

          <div className="relative">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#4F8CFF]/25 bg-[#4F8CFF]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#4F8CFF]">
              Acesso exclusivo
            </span>

            <h2 className="mb-4 font-['Manrope'] text-3xl font-extrabold leading-tight text-white md:text-4xl">
              Faça parte da próxima geração<br />
              <span className="bg-gradient-to-r from-[#4F8CFF] to-[#67E8F9] bg-clip-text text-transparent">
                da música independente.
              </span>
            </h2>

            <p className="mx-auto mb-10 max-w-md text-[#94A3B8]">
              A plataforma é exclusiva. O acesso é por convite. Quem entra primeiro ajuda a moldar o que vem depois.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/convite"
                className="w-full rounded-xl bg-[#4F8CFF] px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-[#4F8CFF]/20 transition hover:bg-[#4F8CFF]/90 sm:w-auto"
              >
                Solicitar convite
              </Link>
              <Link
                href="/cadastro"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10 sm:w-auto"
              >
                Já tenho convite
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

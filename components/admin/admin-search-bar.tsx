/** Form GET simples — busca por nome, email, telefone ou usuário, sem JS. */
export function AdminSearchBar({
  defaultValue,
  placeholder = 'Buscar por nome, email ou telefone...',
}: {
  defaultValue?: string
  placeholder?: string
}) {
  return (
    <form method="GET" className="mb-4">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600"
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-9 pr-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-neutral-600"
        />
      </div>
    </form>
  )
}

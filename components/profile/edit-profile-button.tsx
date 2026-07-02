import Link from 'next/link'

export function EditProfileButton() {
  return (
    <Link
      href="/perfil/editar"
      className="rounded-md bg-gate-pink px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
    >
      Editar perfil
    </Link>
  )
}

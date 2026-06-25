'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileForm } from './profile-form'

interface EditProfileButtonProps {
  email: string
  username: string | null
  handle: string | null
  artisticName: string | null
  phone: string | null
  initialName: string
  initialPhotoUrl: string | null
  initialShowEmail: boolean
  initialShowPhone: boolean
  initialShowName: boolean
  isArtist: boolean
}

export function EditProfileButton(props: EditProfileButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleClose() {
    setOpen(false)
    router.refresh()
  }

  // O @ define a URL do perfil (/perfil/<handle>) — se o usuário trocar o @
  // enquanto está vendo o próprio perfil, navega para a nova URL para não
  // ficar numa rota que deixou de existir.
  function handleHandleChange(newHandle: string) {
    router.replace(`/perfil/${newHandle}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-gate-pink px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Editar perfil
      </button>

      {open && <ProfileForm {...props} onClose={handleClose} onHandleChange={handleHandleChange} />}
    </>
  )
}

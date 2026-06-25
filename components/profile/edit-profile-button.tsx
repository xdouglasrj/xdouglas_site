'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileForm } from './profile-form'

interface EditProfileButtonProps {
  email: string
  username: string | null
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-gate-pink px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Editar perfil
      </button>

      {open && <ProfileForm {...props} onClose={handleClose} />}
    </>
  )
}

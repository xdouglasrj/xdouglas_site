import type { Metadata } from 'next'
import { MusicaExperience } from '@/components/musica/MusicaExperience'

export const metadata: Metadata = {
  title: 'Música',
  description: 'Plataforma de música independente — lançamentos, destaques e agenda.',
  robots: { index: true, follow: true },
}

export default function MusicaPage() {
  return <MusicaExperience />
}

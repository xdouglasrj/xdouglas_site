import { createHash } from 'node:crypto'
import { closeSync, openSync, readSync, readdirSync } from 'node:fs'
import { extname, join } from 'node:path'

const mediaDirectory = join(process.cwd(), 'public', 'ian-raposo-media')

export const editorial = {
  source: 'https://www.ianraposo.com/sobre',
  bio: {
    pt: [
      'Ian Raposo (1992) nasceu no Rio de Janeiro, onde reside e trabalha. Com graduação em Design pela PUC-Rio e passagem em cursos de formação na EAV Parque Lage, usa a pintura como principal abordagem técnica.',
      'Seu trabalho propõe uma investigação visual dos impactos do desconforto psicológico e emocional no ser humano.',
      'A partir da obsessão pelo universo visual e sonoro da cultura da música underground, dos movimentos de rock alternativo, e de seu ingresso ainda jovem no movimento de arte urbana, começou a produzir imagens baseadas na agressividade e violência estéticas dos cartazes e materiais de divulgação de bandas de punk e hardcore.',
      'Em 2024, cofundou, junto a sete amigos, o Virtua 3000, espaço voltado para projetos de arte contemporânea onde também funcionam seus respectivos ateliês.',
      'Em 2025 participou do projeto Ateliê Aberto durante a ArtRio, a convite do Canal Curta! e da Clear Channel, onde pintou um painel durante o evento.',
    ],
    en: [
      'Ian Raposo (b. 1992, Rio de Janeiro, Brazil) is a visual artist based in Rio de Janeiro. He holds a degree in Design from PUC-Rio and has also studied at the School of Visual Arts at Parque Lage (EAV Parque Lage). His practice is primarily centered around painting.',
      'His work explores the psychological and emotional discomforts that affect the human condition.',
      "Deeply influenced by the visual and sonic aesthetics of underground music culture, particularly alternative rock, punk, hardcore, and his early involvement in urban art, Ian Raposo's work draws from the raw energy and graphic violence found in band posters and DIY promotional materials.",
      'In 2024, he co-founded Virtua 3000 with seven friends, an independent contemporary art space that hosts art projects and houses the studios of its eight founding artists.',
      'In 2025, he participated in the Ateliê Aberto project during ArtRio, at the invitation of Canal Curta! and Clear Channel, painting a panel during the event.',
    ],
  },
  exhibitions: [
    { year: 2025, title: 'Moscas Volantes', curator: 'Bia Coslovsky', venue: 'Virtua 3000' },
    { year: 2024, title: 'Nova Bella 86', curator: 'Daniela Avelar', venue: 'São Cristóvão' },
    { year: 2023, title: 'Catavento 23', curator: 'Ian Raposo, Bruno Magliari, TAF e Gpeto', venue: 'São Cristóvão' },
    { year: 2022, title: 'Entre tubos & baratas', venue: 'São Cristóvão' },
    { year: 2022, title: 'ANTIMODA', curator: 'Pedro Pagy', venue: 'Martha Pagy Escritório de Arte' },
    { year: 2021, title: 'O que nos une', curator: 'Franz Manata', venue: 'Rio de Janeiro' },
    { year: 2020, title: 'Patifaria 2', venue: 'Titocar Poético, Maricá' },
    { year: 2019, title: 'Tipo Coletivo', curator: 'Edimilson Nunes', venue: 'Tipografia' },
    { year: 2019, title: 'Curto Circuito 2', curator: 'Débora Guimarães', venue: 'Caixa Preta' },
    { year: 2019, title: 'Bicho', curator: 'Carla Guimarães', venue: 'Casa Bicho' },
    { year: 2019, title: 'LaKermessefez1', venue: 'Caixa Preta' },
    { year: 2018, title: 'Formação e Deformação', curator: 'Ulisses Carrilho e Keyna Eleison', venue: 'Cavalariças do Parque Lage' },
    { year: 2018, title: '9FCCP', curator: 'Bob N', venue: 'Galeria Úmida' },
    { year: 2018, title: 'Pouso de emergência', curator: 'Rafael BQueer e Vinicius Montes', venue: 'Caixa Preta' },
    { year: 2017, title: 'Curto Circuito', curator: 'Débora Guimarães', venue: 'Castelinho do Flamengo' },
  ],
  activities: {
    pt: [
      { year: 2025, text: 'Ateliê Aberto — ArtRio, Canal Curta! e Clear Channel' },
      { year: 2024, text: 'Cofundação do espaço de arte Virtua 3000' },
      { year: 2022, text: 'Início das aulas de pintura no Rio de Janeiro' },
      { year: 2021, text: 'Residência / Ciclo 2 da Galeria Refresco' },
      { year: 2018, text: 'Formação e Deformação — EAV Parque Lage' },
    ],
    en: [
      { year: 2025, text: 'Ateliê Aberto — ArtRio, Canal Curta! and Clear Channel' },
      { year: 2024, text: 'Co-founding of the Virtua 3000 art space' },
      { year: 2022, text: 'Began teaching painting in Rio de Janeiro' },
      { year: 2021, text: 'Residency / Cycle 2 at Galeria Refresco' },
      { year: 2018, text: 'Formação e Deformação — EAV Parque Lage' },
    ],
  },
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function createMediaId(filename: string) {
  return `media-${createHash('sha256').update(filename).digest('hex').slice(0, 16)}`
}

function readJpegDimensions(filePath: string) {
  let fd: number | null = null
  try {
    fd = openSync(filePath, 'r')
    const buffer = Buffer.alloc(65536)
    const bytesRead = readSync(fd, buffer, 0, 65536, 0)
    const data = buffer.subarray(0, bytesRead)
    if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return { width: 1, height: 1 }

    let offset = 2
    while (offset < data.length - 1) {
      if (data[offset] !== 0xff) {
        offset++
        continue
      }
      const marker = data[offset + 1]
      if (marker === 0xd9 || marker === 0xda) break
      if (marker === 0xc0 || marker === 0xc2) {
        if (offset + 9 < data.length) {
          const height = data.readUInt16BE(offset + 5)
          const width = data.readUInt16BE(offset + 7)
          if (width > 0 && height > 0) return { width, height }
        }
        break
      }
      if (offset + 3 >= data.length) break
      offset += 2 + data.readUInt16BE(offset + 2)
    }
  } catch {}
  finally {
    if (fd !== null) closeSync(fd)
  }
  return { width: 1, height: 1 }
}

type Media = { id: string; width: number; height: number; kind: 'image' }
type WorkGroup = { title: string; year: number | null; images: Media[] }

const files = readdirSync(mediaDirectory).filter((filename) => {
  const extension = extname(filename).toLowerCase()
  return (extension === '.jpg' || extension === '.jpeg') && !filename.includes('SaveClip')
})

export const mediaFiles = new Map<string, string>()
export const institutions: { artist: Media[]; course: Media[]; studio: Media[] } = {
  artist: [],
  course: [],
  studio: [],
}
const workFiles: Array<{ title: string; year: number | null; media: Media }> = []

for (const filename of files) {
  const stem = filename.replace(/\.[^.]+$/, '')
  const normalized = stem.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const id = createMediaId(filename)
  const media = { id, ...readJpegDimensions(join(mediaDirectory, filename)), kind: 'image' as const }
  mediaFiles.set(id, filename)

  if (normalized.startsWith('curso de pintura a oleo')) institutions.course.push(media)
  else if (normalized.startsWith('ian raposo')) institutions.artist.push(media)
  else if (normalized.startsWith('atelier')) institutions.studio.push(media)
  else {
    const title = stem.replace(/\s+\d{2}$/, '')
    const yearMatch = stem.match(/(?:^|\s)((?:19|20)\d{2})(?:\s|$)/)
    workFiles.push({ title, year: yearMatch ? Number(yearMatch[1]) : null, media })
  }
}

const groups = new Map<string, WorkGroup>()
for (const item of workFiles) {
  const key = item.title.toLowerCase()
  if (!groups.has(key)) groups.set(key, { title: item.title, year: item.year, images: [] })
  groups.get(key)?.images.push(item.media)
}

export const works = Array.from(groups.values()).map((group, order) => ({
  id: `work-${slug(group.title)}`,
  title: group.title,
  year: group.year,
  category: 'paintings',
  images: group.images,
  order,
  source: group.images[0].id,
}))

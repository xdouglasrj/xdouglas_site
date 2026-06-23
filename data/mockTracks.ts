export interface MockTrack {
  id: string
  title: string
  artist: string
  artistSlug: string
  genre: string
  date: string
  duration: string
  format: 'WAV' | 'MP3'
  downloads: number
  plays: number
  bpm: number
  key: string
  coverColor: string
}

export const mockTracks: MockTrack[] = [
  { id:'1',  title:'Maré Alta',       artist:'Nova Pulse', artistSlug:'nova-pulse', genre:'Deep House',     date:'12 jan 2024', duration:'6:14', format:'WAV', downloads:1842, plays:312,  bpm:124, key:'Am',  coverColor:'#c0392b' },
  { id:'2',  title:'Corrente',         artist:'Drift KR',   artistSlug:'drift-kr',   genre:'Trap',           date:'03 fev 2024', duration:'3:47', format:'MP3', downloads:3210, plays:891,  bpm:140, key:'F#m', coverColor:'#8e44ad' },
  { id:'3',  title:'Axé Digital',      artist:'Cena B',     artistSlug:'cena-b',     genre:'Afrobeats',      date:'19 fev 2024', duration:'4:02', format:'WAV', downloads:982,  plays:204,  bpm:110, key:'Dm',  coverColor:'#16a085' },
  { id:'4',  title:'Névoa',            artist:'Nova Pulse', artistSlug:'nova-pulse', genre:'Ambient House',  date:'07 mar 2024', duration:'7:33', format:'WAV', downloads:701,  plays:98,   bpm:118, key:'Gm',  coverColor:'#2471a3' },
  { id:'5',  title:'Fluxo',            artist:'Drift KR',   artistSlug:'drift-kr',   genre:'Hip-Hop',        date:'22 mar 2024', duration:'2:58', format:'MP3', downloads:5420, plays:1430, bpm:90,  key:'Cm',  coverColor:'#d35400' },
  { id:'6',  title:'Ritual',           artist:'Cena B',     artistSlug:'cena-b',     genre:'R&B',            date:'01 abr 2024', duration:'3:21', format:'WAV', downloads:1230, plays:347,  bpm:78,  key:'Bbm', coverColor:'#1e8449' },
  { id:'7',  title:'Porto Seco',       artist:'Nova Pulse', artistSlug:'nova-pulse', genre:'Techno',         date:'15 abr 2024', duration:'8:10', format:'MP3', downloads:430,  plays:77,   bpm:134, key:'Em',  coverColor:'#6c3483' },
  { id:'8',  title:'Subida',           artist:'Drift KR',   artistSlug:'drift-kr',   genre:'Trap',           date:'29 abr 2024', duration:'3:12', format:'WAV', downloads:4100, plays:1102, bpm:144, key:'Dm',  coverColor:'#c0392b' },
  { id:'9',  title:'Calor de Verão',   artist:'Cena B',     artistSlug:'cena-b',     genre:'Afrobeats',      date:'10 mai 2024', duration:'4:45', format:'MP3', downloads:860,  plays:189,  bpm:105, key:'Am',  coverColor:'#b7950b' },
  { id:'10', title:'Frequency',        artist:'Nova Pulse', artistSlug:'nova-pulse', genre:'Deep House',     date:'24 mai 2024', duration:'5:58', format:'WAV', downloads:2100, plays:558,  bpm:126, key:'Fm',  coverColor:'#1a5276' },
  { id:'11', title:'Cimento Armado',   artist:'Drift KR',   artistSlug:'drift-kr',   genre:'Hip-Hop',        date:'05 jun 2024', duration:'3:33', format:'MP3', downloads:3780, plays:997,  bpm:85,  key:'C#m', coverColor:'#4a235a' },
  { id:'12', title:'Mangue Beat 3.0',  artist:'Cena B',     artistSlug:'cena-b',     genre:'Afrobeats',      date:'18 jun 2024', duration:'5:01', format:'WAV', downloads:620,  plays:143,  bpm:115, key:'Gm',  coverColor:'#0e6655' },
  { id:'13', title:'Pista Vazia',      artist:'Nova Pulse', artistSlug:'nova-pulse', genre:'Minimal Techno', date:'02 jul 2024', duration:'9:20', format:'WAV', downloads:311,  plays:54,   bpm:130, key:'Bm',  coverColor:'#212f3d' },
  { id:'14', title:'Freestyle #7',     artist:'Drift KR',   artistSlug:'drift-kr',   genre:'Hip-Hop',        date:'16 jul 2024', duration:'2:44', format:'MP3', downloads:6100, plays:1788, bpm:93,  key:'Am',  coverColor:'#922b21' },
  { id:'15', title:'Noite Alta',       artist:'Cena B',     artistSlug:'cena-b',     genre:'R&B',            date:'30 jul 2024', duration:'4:17', format:'WAV', downloads:1540, plays:402,  bpm:72,  key:'Ebm', coverColor:'#6e2f8f' },
  { id:'16', title:'Sistema',          artist:'Nova Pulse', artistSlug:'nova-pulse', genre:'House',          date:'12 ago 2024', duration:'6:44', format:'MP3', downloads:1700, plays:461,  bpm:128, key:'Am',  coverColor:'#154360' },
  { id:'17', title:'Modo Noturno',     artist:'Drift KR',   artistSlug:'drift-kr',   genre:'Trap',           date:'26 ago 2024', duration:'3:05', format:'WAV', downloads:4890, plays:1234, bpm:138, key:'Fm',  coverColor:'#7b241c' },
  { id:'18', title:'Força do Norte',   artist:'Cena B',     artistSlug:'cena-b',     genre:'Afrobeats',      date:'09 set 2024', duration:'4:30', format:'MP3', downloads:730,  plays:167,  bpm:108, key:'Dm',  coverColor:'#0b5345' },
  { id:'19', title:'Grid',             artist:'Nova Pulse', artistSlug:'nova-pulse', genre:'Electro',        date:'23 set 2024', duration:'5:22', format:'WAV', downloads:950,  plays:228,  bpm:122, key:'Cm',  coverColor:'#1b2631' },
  { id:'20', title:'Voz do Asfalto',   artist:'Drift KR',   artistSlug:'drift-kr',   genre:'Hip-Hop',        date:'07 out 2024', duration:'4:11', format:'MP3', downloads:3320, plays:876,  bpm:88,  key:'Gm',  coverColor:'#512e5f' },
]

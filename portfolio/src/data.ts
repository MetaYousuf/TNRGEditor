// All site content lives here. Anything marked PLACEHOLDER is waiting on real details.

export const profile = {
  firstName: 'Yousuf',
  fullName: 'Mohammed Yousuf A',
  role: ['Video', 'Producer.'],
  // Three short lines (~190 chars) under the hero title.
  tagline:
    'Twelve years turning newsrooms, classrooms and YouTube channels into stories people finish watching — now building AI systems that turn research into publish-ready video.',
  location: 'Bengaluru, India',
  email: 'yousuf821@gmail.com',
  resume: './resume.pdf',
  links: [
    { label: 'GitHub', href: '#', cursor: 'Open' }, // PLACEHOLDER: GitHub profile URL
    { label: 'LinkedIn', href: 'https://linkedin.com/in/mohammedyousufluan', cursor: 'Open' },
    { label: 'Résumé', href: './resume.pdf', cursor: 'PDF' },
  ],
}

// Words wrapped in *asterisks* render red.
export const manifesto =
  'I make video that *earns* attention. From live *national* *broadcast* control rooms to scaling a channel from *120K* to *445K* subscribers, I blend editorial instinct, *motion* *design* and *AI* *automation* into pipelines that ship.'

export const stats = [
  { value: 12, suffix: '+', label: 'Years across broadcast & digital' },
  { value: 445, suffix: 'K', label: 'Subscribers at channel peak' },
  { value: 16, suffix: 'M+', label: 'YouTube views delivered' },
]

export type Visual = 'chat' | 'gauge' | 'heatmap'

export const projects: {
  name: string
  category: string
  description: string
  chips: string[]
  link: string
  linkLabel: string
  visual: Visual
}[] = [
  {
    name: 'The Newsroom Global',
    category: 'AI Media System · 2026',
    description: 'An autonomous pipeline that turns news topics into publish-ready video packages.',
    chips: ['Claude API', 'Ollama', 'CogVideoX', 'FFmpeg'],
    link: 'https://portfolio.thenewsroomglobal.com',
    linkLabel: 'View project ↗',
    visual: 'chat',
  },
  {
    name: 'Salar Digital',
    category: 'YouTube Growth · 2023–25',
    description: 'Scaled a channel from 120K to 445K subscribers and 5M to 16M+ views.',
    chips: ['Strategy', 'Retention', 'Packaging', 'Team Lead'],
    link: '#', // PLACEHOLDER: channel or case-study URL
    linkLabel: 'View channel ↗',
    visual: 'gauge',
  },
  {
    name: 'Newton Studio',
    category: 'Production Ops · 2022–23',
    description: '12 channels, 10+ courses and an in-house studio that cut turnaround 30%.',
    chips: ['Studio Build', 'Chroma', 'Motion GFX', 'Analytics'],
    link: '#', // PLACEHOLDER: showreel or case-study URL
    linkLabel: 'View showreel ↗',
    visual: 'heatmap',
  },
]

export const journey = {
  title: ['Twelve years', 'on air.'],
  startYear: 2012,
  endYear: 2026,
  // Newest first.
  items: [
    { year: '2025 — Now', title: 'Senior Video Producer', org: 'Newton School of Technology' },
    { year: '2019 — 2025', title: 'Digital Video Lead', org: 'Asianet News · Newton School · Salar Digital' },
    { year: '2012 — 2019', title: 'Broadcast Producer', org: 'BIG NEWS9 · Times Network · Republic World' },
  ],
}

export const skills = [
  'Premiere Pro',
  'After Effects',
  'DaVinci Resolve',
  'Motion Graphics',
  'VFX',
  'Chroma Keying',
  'Sound Design',
  'Content Strategy',
  'YouTube Growth',
  'Video SEO',
  'Live Direction',
  'Studio Ops',
  'Claude API',
  'Ollama',
  'FFmpeg',
  'AI Workflows',
]

export const counters = [
  { value: 12, suffix: '+', label: 'YouTube channels led' },
  { value: 10, suffix: '+', label: 'Video courses shipped' },
  { value: 325, suffix: 'K', label: 'Subscribers grown' },
  { value: 7, suffix: '★', label: 'Newsrooms & studios' },
]

export const certifications = [
  { title: 'B.E. Industrial Eng. & Mgmt', issuer: 'BMS College of Engineering' },
  { title: 'Diploma, Mechanical Eng.', issuer: 'M.E.I Polytechnic' },
  { title: 'Certification title', issuer: 'Issuer · Year' }, // PLACEHOLDER
  { title: 'Certification title', issuer: 'Issuer · Year' }, // PLACEHOLDER
  { title: 'Certification title', issuer: 'Issuer · Year' }, // PLACEHOLDER
  { title: 'Certification title', issuer: 'Issuer · Year' }, // PLACEHOLDER
  { title: 'Certification title', issuer: 'Issuer · Year' }, // PLACEHOLDER
  { title: 'Certification title', issuer: 'Issuer · Year' }, // PLACEHOLDER
]

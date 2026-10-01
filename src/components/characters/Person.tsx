import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Original flat illustrations of the people in RaktFlow's stories, drawn for
 * this project in plain SVG (no third-party artwork). Bust format on a
 * 160×180 canvas, so they sit naturally on a card edge or above a caption.
 */
export type PersonId = 'priya' | 'rohan' | 'doctor' | 'rider'
export type Mood = 'worried' | 'calm' | 'happy'

interface Look {
  skin: string
  shade: string
  hair: string
  top: string
  topShade: string
}

const LOOKS: Record<PersonId, Look> = {
  priya: { skin: '#c68a62', shade: '#a9714d', hair: '#2a1a13', top: '#0e7490', topShade: '#0b5f75' },
  rohan: { skin: '#b37450', shade: '#96603f', hair: '#1d1410', top: '#4f46e5', topShade: '#3d35c4' },
  doctor: { skin: '#d39a72', shade: '#b8805b', hair: '#3a2418', top: '#f8fafc', topShade: '#dbe3ea' },
  rider: { skin: '#a96c47', shade: '#8d5737', hair: '#1d1410', top: '#a80c27', topShade: '#8c0e26' },
}

const HEAD = 'M49 72C49 46 62 36 80 36C98 36 111 46 111 72C111 96 98 112 80 112C62 112 49 96 49 72Z'
const SHOULDERS = 'M14 180C14 146 40 126 80 126C120 126 146 146 146 180Z'

function Face({ mood, look, hideBrows }: { mood: Mood; look: Look; hideBrows?: boolean }) {
  const brows =
    mood === 'worried'
      ? ['M61 69Q67 67 73 63.5', 'M87 63.5Q93 67 99 69']
      : ['M61 67.5Q67 64.5 73 66.5', 'M87 66.5Q93 64.5 99 67.5']
  const mouth =
    mood === 'happy' ? (
      <path d="M69.5 93.5Q80 108 90.5 93.5Q80 97.5 69.5 93.5Z" fill="#7a1022" />
    ) : mood === 'calm' ? (
      <path d="M72.5 96Q80 101.5 87.5 96" stroke="#5b2a1c" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    ) : (
      <path d="M72 100Q80 94.5 88 100" stroke="#5b2a1c" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    )
  return (
    <g>
      {!hideBrows &&
        brows.map((d) => <path key={d} d={d} stroke={look.hair} strokeWidth="2.8" strokeLinecap="round" fill="none" />)}
      {[68, 92].map((x) => (
        <g key={x}>
          {mood === 'happy' ? (
            <path d={`M${x - 4.2} 78.5Q${x} 73.5 ${x + 4.2} 78.5`} stroke="#1c1917" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          ) : (
            <>
              <ellipse cx={x} cy={77} rx={3.7} ry={4.5} fill="#1c1917" />
              <circle cx={x + 1.3} cy={75.4} r={1.15} fill="#fff" />
            </>
          )}
        </g>
      ))}
      <path d="M80 80Q76.8 87.5 81 88.6" stroke={look.shade} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {mood !== 'worried' && (
        <>
          <circle cx={62} cy={90} r={5.5} fill="#fb6173" opacity={0.22} />
          <circle cx={98} cy={90} r={5.5} fill="#fb6173" opacity={0.22} />
        </>
      )}
      {mouth}
      {mood === 'worried' && (
        <path d="M113.5 52C110.6 57 109.4 60.2 111.4 62.6C113.2 64.6 116.6 63.4 116.2 60.2C116 58.4 115.2 56 113.5 52Z" fill="#22d3ee" opacity={0.9} />
      )}
    </g>
  )
}

function Base({ look, children }: { look: Look; children?: React.ReactNode }) {
  return (
    <>
      <path d={SHOULDERS} fill={look.top} />
      <path d="M69 98V121Q80 129 91 121V98Z" fill={look.shade} />
      <ellipse cx={49.5} cy={77} rx={5.5} ry={8.5} fill={look.shade} />
      <ellipse cx={110.5} cy={77} rx={5.5} ry={8.5} fill={look.shade} />
      <path d={HEAD} fill={look.skin} />
      {children}
    </>
  )
}

function Priya({ mood }: { mood: Mood }) {
  const look = LOOKS.priya
  return (
    <>
      {/* Long hair behind the shoulders */}
      <path
        d="M44 74C42 40 60 28 80 28C102 28 118 42 116 76C116 102 121 122 127 140C115 149 101 146 95 133H65C59 146 45 149 33 140C39 122 44 102 44 74Z"
        fill={look.hair}
      />
      <Base look={look}>
        {/* Kurta neckline and dupatta over one shoulder */}
        <path d="M66 127Q80 151 94 127Z" fill={look.shade} />
        <path d="M99 128C117 132 131 144 137 160L127 180H108C116 160 111 142 97 134Z" fill="#f59e0b" />
        <path d="M99 128C117 132 131 144 137 160" stroke="#d97706" strokeWidth="2" fill="none" />
        <path d="M48 71C48 46 62 34 82 34C100 35 112 46 112 67C104 58 95 52 86 50C79 59 65 65 48 71Z" fill={look.hair} />
        <circle cx={80} cy={62.5} r={1.7} fill="#c8102e" />
        <circle cx={49.5} cy={88} r={2.4} fill="#fbbf24" />
        <circle cx={110.5} cy={88} r={2.4} fill="#fbbf24" />
        <Face mood={mood} look={look} />
      </Base>
    </>
  )
}

function Rohan({ mood }: { mood: Mood }) {
  const look = LOOKS.rohan
  return (
    <Base look={look}>
      {/* Shirt collar and placket */}
      <path d="M80 131V180" stroke={look.topShade} strokeWidth="2.5" />
      <path d="M65 125L73 141L80 131Z" fill={look.topShade} />
      <path d="M95 125L87 141L80 131Z" fill={look.topShade} />
      {/* Stubble and moustache */}
      <path d="M52 83C55 100 66 110 80 110C94 110 105 100 108 83C104 96 95 103 80 103C65 103 56 96 52 83Z" fill={look.hair} opacity={0.2} />
      <path d="M71 91.5Q80 87.5 89 91.5Q80 94.5 71 91.5Z" fill={look.hair} opacity={0.75} />
      <path d="M48 72C45 42 62 28 82 29C103 30 116 44 112 72C110 61 105 54 98 50C88 55 72 56 60 51C54 56 50 63 48 72Z" fill={look.hair} />
      <Face mood={mood} look={look} />
    </Base>
  )
}

function Doctor({ mood }: { mood: Mood }) {
  const look = LOOKS.doctor
  return (
    <>
      <circle cx={80} cy={29} r={11.5} fill={look.hair} />
      <Base look={look}>
        {/* Coat outline, scrubs and lapels */}
        <path d={SHOULDERS} fill="none" stroke={look.topShade} strokeWidth="2" />
        <path d="M67 127L80 147L93 127Z" fill="#0891b2" />
        <path d="M67 127L80 152L75 180M93 127L80 152L85 180" stroke={look.topShade} strokeWidth="2.2" fill="none" strokeLinejoin="round" />
        <rect x={100} y={152} width={18} height={9} rx={2.5} fill="#cffafe" stroke="#67e8f9" />
        {/* Stethoscope */}
        <path d="M66 128C61 147 69 158 80 160M94 128C99 147 91 158 80 160M80 160C80 168 86 172 93 171" stroke="#2e2927" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <circle cx={96} cy={170.5} r={5} fill="#7c706a" stroke="#2e2927" strokeWidth="2" />
        <path d="M48 72C47 46 63 34 80 34C98 34 113 46 112 72C108 58 100 50 90 47C83 53 65 58 50 64Z" fill={look.hair} />
        <Face mood={mood} look={look} />
      </Base>
    </>
  )
}

function Rider({ mood }: { mood: Mood }) {
  const look = LOOKS.rider
  return (
    <Base look={look}>
      {/* Reflective band and zip on the jacket */}
      <path d="M22 158H138L141 167H19Z" fill="#a5f3fc" opacity={0.9} />
      <path d="M80 128V180" stroke={look.topShade} strokeWidth="2.5" />
      <Face mood={mood} look={look} hideBrows />
      {/* Helmet with the visor flipped up */}
      <path d="M44 78C42 41 60 25 80 25C100 25 118 41 116 78L116 84C112 86 108 85 106 81V64H54V81C52 85 48 86 44 84Z" fill="#c8102e" />
      <path d="M54 64H106V57Q80 48 54 57Z" fill="#1c1917" opacity={0.9} />
      <path d="M80 26V50" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity={0.85} />
      <path d="M55 81Q61 104 74 110M105 81Q99 104 86 110" stroke="#2e2927" strokeWidth="2" fill="none" />
    </Base>
  )
}

const DRAW: Record<PersonId, (p: { mood: Mood }) => React.ReactElement> = {
  priya: Priya,
  rohan: Rohan,
  doctor: Doctor,
  rider: Rider,
}

export function Person({
  who,
  mood = 'calm',
  backdrop,
  badge,
  label,
  className,
  float = false,
  delay = 0,
}: {
  who: PersonId
  mood?: Mood
  /** Fill colour for a round backdrop; the bust is clipped to it like an avatar. */
  backdrop?: string
  /** Small heart badge on the shoulder, e.g. for donors. */
  badge?: 'heart'
  /** Accessible name; leave empty when the figure is decorative. */
  label?: string
  className?: string
  /** Gentle idle bob, skipped for reduced motion. */
  float?: boolean
  delay?: number
}) {
  const clip = `person-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const Draw = DRAW[who]
  return (
    <svg
      viewBox="0 0 160 180"
      className={cn('block h-auto overflow-visible', float && 'animate-float', className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {backdrop ? (
        <>
          <defs>
            <clipPath id={clip}>
              <path d="M0 0H160V100A80 80 0 0 1 0 100Z" />
              <circle cx={80} cy={100} r={80} />
            </clipPath>
          </defs>
          <circle cx={80} cy={100} r={80} fill={backdrop} />
          <g clipPath={`url(#${clip})`}>
            <Draw mood={mood} />
          </g>
        </>
      ) : (
        <Draw mood={mood} />
      )}
      {badge === 'heart' && (
        <g>
          <circle cx={128} cy={150} r={15} fill="#c8102e" stroke="#fff" strokeWidth="3" />
          <path d="M128 158C121 153 119.5 149.5 120.5 146.6C121.6 143.6 125.6 143 128 146C130.4 143 134.4 143.6 135.5 146.6C136.5 149.5 135 153 128 158Z" fill="#fff" />
        </g>
      )}
    </svg>
  )
}

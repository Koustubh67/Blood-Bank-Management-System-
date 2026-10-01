import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { BRAND } from '@/config/brand'

/**
 * Small, original interface sounds synthesised with the Web Audio API, so no
 * audio files ship with the app. Plus an optional spoken confirmation after
 * payment, using the device's own text-to-speech voice.
 */
export type SoundKind = 'tap' | 'order' | 'payment' | 'failed' | 'alert'

interface SoundPrefs {
  enabled: boolean
  /** Speak payment confirmations aloud */
  voice: boolean
}

export const useSoundPrefs = create<SoundPrefs>()(
  persist((): SoundPrefs => ({ enabled: true, voice: true }), { name: 'rf-sound', version: 1, storage: createJSONStorage(() => localStorage) }),
)

export function setSoundEnabled(enabled: boolean) {
  useSoundPrefs.setState({ enabled })
  if (enabled) playSound('tap')
}

export function setVoiceEnabled(voice: boolean) {
  useSoundPrefs.setState({ voice })
}

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// Browsers only allow audio after a user gesture; unlock on the first one so
// sounds that follow an async step (like a payment) still play.
if (typeof window !== 'undefined') {
  const unlock = () => {
    audio()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

interface Note {
  freq: number
  at: number
  dur: number
  type?: OscillatorType
  gain?: number
  /** Glide to this frequency over the note */
  to?: number
}

function play(notes: Note[]) {
  const ac = audio()
  if (!ac) return
  const master = ac.createGain()
  master.gain.value = 0.55
  master.connect(ac.destination)
  const t0 = ac.currentTime + 0.01
  for (const n of notes) {
    const osc = ac.createOscillator()
    const env = ac.createGain()
    osc.type = n.type ?? 'sine'
    osc.frequency.setValueAtTime(n.freq, t0 + n.at)
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t0 + n.at + n.dur)
    const peak = n.gain ?? 0.25
    env.gain.setValueAtTime(0.0001, t0 + n.at)
    env.gain.exponentialRampToValueAtTime(peak, t0 + n.at + 0.012)
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur)
    osc.connect(env).connect(master)
    osc.start(t0 + n.at)
    osc.stop(t0 + n.at + n.dur + 0.05)
  }
}

/** A bell-like tone: fundamental plus two quiet overtones. */
function bell(freq: number, at: number, dur: number, gain = 0.22): Note[] {
  return [
    { freq, at, dur, gain },
    { freq: freq * 2.01, at, dur: dur * 0.6, gain: gain * 0.35 },
    { freq: freq * 3.02, at, dur: dur * 0.35, gain: gain * 0.15 },
  ]
}

const SOUNDS: Record<SoundKind, () => Note[]> = {
  // Soft pop for small confirmations.
  tap: () => [{ freq: 660, to: 880, at: 0, dur: 0.09, type: 'triangle', gain: 0.18 }],
  // Order placed: two rising notes.
  order: () => [...bell(784, 0, 0.35, 0.2), ...bell(1175, 0.11, 0.55, 0.22)],
  // Payment received: a quick coin shimmer resolving on a bright bell.
  payment: () => [
    { freq: 1568, at: 0, dur: 0.07, type: 'square', gain: 0.05 },
    { freq: 2093, at: 0.05, dur: 0.07, type: 'square', gain: 0.05 },
    ...bell(1047, 0.12, 0.5, 0.2),
    ...bell(1319, 0.2, 0.55, 0.18),
    ...bell(1568, 0.28, 0.9, 0.22),
  ],
  // Payment failed: a gentle falling pair, not an alarm.
  failed: () => [
    { freq: 440, to: 392, at: 0, dur: 0.22, type: 'triangle', gain: 0.2 },
    { freq: 349, to: 311, at: 0.2, dur: 0.38, type: 'triangle', gain: 0.2 },
  ],
  // New order on an operations board: two quick pings.
  alert: () => [...bell(1319, 0, 0.18, 0.22), ...bell(1319, 0.2, 0.3, 0.22)],
}

export function playSound(kind: SoundKind) {
  if (!useSoundPrefs.getState().enabled) return
  try {
    play(SOUNDS[kind]())
  } catch {
    /* audio is a nicety; never break the flow */
  }
}

/** Speaks a payment confirmation, in Hindi when the browser prefers it and has a Hindi voice. */
export function announcePayment(amount: number) {
  const { enabled, voice } = useSoundPrefs.getState()
  if (!enabled || !voice || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const voices = window.speechSynthesis.getVoices()
  const hindi = navigator.language.toLowerCase().startsWith('hi') ? voices.find((v) => v.lang.toLowerCase().startsWith('hi')) : undefined
  const rupees = Math.round(amount).toLocaleString(BRAND.locale)
  const text = hindi
    ? `${rupees} रुपये का भुगतान सफल रहा। आपका ब्लड ऑर्डर कन्फ़र्म है।`
    : `Payment of ${rupees} rupees successful. Your ${BRAND.name} order is confirmed.`
  const utter = new SpeechSynthesisUtterance(text)
  utter.voice = hindi ?? voices.find((v) => v.lang === 'en-IN') ?? null
  utter.lang = hindi ? hindi.lang : 'en-IN'
  utter.rate = 1.02
  // Let the chime ring out first.
  setTimeout(() => {
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }, 900)
}

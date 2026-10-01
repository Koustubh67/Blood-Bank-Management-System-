import { useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import { BRAND } from '@/config/brand'
import { Hero } from '@/components/home/Hero'
import { LiveTicker } from '@/components/home/LiveTicker'
import { HoursToMinutes } from '@/components/home/HoursToMinutes'
import { NearYou } from '@/components/home/NearYou'
import { Audiences } from '@/components/home/Audiences'
import { SafeAndFair } from '@/components/home/SafeAndFair'
import { GiveBlood } from '@/components/home/GiveBlood'
import { HomeFaq } from '@/components/home/HomeFaq'
import { HomeNotes } from '@/components/home/HomeNotes'

/**
 * Home, kept deliberately short: what the service is, why it beats the
 * counter route, what it looks like in the visitor's city, who it serves,
 * why it is safe and fair, how to give, and the questions people ask first.
 */
export default function Home() {
  useEffect(() => {
    document.title = `${BRAND.name} — ${BRAND.tagline.replace(/\.$/, '')}`
  }, [])

  return (
    // "user": transform-based motion is skipped for people who prefer reduced motion.
    <MotionConfig reducedMotion="user">
      <Hero />
      <LiveTicker />
      <HoursToMinutes />
      <NearYou />
      <Audiences />
      <SafeAndFair />
      <GiveBlood />
      <HomeFaq />
      <HomeNotes />
    </MotionConfig>
  )
}

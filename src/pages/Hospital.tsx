import { useCurrentUser } from '@/services/auth'
import { HospitalDashboard } from '@/components/hospital/HospitalDashboard'
import { HospitalLanding } from '@/components/hospital/HospitalLanding'

/** Operations dashboard for signed-in hospitals; partner landing page for everyone else. */
export default function Hospital() {
  const user = useCurrentUser()
  if (user?.role === 'hospital') return <HospitalDashboard user={user} />
  return <HospitalLanding />
}

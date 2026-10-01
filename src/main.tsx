import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ensureDemoAccounts } from '@/services/auth'
import { startNetworkSimulation } from '@/services/inventory'
import { seedDemoHistory } from '@/services/demoSeed'
import { refreshLocationSilently } from '@/services/location'
import './index.css'

void ensureDemoAccounts().then(seedDemoHistory)
startNetworkSimulation()
// Quick-commerce style: refresh the delivery location if the visitor already allowed it.
void refreshLocationSilently()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

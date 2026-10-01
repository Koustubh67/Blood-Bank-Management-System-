import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { Layout, RequireAuth } from '@/components/layout/Layout'

const Home = lazy(() => import('@/pages/Home'))
const OrderBlood = lazy(() => import('@/pages/OrderBlood'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'))
const PaymentFailed = lazy(() => import('@/pages/PaymentFailed'))
const Track = lazy(() => import('@/pages/Track'))
const TrackLookup = lazy(() => import('@/pages/TrackLookup'))
const Orders = lazy(() => import('@/pages/Orders'))
const Availability = lazy(() => import('@/pages/Availability'))
const Donate = lazy(() => import('@/pages/Donate'))
const Camps = lazy(() => import('@/pages/Camps'))
const Network = lazy(() => import('@/pages/Network'))
const Hospital = lazy(() => import('@/pages/Hospital'))
const Safety = lazy(() => import('@/pages/Safety'))
const Guide = lazy(() => import('@/pages/Guide'))
const Legal = lazy(() => import('@/pages/Legal'))
const Login = lazy(() => import('@/pages/Login'))
const Signup = lazy(() => import('@/pages/Signup'))
const Account = lazy(() => import('@/pages/Account'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// Operations panel: its own shell, outside the marketing layout.
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))
const AdminOverview = lazy(() => import('@/pages/admin/Overview'))
const AdminBoard = lazy(() => import('@/pages/admin/PriorityBoard'))
const AdminDispatch = lazy(() => import('@/pages/admin/Dispatch'))
const AdminStores = lazy(() => import('@/pages/admin/Stores'))
const AdminStaff = lazy(() => import('@/pages/admin/Staff'))
const AdminCollections = lazy(() => import('@/pages/admin/Collections'))

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/order', element: <RequireAuth><OrderBlood /></RequireAuth> },
      { path: '/checkout/:orderId', element: <RequireAuth><Checkout /></RequireAuth> },
      { path: '/order/:orderId/success', element: <RequireAuth><PaymentSuccess /></RequireAuth> },
      { path: '/order/:orderId/failed', element: <RequireAuth><PaymentFailed /></RequireAuth> },
      { path: '/track', element: <TrackLookup /> },
      { path: '/track/:orderId', element: <Track /> },
      { path: '/orders', element: <RequireAuth><Orders /></RequireAuth> },
      { path: '/availability', element: <Availability /> },
      { path: '/donate', element: <Donate /> },
      { path: '/camps', element: <Camps /> },
      { path: '/network', element: <Network /> },
      { path: '/hospital', element: <Hospital /> },
      { path: '/safety', element: <Safety /> },
      { path: '/guide', element: <Guide /> },
      { path: '/legal', element: <Legal /> },
      { path: '/legal/:doc', element: <Legal /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/account', element: <RequireAuth><Account /></RequireAuth> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAuth role="admin">
        <Suspense fallback={null}>
          <AdminLayout />
        </Suspense>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AdminOverview /> },
      { path: 'orders', element: <AdminBoard /> },
      { path: 'dispatch', element: <AdminDispatch /> },
      { path: 'stores', element: <AdminStores /> },
      { path: 'staff', element: <AdminStaff /> },
      { path: 'collections', element: <AdminCollections /> },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}

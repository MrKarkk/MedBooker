import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ScrollToTop from './contexts/ScrollToTop'
import Layout from './components/Layout/Layout'
import LayoutQueue from './components/Layout/LoyoutQuere'
import NotFound404 from './components/SiteCods/NotFound404'
import LoadingFallback from './components/Layout/LoadingFallback/LoadingFallback'
import { Suspense, lazy } from 'react'

const Home = lazy(() => import('./pages/Home/Home'))
const About = lazy(() => import('./pages/About/About'))
const Contacts = lazy(() => import('./pages/Contacts/Contacts'))
const FAQ = lazy(() => import('./pages/FAQ/FAQ'))
const Login = lazy(() => import('./pages/Login/Login'))
const Register = lazy(() => import('./pages/Register/Register'))
const Profile = lazy(() => import('./pages/Profile/Profile'))
const Setting = lazy(() => import('./pages/Setting/Setting'))
const Appointment = lazy(() => import('./pages/Appointment/AppointmentPage'))
const TodayAppointments = lazy(() => import('./pages/TodayAppointments/TodayAppointments'))
const AppointmentUser = lazy(() => import('./pages/AppointmentUser/AppointmentAllPage'))
const Commercial = lazy(() => import('./pages/Commercial/Commercial'))


function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contacts />} />
            <Route path="/help" element={<FAQ />} />
            <Route path="/commercial" element={<Commercial />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/appointment" element={<Appointment />} />
            <Route path="/my-appointments" element={<AppointmentUser />} />
            <Route path="/settings" element={<Setting />} />
          </Route>

          <Route element={<LayoutQueue />}>
            <Route path="/today-appointments" element={<TodayAppointments />} />
          </Route>

          <Route path="*" element={<NotFound404 />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  )
}

export default App

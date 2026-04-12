import { Route, Routes } from 'react-router-dom'

import { HomePage } from '@/pages/home'
import { SettingsPage } from '@/pages/settings-page'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}

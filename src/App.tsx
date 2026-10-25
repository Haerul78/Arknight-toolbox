import { Route, Routes } from 'react-router-dom'
// import { Barlow } from 'next/font/google'
import './App.css'
import Navbar from './components/navbar'
import Hero from './components/hero'
import OperatorPage from './pages/OperatorPage'
import MaterialPage from './pages/MaterialPage'
import OperatorDetailPage from './pages/OperatorDetailPage'
import PageTransition from './components/PageTransition'
import MusicPage from './pages/MusicPage'
import MiniPlayer from './components/music/MiniPlayer'
import DataWarning from './components/music/DataWarning'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Routes>
        <Route element={<PageTransition />}>
          <Route path="/" element={<Hero />} />
          <Route path="/operators" element={<OperatorPage />} />
          <Route path="/operators/:id" element={<OperatorDetailPage />} />
          <Route path="/materials" element={<MaterialPage />} />
          <Route path="/music" element={<MusicPage />} />
        </Route>
      </Routes>
      <MiniPlayer variant="bar" />
      <DataWarning />
    </div>
  )
}

export default App

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import { applyAppearance, loadAppearance } from './theme/theme.ts'
import { takeSnapshotIfNewBuild } from './data/snapshot.ts'

applyAppearance(loadAppearance())

// Before the first render, and before anything migrates or re-saves what it
// loaded. The read is synchronous even though the write isn't — see the note in
// data/snapshot.ts on why that ordering is the whole point.
void takeSnapshotIfNewBuild()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

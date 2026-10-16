import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(ScrollTrigger, CustomEase)

// Only load the 404 page when actually on an unknown route, so its
// code/CSS never ships with the main entry chunk.
const Error404 = lazy(() => import('./pages/Error404.jsx'))

const is404 = window.location.pathname !== '/' && window.location.pathname !== ''

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {is404 ? (
      <Suspense fallback={null}>
        <Error404 />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)

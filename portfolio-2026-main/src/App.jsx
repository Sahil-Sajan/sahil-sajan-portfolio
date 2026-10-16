import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react"
import './App.css'
import { ReactLenis, useLenis } from 'lenis/react'

import Preloader from './components/Preloader/Preloader.jsx'
import Landing from './pages/Landing.jsx'
import TransitionLoader from './components/TransitionLoader/TransitionLoader.jsx'

const Project      = lazy(() => import('./pages/Project.jsx'))
const ModifierDeck = lazy(() => import('./pages/ModifierDeck.jsx'))
const MobilePlayer = lazy(() => import('./components/MobilePlayer/MobilePlayer.jsx'))
import { useSmoothScrollConfig } from './hooks/useSmoothScrollConfig'
import { useIsMobile } from './hooks/useIsMobile'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { PlayerProvider } from './context/PlayerContext.jsx'

function App() {
  const flag = false
  const scrollConfig = useSmoothScrollConfig()
  const [isAssetLoaded, setIsAssetLoad] = useState(flag)
  const [isPreloaderDone, setIsPreloaderDone] = useState(flag)
  const [view, setView] = useState('landing')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState('out')
  const [selectedProjectName, setSelectedProjectName] = useState(null)
  const [projectToLoad, setProjectToLoad] = useState(null)
  const [corrector, setCorrector] = useState(false)
  const [returnedFrom, setReturnedFrom] = useState(null)
  const lenisRef = useRef(null)
  const skipHistoryPush = useRef(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);



  useEffect(() => {
    const originalTitle = document.title;
    const hiddenTitle = "Observation paused.";
    const handleVisibilityChange = () => {
      document.title = document.hidden ? hiddenTitle : originalTitle;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleMidway = useCallback(() => {
    const lenisInstance = lenisRef.current?.lenis;

    if (transitionDirection === 'in') {
      setView('project')
    }
    else if (transitionDirection === 'modifier_in') {
      setView('modifier_deck') // 2. Handle switching to Modifier Deck
    }
    else if (transitionDirection === 'loop') {
      setSelectedProjectName(projectToLoad)
      setView('project')
      setCorrector(true)
      window.scrollTo(0, 0);
      lenisInstance?.scrollTo(0, { immediate: true });
    }
    else {
      setView('landing')
    }
  }, [transitionDirection, projectToLoad]);

  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false)
    setCorrector(false)
  }, []);

  const handleProjectSelect = (projectData) => {
    if (!skipHistoryPush.current) {
      const slug = projectData.name.toLowerCase().replace(/\s/g, '_');
      window.history.pushState({ view: 'project', name: projectData.name }, '', `#${slug}`);
    }
    setSelectedProjectName(projectData.name)
    setTransitionDirection('in')
    setIsTransitioning(true)
  };

  // 3. New handler to navigate to Modifier Deck
  const handleModifierDeckSelect = useCallback(() => {
    if (!skipHistoryPush.current) {
      window.history.pushState({ view: 'modifier_deck' }, '', '#modifier-deck');
    }
    setTransitionDirection('modifier_in')
    setIsTransitioning(true)
  }, []);

  const handleNextProjectSelect = (projectData) => {
    if (!skipHistoryPush.current) {
      const slug = projectData.name.toLowerCase().replace(/\s/g, '_');
      window.history.pushState({ view: 'project', name: projectData.name }, '', `#${slug}`);
    }
    setProjectToLoad(projectData.name)
    setTransitionDirection('loop')
    setIsTransitioning(true)
  };

  const handleBackToLanding = useCallback(() => {
    if (!skipHistoryPush.current) {
      window.history.pushState({ view: 'landing' }, '', window.location.pathname.split('#')[0]);
    }
    setTransitionDirection('out')
    setIsTransitioning(true)
    setReturnedFrom(view)
  }, [view]);

  const [pendingScrollTarget, setPendingScrollTarget] = useState(null);

  const handleBackWithScroll = useCallback((target) => {
    setPendingScrollTarget(target);
    handleBackToLanding();
  }, [handleBackToLanding]);

  const handlePreloaderComplete = useCallback(() => {
    setIsPreloaderDone(true)
  }, []);

  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ view: 'landing' }, '', window.location.pathname);
    }

    const handlePopState = (event) => {
      const state = event.state;
      skipHistoryPush.current = true;

      if (!state || state.view === 'landing') {
        if (view !== 'landing') handleBackToLanding();
      }
      else if (state.view === 'project') {
        const targetProject = { name: state.name };
        if (view === 'landing' || view === 'modifier_deck') {
          handleProjectSelect(targetProject);
        } else if (view === 'project' && selectedProjectName !== state.name) {
          handleNextProjectSelect(targetProject);
        }
      }
      else if (state.view === 'modifier_deck') {
        if (view !== 'modifier_deck') handleModifierDeckSelect(); 
      }

      setTimeout(() => {
        skipHistoryPush.current = false;
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view, selectedProjectName, projectToLoad, handleBackToLanding, handleModifierDeckSelect]);

  return (
    <ThemeProvider>
    <PlayerProvider>
    <>
      {!isPreloaderDone && (
        <Preloader onComplete={handlePreloaderComplete} onMidway={() => setIsAssetLoad(true)} />
      )}

      <ReactLenis
        ref={lenisRef}
        root
        options={{
          autoRaf: true,
          ...scrollConfig,
        }}
      >
        {isTransitioning && (
          <TransitionLoader
            direction={transitionDirection}
            onMidway={handleMidway}
            onComplete={handleTransitionComplete}
          />
        )}

        {isAssetLoaded && view === 'landing' && (
          <Landing
            onProjectSelect={handleProjectSelect}
            onModifierDeckSelect={handleModifierDeckSelect} // 4. Pass handler to Landing
            isLoaded={isAssetLoaded}
            isPreloaderDone={isPreloaderDone}
            isIncomingTransition={isTransitioning && transitionDirection === 'out'}
            returnedFrom={returnedFrom}
            pendingScrollTarget={pendingScrollTarget}
            onScrollTargetConsumed={() => setPendingScrollTarget(null)}
          />
        )}

        {view === 'project' && (
          <Suspense fallback={null}>
            <Project
              handleBack={handleBackToLanding}
              onBackWithScroll={handleBackWithScroll}
              isIncomingTransition={isTransitioning && (transitionDirection === 'in' || corrector)}
              selectedProjectName={selectedProjectName}
              onNextProjectSelect={handleNextProjectSelect}
            />
          </Suspense>
        )}

        {view === 'modifier_deck' && (
          <Suspense fallback={null}>
            <ModifierDeck
              handleBack={handleBackToLanding}
              onBackWithScroll={handleBackWithScroll}
              isIncomingTransition={isTransitioning && transitionDirection === 'modifier_in'}
            />
          </Suspense>
        )}

        {(isMobile || view === 'project') && (
          <Suspense fallback={null}>
            <MobilePlayer />
          </Suspense>
        )}
      </ReactLenis>
    </>
    </PlayerProvider>
    </ThemeProvider>
  );
}

export default App

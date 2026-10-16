import { useState, useEffect, useCallback, useRef } from "react";

const BASE_PATH = "";
const PROJECTS_INDEX_PATH = `${BASE_PATH}/data/projects.json`;

// --- CRITICAL ASSETS (these gate the preloader) ---
// Only small files that are needed for the very first visible frame.
const CRITICAL_ASSETS = Object.freeze([
  "/box_anchor.svg",
  "/checked.svg",
  "/Cursor.svg",
  "/denji.svg",
  "/footer.svg",
  "/hand.svg",
  "/lego_44.svg",
  "/lego_210.svg",
  "/star.svg",
  "/unchecked.svg",

  "/icons/cursor.png",
  "/icons/figma_apply.png",
  "/icons/figma_cancel.png",
  "/icons/figma_search.png",

  "/tap_01.wav",
  "/tap_02.wav",
  "/tap_03.wav",
  "/tap_04.wav",
  "/tap_05.wav",

  "/project_imgs/placeholder.webp",
]);

// --- DEFERRED ASSETS (warmed in the background, never gate the preloader) ---
// These live below the fold, so they can keep loading after the reveal.
const DEFERRED_ASSETS = Object.freeze([
  "/about_imgs/1.webp",
  "/about_imgs/2.webp",
  "/about_imgs/3.webp",
  "/about_imgs/4.webp",
  "/about_imgs/5.webp",
  "/about_imgs/6.webp",
  "/about_imgs/7.webp",
  "/about_imgs/8.webp",
  "/about_imgs/9.webp",
  "/about_imgs/10.webp",
  "/about_imgs/11.webp",
  "/about_imgs/12.webp",
  "/about_imgs/13.webp",
  "/about_imgs/14.webp",
  "/about_imgs/15.webp",
  "/about_imgs/16.webp",
  "/about_imgs/17.webp",
  "/about_imgs/18.webp",
  "/about_imgs/19.webp",
  "/about_imgs/20.webp",
]);

const REACT_MODULES_TO_PRELOAD = Object.freeze([
  () => import("../pages/Project.jsx"),
]);

// Safety valve: the preloader should never hold the site hostage. If the
// critical assets are unusually slow, we finish the animation anyway and let
// the remaining work stream in behind the scenes.
const MAX_WAIT_MS = 3000;

const preloadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(src);
    img.src = src;
  });
};

export const useAssetPreloader = () => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const loadedCountRef = useRef(0);
  const totalCountRef = useRef(0);

  const calculateTotalProgress = useCallback(() => {
    if (totalCountRef.current === 0) return;
    const percentage = Math.round(
      (loadedCountRef.current / totalCountRef.current) * 100
    );
    setProgress(Math.min(100, percentage));
  }, []);

  const startPreloading = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    loadedCountRef.current = 0;
    setProgress(0);
    setIsComplete(false);

    // Kick off the projects index fetch (needed to know the Work thumbnails).
    const projectsIndexPromise = fetch(PROJECTS_INDEX_PATH)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${PROJECTS_INDEX_PATH}`);
        return res.json();
      })
      .catch((error) => {
        console.error("[ERROR] Could not load projects.json:", error);
        return { projects: [] };
      });

    const assetsToLoad = new Set();
    CRITICAL_ASSETS.forEach((asset) => assetsToLoad.add(BASE_PATH + asset));

    totalCountRef.current = assetsToLoad.size + REACT_MODULES_TO_PRELOAD.length;

    const tick = () => {
      loadedCountRef.current++;
      calculateTotalProgress();
    };

    const criticalJobs = [];

    Array.from(assetsToLoad).forEach((url) => {
      criticalJobs.push(preloadImage(url).then(tick));
    });

    REACT_MODULES_TO_PRELOAD.forEach((fn) => {
      criticalJobs.push(fn().then(tick));
    });

    // Warm up everything below the fold in the background — these do NOT
    // affect the progress counter or block the reveal.
    projectsIndexPromise.then((projectsIndex) => {
      const backgroundAssets = new Set();
      DEFERRED_ASSETS.forEach((asset) => backgroundAssets.add(BASE_PATH + asset));
      (projectsIndex.projects || []).forEach((project) => {
        if (project.img) backgroundAssets.add(BASE_PATH + project.img);
      });
      backgroundAssets.forEach((url) => preloadImage(url));
    });

    await Promise.race([
      Promise.all(criticalJobs),
      new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS)),
    ]);

    setProgress(100);
    setTimeout(() => setIsComplete(true), 500);
  }, [calculateTotalProgress]);

  useEffect(() => {
    startPreloading();
  }, [startPreloading]);

  return { progress, isComplete };
};

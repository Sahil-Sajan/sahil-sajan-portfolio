import { useState, useEffect, useMemo, useRef } from "react";
import { useButtonSounds } from "../hooks/useButtonSounds";
import "./Project.css";
import ProjectBigText from "../components/ProjectBigText";
import ProjectParaText from "../components/ProjectParaText";
import ProjectImage from "../components/ProjectImage";
import ProjectHeadingParaText from "../components/ProjectHeadingParaText";
import Contact from "../sections/Contact";
import Footer from "../sections/Footer";
import AnimatedArrow from "../components/AnimatedArrow";
import star from "/star.svg";
import { useLenis } from "lenis/react";
import GrassOverlay from "../components/GrassOverlay";

const BASE_PATH = "";

const getProjectDataPath = (projectName) => {
  if (!projectName) return null;
  const filename = projectName.toLowerCase().replace(/\s/g, "_");
  return `${BASE_PATH}/data/project_data/${filename}.json`;
};

const Project = ({
  handleBack,
  onBackWithScroll,
  isIncomingTransition,
  selectedProjectName,
  onNextProjectSelect,
}) => {
  const { playHover: _playHover, playClick: _playClick } = useButtonSounds();
  const playHover = () => _playHover(3);
  const playClick = () => _playClick(3);
  const [projectData, setProjectData] = useState(null);
  const [projectsData, setProjectsData] = useState(null);
  const [hovered, setHovered] = useState(false);
  const lenis = useLenis();
  const grassTargetRef1 = useRef(null);
  const grassTargetRef2 = useRef(null);
  // Cache for next project: stores { name, data, images[] } so switching is instant
  const prefetchRef = useRef(null);

  const initialStyle = useMemo(
    () => ({
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "calc(100dvh / var(--app-scale, 1))",
      overflow: "hidden",
      backgroundColor: "var(--off-teal)",
      zIndex: 0,
      clipPath: "inset(50% 50% 50% 50% round 9px)",
    }),
    []
  );

  const finalStyle = useMemo(
    () => ({
      position: "relative",
      width: "100%",
      minHeight: "100%",
      backgroundColor: "var(--off-teal)",
      overflow: "visible",
      zIndex: 1,
    }),
    []
  );

  const currentStyle = isIncomingTransition ? initialStyle : finalStyle;

  useEffect(() => {
    const loadProjectsList = async () => {
      try {
        const res = await fetch(`${BASE_PATH}/data/projects.json`);
        if (!res.ok) throw new Error(`Failed to fetch projects.json`);
        const data = await res.json();
        setProjectsData(data);
      } catch (err) {
        console.error("[ERROR] Could not load projects.json:", err);
      }
    };
    loadProjectsList();
  }, []);

  useEffect(() => {
    if (!selectedProjectName) {
      setProjectData(null);
      return;
    }

    // Use prefetched data immediately if it matches — no loading flash
    if (prefetchRef.current?.name === selectedProjectName) {
      setProjectData(prefetchRef.current.data);
      prefetchRef.current = null;
      return;
    }

    const controller = new AbortController();
    const path = getProjectDataPath(selectedProjectName);

    const load = async () => {
      try {
        const res = await fetch(path, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to fetch ${path}`);
        const data = await res.json();
        setProjectData(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(
            `[ERROR] Could not load project data for ${selectedProjectName}:`,
            error
          );
          setProjectData(null);
        }
      }
    };

    load();
    return () => controller.abort();
  }, [selectedProjectName]);

  const nextProject = useMemo(() => {
    if (!projectData?.details?.projectTitle || !projectsData?.projects)
      return null;

    const currentIndex = projectsData.projects.findIndex(
      (p) => p.name === projectData.details.projectTitle
    );

    if (currentIndex === -1) {
      const firstProj = projectsData.projects[0];
      if (!firstProj) return null;
      return {
        nextWorkTitle: firstProj.name,
        nextWorkDescription: firstProj.description,
      };
    }

    const nextIndex = (currentIndex + 1) % projectsData.projects.length;
    const nextProj = projectsData.projects[nextIndex];

    return {
      nextWorkTitle: nextProj.name,
      nextWorkDescription: nextProj.description,
    };
  }, [projectData, projectsData]);

  useEffect(() => {
    if (!nextProject?.nextWorkTitle) return;
    const nextName = nextProject.nextWorkTitle;
    const nextFile = nextName.toLowerCase().replace(/\s/g, "_");
    const nextUrl = `${BASE_PATH}/data/project_data/${nextFile}.json`;

    fetch(nextUrl)
      .then((res) => res.json())
      .then((nextData) => {
        const images = [];
        if (Array.isArray(nextData.content)) {
          nextData.content
            .filter((i) => i.type === "img" && i.url)
            .forEach((i) => {
              const img = new Image();
              img.crossOrigin = "anonymous"; // match ProjectImage's crossOrigin so same cache entry is used
              img.loading = "eager";
              img.src = BASE_PATH + i.url;
              images.push(img); // hold ref to prevent GC before load completes
            });
        }
        prefetchRef.current = { name: nextName, data: nextData, images };
      })
      .catch(() => {});
  }, [nextProject]);

  if (!projectData) {
    return (
      <div id="project-content" style={currentStyle}>
        <div
          className="loading-message"
          style={{ textAlign: "center", paddingTop: "50vh" }}
        >
          Loading project details for {selectedProjectName || "..."}
        </div>
      </div>
    );
  }

  const { content, details } = projectData;

  return (
    <div id="project-content" style={currentStyle}>
      <main>
      <section id={"PROJECT"}>
        <div className={"extremes-wrapper-left"}>
          <div className={"extremes"}></div>
        </div>

        <div className={"middle"}>
          <div className={"left"}>
            <div className={"sticky-div"}>
              <div className={"menu"}>
                <div className={"nav-link"} role="button" tabIndex={0} aria-label="Back to portfolio" onMouseEnter={playHover} onClick={() => { playClick(); handleBack(); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playClick(); handleBack(); } }}>
                  BACK
                </div>
                {details.projectLink ? (
                  <div
                    className={"nav-link website"}
                    role="button"
                    tabIndex={0}
                    aria-label={`Go to ${details.projectTitle} project site (opens in new tab)`}
                    onMouseEnter={playHover}
                    onClick={() => { playClick(); window.open(details.projectLink, "_blank", "noopener"); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playClick(); window.open(details.projectLink, "_blank", "noopener"); } }}
                  >
                    GO TO PROJECT
                  </div>
                ) : (
                  <div className="cell"></div>
                )}
              </div>

              <div className={"project-title"} ref={grassTargetRef1}>
                {details.projectTitle || selectedProjectName}
              </div>
              <GrassOverlay
                key={selectedProjectName}
                targetRef={grassTargetRef1}
              />

              <div className={"details-wrapper"}>
                <div className={"details-left"}>
                  <div className={"detail"}>
                    <h3>TIMELINE</h3>
                    <div className={"list"}>
                      <div className={"item"}>
                        <div className={"wrapper"}>
                          <img src={star} alt="" />
                        </div>
                        <h2>{details.timeline}</h2>
                      </div>
                    </div>
                  </div>
                  <div className={"detail"} ref={grassTargetRef2}>
                    <h3>COMPANY</h3>
                    <div className={"list"}>
                      <div className={"item"}>
                        <div className={"wrapper"}>
                          <img src={star} alt="" />
                        </div>
                        <h2>{details.company}</h2>
                      </div>
                    </div>
                  </div>
                  <GrassOverlay
                    key={selectedProjectName}
                    targetRef={grassTargetRef2}
                  />
                </div>

                <div className={"detail"}>
                  <h3>QUICK TAGS</h3>
                  <div className={"list"}>
                    {details.tags.map((tag, index) => (
                      <div className={"item"} key={index}>
                        <div className={"wrapper"}>
                          <img src={star} alt="" />
                        </div>
                        <h2>{tag}</h2>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {nextProject && (
                <div
                  className={`project`}
                  role="button"
                  tabIndex={0}
                  aria-label={`View next project: ${nextProject.nextWorkTitle}`}
                  onMouseEnter={() => { setHovered(true); playHover(); }}
                  onMouseLeave={() => setHovered(false)}
                  onClick={() => {
                    playClick();
                    onNextProjectSelect({
                      name: nextProject.nextWorkTitle,
                      description: nextProject.nextWorkDescription,
                    });
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playClick(); onNextProjectSelect({ name: nextProject.nextWorkTitle, description: nextProject.nextWorkDescription }); } }}
                >
                  <div className={"title"}>
                    <AnimatedArrow isActive={!hovered} />
                    <h3>{nextProject.nextWorkTitle}</h3>
                    <AnimatedArrow isActive={hovered} />
                  </div>
                  <div className={"description"}>
                    <p>{nextProject.nextWorkDescription}</p>
                  </div>
                </div>
              )}
              <div className="rounder">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  fill="none"
                >
                  <path
                    d="M0 0H9C4.02944 0 3.22128e-07 4.02944 0 9V0Z"
                    fill="var(--off-teal)"
                  />
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  fill="none"
                >
                  <path
                    d="M9 0H0C4.97056 0 9 4.02944 9 9V0Z"
                    fill="var(--off-teal)"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className={"right"}>
            {content.map((item, index) => {
              switch (item.type) {
                case "img":
                  return (
                    <ProjectImage
                      key={`${selectedProjectName}-${index}`}
                      src={BASE_PATH + item.url}
                      alt={`Project image ${index}`}
                      caption={item.caption}
                    />
                  );
                case "bigtext":
                  return <ProjectBigText key={index} text1={item.text1} text2={item.text2} text3={item.text3} points={item.points? item.points : null}/>;
                case "para":
                  return <ProjectParaText key={index} text={item.text} />;
                case "headingpara":
                  return (
                    <ProjectHeadingParaText
                      key={index}
                      heading={item.heading}
                      para={item.para}
                      headingcolor={item.headingcolor}
                    />
                  );
                default:
                  return null;
              }
            })}

            <div className={"menu"}>
              <div className={"nav-link"} onMouseEnter={playHover} onClick={() => { playClick(); handleBack(); }}>
                BACK
              </div>
              {details.projectLink ? (
                <div
                  className={"nav-link website"}
                  onMouseEnter={playHover}
                  onClick={() => { playClick(); window.open(details.projectLink, "_blank", "noopener"); }}
                >
                  GO TO PROJECT
                </div>
              ) : (
                <div className="cell"></div>
              )}
            </div>

            {nextProject && (
              <div
                className={`project`}
                onMouseEnter={() => { setHovered(true); playHover(); }}
                onMouseLeave={() => setHovered(false)}
                onClick={() => {
                  playClick();
                  onNextProjectSelect({
                    name: nextProject.nextWorkTitle,
                    description: nextProject.nextWorkDescription,
                  });
                }}
              >
                <div className={"title"}>
                  <AnimatedArrow isActive={!hovered} />
                  <h3>{nextProject.nextWorkTitle}</h3>
                  <AnimatedArrow isActive={hovered} />
                </div>
                <div className={"description"}>
                  <p>{nextProject.nextWorkDescription}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={"extremes-wrapper-right"}>
          <div className={"extremes"}></div>
        </div>
      </section>
      <Contact key={selectedProjectName}/>
      </main>
      <Footer inProject={true} lenis={lenis} onBackWithScroll={onBackWithScroll} />
    </div>
  );
};

export default Project;

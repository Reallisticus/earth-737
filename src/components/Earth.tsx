import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import countries from "../../public/custom.geo.json";
import lines from "../../public/lines.json";
import map from "../../public/map.json";
import _ from "lodash";
import { gsap } from "gsap";
import FuturisticAuthForm from "./form";
import Loader from "./Loader";

const Earth = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // New state for loading

  const INITIAL_DISTANCE = 400;

  useEffect(() => {
    const initScene = () => {
      sceneRef.current = new THREE.Scene();
      sceneRef.current.background = new THREE.Color(0x040c1e);

      const ambientLight = new THREE.AmbientLight(0xbbbbbb, 0.3);
      sceneRef.current.add(ambientLight);

      addStarfield();
    };

    const initRenderer = () => {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      containerRef.current?.appendChild(rendererRef.current.domElement);
    };
    const addLogo = () => {
      const logo = document.createElement("img");
      logo.src = "/earth737.png"; // Assuming the image is in the public directory
      logo.alt = "Earth737 Logo";
      logo.style.position = "absolute";
      logo.style.bottom = "20px";
      logo.style.left = "20px";
      logo.style.zIndex = "10";
      logo.style.maxWidth = "150px"; // Adjust this value as needed
      logo.style.height = "auto";
      logo.style.opacity = "0.8"; // Slightly transparent to blend with the space theme
      containerRef.current?.appendChild(logo);
    };

    const initCamera = () => {
      cameraRef.current = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
      );
      cameraRef.current.position.set(0, 0, INITIAL_DISTANCE);

      const dLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dLight.position.set(-800, 2000, 400);
      cameraRef.current.add(dLight);

      if (sceneRef.current) {
        sceneRef.current.add(cameraRef.current);
      }
    };

    const initControls = () => {
      if (cameraRef.current && rendererRef.current) {
        controlsRef.current = new OrbitControls(
          cameraRef.current,
          rendererRef.current.domElement
        );
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.05;
        controlsRef.current.enablePan = false;
        controlsRef.current.minDistance = 200;
        controlsRef.current.maxDistance = 500;

        controlsRef.current.addEventListener(
          "change",
          _.throttle(() => {
            if (cameraRef.current) {
              const distance = cameraRef.current.position.distanceTo(
                new THREE.Vector3(0, 0, 0)
              );
              if (
                distance <= controlsRef.current!.minDistance + 10 &&
                !isLoginVisible
              ) {
                controlsRef.current!.enabled = false;
                animateGlobeToLeft();
              }
            }
          }, 100)
        );
      }
    };

    const addStarfield = () => {
      const starGeometry = new THREE.BufferGeometry();
      const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        sizeAttenuation: false,
      });

      const starVertices = [];
      for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
      }

      starGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starVertices, 3)
      );
      const stars = new THREE.Points(starGeometry, starMaterial);
      sceneRef.current?.add(stars);
    };

    const initGlobe = async () => {
      const ThreeGlobe = (await import("three-globe")).default;

      if (!globeRef.current) {
        globeRef.current = new ThreeGlobe()
          .hexPolygonsData(countries.features)
          .hexPolygonResolution(3)
          .hexPolygonMargin(0.7)
          .showAtmosphere(true)
          .atmosphereColor("#3a228a")
          .atmosphereAltitude(0.25);

        setTimeout(() => {
          globeRef.current
            .arcsData(lines.pulls)
            .arcColor((e: any) => (e.status ? "#9cff00" : "#ff4000"))
            .arcAltitude((e: any) => e.arcAlt)
            .arcStroke((e: any) => (e.status ? 0.5 : 0.3))
            .arcDashLength(0.9)
            .arcDashGap(4)
            .arcDashAnimateTime(1000)
            .arcsTransitionDuration(1000)
            .arcDashInitialGap((e: any) => e.order * 1)
            .labelsData(map.maps)
            .labelColor(() => "#ffcb21")
            .labelDotRadius(0.3)
            .labelSize((e: any) => e.size)
            .labelText("city")
            .labelResolution(6)
            .labelAltitude(0.01)
            .pointsData(map.maps)
            .pointColor(() => "#ffffff")
            .pointsMerge(true)
            .pointAltitude(0.07)
            .pointRadius(0.05);

          setIsInitialized(true); // Set initialization flag
          setIsLoading(false); // Set loading to false when globe is ready
        }, 1000);

        globeRef.current.rotateY(-Math.PI * (5 / 9));
        globeRef.current.rotateZ(-Math.PI / 6);

        const globeMaterial = globeRef.current.globeMaterial();
        globeMaterial.color = new THREE.Color(0x3a228a);
        globeMaterial.emissive = new THREE.Color(0x220038);
        globeMaterial.emissiveIntensity = 0.1;
        globeMaterial.shininess = 0.7;

        if (sceneRef.current) {
          sceneRef.current.add(globeRef.current);
        }
      }
    };

    const animateGlobeToLeft = () => {
      if (cameraRef.current && globeRef.current && sceneRef.current) {
        const globePosition = new THREE.Vector3();
        globeRef.current.getWorldPosition(globePosition);

        // Move the globe to the left
        gsap.to(globeRef.current.position, {
          duration: 2,
          x: -200,
          ease: "power2.inOut",
        });

        // Adjust camera position
        gsap.to(cameraRef.current.position, {
          duration: 2,
          x: -200,
          z: INITIAL_DISTANCE + 150,
          ease: "power2.inOut",
          onUpdate: () => {
            // Ensure camera keeps looking at the globe's new position
            cameraRef.current!.lookAt(globeRef.current.position);
          },
          onComplete: () => {
            setIsLoginVisible(true);
            saveState();
          },
        });

        // Rotate the globe slightly
        gsap.to(globeRef.current.rotation, {
          duration: 2,
          y: globeRef.current.rotation.y + Math.PI / 4,
          ease: "power2.inOut",
        });
      }
    };

    const onWindowResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    const animate = () => {
      if (cameraRef.current && rendererRef.current && sceneRef.current) {
        if (!isLoginVisible && controlsRef.current) {
          controlsRef.current.update();
        }
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        if (globeRef.current) {
          globeRef.current.rotateY(0.001);
        }
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initialization
    initScene();
    initRenderer();
    initCamera();
    initControls();
    initGlobe();
    animate();
    addLogo();

    // Event listeners
    window.addEventListener("resize", onWindowResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (controlsRef.current) controlsRef.current.dispose();
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      if (rendererRef.current) {
        containerRef.current?.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      if (globeRef.current) {
        if (sceneRef.current) sceneRef.current.remove(globeRef.current);
        globeRef.current = null;
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      const logo = containerRef.current?.querySelector("img");
      if (logo) {
        containerRef.current?.removeChild(logo);
      }
    };
  }, []);

  useEffect(() => {
    if (isLoginVisible && formRef.current) {
      gsap.fromTo(
        formRef.current,
        {
          x: "100%",
          opacity: 0,
        },
        {
          duration: 1,
          x: "0%",
          opacity: 1,
          ease: "power2.out",
        }
      );
    }
  }, [isLoginVisible]);

  useEffect(() => {
    if (isInitialized) {
      const savedState = localStorage.getItem("earthState");
      if (savedState) {
        const { globePosition, cameraPosition, controlsEnabled } =
          JSON.parse(savedState);
        if (globeRef.current && cameraRef.current && controlsRef.current) {
          globeRef.current.position.set(
            globePosition.x,
            globePosition.y,
            globePosition.z
          );
          cameraRef.current.position.set(
            cameraPosition.x,
            cameraPosition.y,
            cameraPosition.z
          );
          controlsRef.current.enabled = controlsEnabled;
          setIsLoginVisible(!controlsEnabled);
        }
      }
    }
  }, [isInitialized]);

  const saveState = () => {
    if (globeRef.current && cameraRef.current && controlsRef.current) {
      const state = {
        globePosition: {
          x: globeRef.current.position.x,
          y: globeRef.current.position.y,
          z: globeRef.current.position.z,
        },
        cameraPosition: {
          x: cameraRef.current.position.x,
          y: cameraRef.current.position.y,
          z: cameraRef.current.position.z,
        },
        controlsEnabled: controlsRef.current.enabled,
      };
      localStorage.setItem("earthState", JSON.stringify(state));
    }
  };

  const handleVisibilityChange = () => {
    if (!document.hidden && isInitialized) {
      const savedState = localStorage.getItem("earthState");
      if (savedState) {
        const { globePosition, cameraPosition, controlsEnabled } =
          JSON.parse(savedState);
        if (globeRef.current && cameraRef.current && controlsRef.current) {
          globeRef.current.position.set(
            globePosition.x,
            globePosition.y,
            globePosition.z
          );
          cameraRef.current.position.set(
            cameraPosition.x,
            cameraPosition.y,
            cameraPosition.z
          );
          controlsRef.current.enabled = controlsEnabled;
          setIsLoginVisible(!controlsEnabled);
        }
      }
    }
  };

  return (
    <>
      {isLoading && <Loader />}
      <div className="relative h-screen w-full overflow-hidden">
        <div
          id="earth-container"
          ref={containerRef}
          className="absolute left-0 top-0 h-full w-full"
        />
        <div
          ref={formRef}
          className={`fixed right-52 top-1/2 -translate-y-1/2 transform rounded-lg bg-white p-6 text-black shadow-lg ${
            isLoginVisible ? "opacity-100" : "pointer-events-none opacity-0"
          } transition-opacity duration-300`}
        >
          <FuturisticAuthForm />
        </div>
      </div>
    </>
  );
};

export default Earth;

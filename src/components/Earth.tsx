import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import countries from "../../public/custom.geo.json";
import lines from "../../public/lines.json";
import map from "../../public/map.json";
import _ from "lodash";
import { gsap } from "gsap";

const Earth = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const INITIAL_DISTANCE = 400;
  const globeRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const initScene = () => {
      sceneRef.current = new THREE.Scene();
      sceneRef.current.background = new THREE.Color(0x040d21);

      const ambientLight = new THREE.AmbientLight(0xbbbbbb, 0.3);
      sceneRef.current.add(ambientLight);
    };

    const initRenderer = () => {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      containerRef.current?.appendChild(rendererRef.current.domElement);
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

    // Initialization
    initScene();
    initRenderer();
    initCamera();
    initControls();
    initGlobe();
    animate();

    // Event listeners
    window.addEventListener("resize", onWindowResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
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

  return (
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
        <h2 className="mb-4 text-xl font-bold">Login</h2>
        <form>{/* Login form fields */}</form>
      </div>
    </div>
  );
};

export default Earth;

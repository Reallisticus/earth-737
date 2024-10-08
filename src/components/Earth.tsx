import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import countries from "../../public/custom.geo.json";
import lines from "../../public/lines.json";
import map from "../../public/map.json";

const Earth = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let renderer: THREE.WebGLRenderer | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let scene: THREE.Scene | null = null;
    let controls: OrbitControls | null = null;
    let Globe: any = null;

    let mouseX = 0;
    let mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    const init = () => {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current?.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x040d21);

      const ambientLight = new THREE.AmbientLight(0xbbbbbb, 0.3);
      scene.add(ambientLight);

      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
      );
      camera.position.set(0, 0, 400);

      const dLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dLight.position.set(-800, 2000, 400);
      camera.add(dLight);

      scene.add(camera);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 200;
      controls.maxDistance = 500;

      window.addEventListener("resize", onWindowResize);
      document.addEventListener("mousemove", onMouseMove);
    };

    const initGlobe = async () => {
      const ThreeGlobe = (await import("three-globe")).default;

      Globe = new ThreeGlobe()
        .hexPolygonsData(countries.features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.7)
        .showAtmosphere(true)
        .atmosphereColor("#3a228a")
        .atmosphereAltitude(0.25);

      setTimeout(() => {
        Globe.arcsData(lines.pulls)
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

      Globe.rotateY(-Math.PI * (5 / 9));
      Globe.rotateZ(-Math.PI / 6);
      const globeMaterial = Globe.globeMaterial();
      globeMaterial.color = new THREE.Color(0x3a228a);
      globeMaterial.emissive = new THREE.Color(0x220038);
      globeMaterial.emissiveIntensity = 0.1;
      globeMaterial.shininess = 0.7;

      scene!.add(Globe);
    };

    const onWindowResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
    };

    const animate = () => {
      if (camera && controls && renderer && scene) {
        camera.position.x +=
          Math.abs(mouseX) <= windowHalfX / 2
            ? (mouseX / 2 - camera.position.x) * 0.005
            : 0;
        camera.position.y += (-mouseY / 2 - camera.position.y) * 0.005;
        camera.lookAt(scene.position);
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }
    };

    // Initialization and animation
    init();
    initGlobe();
    animate();

    // Cleanup
    return () => {
      if (renderer) {
        containerRef.current?.removeChild(renderer.domElement);
      }
      window.removeEventListener("resize", onWindowResize);
      document.removeEventListener("mousemove", onMouseMove);
      if (controls) controls.dispose();
      if (scene) scene.clear();
    };
  }, []);

  return <div id="earth-container" ref={containerRef}></div>;
};

export default Earth;

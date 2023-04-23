import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  ClampToEdgeWrapping,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  TextureLoader,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { AiOutlinePause } from "react-icons/ai";

const Earth = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Space") {
      setPaused(true);
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.code === "Space") {
      setPaused(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set up the scene, camera and renderer
    const scene = new Scene();
    const camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add your objects here
    const textureLoader = new TextureLoader();

    const earthTexture = textureLoader.load("/earthmap.jpg");
    earthTexture.wrapS = ClampToEdgeWrapping;
    earthTexture.wrapT = ClampToEdgeWrapping;
    const earthBumpMap = textureLoader.load("/bumpmap.jpg");
    const cloudTexture = textureLoader.load("/cloud.jpg");
    const moonTexture = textureLoader.load("/moon.jpg");

    const earthGeometry = new SphereGeometry(1, 32, 32);
    const earthMaterial = new MeshPhongMaterial({
      map: earthTexture,
      bumpMap: earthBumpMap,
      bumpScale: 0.1,
      specular: new Color("grey"),
      shininess: 10,
    });
    const earth = new Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    const cloudGeometry = new SphereGeometry(1.01, 32, 32);
    const cloudMaterial = new MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4,
    });
    const clouds = new Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);

    // Create Moon
    const moonGeometry = new SphereGeometry(0.27, 32, 32);
    const moonMaterial = new MeshPhongMaterial({ map: moonTexture });
    const moon = new Mesh(moonGeometry, moonMaterial);
    moon.position.set(2.5, 0, 0);

    const earthMoonGroup = new Group();
    earthMoonGroup.add(earth);
    earthMoonGroup.add(clouds);
    earthMoonGroup.add(moon);
    scene.add(earthMoonGroup);

    const ambientLight = new AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Set up the camera
    camera.position.z = 3;

    // Set up the controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 10;

    // Add an animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate the Earth and clouds
      if (!paused) {
        earth.rotation.y += 0.0005;
        clouds.rotation.y += 0.0007;

        moon.position.x = 2.5 * Math.cos(Date.now() * 0.00001);
        moon.position.z = 2.5 * Math.sin(Date.now() * 0.00001);
      }

      // Update controls and render the scene
      controls.update();
      renderer.render(scene, camera);
    };

    animate();
  }, [paused]);

  return (
    <div className="fixed inset-0">
      <div ref={containerRef} className="h-full w-full" />
      {paused && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 transform animate-pulse opacity-70">
          <AiOutlinePause className="text-4xl text-white" />
        </div>
      )}
    </div>
  );
};

export default Earth;

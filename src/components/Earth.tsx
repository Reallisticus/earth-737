import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { AiOutlinePause } from "react-icons/ai";
import { useDynamicStyle } from "../hooks/useDynamicStyle";

interface TextStyle {
  opacity: number;
}

const Earth = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [earthTextStyle, updateEarthTextStyle] = useDynamicStyle<TextStyle>({
    opacity: 1,
  });

  const [earthComingSoonStyle, updateEarthComingSoonStyle] =
    useDynamicStyle<TextStyle>({
      opacity: 1,
    });

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

  const generateRandomStarPositions = useCallback(
    (count: number, radius: number) => {
      const positions = new Float32Array(count * 3);

      for (let i = 0; i < count * 3; i += 3) {
        const randomVector = new Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        );

        randomVector.normalize().multiplyScalar(radius);
        positions[i] = randomVector.x;
        positions[i + 1] = randomVector.y;
        positions[i + 2] = randomVector.z;
      }

      return positions;
    },
    []
  );

  const createStarMaterial = useCallback((size: number, color: string) => {
    return new ShaderMaterial({
      uniforms: {
        size: { value: size },
        color: { value: new Color(color) },
        time: { value: 0 },
      },
      vertexShader: `
      uniform float size;
      uniform float time;
      varying float opacity;

      void main() {
        opacity = sin((position.y + time) * 2.0) * 0.5 + 0.5;
        gl_PointSize = size * opacity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
      uniform vec3 color;
      varying float opacity;

      void main() {
        gl_FragColor = vec4(color, 1.0) * opacity;
      }
    `,
      transparent: true,
    });
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
    const cloudTexture = textureLoader.load("/cloudmap.jpg");
    const cloudSpecularMap = textureLoader.load("cloud.jpg");
    const moonTexture = textureLoader.load("/moon.jpg");
    const moonBumpMap = textureLoader.load("/moonbump.jpg");
    const earthSpecularMap = textureLoader.load("/specular.jpg");

    const earthGeometry = new SphereGeometry(1, 32, 32);
    const earthMaterial = new MeshPhongMaterial({
      map: earthTexture,
      bumpMap: earthBumpMap,
      bumpScale: 0.1,
      specularMap: earthSpecularMap,
      specular: new Color("grey"),
      shininess: 10,
    });
    const earth = new Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    const cloudGeometry = new SphereGeometry(1.01, 32, 32);
    const cloudMaterial = new MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      specularMap: cloudSpecularMap,
      specular: new Color("white"),
      opacity: 0.4,
    });
    const clouds = new Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);

    // Create Moon
    const moonGeometry = new SphereGeometry(0.27, 32, 32);
    const moonMaterial = new MeshPhongMaterial({
      map: moonTexture,
      bumpMap: moonBumpMap,
      bumpScale: 0.01,
    });
    const moon = new Mesh(moonGeometry, moonMaterial);
    moon.position.set(4, 0, 0);

    const earthMoonGroup = new Group();
    earthMoonGroup.add(earth);
    earthMoonGroup.add(clouds);
    earthMoonGroup.add(moon);
    scene.add(earthMoonGroup);

    const starCount = 1000;
    const starSize = 0.1;
    const starColor = "white";
    const starRadius = 50;

    const starGeometry = new BufferGeometry();
    starGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        generateRandomStarPositions(starCount, starRadius),
        3
      )
    );

    const starMaterial = createStarMaterial(starSize, starColor);

    const stars = new Points(starGeometry, starMaterial);
    scene.add(stars);
    scene.add(stars);

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

    const handleWheel = (event: WheelEvent) => {
      const distance = camera.position.distanceTo(earth.position);
      const thresholdDistance = 2;

      const newOpacity = Math.max(
        0,
        Math.min(1, (distance - thresholdDistance) / 2)
      );
      updateEarthTextStyle({ opacity: newOpacity });
      updateEarthComingSoonStyle({ opacity: newOpacity });
    };

    window.addEventListener("wheel", handleWheel);

    // Add an animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate the Earth and clouds
      if (!paused) {
        earth.rotation.y += 0.0005;
        clouds.rotation.y += 0.0007;
        starMaterial.uniforms.time!.value += 0.01;

        moon.position.x = 4 * Math.cos(Date.now() * 0.00002);
        moon.position.z = 4 * Math.sin(Date.now() * 0.00002);
      }

      // Update controls and render the scene
      controls.update();
      renderer.render(scene, camera);
    };

    animate();
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [paused, generateRandomStarPositions, createStarMaterial]);

  return (
    <div className="fixed inset-0">
      <h1 className="earth-text font-earth737" style={earthTextStyle}>
        Earth 737
      </h1>
      <div ref={containerRef} className="h-full w-full" />
      <h1
        className="earth-coming-soon font-earth737"
        style={earthComingSoonStyle}
      >
        Coming soon!
      </h1>
      {paused && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 transform animate-pulse opacity-70">
          <AiOutlinePause className="text-4xl text-white" />
        </div>
      )}
    </div>
  );
};

export default Earth;

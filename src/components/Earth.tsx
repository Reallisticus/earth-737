import { useEffect, useRef, useState, useCallback } from "react";
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
  Raycaster,
  Vector2,
  LoadingManager,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { AiOutlinePause } from "react-icons/ai";
import Loader from "./Loader";

const Earth = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const earthTextRef = useRef<HTMLHeadingElement | null>(null);
  const earthComingSoonRef = useRef<HTMLHeadingElement | null>(null);
  const [hoveredObject, setHoveredObject] = useState<Mesh | null>(null);
  const [cameraTarget, setCameraTarget] = useState("earth");
  const [cameraPosition, setCameraPosition] = useState(new Vector3(0, 0, 3));
  const [loading, setLoading] = useState(true);

  const [selectedObject, setSelectedObject] = useState<Mesh | null>(null);

  const [paused, setPaused] = useState(false);

  const handleKey = (event: KeyboardEvent) => {
    if (event.code === "Space") {
      setPaused(event.type === "keydown");
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const speed = 0.1;
    switch (event.code) {
      case "KeyW":
        setCameraPosition((prevPosition) =>
          prevPosition.add(new Vector3(0, 0, -speed))
        );
        break;
      case "KeyA":
        setCameraPosition((prevPosition) =>
          prevPosition.add(new Vector3(-speed, 0, 0))
        );
        break;
      case "KeyS":
        setCameraPosition((prevPosition) =>
          prevPosition.add(new Vector3(0, 0, speed))
        );
        break;
      case "KeyD":
        setCameraPosition((prevPosition) =>
          prevPosition.add(new Vector3(speed, 0, 0))
        );
        break;
      default:
        break;
    }
  };

  // useEffect(() => {
  //   window.addEventListener("keydown", handleKey);
  //   window.addEventListener("keyup", handleKey);

  //   return () => {
  //     window.removeEventListener("keydown", handleKey);
  //     window.removeEventListener("keyup", handleKey);
  //   };
  // }, []);

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

  const generateRandomStarSizes = (
    count: number,
    minSize: number,
    maxSize: number
  ) => {
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      sizes[i] = Math.random() * (maxSize - minSize) + minSize;
    }

    return sizes;
  };

  const getRandomArbitrary = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const createStarMaterial = useCallback((colors: string[]) => {
    return new ShaderMaterial({
      uniforms: {
        size: { value: getRandomArbitrary(0.05, 5) },
        color: {
          value: new Color(colors[Math.floor(Math.random() * colors.length)]),
        },
        time: { value: 0 },
      },
      vertexShader: `
      attribute float size;
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
        float distanceFromCenter = distance(gl_PointCoord, vec2(0.5, 0.5));
        float edgeOpacity = 1.0 - smoothstep(0.4, 0.5, distanceFromCenter);
        gl_FragColor = vec4(color, opacity * edgeOpacity);
      }
    `,
      transparent: true,
    });
  }, []);

  const starColors = ["#ffffff", "#ffaa00", "#00aaff", "#aaaaff"];

  useEffect(() => {
    if (!containerRef.current) return;

    const manager = new LoadingManager();

    manager.onStart = () => {
      setLoading(true);
    };

    manager.onLoad = () => {
      setLoading(false);
    };

    // Set up the scene, camera and renderer
    const scene = new Scene();
    const camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.copy(cameraPosition);

    const renderer = new WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add your objects here
    const textureLoader = new TextureLoader(manager);

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
    const starMinSize = 0.05;
    const starMaxSize = 5;
    const starRadius = 50;

    const starGeometry = new BufferGeometry();
    starGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        generateRandomStarPositions(starCount, starRadius),
        3
      )
    );

    const starSizes = generateRandomStarSizes(
      starCount,
      starMinSize,
      starMaxSize
    );
    starGeometry.setAttribute("size", new Float32BufferAttribute(starSizes, 1));

    const starMaterial = createStarMaterial(starColors);

    const stars = new Points(starGeometry, starMaterial);
    scene.add(stars);

    const raycaster = new Raycaster();
    const mouse = new Vector2();

    const focusOnObject = (object: Mesh) => {
      camera.position.set(
        object.position.x,
        object.position.y,
        object.position.z + 3
      );
      controls.target.copy(object.position);
    };

    const handleMouseMove = (event: MouseEvent) => {
      // Prevent the default context menu from showing up on right-click
      if (event.button === 2) {
        event.preventDefault();
      }

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([earth, moon]);

      if (intersects.length > 0 && intersects[0]) {
        setHoveredObject(intersects[0].object as Mesh);
        if (event.button === 2) {
          setSelectedObject(intersects[0].object as Mesh);
        }
      } else {
        setHoveredObject(null);
        if (event.button === 2) {
          setSelectedObject(null);
        }
      }
    };

    const handleDoubleClick = (event: MouseEvent) => {
      event.preventDefault();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([earth, moon]);

      if (intersects.length > 0 && intersects[0]) {
        if (intersects[0].object === earth) {
          focusOnObject(earth);
        } else if (intersects[0].object === moon) {
          focusOnObject(moon);
        }
      }
    };

    window.addEventListener("mousedown", handleMouseMove);
    containerRef.current.addEventListener("dblclick", handleDoubleClick);

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
      earthTextRef.current!.style.opacity = newOpacity.toString();
      earthComingSoonRef.current!.style.opacity = newOpacity.toString();
    };

    window.addEventListener("wheel", handleWheel);

    // Add an animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      raycaster.setFromCamera(mouse, camera);

      if (cameraTarget === "earth") {
        controls.target.copy(earth.position);
      } else if (cameraTarget === "moon") {
        controls.target.copy(moon.position);
      }

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
      window.removeEventListener("mousedown", handleMouseMove);

      if (containerRef.current) {
        containerRef.current.removeEventListener("dblclick", handleDoubleClick);
      }
    };
  }, [paused, generateRandomStarPositions, createStarMaterial]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0">
      <h1 ref={earthTextRef} className="earth-text no-select font-earth737">
        Earth 737
      </h1>{" "}
      <div ref={containerRef} className="h-full w-full" />
      <h1
        ref={earthComingSoonRef}
        className="earth-coming-soon no-select  font-earth737"
      >
        Coming soon!
      </h1>
      {paused && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 transform animate-pulse opacity-70">
          <AiOutlinePause className="text-4xl text-white" />
        </div>
      )}
      {loading && <Loader />}
    </div>
  );
};

export default Earth;

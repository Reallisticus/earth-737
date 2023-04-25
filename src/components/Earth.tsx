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
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  Vector3,
  Raycaster,
  Vector2,
  LoadingManager,
  PCFSoftShadowMap,
  PointLight,
  ShaderMaterial,
  AdditiveBlending,
  PointsMaterial,
  BufferAttribute,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { AiOutlinePause } from "react-icons/ai";
import Loader from "./Loader";
import {
  createStarMaterial,
  generateRandomStarPositions,
  generateRandomStarSizes,
  starColors,
} from "./helper/stars";
import { debounce, disposeMesh } from "./helper/utils";
import { generateSolarEruptionPositions } from "./helper/sun";

const Earth = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const earthTextRef = useRef<HTMLHeadingElement | null>(null);
  const earthComingSoonRef = useRef<HTMLHeadingElement | null>(null);
  const [loading, setLoading] = useState(true);

  const [paused, setPaused] = useState(false);

  const handleKey = (event: KeyboardEvent) => {
    if (event.code === "Space") {
      setPaused(event.type === "keydown");
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
    };
  }, []);

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

    const renderer = new WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add your objects here
    const textureLoader = new TextureLoader(manager);

    const earthTexture = textureLoader.load(
      "https://earth737.s3.eu-central-1.amazonaws.com/earthmap.jpg"
    );
    earthTexture.wrapS = ClampToEdgeWrapping;
    earthTexture.wrapT = ClampToEdgeWrapping;
    const earthBumpMap = textureLoader.load(
      "https://earth737.s3.eu-central-1.amazonaws.com/bumpmap.jpg"
    );
    const cloudTexture = textureLoader.load(
      "https://earth737.s3.eu-central-1.amazonaws.com/cloudmap.jpg"
    );
    const cloudSpecularMap = textureLoader.load(
      "https://earth737.s3.eu-central-1.amazonaws.com/cloud.jpg"
    );
    const moonTexture = textureLoader.load(
      "https://earth737.s3.eu-central-1.amazonaws.com/moon.jpg"
    );
    const moonBumpMap = textureLoader.load(
      "https://earth737.s3.eu-central-1.amazonaws.com/moonbump.jpg"
    );
    const earthSpecularMap = textureLoader.load(
      "https://earth737.s3.eu-central-1.amazonaws.com/specular.jpg"
    );

    const sunTexture = textureLoader.load("sun.jpg");
    const sunDisplacementMap = textureLoader.load("sun.jpg");

    const sunGeometry = new SphereGeometry(5, 32, 32); // Adjust size as needed
    const sunMaterial = new ShaderMaterial({
      vertexShader: `
      varying vec2 vUv;
  uniform float time;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Adjust the displacement amount and speed as needed
    float displacementAmount = 0.05;
    float speed = 0.5;

    pos.z += sin((uv.y + time) * speed) * displacementAmount;
    pos.x += cos((uv.x + time) * speed) * displacementAmount;

    vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
  }`,
      fragmentShader: `
     varying vec2 vUv;
  uniform sampler2D map;
  uniform sampler2D emissiveMap;
  uniform float emissiveIntensity;
  
  void main() {
    vec4 color = texture2D(map, vUv);
    vec3 emissiveColor = texture2D(emissiveMap, vUv).rgb * emissiveIntensity;
    gl_FragColor = vec4(color.rgb + emissiveColor, 1.0);
  }
  `,
      uniforms: {
        map: { value: sunTexture },
        emissiveMap: { value: sunTexture },
        displacementMap: { value: sunDisplacementMap },
        displacementScale: { value: 0.5 },
        emissiveIntensity: { value: 1.5 },
        time: { value: 0 },
      },
    });
    const sun = new Mesh(sunGeometry, sunMaterial);
    sun.position.set(-30, 0, 0); // Adjust position as needed
    scene.add(sun);

    // Solar eruptions
    const eruptionCount = 5000;
    const eruptionRadius = 5.5; // Adjust to match the size of the sun

    const eruptionGeometry = new BufferGeometry();
    eruptionGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        generateSolarEruptionPositions(eruptionCount, eruptionRadius),
        3
      )
    );

    const eruptionTexture = textureLoader.load(
      "https://trafffic.com/wp-content/uploads/2014/08/circle-white.png"
    ); // Particle texture (a white dot)

    const eruptionMaterial = new PointsMaterial({
      size: 0.1,
      transparent: true,
      opacity: 0.7,
      map: eruptionTexture,
      blending: AdditiveBlending,
      depthTest: false,
    });

    const solarEruptions = new Points(eruptionGeometry, eruptionMaterial);
    sun.add(solarEruptions);

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

    const solarSystemGroup = new Group();
    solarSystemGroup.add(sun);
    solarSystemGroup.add(earthMoonGroup);

    scene.add(solarSystemGroup);

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

    const pointLight = new PointLight(0xffffff, 1, 1000); // Change the distance (third parameter) as needed
    pointLight.position.copy(sun.position);

    scene.add(pointLight);

    moon.castShadow = true;
    earth.castShadow = true;
    clouds.receiveShadow = true;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 50;

    // Set up the camera
    camera.position.z = 10;

    // Set up the controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 45;

    controls.target.copy(earth.position);

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

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    window.addEventListener("wheel", debounce(handleWheel, 100));

    const earthOrbitRadius = 15; // Adjust as needed
    const earthOrbitSpeed = 0.0005; // Adjust as needed
    const lastValidTarget = new Vector3();

    function onMouseMove(event: { clientX: number; clientY: number }) {
      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(scene.children, true);

      const filteredIntersects = intersects.filter(
        (intersect) => intersect.object !== sun
      );

      if (filteredIntersects.length > 0) {
        // Set controls target to the first intersected object
        lastValidTarget.copy(controls.target);
        controls.target.copy(filteredIntersects[0]!.object.position);
      } else {
        // Reset controls target to the sun's position when no object is intersected
        controls.target.copy(lastValidTarget);
      }
    }

    // Add an animation loop
    const animate = () => {
      const eruptionsSpeed = 0.01;

      requestAnimationFrame(animate);
      earth.getWorldPosition(controls.target);

      // Rotate the Earth and clouds
      if (!paused) {
        if (
          solarEruptions.geometry.attributes.position instanceof BufferAttribute
        ) {
          const positions = solarEruptions.geometry.attributes.position.array;
          const mutablePositions = Array.from(positions);

          if (mutablePositions) {
            mutablePositions.forEach((_, index) => {
              if ((index + 1) % 3 === 0) {
                const distanceToSun = Math.sqrt(
                  Math.pow(mutablePositions[index - 2] as number, 2) +
                    Math.pow(mutablePositions[index - 1] as number, 2) +
                    Math.pow(mutablePositions[index] as number, 2)
                );

                const normalizedDistance = Math.min(
                  1,
                  distanceToSun / eruptionRadius
                );

                mutablePositions[index - 2] +=
                  mutablePositions[index - 2]! *
                  eruptionsSpeed *
                  normalizedDistance;
                mutablePositions[index - 1] +=
                  mutablePositions[index - 1]! *
                  eruptionsSpeed *
                  normalizedDistance;
                mutablePositions[index] +=
                  mutablePositions[index]! *
                  eruptionsSpeed *
                  normalizedDistance;

                if (distanceToSun > eruptionRadius * 2) {
                  const newPos = new Vector3(
                    (Math.random() - 0.5) * 2 * eruptionRadius,
                    (Math.random() - 0.5) * 2 * eruptionRadius,
                    (Math.random() - 0.5) * 2 * eruptionRadius
                  );
                  if (newPos.length() < eruptionRadius) {
                    mutablePositions[index - 2] = newPos.x;
                    mutablePositions[index - 1] = newPos.y;
                    mutablePositions[index] = newPos.z;
                  }
                }
              }
            });
          }
          solarEruptions.geometry.attributes.position.array = new Float32Array(
            mutablePositions
          );
        }

        earth.rotation.y += 0.0005;
        clouds.rotation.y += 0.0007;
        starMaterial.uniforms.time!.value += 0.01;
        const elapsedTime = Date.now() * earthOrbitSpeed;

        sun.position.x += 0.005;
        sun.position.z += 0.002;

        earthMoonGroup.position.x =
          sun.position.x + earthOrbitRadius * Math.cos(elapsedTime);
        earthMoonGroup.position.z =
          sun.position.z + earthOrbitRadius * Math.sin(elapsedTime);

        moon.position.x = 4 * Math.cos(Date.now() * 0.00002);
        moon.position.z = 4 * Math.sin(Date.now() * 0.00002);
      }

      // Update controls and render the scene
      controls.update();
      renderer.render(scene, camera);
    };

    window.addEventListener("mousemove", onMouseMove, false);

    animate();
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);

      disposeMesh(earth);
      disposeMesh(clouds);
      disposeMesh(moon);
      stars.geometry.dispose();
      stars.material.dispose();
    };
  }, [paused, generateRandomStarPositions, createStarMaterial]);

  return (
    <div className="fixed inset-0">
      {loading && <Loader />}
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
    </div>
  );
};

export default Earth;

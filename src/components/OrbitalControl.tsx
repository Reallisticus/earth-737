import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import {
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  BoxGeometry,
  BufferGeometry,
  BufferAttribute,
  TextureLoader,
} from "three";

const Earth: React.FC = () => {
  const textureUrl = "OIP.jpg";
  const loader = new TextureLoader();
  const texture = loader.load(textureUrl);
  const material = new MeshBasicMaterial({ map: texture });

  return (
    <mesh>
      <sphereBufferGeometry args={[2, 1024, 1024]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

function adjustUVs(geometry: BufferGeometry, uTile = 1, vTile = 1) {
  // Check if the geometry has UV attribute
  if (!geometry.hasAttribute("uv")) {
    console.warn("The geometry does not have UV coordinates.");
    return;
  }

  // Get the UV attribute from the geometry
  const uvAttribute = geometry.getAttribute("uv") as BufferAttribute;

  // Loop through the UVs and adjust them based on the uTile and vTile
  for (let i = 0; i < uvAttribute.count; i++) {
    const u = uvAttribute.getX(i);
    const v = uvAttribute.getY(i);

    uvAttribute.setXY(i, u * uTile, v * vTile);
  }

  // Mark the UV attribute as needing an update
  uvAttribute.needsUpdate = true;
}

const Skyscraper: React.FC<{
  position: [number, number, number];
  height: number;
}> = ({ position, height }) => {
  const textureUrl = "skyscraper.png";
  const texture = useTexture(textureUrl);
  const material = new MeshStandardMaterial({ map: texture });

  const up = new Vector3(0, 1, 0);
  const skyscraperUp = new Vector3(...position).normalize();
  const quaternion = new Quaternion().setFromUnitVectors(up, skyscraperUp);

  const skyscraperGeometry = new BoxGeometry(0.1, height, 0.1);
  adjustUVs(skyscraperGeometry);

  return (
    <mesh position={position} quaternion={quaternion}>
      <primitive object={skyscraperGeometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const positionSkyscraper = (
  lat: number,
  lon: number,
  earthRadius: number,
  height: number
): [number, number, number] => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(earthRadius + height / 2) * Math.sin(phi) * Math.cos(theta);
  const y = (earthRadius + height / 2) * Math.cos(phi);
  const z = (earthRadius + height / 2) * Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
};

const OrbitalBackground: React.FC = () => {
  const earthRadius = 2;
  const skyscraperHeight = 1;

  return (
    <Canvas
      style={{ width: "100vw", height: "100vh" }}
      camera={{ position: [0, 0, 10], fov: 60 }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Earth />
      <Skyscraper
        position={positionSkyscraper(45, 0, earthRadius, skyscraperHeight)}
        height={skyscraperHeight}
      />
      <Skyscraper
        position={positionSkyscraper(
          45,
          10,
          earthRadius,
          skyscraperHeight * 0.8
        )}
        height={skyscraperHeight * 0.8}
      />
      <Skyscraper
        position={positionSkyscraper(
          45,
          -10,
          earthRadius,
          skyscraperHeight * 1.2
        )}
        height={skyscraperHeight * 1.2}
      />
      <Stars />
      <OrbitControls />
    </Canvas>
  );
};

export default OrbitalBackground;

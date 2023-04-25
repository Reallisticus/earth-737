import { Color, ShaderMaterial, Vector3 } from "three";

export const generateRandomStarPositions = (count: number, radius: number) => {
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
};

export const generateRandomStarSizes = (
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

export const createStarMaterial = (colors: Array<string>) => {
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
};

export const starColors = ["#ffffff", "#ffaa00", "#00aaff", "#aaaaff"];

import { Vector3 } from "three";

export function generateSolarEruptionPositions(count: number, radius: number) {
  const positions = [];

  for (let i = 0; i < count; i++) {
    const sphere = new Vector3(
      (Math.random() - 0.5) * 2 * radius,
      (Math.random() - 0.5) * 2 * radius,
      (Math.random() - 0.5) * 2 * radius
    );

    if (sphere.length() < radius) {
      positions.push(sphere.x, sphere.y, sphere.z);
    } else {
      i--;
    }
  }

  return positions;
}

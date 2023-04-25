import type { Mesh } from "three";

import { MeshBasicMaterial, MeshPhongMaterial } from "three";

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number | undefined
): T => {
  let timeout: number | NodeJS.Timeout | undefined;
  return ((...args: any[]) => {
    clearTimeout(timeout as number | NodeJS.Timeout);
    // eslint-disable-next-line
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

export const disposeMesh = (mesh: Mesh) => {
  if (mesh.geometry) {
    mesh.geometry.dispose();
  }

  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => {
        if (
          material instanceof MeshPhongMaterial ||
          material instanceof MeshBasicMaterial
        ) {
          if (material.map) material.map.dispose();
        }
        material.dispose();
      });
    } else {
      if (
        mesh.material instanceof MeshPhongMaterial ||
        mesh.material instanceof MeshBasicMaterial
      ) {
        if (mesh.material.map) mesh.material.map.dispose();
      }
      mesh.material.dispose();
    }
  }
};

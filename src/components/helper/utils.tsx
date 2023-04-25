import { Mesh, MeshBasicMaterial, MeshPhongMaterial } from "three";

export const debounce = (
  func: { apply: (arg0: undefined, arg1: any[]) => void },
  wait: number | undefined
) => {
  let timeout: string | number | NodeJS.Timeout | undefined;
  return (...args: any) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
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

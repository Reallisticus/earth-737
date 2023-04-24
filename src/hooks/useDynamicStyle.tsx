import { useState } from "react";
type Style = {
  opacity: number;
  // add other style properties as needed
};

type UseDynamicStyleReturnType = [
  Style,
  <T extends Style>(newStyle: Partial<T>) => void
];

export const useDynamicStyle = <T extends Style>(
  initialStyle: T
): UseDynamicStyleReturnType => {
  const [style, setStyle] = useState<T>(initialStyle);

  const updateStyle = <U extends Style>(newStyle: Partial<U>) => {
    setStyle((prevStyle) => ({ ...prevStyle, ...newStyle }));
  };

  return [style, updateStyle];
};

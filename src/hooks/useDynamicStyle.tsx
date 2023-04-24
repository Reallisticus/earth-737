import { useState } from "react";

export const useDynamicStyle = (initialStyle: any) => {
  const [style, setStyle] = useState(initialStyle);

  const updateStyle = (newStyle: any) => {
    setStyle((prevStyle: any) => ({
      ...prevStyle,
      ...newStyle,
    }));
  };

  return [style, updateStyle];
};

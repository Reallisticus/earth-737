// components/Loader.tsx
import React, { useEffect, useState } from "react";

const Loader: React.FC = () => {
  const [text, setText] = useState("");
  const loadingText = "Loading...";

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < loadingText.length) {
        setText((prevText) => prevText + loadingText[index]);
        index++;
      } else {
        clearInterval(timer);
      }
    }, 150);

    return () => clearInterval(timer);
  }, [text]);
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-4 border-t-4 border-[#0077ff]"></div>
        <p className="mt-4 text-xl text-white">{text}</p>
      </div>
    </div>
  );
};

export default Loader;

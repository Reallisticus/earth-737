// components/Loader.tsx
import React, { useEffect, useState } from "react";

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-4 border-t-4 border-[#0077ff]"></div>
      </div>
    </div>
  );
};

export default Loader;

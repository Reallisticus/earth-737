import React from "react";
import { motion } from "framer-motion";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040c1e]">
      <motion.div
        className="relative h-20 w-20"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-t-4 border-purple-500 border-t-transparent"></div>
        <div className="absolute inset-2 rounded-full border-4 border-t-4 border-blue-500 border-t-transparent"></div>
        <div className="absolute inset-4 rounded-full border-4 border-t-4 border-violet-500 border-t-transparent"></div>
      </motion.div>
      <p className="ml-12 mt-4 text-lg text-white">Initializing Earth737...</p>
    </div>
  );
};

export default Loader;

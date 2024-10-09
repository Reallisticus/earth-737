import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    promoCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const FuturisticAuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
  });

  const onSubmit = (data: any) => {
    console.log(data);
    // Handle login/register logic here
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  const InputField = ({ name, type, placeholder, error }: any) => (
    <div className="relative mb-6">
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className="w-full border-b-2 border-purple-500 bg-transparent px-4 py-2 text-black placeholder-purple-300 transition-all duration-300 focus:border-purple-300 focus:outline-none"
      />
      <div className="absolute bottom-0 left-0 h-0.5 w-full scale-x-0 transform bg-purple-500 transition-transform duration-300 group-focus-within:scale-x-100"></div>
      {error && (
        <p className="absolute mt-1 text-xs text-red-400">{error.message}</p>
      )}
    </div>
  );

  return (
    <div className="relative">
      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5 }}
        className="relative w-96 rounded-3xl bg-white p-8 shadow-lg"
      >
        {/* Circular accents */}
        <div className="absolute -left-12 -top-4 h-8 w-8 rounded-full bg-white"></div>
        <div className="absolute -left-16 -top-10 h-6 w-6 rounded-full bg-purple-200"></div>
        <div className="absolute -left-20 -top-3 h-4 w-4 rounded-full bg-purple-300"></div>

        <div className="absolute -right-12 -top-4 h-8 w-8 rounded-full bg-white"></div>
        <div className="absolute -right-16 -top-10 h-6 w-6 rounded-full bg-violet-200"></div>
        <div className="absolute -right-20 -top-3 h-4 w-4 rounded-full bg-violet-300"></div>

        <div className="absolute -bottom-11 -left-4 h-8 w-8 rounded-full bg-white"></div>
        <div className="absolute -bottom-16 -left-10 h-6 w-6 rounded-full bg-violet-200"></div>
        <div className="absolute -bottom-20 -left-6 h-4 w-4 rounded-full bg-violet-300"></div>

        <div className="absolute -bottom-11 -right-4 h-8 w-8 rounded-full bg-white"></div>
        <div className="absolute -bottom-16 -right-10 h-6 w-6 rounded-full bg-purple-200"></div>
        <div className="absolute -bottom-20 -right-6 h-4 w-4 rounded-full bg-purple-300"></div>

        <div className="relative mb-8">
          <h2 className="bg-gradient-to-r from-purple-700 to-violet-900 bg-clip-text text-3xl font-bold text-transparent">
            {isLogin ? "Access Portal" : "New Recruit"}
          </h2>
          <div className="mt-2 h-1 w-20 bg-gradient-to-r from-purple-700 to-violet-900"></div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="username"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <InputField
                  name="username"
                  type="text"
                  placeholder="Cosmic Alias"
                  error={errors.username}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <InputField
            name="email"
            type="email"
            placeholder="Galactic Email"
            error={errors.email}
          />
          <InputField
            name="password"
            type="password"
            placeholder="Secret Code"
            error={errors.password}
          />

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="additional-fields"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <InputField
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm Secret Code"
                  error={errors.confirmPassword}
                />
                <InputField
                  name="promoCode"
                  type="text"
                  placeholder="Star Command Code (Optional)"
                  error={errors.promoCode}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full rounded-full bg-gradient-to-r from-purple-700 to-violet-900 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:shadow-purple-500/50"
            type="submit"
          >
            {isLogin ? "Initiate Launch Sequence" : "Join the Fleet"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-violet-300">
          {isLogin ? "New to the galaxy?" : "Already part of the crew?"}
          <button
            onClick={toggleMode}
            className="ml-1 text-violet-700 underline underline-offset-4 transition-colors duration-300 hover:text-purple-500 focus:outline-none"
          >
            {isLogin ? "Enlist Now" : "Return to Base"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default FuturisticAuthForm;

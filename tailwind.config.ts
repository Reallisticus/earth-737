import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        earth737: ["Monoton", "cursive"],
      },
    },
  },
  plugins: [],
} satisfies Config;

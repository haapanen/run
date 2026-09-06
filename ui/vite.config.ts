import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base =
  process.env.BASE_PATH ?? (repositoryName ? `/${repositoryName}/` : "/");

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
});

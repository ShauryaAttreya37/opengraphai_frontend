import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(process.cwd(), "index.html"),
        howItWorks: resolve(process.cwd(), "how-it-works/index.html"),
        useCases: resolve(process.cwd(), "use-cases/index.html"),
        resources: resolve(process.cwd(), "resources/index.html"),
        about: resolve(process.cwd(), "about/index.html"),
      },
    },
  },
});

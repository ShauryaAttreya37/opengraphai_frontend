import { resolve } from "node:path";
import { defineConfig } from "vite";
import { seoPages } from "./scripts/seo-pages.mjs";

export default defineConfig({
  plugins: [seoPages()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(process.cwd(), "index.html"),
        docs: resolve(process.cwd(), "docs/index.html"),
        // Template for markdown pages; seoPages renders it per page and drops it from the output.
        page: resolve(process.cwd(), "page.html"),
      },
    },
  },
});

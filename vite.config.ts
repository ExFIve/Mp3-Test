import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** `jsmediatags` points `browser` at missing `dist/`; published files live in `build2/`. */
const jsmediatagsEntry = path.resolve(__dirname, "node_modules/jsmediatags/build2/jsmediatags.js");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      jsmediatags: jsmediatagsEntry,
      "react-native-fs": path.resolve(__dirname, "src/shims/react-native-fs.ts"),
    },
  },
  server: {
    open: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});

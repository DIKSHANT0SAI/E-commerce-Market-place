import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    // Pure-logic tests don't need a browser — Node is faster.
    environment: "node",
    // Allow describe/it/expect without importing them in every file.
    globals: true,
    // Where test files live.
    include: ["tests/**/*.test.js"],
  },
  resolve: {
    // Let tests use the same "@/..." imports the app uses (maps "@" to the project root).
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});

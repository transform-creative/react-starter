import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Separate config from `vite.config.ts` because the React Router plugin
// only works inside its own dev/build pipeline — under Vitest it errors
// with "can't detect preamble".
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});

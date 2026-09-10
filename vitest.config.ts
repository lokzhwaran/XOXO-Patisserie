import { defineConfig } from "vitest/config";
import path from "path";

const alias = {
  "@": path.resolve(__dirname, "./src"),
};

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
        resolve: { alias },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
        },
        resolve: { alias },
      },
    ],
  },
});

import { defineConfig, type UserConfig } from "tsdown";

/** ESM with the React Server Components boundary ("use client"); React and the core stay external. */
const config: UserConfig = defineConfig({
  entry: ["src/index.tsx"],
  format: ["esm"],
  platform: "neutral",
  target: "es2022",
  dts: true,
  banner: { js: '"use client";' },
});
export default config;

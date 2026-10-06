import { defineConfig, type UserConfig } from "tsdown";

/** ESM for browsers, SSR and bundlers; declarations from Oxc (isolatedDeclarations). */
const config: UserConfig = defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "neutral",
  target: "es2022",
  dts: true,
});
export default config;

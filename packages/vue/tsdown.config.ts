import { defineConfig, type UserConfig } from "tsdown";

/** ESM: the Vue entry, the Nuxt module and its client plugin; Vue, Nuxt Kit and the core stay external. */
const config: UserConfig = defineConfig({
  entry: ["src/index.ts", "src/nuxt.ts", "src/runtime/plugin.ts"],
  format: ["esm"],
  platform: "neutral",
  target: "es2022",
  dts: true,
  // Nuxt types are the app's own (optional peers); never inline them into the declarations.
  deps: { neverBundle: ["@nuxt/kit", "@nuxt/schema", "vue"] },
});
export default config;

/**
 * The Nuxt module (`modules: ["@terragamingmedia/ads-vue/nuxt"]`, options under `tgm`): exposes the
 * options as `runtimeConfig.public.tgm` (so `NUXT_PUBLIC_TGM_HOST` and friends override them at
 * runtime), loads the site tag in the browser once the app has mounted, and registers
 * `<TgmAd>` / `<TgmFloating>`.
 */
import { addComponent, addPlugin, createResolver, defineNuxtModule } from "@nuxt/kit";
import type { NuxtModule } from "@nuxt/schema";
import type { TgmOptions } from "@terragamingmedia/ads";

export type ModuleOptions = Partial<TgmOptions>;

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: { name: "@terragamingmedia/ads-vue", configKey: "tgm", compatibility: { nuxt: ">=3.13.0" } },
  defaults: {},
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const pub = nuxt.options.runtimeConfig.public as Record<string, unknown>;
    pub.tgm = { ...options, ...(pub.tgm as object | undefined) };
    addPlugin({ src: resolver.resolve("./runtime/plugin"), mode: "client" });
    for (const name of ["TgmAd", "TgmFloating"])
      addComponent({ name, export: name, filePath: "@terragamingmedia/ads-vue" });
  },
});
export default module;

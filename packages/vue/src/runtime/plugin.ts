/**
 * Nuxt client plugin (registered by the module): loads the site tag once the app has mounted,
 * with `runtimeConfig.public.tgm`. A plain function plugin, so it needs no Nuxt runtime imports.
 */
import { loadTag, type TgmOptions } from "@terragamingmedia/ads";

interface NuxtAppLike {
  $config: { public: { tgm?: Partial<TgmOptions> } };
  hook(name: "app:mounted", cb: () => void): void;
}

export default function tgmPlugin(nuxtApp: NuxtAppLike): void {
  const opts = nuxtApp.$config.public.tgm;
  if (!opts?.host) {
    console.warn("[TerraGaming Media] set `tgm.host` in nuxt.config (or NUXT_PUBLIC_TGM_HOST).");
    return;
  }
  const host = opts.host;
  nuxtApp.hook("app:mounted", () => void loadTag({ ...opts, host }));
}

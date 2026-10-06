/**
 * @terragaming/ads-vue — TerraGaming Media ads for Vue 3 (and Nuxt via `@terragaming/ads-vue/nuxt`).
 *
 * - `app.use(createTgm({ host: "tgmads.<domain>" }))`: loads the site tag once, after the app
 *   mounted (so server-rendered markup hydrates before the tag touches the page).
 * - `<TgmAd unit="TGM-…" />` wherever an ad goes; `<TgmFloating unit="TGM-…" />` once. The unit
 *   container mounts in the browser only; unmounting removes the ad.
 * - Route changes are followed by the tag itself; `useTgm().pageview()` for manual mode.
 *
 * Guide: https://help.terragamingmedia.com/publishers/install/vue/
 */
import { getTgm, loadTag, tgm, type TgmOptions, type TgmStatus } from "@terragaming/ads";
import { defineComponent, h, onMounted, ref, type App, type Component, type Plugin } from "vue";

export type { TgmApi, TgmEvent, TgmOptions, TgmStatus } from "@terragaming/ads";
export { getTgm, loadTag, tagScriptAttributes } from "@terragaming/ads";

/** The Vue plugin: loads the site tag once the app has mounted. */
export function createTgm(opts: TgmOptions): Plugin {
  return {
    install(app: App) {
      if (typeof window === "undefined") return;
      const mount = app.mount.bind(app);
      app.mount = ((...args: Parameters<App["mount"]>) => {
        const vm = mount(...args);
        void loadTag(opts);
        return vm;
      }) as App["mount"];
    },
  };
}

const placement = (name: string, slot?: "floating"): Component =>
  defineComponent({
    name,
    props: { unit: { type: String, required: true } },
    setup(props) {
      const mounted = ref(false);
      onMounted(() => {
        mounted.value = true;
      });
      return () =>
        h(
          "div",
          { "data-tgm-placement": "" },
          mounted.value
            ? [h("div", { key: props.unit, "data-tgm-unit": props.unit, "data-tgm-slot": slot })]
            : [],
        );
    },
  });

/** An ad placement. The same unit may appear any number of times. */
export const TgmAd: Component = placement("TgmAd");

/** The floating banner: once per page, anywhere (it anchors to the bottom of the screen). */
export const TgmFloating: Component = placement("TgmFloating", "floating");

/** Calls the live tag (no-ops until it is ready). */
export function useTgm(): {
  pageview(): void;
  refresh(slotIds?: string[]): void;
  status(): TgmStatus | null;
  ready(): boolean;
} {
  return { ...tgm, ready: () => getTgm() !== null };
}

/**
 * `@terragaming/ads-vue`:
 * - `<TgmAd>` renders no unit container on the server; it mounts after hydration without
 *   mismatch warnings, and unmounting removes it;
 * - `createTgm()` loads the tag once, after the app has mounted (never before hydration);
 * - the Nuxt module is configured under `tgm`.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, createSSRApp, h, nextTick, ref } from "vue";
import { renderToString } from "vue/server-renderer";

import { TgmAd, TgmFloating, createTgm, useTgm } from "../src/index";
import nuxtModule from "../src/nuxt";

afterEach(() => {
  document.head.replaceChildren();
  document.body.replaceChildren();
  delete (window as { tgm?: unknown }).tgm;
});

const container = () => {
  const el = document.createElement("div");
  document.body.append(el);
  return el;
};

describe("TgmAd", () => {
  it("has no unit container on the server and hydrates without warnings", async () => {
    const html = await renderToString(createSSRApp(() => h(TgmAd, { unit: "TGM-HPO-SBR01" })));
    expect(html).not.toContain("data-tgm-unit");
    const el = container();
    el.innerHTML = html;
    const warn = vi.fn();
    const app = createSSRApp(() => h(TgmAd, { unit: "TGM-HPO-SBR01" }));
    app.config.warnHandler = warn;
    const mismatch = vi.spyOn(console, "error");
    app.mount(el);
    await nextTick();
    expect(warn).not.toHaveBeenCalled();
    expect(mismatch).not.toHaveBeenCalled();
    expect(el.querySelectorAll('[data-tgm-unit="TGM-HPO-SBR01"]')).toHaveLength(1);
    app.unmount();
    expect(el.querySelectorAll("[data-tgm-unit]")).toHaveLength(0);
  });

  it("unmounting the component removes the container", async () => {
    const show = ref(true);
    const el = container();
    createApp(() => (show.value ? h(TgmFloating, { unit: "TGM-HPO-FLT01" }) : null)).mount(el);
    await nextTick();
    const unit = el.querySelector<HTMLElement>("[data-tgm-unit]")!;
    expect(unit.dataset.tgmSlot).toBe("floating");
    show.value = false;
    await nextTick();
    expect(el.querySelectorAll("[data-tgm-unit]")).toHaveLength(0);
  });
});

describe("createTgm", () => {
  it("loads the tag once, after the app mounted", async () => {
    const el = container();
    let mountedScripts = -1;
    const app = createApp({
      mounted() {
        mountedScripts = document.querySelectorAll("script").length;
      },
      render: () => h(TgmAd, { unit: "TGM-HPO-SBR01" }),
    });
    app.use(createTgm({ host: "tgmads.example.com" }));
    app.use(createTgm({ host: "tgmads.example.com" }));
    expect(document.querySelectorAll("script")).toHaveLength(0);
    app.mount(el);
    expect(mountedScripts).toBe(0);
    expect(
      document.querySelectorAll('script[src="https://tgmads.example.com/tag.js"]'),
    ).toHaveLength(1);
  });

  it("useTgm() calls the live tag", () => {
    const pageview = vi.fn();
    (window as { tgm?: unknown }).tgm = { __tgm: true, pageview };
    useTgm().pageview();
    expect(pageview).toHaveBeenCalledTimes(1);
  });
});

describe("the Nuxt module", () => {
  it("is configured under `tgm`", async () => {
    const meta = await nuxtModule.getMeta?.();
    expect(meta).toMatchObject({ name: "@terragaming/ads-vue", configKey: "tgm" });
  });
});

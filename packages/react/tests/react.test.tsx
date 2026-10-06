/**
 * `@terragamingmedia/ads-react`:
 * - `<TgmAd>` renders nothing the tag fills on the server; the `data-tgm-unit` container mounts
 *   after hydration, so the tag's iframes never meet React's hydration (no warnings);
 * - StrictMode mounts one container; unmounting removes it (the tag tears its ad down);
 * - `<TgmScript>` renders the site tag's `<script>`; `<TgmProvider>` loads it once in an effect;
 * - `useTgmPageview(key)` starts a page view when the key changes, not on the first render.
 */
import { act, StrictMode } from "react";
import { hydrateRoot, createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { TgmAd, TgmFloating, TgmProvider, TgmScript, useTgmPageview } from "../src/index";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

let root: Root | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.head.replaceChildren();
  document.body.replaceChildren();
  delete (window as { tgm?: unknown }).tgm;
  vi.restoreAllMocks();
});

const container = () => {
  const el = document.createElement("div");
  document.body.append(el);
  return el;
};

describe("TgmAd", () => {
  it("has no unit container on the server and hydrates without warnings", async () => {
    const html = renderToString(<TgmAd unit="TGM-HPO-SBR01" className="ad" />);
    expect(html).not.toContain("data-tgm-unit");
    const el = container();
    el.innerHTML = html;
    const errors = vi.spyOn(console, "error");
    await act(async () => {
      root = hydrateRoot(el, <TgmAd unit="TGM-HPO-SBR01" className="ad" />);
    });
    expect(errors).not.toHaveBeenCalled();
    expect(el.querySelectorAll('[data-tgm-unit="TGM-HPO-SBR01"]')).toHaveLength(1);
    expect(el.firstElementChild!.className).toBe("ad");
  });

  it("mounts one container under StrictMode and removes it on unmount", async () => {
    const el = container();
    await act(async () => {
      root = createRoot(el);
      root.render(
        <StrictMode>
          <TgmAd unit="TGM-HPO-SBR01" />
        </StrictMode>,
      );
    });
    expect(el.querySelectorAll("[data-tgm-unit]")).toHaveLength(1);
    act(() => root!.render(<div />));
    expect(el.querySelectorAll("[data-tgm-unit]")).toHaveLength(0);
  });

  it("TgmFloating declares the floating slot", async () => {
    const el = container();
    await act(async () => {
      root = createRoot(el);
      root.render(<TgmFloating unit="TGM-HPO-FLT01" />);
    });
    const unit = el.querySelector<HTMLElement>("[data-tgm-unit]")!;
    expect(unit.dataset.tgmUnit).toBe("TGM-HPO-FLT01");
    expect(unit.dataset.tgmSlot).toBe("floating");
  });
});

describe("TgmScript", () => {
  it("renders the site tag's script", () => {
    const html = renderToString(
      <TgmScript host="tgmads.example.com" property="PROP-1-1" nonce="n1" />,
    );
    expect(html).toContain('src="https://tgmads.example.com/tag.js"');
    expect(html).toContain('data-tgm-property="PROP-1-1"');
    expect(html).toContain('nonce="n1"');
    expect(html).toMatch(/async=""/);
  });
});

describe("TgmProvider", () => {
  it("loads the tag once, after mount (StrictMode included)", async () => {
    const el = container();
    await act(async () => {
      root = createRoot(el);
      root.render(
        <StrictMode>
          <TgmProvider host="tgmads.example.com">
            <TgmAd unit="TGM-HPO-SBR01" />
          </TgmProvider>
        </StrictMode>,
      );
    });
    const scripts = document.querySelectorAll('script[src="https://tgmads.example.com/tag.js"]');
    expect(scripts).toHaveLength(1);
  });
});

describe("useTgmPageview", () => {
  function Router({ path }: { path: string }) {
    useTgmPageview(path);
    return null;
  }

  it("starts a page view when the key changes, not on the first render", async () => {
    const pageview = vi.fn();
    (window as { tgm?: unknown }).tgm = { __tgm: true, pageview };
    const el = container();
    await act(async () => {
      root = createRoot(el);
      root.render(<Router path="/a" />);
    });
    expect(pageview).not.toHaveBeenCalled();
    await act(async () => root!.render(<Router path="/a" />));
    await act(async () => root!.render(<Router path="/b" />));
    expect(pageview).toHaveBeenCalledTimes(1);
  });
});

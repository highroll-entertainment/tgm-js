/**
 * `@terragamingmedia/ads`: the framework-agnostic loader.
 * - `tagScriptAttributes()`: the site tag's `<script>` attributes — `src` on the host, the
 *   property's `data-tgm-*` attributes only when given (the shared CDN host needs them; the
 *   publisher's own host supplies them), `nonce`; the host is a bare hostname;
 * - `loadTag()`: one script per page however often it is called (StrictMode, remounts, an
 *   SSR-rendered `<TgmScript>`), resolves with `window.tgm` once the tag announces `tgm:ready`, and
 *   resolves at once when a live tag is already on the page.
 */
import { afterEach, describe, expect, it } from "vitest";

import { getTgm, loadTag, tagScriptAttributes, type TgmApi } from "../src/index";

type W = Window & { tgm?: TgmApi & { __tgm?: boolean } };

afterEach(() => {
  delete (window as W).tgm;
  document.head.replaceChildren();
  document.body.replaceChildren();
});

const fakeTag = (): TgmApi & { __tgm: boolean } => ({
  __tgm: true,
  version: "test",
  pageview() {},
  refresh() {},
  destroy() {},
  on: () => () => {},
  status: () => ({}) as ReturnType<TgmApi["status"]>,
});

/** What tag.js does when it boots: publish `window.tgm`, then announce it. */
function boot() {
  (window as W).tgm = fakeTag();
  window.dispatchEvent(new CustomEvent("tgm:ready", { detail: { status: "ok" } }));
}

describe("tagScriptAttributes", () => {
  it("is the script on the publisher's own host", () => {
    expect(tagScriptAttributes({ host: "tgmads.example.com" })).toEqual({
      src: "https://tgmads.example.com/tag.js",
      async: "",
    });
  });

  it("carries the ids, the page settings and the nonce when given", () => {
    expect(
      tagScriptAttributes({
        host: "cdn.terramedia-sandbox.com",
        property: "PROP-1-1",
        publisher: "PUB-1",
        inArticle: "TGM-HPO-INART",
        articleSelector: ".post-content",
        spa: "manual",
        floating: "per-pageview",
        cmp: "onetrust",
        nonce: "abc123",
      }),
    ).toEqual({
      src: "https://cdn.terramedia-sandbox.com/tag.js",
      async: "",
      "data-tgm-property": "PROP-1-1",
      "data-tgm-publisher": "PUB-1",
      "data-tgm-in-article": "TGM-HPO-INART",
      "data-tgm-article-selector": ".post-content",
      "data-tgm-spa": "manual",
      "data-tgm-floating": "per-pageview",
      "data-tgm-cmp": "onetrust",
      nonce: "abc123",
    });
  });

  it("accepts a host with a scheme or a trailing slash, and refuses anything else", () => {
    expect(tagScriptAttributes({ host: "https://tgmads.example.com/" }).src).toBe(
      "https://tgmads.example.com/tag.js",
    );
    expect(() => tagScriptAttributes({ host: "tgmads.example.com/x" })).toThrow(/host/);
    expect(() => tagScriptAttributes({ host: "" })).toThrow(/host/);
    expect(() => tagScriptAttributes({ host: 'evil.com"><script>' })).toThrow(/host/);
  });
});

describe("loadTag", () => {
  it("adds one async script with the attributes and resolves when the tag is ready", async () => {
    const pending = loadTag({ host: "tgmads.example.com", spa: "manual" });
    const scripts = document.querySelectorAll("script");
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.src).toBe("https://tgmads.example.com/tag.js");
    expect(scripts[0]!.async).toBe(true);
    expect(scripts[0]!.dataset.tgmSpa).toBe("manual");
    boot();
    await expect(pending).resolves.toBe((window as W).tgm);
    expect(getTgm()).toBe((window as W).tgm);
  });

  it("adds the script once however often it is called", async () => {
    const a = loadTag({ host: "tgmads.example.com" });
    const b = loadTag({ host: "tgmads.example.com" });
    expect(document.querySelectorAll("script")).toHaveLength(1);
    boot();
    expect(await a).toBe(await b);
    await loadTag({ host: "tgmads.example.com" });
    expect(document.querySelectorAll("script")).toHaveLength(1);
  });

  it("reuses a server-rendered site tag", async () => {
    const s = document.createElement("script");
    s.type = "text/plain"; // jsdom must not fetch it
    s.setAttribute("src", "https://tgmads.example.com/tag.js");
    document.head.append(s);
    const pending = loadTag({ host: "tgmads.example.com" });
    expect(document.querySelectorAll("script")).toHaveLength(1);
    boot();
    await expect(pending).resolves.toBe((window as W).tgm);
  });

  it("resolves at once with a live tag", async () => {
    (window as W).tgm = fakeTag();
    await expect(loadTag({ host: "tgmads.example.com" })).resolves.toBe((window as W).tgm);
    expect(document.querySelectorAll("script")).toHaveLength(0);
  });

  it("resolves null when the script fails to load", async () => {
    const pending = loadTag({ host: "tgmads.example.com" });
    document.querySelector("script")!.dispatchEvent(new Event("error"));
    await expect(pending).resolves.toBeNull();
  });
});

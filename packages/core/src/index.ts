/**
 * @terragaming/ads — load the TerraGaming Media ad tag from any JavaScript framework.
 *
 * The tag is the site tag `<script async src="https://<host>/tag.js">`: once per page, however many
 * ad units. On the publisher's verified host (`tgmads.<domain>`) the host is all it needs; on the
 * shared host it also needs the property's ids. Placements are `<div data-tgm-unit="TGM-…">`;
 * the tag finds them, also when they mount later, and follows client-side route changes.
 *
 * Everything here is safe to import on the server: `loadTag()` resolves `null` there.
 * Guide: https://help.terragamingmedia.com/publishers/install/other-frameworks/
 */

export type TgmCmp = "c15t" | "tcf" | "onetrust" | "termly";

export interface TgmOptions {
  /** Your tag host: `tgmads.<your domain>` once verified, else the shared host the portal shows. */
  host: string;
  /** PROP-… — only needed on the shared host. */
  property?: string;
  /** PUB-… — only needed on the shared host. */
  publisher?: string;
  /** Your in-article unit (TGM-…-INART) — only needed on the shared host. */
  inArticle?: string;
  /** The CSS selector of your article body (default: the one set in the portal). */
  articleSelector?: string;
  /** `auto` (default) follows client-side route changes; `manual`: call `pageview()` yourself. */
  spa?: "auto" | "manual";
  /** The floating banner survives route changes (`persist`, default) or not. */
  floating?: "persist" | "per-pageview";
  /** A consent manager that loads after the tag: the tag waits for it (up to 10 s). */
  cmp?: TgmCmp;
  /** CSP nonce for the `<script>`. */
  nonce?: string;
}

export type TgmEvent =
  | "render"
  | "unfilled"
  | "viewable"
  | "close"
  | "decide"
  | "pageview"
  | "remove";

export interface TgmSlotStatus {
  targetId: string;
  adUnitId: string;
  kind: "declared" | "in_article" | "floating";
  state: "filled" | "unfilled";
  format?: string;
  reason?: string;
}

export interface TgmStatus {
  version: string;
  host: string;
  publisherId: string | null;
  propertyId: string | null;
  spa: "auto" | "manual";
  frame: "top" | "friendly" | "unsupported";
  state:
    | "starting"
    | "waiting_for_consent"
    | "running"
    | "gpc"
    | "no_consent"
    | "blocked_environment"
    | "unsupported_frame"
    | "no_host"
    | "destroyed";
  pageViewId: string;
  slots: TgmSlotStatus[];
}

/** `window.tgm`, the tag's API. */
export interface TgmApi {
  version: string;
  /** Start a new page view (manual SPA mode). */
  pageview(): void;
  /** Decide the given placements (DOM ids) again, or every new one. */
  refresh(slotIds?: string[]): void;
  /** Remove every ad and stop the tag. Loading tag.js again starts a fresh one. */
  destroy(): void;
  on(event: TgmEvent, cb: (detail: unknown) => void): () => void;
  status(): TgmStatus;
}

type TgmWindow = Window & { tgm?: TgmApi & { __tgm?: boolean } };

const HOST =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?::\d{1,5})?$/i;

/** The bare hostname (a scheme and a trailing slash are tolerated). */
function normalizeHost(host: string): string {
  const bare = host
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  if (!HOST.test(bare)) throw new Error(`TerraGaming Media: invalid tag host "${host}"`);
  return bare.toLowerCase();
}

const DATA: [keyof TgmOptions, string][] = [
  ["property", "data-tgm-property"],
  ["publisher", "data-tgm-publisher"],
  ["inArticle", "data-tgm-in-article"],
  ["articleSelector", "data-tgm-article-selector"],
  ["spa", "data-tgm-spa"],
  ["floating", "data-tgm-floating"],
  ["cmp", "data-tgm-cmp"],
];

/** The site tag's `<script>` attributes, for frameworks that render it themselves. */
export function tagScriptAttributes(opts: TgmOptions): Record<string, string> {
  const attrs: Record<string, string> = {
    src: `https://${normalizeHost(opts.host)}/tag.js`,
    async: "",
  };
  for (const [key, attr] of DATA) {
    const value = opts[key];
    if (typeof value === "string" && value) attrs[attr] = value;
  }
  if (opts.nonce) attrs.nonce = opts.nonce;
  return attrs;
}

const win = (): TgmWindow | null => (typeof window === "undefined" ? null : window);

/** The live tag, or null (on the server, before it loaded, after `destroy()`). */
export function getTgm(): TgmApi | null {
  const t = win()?.tgm;
  return t && t.__tgm !== false ? t : null;
}

/** Calls `cb` with the tag once it is live (at once if it is). Returns a cancel function. */
export function onTgmReady(cb: (tgm: TgmApi) => void): () => void {
  const w = win();
  if (!w) return () => {};
  const live = getTgm();
  if (live) {
    cb(live);
    return () => {};
  }
  const handler = () => {
    const t = getTgm();
    if (t) cb(t);
  };
  w.addEventListener("tgm:ready", handler, { once: true });
  return () => w.removeEventListener("tgm:ready", handler);
}

/** The pending load per site tag element (StrictMode, remounts and many callers share one). */
const loads = new WeakMap<HTMLScriptElement, Promise<TgmApi | null>>();

/**
 * Adds the site tag once and resolves with the tag when it is ready (null on the server or when
 * the script cannot load). Safe to call any number of times; reuses a server-rendered site tag.
 */
export function loadTag(opts: TgmOptions): Promise<TgmApi | null> {
  const w = win();
  if (!w) return Promise.resolve(null);
  const live = getTgm();
  if (live) return Promise.resolve(live);
  const attrs = tagScriptAttributes(opts);
  const d = w.document;
  let script = [...d.querySelectorAll<HTMLScriptElement>("script[src]")].find(
    (s) => s.getAttribute("src") === attrs.src,
  );
  const pending = script && loads.get(script);
  if (pending) return pending;
  if (!script) {
    script = d.createElement("script");
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "async") script.async = true;
      else script.setAttribute(k, v);
    }
    (d.head ?? d.documentElement).appendChild(script);
  }
  const el = script;
  const load = new Promise<TgmApi | null>((resolve) => {
    const cancel = onTgmReady((tgm) => {
      el.removeEventListener("error", failed);
      resolve(tgm);
    });
    function failed() {
      cancel();
      loads.delete(el);
      resolve(null);
    }
    el.addEventListener("error", failed, { once: true });
  });
  loads.set(el, load);
  return load;
}

/** Proxies that call the live tag (no-ops until it is ready). */
export const tgm: {
  pageview(): void;
  refresh(slotIds?: string[]): void;
  status(): TgmStatus | null;
} = {
  pageview: () => getTgm()?.pageview(),
  refresh: (slotIds) => getTgm()?.refresh(slotIds),
  status: () => getTgm()?.status() ?? null,
};

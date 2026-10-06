/**
 * @terragaming/ads-react — TerraGaming Media ads for React, Next.js, TanStack Start and Remix.
 *
 * - `<TgmScript host="…" />` in the root layout's `<head>` (server-rendered frameworks), or
 *   `<TgmProvider host="…">` around the app (client-only apps): the site tag, once.
 * - `<TgmAd unit="TGM-…" />` wherever an ad goes; `<TgmFloating unit="TGM-…" />` once.
 *   The unit container mounts only in the browser, after hydration, so the tag's iframes never meet
 *   React's hydration; unmounting removes the ad.
 * - Route changes are followed by the tag itself. Manual mode: `spa="manual"` + `useTgmPageview()`.
 *
 * Guide: https://help.terragamingmedia.com/publishers/install/react/
 */
import {
  getTgm,
  loadTag,
  onTgmReady,
  tagScriptAttributes,
  type TgmApi,
  type TgmEvent,
  type TgmOptions,
} from "@terragaming/ads";
import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

export type { TgmApi, TgmEvent, TgmOptions, TgmStatus } from "@terragaming/ads";
export { getTgm, loadTag, tagScriptAttributes } from "@terragaming/ads";

/**
 * The site tag's `<script>`. React 19 hoists it into `<head>` and renders it once however often it
 * appears; React 18 renders it on the server only (add `<TgmProvider>` for client-only apps).
 */
export function TgmScript(props: TgmOptions): ReactElement {
  const attrs = tagScriptAttributes(props);
  const data = Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith("data-")));
  return <script async src={attrs.src} nonce={attrs.nonce} {...data} suppressHydrationWarning />;
}

/** Loads the site tag once after the app mounted (never during server rendering or hydration). */
export function TgmProvider({
  children,
  ...opts
}: TgmOptions & { children?: ReactNode }): ReactElement {
  const key = JSON.stringify(opts);
  useEffect(() => {
    void loadTag(JSON.parse(key) as TgmOptions);
  }, [key]);
  return <>{children}</>;
}

const noop = () => () => {};
/** false on the server and during hydration, true once mounted in the browser. */
const useMounted = (): boolean =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

export interface TgmAdProps {
  /** The ad unit id from the portal, e.g. `TGM-ABC-HRS01`. */
  unit: string;
  className?: string;
  style?: CSSProperties;
}

function Placement({ unit, className, style, slot }: TgmAdProps & { slot?: "floating" }) {
  const mounted = useMounted();
  return (
    <div className={className} style={style} data-tgm-placement="">
      {mounted ? <div key={unit} data-tgm-unit={unit} data-tgm-slot={slot} /> : null}
    </div>
  );
}

/** An ad placement. The same unit may appear any number of times. */
export function TgmAd(props: TgmAdProps): ReactElement {
  return <Placement {...props} />;
}

/** The floating banner: once per page, anywhere (it anchors to the bottom of the screen). */
export function TgmFloating(props: TgmAdProps): ReactElement {
  return <Placement {...props} slot="floating" />;
}

const subscribeReady = (cb: () => void) => onTgmReady(() => cb());

/** The live tag (`window.tgm`), or null until it is ready. */
export function useTgm(): TgmApi | null {
  return useSyncExternalStore(subscribeReady, getTgm, () => null);
}

/** Subscribes to a tag event while mounted. */
export function useTgmEvent(event: TgmEvent, cb: (detail: unknown) => void): void {
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  });
  const tgm = useTgm();
  useEffect(() => tgm?.on(event, (d) => ref.current(d)), [tgm, event]);
}

/**
 * Manual SPA mode (`spa="manual"`): starts a page view when `key` (e.g. the pathname) changes,
 * after the new route rendered — not on the first render, which the tag already counted.
 */
export function useTgmPageview(key: string): void {
  const first = useRef<string | null>(null);
  useEffect(() => {
    if (first.current === null) {
      first.current = key;
      return;
    }
    if (first.current === key) return;
    first.current = key;
    getTgm()?.pageview();
  }, [key]);
}

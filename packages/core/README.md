# @terragaming/ads

Load the [TerraGaming Media](https://terragamingmedia.com) ad tag from any JavaScript framework.
It is SSR-safe and idempotent, and ships its own types. For React and Vue, use
[`@terragaming/ads-react`](https://www.npmjs.com/package/@terragaming/ads-react) or
[`@terragaming/ads-vue`](https://www.npmjs.com/package/@terragaming/ads-vue).

```bash
npm install @terragaming/ads
```

```ts
import { loadTag } from "@terragaming/ads";

// In the browser, once (repeated calls return the same tag; null on the server):
const tgm = await loadTag({ host: "tgmads.example.com" });
```

Place ads with `<div data-tgm-unit="TGM-…"></div>` (ids from the publisher portal). The tag finds
placements mounted later and follows client-side route changes. Render placements only in the
browser, so hydration never sees the tag's iframes.

| Export                                                |                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `loadTag(options)`                                    | Adds the site tag once; resolves with `window.tgm` (or `null`).           |
| `tagScriptAttributes(options)`                        | The `<script>` attributes, for frameworks that render the tag themselves. |
| `getTgm()`, `onTgmReady(cb)`                          | The live tag.                                                             |
| `tgm.pageview()`, `tgm.refresh(ids?)`, `tgm.status()` | Calls into the live tag (manual SPA mode, checks).                        |

Options: `host` (your `tgmads.<domain>`), and on the shared host also `property`, `publisher`,
`inArticle`, `articleSelector`. Optional: `spa` (`"auto"` | `"manual"`), `floating`, `cmp` and
`nonce`.

Guide: https://help.terragamingmedia.com/publishers/install/other-frameworks/

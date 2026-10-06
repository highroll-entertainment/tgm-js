# TerraGaming Media JavaScript SDKs

Load the [TerraGaming Media](https://terragamingmedia.com) ad tag and place ad units from any
JavaScript framework.

| Package | For | |
| --- | --- | --- |
| [`@terragamingmedia/ads`](packages/core) | Any framework (Angular, Svelte, Astro, plain JS) | `loadTag()`, typed `window.tgm` |
| [`@terragamingmedia/ads-react`](packages/react) | React, Next.js, TanStack Start, Remix | `<TgmScript>`, `<TgmProvider>`, `<TgmAd>`, hooks |
| [`@terragamingmedia/ads-vue`](packages/vue) | Vue 3, Nuxt | `createTgm()`, `<TgmAd>`, Nuxt module |

How it works: the **site tag** (`<script async src="https://tgmads.<your domain>/tag.js">`) goes on
every page once, and each **ad unit** is a placement (`<div data-tgm-unit="TGM-…">`, or `<TgmAd>`).
The tag follows client-side route changes and placements mounted later by itself. The components
mount their containers only after hydration, so the ad iframes never cause a hydration mismatch.

Publisher guides: https://help.terragamingmedia.com/publishers/install/react/ ·
https://help.terragamingmedia.com/publishers/install/vue/ ·
https://help.terragamingmedia.com/publishers/install/other-frameworks/

## Development

```bash
pnpm install
pnpm build && pnpm typecheck && pnpm test
```

Node 20+, pnpm 11. Releases: add a changeset (`pnpm changeset`); the release workflow publishes
merged changesets to npm.

## Licence

MIT — see [LICENSE](LICENSE).

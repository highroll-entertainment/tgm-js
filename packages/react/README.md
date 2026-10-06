# @terragamingmedia/ads-react

[TerraGaming Media](https://terragamingmedia.com) ads for React, Next.js, TanStack Start and Remix.

```bash
npm install @terragamingmedia/ads-react
```

```tsx
// Root layout (<head>): the site tag, once
import { TgmScript } from "@terragamingmedia/ads-react";
<TgmScript host="tgmads.example.com" />;

// Anywhere an ad goes
import { TgmAd, TgmFloating } from "@terragamingmedia/ads-react";
<TgmAd unit="TGM-ABC-HRS01" />;
<TgmFloating unit="TGM-ABC-GMA01" />;
```

- `<TgmScript>` renders the site tag (React 19 hoists and dedupes it). For client-only apps, wrap
  the app in `<TgmProvider host="…">` instead.
- `<TgmAd>` mounts its container after hydration, so there are no hydration mismatches. Unmounting
  removes the ad, and a unit may repeat on a page. In-article ads are automatic.
- Route changes are detected by the tag. For manual mode, use `spa="manual"` with
  `useTgmPageview(pathname)`.
- Hooks: `useTgm()`, `useTgmEvent(event, cb)`, `useTgmPageview(key)`.
- CSP: pass `nonce`.

Guide: https://help.terragamingmedia.com/publishers/install/react/

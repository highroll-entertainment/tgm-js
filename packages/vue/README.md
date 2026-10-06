# @terragaming/ads-vue

[TerraGaming Media](https://terragamingmedia.com) ads for Vue 3 and Nuxt.

```bash
npm install @terragaming/ads-vue
```

**Nuxt**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@terragaming/ads-vue/nuxt"],
  tgm: { host: "tgmads.example.com" }, // or NUXT_PUBLIC_TGM_HOST
});
```

**Vue**

```ts
import { createTgm } from "@terragaming/ads-vue";
app.use(createTgm({ host: "tgmads.example.com" }));
```

```vue
<TgmAd unit="TGM-ABC-HRS01" />
<TgmFloating unit="TGM-ABC-GMA01" />
```

The site tag loads once the app has mounted. `<TgmAd>` mounts its container in the browser only,
and unmounting removes the ad. Route changes are detected by the tag; `useTgm().pageview()` is for
manual mode.

Guide: https://help.terragamingmedia.com/publishers/install/vue/

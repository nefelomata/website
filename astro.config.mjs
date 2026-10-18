// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Where the site lives: the custom domain from the CNAME file, served from the root.
// To preview it under GitHub's own URL instead, set SITE_URL=https://nefelomata.github.io and BASE_PATH=/website.
const site = process.env.SITE_URL ?? 'https://nefelomata.com';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: {
    // Small stylesheets go inline, so the first paint never waits on a CSS request.
    inlineStylesheets: 'auto',
  },
});

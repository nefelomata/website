// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Where the site lives. GitHub Pages serves this repo at nefelomata.github.io/website/.
// With a custom domain, set SITE_URL=https://yourdomain.com and BASE_PATH=/ (or edit the defaults).
const site = process.env.SITE_URL ?? 'https://nefelomata.github.io';
const base = process.env.BASE_PATH ?? '/website';

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

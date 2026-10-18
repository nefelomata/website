# Nefeli Koumantaki — personal website

Film production and copywriting portfolio. Built with [Astro](https://astro.build): every page is plain, pre-rendered HTML, so search engines and screen readers see all the content, and the site works with JavaScript turned off. The animations and toys are layered on top.

## What's on it

| Scene | Section | Notes |
| --- | --- | --- |
| SC.01 | Opening titles | Name, and a portrait on a camera monitor with shallow depth of field: the focus box follows the pointer and only what's inside it is sharp |
| SC.02 | Cold open | The "Oh. I didn't see you there." note, in a night sky. Two cloud banks cover it as it scrolls in and part when it reaches the middle (nefeli is Greek for cloud) |
| SC.03 | Filmography | One card per film, each with its own page at `/work/<film>/` |
| SC.04 | Chapters | Copywriting, campaigns and ideas, told as a book. Each chapter has its own page at `/chapters/<chapter>/` |
| SC.05 | About | Paragraph that lights up word by word, plus quick facts |
| SC.06 | The pitch | "Why me?" in four reasons |
| SC.07 | The long version | Clapperboard that downloads the CV |
| SC.08 | Call sheet | Email, links, and a little booking form that writes the email for you |

The whole site sits inside a camera monitor: corner frame lines, REC and timecode, the menu as camera tabs, the current scene, a focus-distance scale that moves as you scroll, and a white balance switch (3200K night / 5600K day) that changes the theme. Edges of the screen blur like a lens.

Focus and blur are the house style: headings rack into focus as they reach the middle of the screen, sections focus-pull in, the About paragraph sharpens word by word, hovering one film or chapter throws the others out of focus, and key words get camera AF brackets.

Also: clouds rising behind "That's a wrap." in the footer, film grain, a viewfinder cursor, page transitions that dip to black, a runtime counter, and a 404 page.

## Editing content

You never need to touch the layout to change the words.

- **Contact details, CV, page title and description:** `src/data/site.ts`
- **Films:** one Markdown file per film in `src/content/films/`. The top block (frontmatter) holds the title, role, year, logline, still and duties; the text below it is the story on the film's page. Stills go in `src/assets/films/`.
- **Chapters:** one Markdown file per chapter in `src/content/chapters/`. Copy `spec-idea-template.md` to start a new one.
  - `order` sets the position (and the roman numeral). `label: Prologue` overrides the numeral.
  - `line:` is the headline or tagline you wrote. It gets the big pull-quote treatment, so use it whenever you can.
  - `cover:` and `coverAlt:` add an image (put it in `src/assets/`).
  - `draft: true` keeps a chapter off the live site; it still shows in `npm run dev` with a Draft tag.
  - Story beats are just `## The setup`, `## The plot`, `## The twist`, `## The moral` headings. Use whichever you like.
- **CV:** replace `public/nefeli-koumantaki-cv.pdf` (keep the name, or change `cv` in `src/data/site.ts`).
- **Portrait:** replace `src/assets/portrait.jpg`, then run `node scripts/make-images.mjs` to rebuild the social share image and icons.
- **Clouds:** generated, not photographed. `node scripts/make-clouds.mjs` re-renders them into `src/assets/clouds/` (change the seeds for different shapes).
- **Colours:** the purple brand colour and the sky live at the top of `src/styles/global.css` (`--accent`, `--sky-1` to `--sky-3`), once for 3200K and once for 5600K.
- **Hero, About, Pitch text:** `src/pages/index.astro`.

## Run it locally

Needs Node 22.22 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:4321/website/. `npm run build` makes the production site in `dist/`, `npm run preview` serves that build, and `npm run check` type-checks everything.

## Publish

The workflow in `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`. One-time setup: repository **Settings → Pages → Source: GitHub Actions**. The site then lives at https://nefelomata.github.io/website/.

### Custom domain

When there's a domain (say `nefelikoumantaki.com`):

1. Add it in **Settings → Pages → Custom domain** and point the DNS at GitHub Pages.
2. In `astro.config.mjs`, change the defaults to `site = 'https://nefelikoumantaki.com'` and `base = '/'`.

## SEO, accessibility, performance

- Static HTML for every page, a sitemap (`sitemap-index.xml`), `robots.txt`, canonical URLs.
- Open Graph and Twitter cards on every page; film pages use their own still as the share image.
- Structured data (JSON-LD): `Person` on the home page, `Movie` on film pages, `CreativeWork` on chapters, plus breadcrumbs.
- Images are converted to AVIF and WebP at several sizes and lazy-loaded below the fold.
- Fonts are sans-serif only (Inter, plus JetBrains Mono for the camera readouts) and self-hosted: no requests to Google, nothing to block.
- Semantic landmarks, a skip link, visible focus, keyboard-friendly accordions and radio buttons, alt text on every image, and `prefers-reduced-motion` turns the motion and blur effects off.

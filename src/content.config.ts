import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One Markdown file per film in src/content/films/.
const films = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/films' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // English title for films with a Greek one, shown under it.
      aka: z.string().optional(),
      order: z.number(),
      role: z.string(),
      format: z.string(),
      // Numbers are fine too: 2026 becomes "2026".
      year: z.coerce.string(),
      made: z.string(),
      shoot: z.string().optional(),
      logline: z.string(),
      still: image(),
      stillAlt: z.string(),
      duties: z.array(z.string()).default([]),
    }),
});

// One Markdown file per chapter in src/content/chapters/.
// Chapters with `draft: true` show up in `npm run dev` only, never on the live site.
const chapters = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chapters' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number(),
      // "Prologue", "Epilogue", or leave empty to get a roman numeral from `order`.
      label: z.string().optional(),
      client: z.string(),
      role: z.string(),
      // Numbers are fine too: 2026 becomes "2026".
      year: z.coerce.string(),
      format: z.string(),
      logline: z.string(),
      // The actual line: a headline, a tagline, a script opener. Optional but it is the best part.
      line: z.string().optional(),
      link: z.object({ href: z.url(), text: z.string() }).optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { films, chapters };

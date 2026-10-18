# Nefeli Koumantaki — personal website

A single-page site (six pages: home, note, why me, film work, CV, contact) in one file: `index.html`. No build step, no dependencies besides Google Fonts.

## Edit
- Contact details, film list (titles, roles, years, descriptions, stills) and the CV file live in the `CONFIG` and `FILMS` blocks near the top of the `<script>`.
- The "Why me" text and the note on page 2 are plain HTML in `index.html`.
- Photos and the CV are embedded in the file as base64, so the page is fully self-contained.

## Run locally
Open `index.html` in a browser.

## Publish (GitHub Pages)
Repository Settings → Pages → Deploy from a branch → `main` / root.

# MastersonMarketingAI.com

Plain static HTML and CSS, served by a Cloudflare Worker (static assets) connected
to this repo through Workers Builds. **A merge to `main` publishes to the live site.**
Work on a branch.

## Layout

| Path | What it is |
|---|---|
| `index.html`, `nonprofits.html`, `businesses.html`, `work.html`, `about.html` | Pages |
| `privacy.html`, `terms.html` | Legal pages |
| `styles.css` | The one stylesheet. Colour and type tokens are at the top. |
| `assets/` | Web-ready images, icons, and self-hosted fonts |
| `_headers` | Security and cache headers |
| `wrangler.jsonc` | Worker config: name `autumn-union-b85a`, assets served from the repo root |
| `.assetsignore` | Files that must never be served (all `.md`, `source/`, dotfiles) |
| `source/` | Raw logos and old page versions. Never served. |

The header and footer are copied into every page by hand. If you change one, change
all seven.

## Editing notes

- Links are clean URLs (`/work`, not `work.html`). Cloudflare serves `work.html` at `/work`.
- `styles.css` is cached for a week. Images for 30 days, fonts for a year.
- Amber marks one thing per page. Blue is for links and focus only.
- Only the proof numbers approved in the brief may appear on the site.

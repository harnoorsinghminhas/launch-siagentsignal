# SI Agent Signal (siagentsignal.com)

Live site, served by GitHub Pages at https://siagentsignal.com/. Static files only: no build step, no dependencies, no secrets.
Launched October 3, 2026 as a Founders' Preview: everything is pre-launch, including Free, and unfinished parts say "coming".
DNS and HTTPS are already set; the `CNAME` file keeps the custom domain, so do not delete it (and keep it without a trailing newline).

## Files
| File | What it is |
|---|---|
| `index.html` | The page: My Brief hub, sign-up, plans, the live "On air" hour, Stylebook, network. |
| `assets/app.css`, `assets/app.js` | Styling (the brand tokens are the `:root` block at the top) and the page's behaviour. |
| `img/`, `audio/opener.mp3` | Alien art, the signal mark, and the sample 60-second brief (labelled as a dated sample on the page). |
| `assets/hourly.js` + `assets/live.css` | The live "this hour" bulletin and the "Launched" line (see below). Same files on every SI site. |
| `assets/logo.svg` | PLACEHOLDER text wordmark: the logo slot (see "How to swap the logo"). |
| `launching-soon.html`, `assets/launching-soon/` | The old "Launching soon" rocket page, archived (not linked, not indexed). |
| `404.html` | Not-found page in the site's own style. Uses root-absolute paths because Pages serves it at the missing URL. |
| `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml` | Pages plumbing. Keep them. |

## How to swap the logo (one place)
The logo is a single image in the page header of `index.html` (and of `404.html`):

```html
<img class="logo" id="logo" src="assets/logo.svg" width="..." height="38" alt="SI Agent Signal">
```

1. **Same file name (easiest).** Replace `assets/logo.svg` with your logo saved as an SVG. Nothing else changes.
2. **PNG or another name.** Put the file in `assets/` (for example `assets/logo.png`) and change that one tag in `index.html`: set `src="assets/logo.png"`,
   keep `height` at 38 and set `width` to the logo's width at that height (width = 38 x logo width / logo height). Keep the `alt` text.
   Do the same in `404.html` (its path starts with a slash: `/assets/logo.png`).
3. Use a logo that reads on the header background: light (white).
4. Commit and push to `main`; GitHub Pages republishes in about a minute. The favicon (`img/mark-a.png` or the inline icon) is a separate file.

## The live hour
`assets/hourly.js` fetches https://media.theagentsignal.com/ironman/audio/si-preview/hourly/latest.json (public, CORS `*`) on load and every 5 minutes.
It fills the elements marked `data-hr="..."` with the five labelled stories (Confirmed / Reported / Still open, each with a "Source: outlet" credit),
the headline ticker, the tidbit, the audio player and the "Updated N min ago" line. Everything is written with `textContent`; a story without a known label
is dropped; story links must be `https`; the audio must come from `media.theagentsignal.com`. If the fetch fails the page shows a calm "warming up" note.
The page's content-security policy allows that one host in `connect-src` and `media-src`.

## Sign-up
The email boxes post to `https://acp9reat3l.execute-api.us-east-1.amazonaws.com/signal/request-link` with `site` = `siagentsignal.com`. The API must list this origin in its CORS allow-list.
Payment buttons are the build's preview buttons: no live checkout is connected yet and no payment is taken. Do not switch test and live mode from here.

## Notes
- The content-security policy is a `<meta>` tag in `index.html` (Pages cannot set headers). If you add anything external, add its host there.
- External links open in a new tab. No street address appears anywhere on the site.

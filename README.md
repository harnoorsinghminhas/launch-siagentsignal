# siagentsignal.com

Static site served by GitHub Pages. The custom domain is set in `CNAME`; do not delete it.

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

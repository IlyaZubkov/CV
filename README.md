# Ilya Zubkov — CV

The main CV and project roadmap are plain HTML. Edit those pages to update the
website and PDF content together.

## Build and verify

Requires Node.js 22 or later.

```sh
npm ci
npx playwright install chromium
npm run build
npm test
```

The build creates the deployable site in `dist/` and a selectable-text A4 CV in
`output/pdf/Ilya-Zubkov-CV.pdf`. Open the built site through a local HTTP server
to test the download. Generated files and browser screenshots are ignored by Git.

GitHub Actions builds and checks the site on pushes to `main`, then deploys only
`dist/` to GitHub Pages. The PDF must generate successfully before publishing.

For an existing installed browser, set `PLAYWRIGHT_CHANNEL=msedge` or `chrome`.

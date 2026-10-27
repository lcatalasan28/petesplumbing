# Pete's Plumbing demo

Unofficial static rebuild of [petes-plumbing.com](https://www.petes-plumbing.com) for preview only. It is not the business's site. Every page is `noindex`, and `robots.txt` disallows crawling.

Version 1.0.0.

## Scripts

```bash
npm install
npm test
npm run dev
VITE_STATIC_DEMO=1 VITE_BASE=/ npm run build
```

`VITE_STATIC_DEMO=1` skips the lead send and opens `/thank-you/`. Without that flag, the contact and estimate forms post to `lito.catalasan@mail.grokbot.com` through FormSubmit. `VITE_BASE` is the Vite `base` path.

`vercel.json` sets `X-Robots-Tag: noindex` and the static-demo build command. This repo does not create a Vercel project, environment, DNS record, or domain.

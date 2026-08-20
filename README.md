# bhorda-web

Cloudflare Workers site for [Gayatri Kamdhenu Sevatirth, Bhorda](https://sevatirthbhorda.org) — bilingual English / Gujarati.

- Product requirements: [`PRD.md`](./PRD.md)
- Infrastructure setup: [`SETUP.md`](./SETUP.md)
- GitHub: [`github.com/codinghorrr/bhorda-web`](https://github.com/codinghorrr/bhorda-web)

```bash
npm install
cp .env.example .env
npm run dev
```

`GET /health` returns `{ "status": "ok" }` when the Worker is running.

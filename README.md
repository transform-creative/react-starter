# Transform Creative — React Starter

Bootstrap template for React + Supabase + Vercel projects. Ships with Stripe checkout, react-email transactional templates, image moderation, fluid CSS tokens, and a Vitest baseline.

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture, conventions, and "replace before shipping" checklist.

## New project setup

```bash
git clone https://github.com/transform-creative/react-starter.git my-project
cd my-project
rm -rf .git && git init
cp .env.example .env.local
npm install
npm run dev
```

Then push to a new repo:

```bash
git remote add origin https://github.com/transform-creative/my-project.git
git add . && git commit -m "Initial commit"
git push -u origin main
```

## Daily commands

```bash
npm run dev              # Vite + React Router dev server
npm run typecheck        # React Router typegen + tsc
npm run lint             # ESLint
npm run test             # Vitest
npm run build            # Production build
npm run email            # react-email preview at http://localhost:3000
```

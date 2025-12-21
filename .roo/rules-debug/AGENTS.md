# Project Debug Rules (Non-Obvious Only)

- Extension logs appear in "Extension Host" output channel, not Debug Console
- Chrome extension dev server runs via nodemon - check `nodemon.chrome.json` for config
- Database operations require `pnpm --filter @sassy/db` prefix, not from root
- tRPC context creation fails silently without proper headers - check `createTRPCContext` usage
- Environment variables must use `with-env` prefix or scripts fail with "not found" errors
- Prisma engine copying happens in postinstall - if missing, Next.js serverless functions fail
- Turbo cache conflicts: run `pnpm clean:workspaces` when build outputs seem stale
- LinkedIn scraping requires specific API keys - check `APIFY_LINKEDIN_ACTOR_ID` and `APIFY_API_TOKEN`

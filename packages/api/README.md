# SSH into the server and see logs

ssh engagekit
pm2 logs 0
to see full logs
cd ~/.pm2/logs
tail -1000 start-error.log

# How to redeploy server from main branch

## Full Deployment (Recommended)
Use this for all deployments - it's fast and handles everything:

```bash
ssh engagekit
cd engagekit.io
pnpm api:deploy
```

This automatically:
- Switches to Node 22
- Pulls latest code from main
- Runs `pnpm install` (triggers `db:generate` via postinstall hook)
- Restarts PM2
- Shows logs

## Quick Restart (code changes only - for testing)
Only use this when you've changed source code in `packages/api/src/` and know there are no dependency/schema changes:

```bash
ssh engagekit
cd engagekit.io
git fetch
git checkout origin/main
pm2 restart 0
pm2 logs 0
```

# Check if the server is running

```bash
pm2 status
# or
pm2 list
```

# Verify PM2 configuration

To see what PM2 is actually running:

```bash
pm2 show 0
```

This shows:
- **script path**: Should be `/root/engagekit.io/packages/api/start.sh`
- **exec cwd**: Working directory `/root/engagekit.io/packages/api`
- **exec mode**: Should be `fork_mode`
- **node.js version**: Currently shows `N/A` (using Bun instead)

To check the start script contents:
```bash
cat /root/engagekit.io/packages/api/start.sh
```

Should show:
```bash
TLS_KEY=/root/cert/key.pem TLS_CERT=/root/cert/cert.pem PORT=443 NODE_ENV=production bun --env-file=../../.env run ./src/server.ts
```

# How the deploy script works

The `pnpm api:deploy` command:

1. **In root package.json**: `"api:deploy": "pnpm --filter @sassy/api api:deploy"`
   - Delegates to the api package

2. **In packages/api/package.json**: `"api:deploy": "./deploy.sh"`
   - Runs the bash deployment script

3. **deploy.sh** does:
   - Navigates to repo root
   - Switches to Node 22 (`fnm use 22`)
   - Pulls latest code (`git fetch && git checkout origin/main`)
   - Runs `pnpm install` (triggers postinstall hook)
   - Restarts PM2 (`pm2 restart 0`)
   - Shows logs (`pm2 logs 0`)

4. **Postinstall hook** (in root package.json):
   - Runs `pnpm db:generate` (generates Prisma client)
   - Copies Prisma query engine to Next.js folder

5. **PM2 restart**: Kills old process and re-runs `start.sh`

6. **start.sh**: Starts Bun with the new code from disk

# Pass Phrase

"Engagekit1234:)"

# Check the commit version the server is running

```bash
ssh engagekit
cd engagekit.io
git status
git log -1  # Show latest commit
```

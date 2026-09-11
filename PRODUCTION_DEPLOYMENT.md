# MemoryLab Production Deployment

This document describes how to update the production deployment at `https://memorylab.teach.cs.toronto.edu/`.

The production application is hosted on `vm009`. Each team member connects using their own assigned account, while the live application files and backend process are currently managed under the `lilymeng` account.

## 1. Connect to the Production VM

Connect using your assigned VM account:

```bash
ssh <your_username>@memorylab.teach.cs.toronto.edu
```

Verify that you are on the correct machine:

```bash
whoami
hostname
pwd
```

The hostname should be:

```text
vm009
```

Check that your account has permission to run deployment commands:

```bash
sudo -l
```

If your account does not have sudo access, contact the project maintainer or system administrator before continuing.

## 2. Update the Production Repository

The production repository is located at:

```text
/home/lilymeng/memory-model-editor
```

Check that the repository is clean before updating:

```bash
sudo -u lilymeng git -C /home/lilymeng/memory-model-editor status
```

The working tree should be clean. If there are unexpected local changes, do not continue until they have been reviewed.

Fetch the latest changes from GitHub:

```bash
sudo -u lilymeng git -C /home/lilymeng/memory-model-editor fetch origin
```

Check whether production is behind `origin/dev`:

```bash
sudo -u lilymeng git -C /home/lilymeng/memory-model-editor status
```

Optional: review the commits that will be deployed:

```bash
sudo -u lilymeng git -C /home/lilymeng/memory-model-editor log --oneline HEAD..origin/dev
```

Press `q` to exit the Git log pager.

Pull the latest `dev` branch:

```bash
sudo -u lilymeng git -C /home/lilymeng/memory-model-editor pull --ff-only origin dev
```

Using `--ff-only` prevents an unexpected merge commit from being created on the production VM.

Verify the update:

```bash
sudo -u lilymeng git -C /home/lilymeng/memory-model-editor status
sudo -u lilymeng git -C /home/lilymeng/memory-model-editor log -1 --oneline
```

The repository should now be clean and up to date with `origin/dev`.

## 3. Install Dependencies and Build

### Backend

Install backend dependencies and rebuild the compiled backend:

```bash
sudo -u lilymeng bash -lc 'cd /home/lilymeng/memory-model-editor/backend && npm install && npm run build'
```

The backend build runs TypeScript compilation and should complete without errors.

### Frontend

Install frontend dependencies and build the production frontend:

```bash
sudo -u lilymeng bash -lc 'cd /home/lilymeng/memory-model-editor/frontend && npm install && npm run build'
```

The frontend build is written to:

```text
/home/lilymeng/memory-model-editor/frontend/build
```

Nginx serves this directory directly, so nginx normally does not need to be restarted after a frontend build.

## 4. Import Questions

Run this step only when question data has changed.

Before importing, verify that the backend is using the production environment:

```bash
sudo -u lilymeng bash -lc 'cd /home/lilymeng/memory-model-editor/backend && grep -E "^(NODE_ENV|DATABASE_URL)=" .env 2>/dev/null | sed "s#DATABASE_URL=.*#DATABASE_URL=[REDACTED]#"'
```

The output should include:

```text
DATABASE_URL=[REDACTED]
NODE_ENV=production
```

Import the questions:

```bash
sudo -u lilymeng bash -lc 'cd /home/lilymeng/memory-model-editor/backend && npm run import-questions'
```

This command clears and re-imports the question tables from the JSON question files.

A successful import ends with:

```text
Successfully imported all questions
```

Do not run this step for deployments that do not change question data.

## 5. Restart the Backend

The production backend is managed by PM2 under the `lilymeng` account.

Restart the backend:

```bash
sudo -u lilymeng pm2 restart backend
```

Check the process status:

```bash
sudo -u lilymeng pm2 list
```

The `backend` process should show:

```text
online
```

The backend listens on port `3001`.

## 6. Verify the Deployment

Open:

`https://memorylab.teach.cs.toronto.edu/`

Do a hard refresh and verify that:

- The site loads successfully.
- The latest UI changes are visible.
- Questions load correctly.
- New or updated questions appear if `npm run import-questions` was run.
- Answer checking and submission still work.

You can also check the site from the VM:

```bash
curl -I https://memorylab.teach.cs.toronto.edu/
```

Finally, confirm that the backend is still online:

```bash
sudo -u lilymeng pm2 list
```

## Production Architecture

The current production setup is:

| Component | Production Setup |
| --- | --- |
| Repository | `/home/lilymeng/memory-model-editor` |
| Branch | `dev` |
| Frontend | `/home/lilymeng/memory-model-editor/frontend/build` |
| Web server | nginx |
| Backend | `node dist/index.js` |
| Backend port | `3001` |
| Process manager | PM2 |
| PM2 application | `backend` |
| Production URL | `https://memorylab.teach.cs.toronto.edu/` |

Nginx serves the frontend build directly and proxies backend API requests to `localhost:3001`.

## Quick Update Reference

For a standard deployment after changes have already been merged into `dev`:

```bash
ssh <your_username>@memorylab.teach.cs.toronto.edu

sudo -u lilymeng git -C /home/lilymeng/memory-model-editor status
sudo -u lilymeng git -C /home/lilymeng/memory-model-editor fetch origin
sudo -u lilymeng git -C /home/lilymeng/memory-model-editor pull --ff-only origin dev

sudo -u lilymeng bash -lc 'cd /home/lilymeng/memory-model-editor/backend && npm install && npm run build'
sudo -u lilymeng bash -lc 'cd /home/lilymeng/memory-model-editor/frontend && npm install && npm run build'

# Only if question data changed
sudo -u lilymeng bash -lc 'cd /home/lilymeng/memory-model-editor/backend && npm run import-questions'

sudo -u lilymeng pm2 restart backend
sudo -u lilymeng pm2 list
```

## Notes

- Do not run `npm audit fix` or `npm audit fix --force` during a normal deployment.
- Do not restart nginx unless its configuration has changed.
- Do not pull if the production repository contains unexpected local changes.
- Do not use `git reset`, force-push, or create merge commits on the production VM unless the branch state has been reviewed first.

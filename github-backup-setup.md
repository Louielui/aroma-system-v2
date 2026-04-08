# GitHub Backup Setup for `aroma-system-v2`

I reviewed the current repository and prepared it for a safe GitHub backup workflow without pushing automatically.

| Area | Current state | Notes |
| --- | --- | --- |
| Git repository | Present | `.git/` exists and the project is already a Git repo |
| Current branch | `main` | Suitable as the primary branch |
| Current remote | `origin` points to an internal S3-style backup remote | This means `origin` is already occupied and should be renamed or replaced before using GitHub as the main remote |
| Working tree | **Not clean yet** | There are many modified and untracked project files waiting to be committed |
| `.gitignore` | Present and mostly good | I added `.manus-logs/` so sandbox logs stay out of Git |
| Dependencies | Ignored | `node_modules/` is already ignored |
| Webdev artifacts | Ignored | `.webdev/` and `client/public/__manus__/version.json` are ignored |

## What I changed

I made one minimal housekeeping update only.

| File | Change |
| --- | --- |
| `.gitignore` | Added `.manus-logs/` to keep sandbox log files out of the repository |

## Important observation before connecting GitHub

The repository is **not yet in a clean commit state** because it contains many modified and untracked files. That is normal for your current development stage, but before using GitHub as a reliable restore point, you should make one explicit local backup commit.

Because the current local Git identity is configured as `Manus <dev-agent@manus.ai>`, I recommend that **you set your own Git name and email before creating the backup commit**, so the history reflects your ownership.

## Recommended setup sequence

The safest approach is to keep the existing internal remote for now, rename it to something explicit, and then add GitHub as the new `origin`.

| Step | Purpose |
| --- | --- |
| 1 | Set your own Git identity locally in this project |
| 2 | Review repo status |
| 3 | Rename the existing `origin` to `manus-origin` |
| 4 | Create a new empty GitHub repository |
| 5 | Add the GitHub repo as the new `origin` |
| 6 | Stage and commit the current project state |
| 7 | Push to GitHub manually |

## Step-by-step instructions

### 1) Open GitHub and create a new empty repository

Create a new repository in your GitHub account. I recommend these settings:

| Setting | Recommended value |
| --- | --- |
| Repository name | `aroma-system-v2` |
| Visibility | Private |
| Initialize with README | **No** |
| Add `.gitignore` | **No** |
| Add license | Optional, usually **No** for now |

Keep the repository empty so it can accept this existing local Git history cleanly.

### 2) Run these commands inside the project folder

Replace the placeholder values before running.

```bash
cd /home/ubuntu/aroma-system-v2

# Optional but strongly recommended: use your own identity for this repo
# Replace with your actual name and GitHub email
git config user.name "YOUR NAME"
git config user.email "your-email@example.com"

# Confirm current status
git status --short --branch

# Rename the current internal remote so GitHub can become the main origin
# If you prefer, you can skip this and use a different remote name for GitHub,
# but using GitHub as origin is cleaner for long-term backup.
git remote rename origin manus-origin

# Add your GitHub repository as the new origin
# Replace GITHUB_USERNAME and REPO_NAME
# HTTPS option:
git remote add origin https://github.com/GITHUB_USERNAME/REPO_NAME.git

# Verify remotes
git remote -v

# Stage everything that should be backed up
git add .

# Review exactly what will be committed
git status

# Create a local backup commit
git commit -m "Backup current project state before next development phase"

# Push manually to GitHub
# If this is the first push, set upstream
git push -u origin main
```

## SSH alternative

If your machine is already set up for GitHub SSH, use this instead of the HTTPS `git remote add` command.

```bash
cd /home/ubuntu/aroma-system-v2

git config user.name "YOUR NAME"
git config user.email "your-email@example.com"

git remote rename origin manus-origin
git remote add origin git@github.com:GITHUB_USERNAME/REPO_NAME.git
git remote -v
git add .
git status
git commit -m "Backup current project state before next development phase"
git push -u origin main
```

## If a commit says there is nothing to commit

That means your working tree is already clean, which is good. In that case, run only the remote commands and push.

```bash
cd /home/ubuntu/aroma-system-v2

git config user.name "YOUR NAME"
git config user.email "your-email@example.com"

git remote rename origin manus-origin
git remote add origin https://github.com/GITHUB_USERNAME/REPO_NAME.git
git remote -v
git push -u origin main
```

## If you want to keep the current `origin` unchanged

If you do not want to rename the existing internal remote, add GitHub under another name such as `github`.

```bash
cd /home/ubuntu/aroma-system-v2

git config user.name "YOUR NAME"
git config user.email "your-email@example.com"

git remote add github https://github.com/GITHUB_USERNAME/REPO_NAME.git
git remote -v
git add .
git status
git commit -m "Backup current project state before next development phase"
git push -u github main
```

That works, but I still recommend using GitHub as `origin` because it simplifies future backup habits.

## Recommended future backup workflow

For this project, the simplest reliable pattern is to commit after every meaningful milestone and push the same day.

| When | What to do |
| --- | --- |
| Before a risky refactor | Commit current working state first |
| After a completed phase | Commit with a phase-based message |
| End of each work session | Push to GitHub |
| Before changing infrastructure or routing | Commit and push first |

A good lightweight workflow is:

```bash
cd /home/ubuntu/aroma-system-v2

git status
git add .
git commit -m "Describe the completed change clearly"
git push
```

## Suggested commit message style

| Situation | Example |
| --- | --- |
| Backup snapshot | `backup: snapshot before logistics phase 3` |
| Feature completion | `feat: refine internal transfer partial fulfillment flow` |
| Bug fix | `fix: restore logistics access control typing` |
| Planning docs | `docs: add logistics phase 2 planning spec` |
| Safe checkpoint before experiment | `chore: checkpoint before external pickup implementation` |

## Practical restore strategy

If the sandbox breaks later, the recovery path becomes straightforward: recreate or reopen a clean environment, clone the GitHub repository, install dependencies, and continue from the last pushed commit.

```bash
git clone https://github.com/GITHUB_USERNAME/REPO_NAME.git
cd REPO_NAME
pnpm install
pnpm run check
pnpm run dev
```

This gives you a restore point outside the sandbox, which is exactly what you want for continuity.

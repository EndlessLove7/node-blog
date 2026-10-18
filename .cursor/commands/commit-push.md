---
description: Review changes, commit them, pull remote updates, and push the current branch
---

Review the Git worktree, then commit, pull remote changes, and push the current branch.

1. Inspect `git status --short --branch`, the staged and unstaged diffs, and all untracked file names. Do not print or expose secret file contents.
2. Stop and ask me what to include if there are no changes, changes appear to belong to unrelated tasks, the intended scope is unclear, or any secret, credential, `.env` file, generated artifact, or unexpectedly large/binary file may be included. Never include `.env`, credentials, private keys, or other secrets.
3. Do not proceed on `main` or `master`. Do not change branches. Confirm a push remote is configured.
4. Run the relevant project checks based on the changed files and available package scripts. If a check fails, report the failure and stop without committing or pushing.
5. Stage only the reviewed paths using explicit path names; never use `git add .` or `git add -A`. Include pre-staged changes only when they clearly belong to this same task. Review the complete staged diff and stop to ask me if anything is unexpected or sensitive.
6. Create a concise Conventional Commit message that describes the changes. Do not amend existing commits.
7. After committing, determine whether the current branch has an upstream. If it does, pull with `git pull --rebase`. If not, check whether `origin` has a branch with the current branch's name; if so, pull with `git pull --rebase origin <current-branch>`. If that remote branch does not exist, there is nothing to pull: continue to publish the branch in step 9. Never merge unrelated branches or change branches.
8. If the pull reports conflicts or fails, stop immediately and report the actual error and how to resolve it. Preserve the commit and working tree; do not reset, clean, stash, abort the rebase, or silently discard changes.
9. Once the pull succeeds, push to the current branch's upstream. If there is no upstream but `origin` is configured, publish the current branch with `git push -u origin HEAD`. Never force-push.
10. If commit or push fails, report the actual error and stop. Do not reset, clean, stash, rewrite history, or silently discard changes.
11. Report the commit hash, commit message, remote branch, and checks run.

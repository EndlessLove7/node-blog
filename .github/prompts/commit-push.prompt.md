---
name: commit-push
description: Review changes, commit them, pull remote updates, and push the current branch
argument-hint: Review and commit the intended current changes
agent: agent
---

Review the Git worktree, then commit, pull remote changes, and push the current branch.

1. Inspect `git status --short --branch`, staged and unstaged diffs, and untracked file names. Do not print or expose secret file contents.
2. Stop and ask me what to include if there are no changes, changes appear unrelated, the intended scope is unclear, or a secret, credential, `.env` file, generated artifact, or unexpectedly large/binary file may be included. Never include `.env`, credentials, private keys, or other secrets.
3. Do not proceed on `main` or `master`. Do not change branches. Confirm a push remote is configured.
4. Run relevant project checks based on the changed files and available package scripts. If a check fails, report the failure and stop without committing or pushing.
5. Stage only reviewed paths by explicit path names; never use `git add .` or `git add -A`. Include pre-staged changes only when they clearly belong to this task. Review the complete staged diff and stop to ask me if anything is unexpected or sensitive.
6. Create a concise Conventional Commit message describing the changes. Do not amend existing commits.
7. After committing, determine whether the current branch has an upstream. If it does, pull with `git pull --rebase`. If not, check whether `origin` has a branch with the current branch's name; if so, pull with `git pull --rebase origin <current-branch>`. If that remote branch does not exist, there is nothing to pull: continue to publish the branch in step 9. Never merge unrelated branches or change branches.
8. If the pull fails or reports conflicts, stop and report the actual error and how to resolve it. Preserve the commit and working tree; do not reset, clean, stash, abort the rebase, or silently discard changes.
9. Once the pull succeeds, push to the current branch's upstream. If no upstream is configured but `origin` exists, publish with `git push -u origin HEAD`. Never force-push.
10. If commit or push fails, report the actual error and stop. Do not reset, clean, stash, rewrite history, or silently discard changes.
11. Report the commit hash, commit message, remote branch, pull result, and checks run.

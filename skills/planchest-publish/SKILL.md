---
name: planchest-publish
description: Publish a design repo to Cloudflare Pages behind Cloudflare Access - the current library from main on every merge, plus a temporary visual diff report for every pull request, linked in a PR comment and deleted when the PR closes. Use when the user wants the design repo online, a site that updates when main changes, or a diff preview on each PR.
---

# Publish a design repo

Two things go online, on two Cloudflare Pages projects, both behind Cloudflare Access:

| What | Project | Updated by | Address |
|---|---|---|---|
| The library as it is on `main` | `<name>`, connected to the GitHub repo | Cloudflare, on every push to `main` | a custom domain, e.g. `design.example.com` |
| The `planchest diff` report of each PR | `<name>-pr`, Direct Upload | GitHub Actions, on `pull_request` only | `https://pr-<number>.<name>-pr.pages.dev/`, deleted when the PR closes |

They are separate projects so that branch pushes never deploy, each has its own access rule, and a redirect on the main project's `pages.dev` address cannot swallow the preview addresses.

You write files in the repo and walk the user through the rest. Dashboard settings, the API token and GitHub secrets are the user's to enter: never ask for a token's value or type one anywhere. If the user asks you to click through the dashboard in a browser, you may, but stop at anything that needs a token, a password or a payment.

## Before you start

Confirm with the user, one question at a time where the repo does not answer it:

- the GitHub repository, and that the user can add Actions secrets to it;
- the project name `<name>` (default: the repo name, lowercase, letters, digits and hyphens);
- the custom domain, which must be a zone on the same Cloudflare account;
- who may view: email addresses, an email domain, or members of the Cloudflare account;
- whether PR summaries should be written by Claude in CI (needs an `ANTHROPIC_API_KEY` or a `CLAUDE_CODE_OAUTH_TOKEN` secret and costs up to $1 per run), or the report alone is enough.

## Part 1: the library on main

1. **Give the repo an entry page.** Without `index.html` at the root the site answers 404. Write one that loads only `system/tokens/tokens.css` and links the root documents and every `system/components/*/examples.html`, `system/patterns/*/*.html`, and each product's equivalents. Relative links only. Add a line to `AGENTS.md` (Working here) saying to update it when a page is added. Check every link exists.
2. **Create the project.** Workers & Pages → Create → the **Pages** tab → Connect to Git → the repo. If the user lands on a Workers screen that asks for a deploy command such as `npx wrangler deploy`, they are in the wrong flow: go back and pick Pages. Settings: production branch `main`, framework preset none, build command empty, build output directory `/`.
3. **Stop branch builds.** Project → Settings → Builds → Branch control → Preview branch: **None**. Automatic production deployments stay on. A commit whose message contains `[CF-Pages-Skip]` is not deployed.
4. **Add the custom domain.** Project → Custom domains → Set up a domain.
5. **Protect it.** Zero Trust → Access controls → Applications → Create new application → Self-hosted → add the custom domain as a public hostname, with a policy for the viewers agreed above.
6. **Close the `pages.dev` address.** `<name>.pages.dev` cannot be deleted and Access on the custom domain does not cover it. Redirect it: the account-level **Bulk redirects** page (`https://dash.cloudflare.com/?to=/:account/bulk-redirects`; it is not under a zone's Rules menu) → Create Bulk Redirect List → source `<name>.pages.dev`, target `https://<custom domain>`, status 301, with Preserve query string, Subpath matching, Preserve path suffix and Include subdomains → then create a Bulk Redirect Rule from the list and Save and Deploy.
7. **Check.** After the entry page reaches `main`: `curl -sI https://<custom domain>/` answers 302 to `<team>.cloudflareaccess.com`, and `curl -sI https://<name>.pages.dev/` answers 301 to the custom domain. A 404 behind the login usually means `main` has no `index.html` yet.

## Part 2: a diff preview for every pull request

1. **Create the preview project.** The user runs, after `npx wrangler login` if needed:

   ```sh
   npx wrangler pages project create <name>-pr --production-branch=main
   ```

   Nothing is ever deployed to its production branch, so `https://<name>-pr.pages.dev/` stays empty (522). That is expected.
2. **Protect it before the first PR.** Project `<name>-pr` → Settings → General → Preview access → enable. This creates an Access application for `*.<name>-pr.pages.dev` allowing members of the Cloudflare account; widen its policy in Zero Trust if others review. Check: `curl -sI https://pr-1.<name>-pr.pages.dev/` answers 302 to the Access login, even before any deployment.
3. **Create the API token.** My Profile → API Tokens → Create Token → Custom token, permission **Account · Cloudflare Pages · Edit**, limited to this account.
4. **Add the GitHub secrets.** Repo → Settings → Secrets and variables → Actions: `CLOUDFLARE_API_TOKEN` (the token), `CLOUDFLARE_ACCOUNT_ID` (the 32-character id in any dashboard URL). Optionally `ANTHROPIC_API_KEY`, or `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token`.
5. **Add the workflow.** Copy `pr-diff-preview.yml` from this skill's directory to `.github/workflows/pr-diff-preview.yml` in the design repo. Set `PAGES_PROJECT` to `<name>-pr` and `PLANCHEST_REF` to `v` plus the output of `planchest --version`. Translate the PR comment lines to the working language in `AGENTS.md`; leave the rest.
6. **Document it.** Add a Publish section to the repo's `README.md` with both projects, their settings from the two tables above, the secrets, and the addresses, so the next person does not have to rediscover them.
7. **Try it.** Commit on a branch and open a PR. The workflow runs on that PR itself. When it finishes, the PR has one comment with the link and the page counts; the link asks for the Access login and then shows the report. Closing the PR deletes its deployments and edits the comment to say so.

## What the workflow does

- Triggers on `opened`, `reopened` and `synchronize`, so the preview follows new commits; remove `synchronize` only if the user wants one preview per PR. `closed` runs the cleanup.
- Side A is `git merge-base origin/<base> HEAD`, so the report shows what the PR changes, like GitHub's Files changed.
- Planchest is checked out at `PLANCHEST_REF` into the git-ignored `.planchest/tool`; nothing is added to the design repo.
- With a Claude secret, Claude Code follows steps 2 to 4 of `planchest-diff` and writes `summary.html`; the step may fail without blocking the deployment.
- The comment carries the marker `<!-- planchest-diff -->` and is edited in place on every run.
- PRs from forks are skipped, because they do not get the secrets.

## Don't

- Don't deploy previews to the main project, or turn its Preview branch back on.
- Don't open a PR before Preview access is enabled on `<name>-pr`; until then the report is public.
- Don't switch the trigger to `pull_request_target`: it would run the PR's code with the secrets.
- Don't commit `.planchest/`, the report, or the Planchest tool into the design repo.
- Don't claim the site or a preview works without the `curl` checks above.

---
name: arenapay-release
description: Prepare and verify ArenaPay changes for promotion from the private ArenaPay-Dev repository to the public ArenaPay repository. Use for release preparation, public synchronization, version publication, or questions about which ArenaPay repository should receive changes.
---

# ArenaPay Release

Treat `C:\nexus\dev\ArenaPay` (`hvaler/ArenaPay-Dev`) as the development source and `C:\nexus\dev\ArenaPay-Public-Seed` (`hvaler/ArenaPay`) as the public release clone.

Read `docs/guias/flujo-desarrollo-y-publicacion.md` before preparing a public release. Preserve these invariants:

- Never merge the two repositories or push the private `main` branch directly to the `public` remote. Their histories are intentionally separate.
- Develop, test, document, commit, and push ordinary work only to `origin` in ArenaPay-Dev.
- When the user does not supply a version, fetch the public tags, identify the latest semantic version, inspect the release diff, and propose the next version with a short reason. Do not require the user to know it. For the pre-1.0 project, use a patch for compatible fixes or release-worthy documentation, a minor for new functionality or an explicitly described incompatible MVP change, and `1.0.0` only when the production-readiness criteria are deliberately met.
- Do not create a release for every private commit. Recommend waiting when the accumulated changes do not form a coherent public delivery.
- Promote a reviewed snapshot by running `node src/scripts/prepare-public-release.mjs` and then `node src/scripts/prepare-public-release.mjs --apply` from the private root.
- Review the complete diff in ArenaPay-Public-Seed after preparation. Treat any unexpected file, credential, private note, personal data, or generated output as a release blocker.
- Run the checks appropriate to the change before public publication. Do not describe an old test result as current.
- Never let the preparation script commit, tag, push, deploy, rewrite history, or force-push.
- Present the proposed version and clean public diff before changing version files or creating release metadata. If public publication has not already been authorized for the current task, stop there and request authorization for the version update, commit, push, tag, release, or deployment that remains.
- After a public push, verify the Vercel deployment from `main`. Publish GitHub Pages and Cloudflare only when their corresponding artifacts changed, then record exact evidence.

For a question about repository choice without a release request, explain the model directly and do not mutate either repository.

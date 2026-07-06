---
name: android-ci-eas
description: Use when working on Sloth's Android build pipeline, the GitHub Actions workflow, eas-cli local builds, build profiles, artifact upload, or build timeouts.
---

# Android CI/CD via EAS (Sloth)

Use this skill for anything touching `.github/workflows/dev-build-android.yml`,
`eas.json`, build profiles, or Android build timeouts.

## How the pipeline actually works

- The workflow (`dev-build-android.yml`) runs on push to `main` (only when
  `package.json`, `app.json`, `bun.lock`, or the workflow file itself changes),
  on pull requests into `main`, and on manual `workflow_dispatch`.
- A `check-skip` job gates the whole pipeline on the latest commit message **not**
  containing `[skip ci]` — respect this when writing commits for build-triggering changes.
- The actual build command is:
  ```
  eas build --platform android --profile staging --local --non-interactive --output=./app-dev.apk
  ```
    - **`--local`** means the build runs **on the GitHub Actions runner itself**, using
      the runner's own Android/Node toolchain — it is *not* dispatched to EAS's cloud
      build infrastructure. Don't assume cloud build behavior (e.g. remote build queues,
      EAS-hosted build images) applies here.
    - **`--profile staging`** is a **debug/staging** build, not a production release
      build. The output is explicitly named `app-dev.apk` — this is for internal testing,
      not a Play Store artifact.
    - Authentication is via `EXPO_TOKEN` (an Expo access token secret), not a
      username/password login.
- Native toolchain versions (JDK, NDK, CMake, Gradle) are **not pinned by hand** in this
  workflow — they come from whatever `eas.json`'s `staging` profile / the local Android
  SDK on `ubuntu-latest` resolves to. Don't add manual JDK/NDK/CMake `setup-*` steps
  unless a build is actually failing on a version mismatch; check `eas.json` first.
- `bun` is the only package manager used in CI (`oven-sh/setup-bun`, then
  `bun install` and `bun add --global eas-cli`) — mirror this in local dev instructions,
  don't suggest `npm ci` as an equivalent.

## Credentials & keystore — handled by EAS, not the repo

- **There is no manual keystore file in this repo's build path.** Signing credentials
  for the `staging` profile are managed by EAS (either EAS-managed remote credentials,
  or a `credentials.json` referenced by `eas.json` — check `eas.json` for which). Do
  **not** add a checked-in `keystores/debug.keystore`, a `keytool`-generation step, or
  any manual signing config to this workflow — that would duplicate/conflict with what
  EAS already does.
- If a build fails on signing/credentials, the fix is almost always in `eas.json` or the
  EAS project's credentials configuration (`eas credentials`), not in the GitHub Actions
  YAML.
- `EXPO_TOKEN` must remain a GitHub Actions secret (`secrets.EXPO_TOKEN`) — never hardcode
  it or log it.

## Artifacts

- Build output (`app-dev.apk`) is uploaded via `actions/upload-artifact@v7` with a
  **7-day retention**. If a task needs longer retention or a different artifact name,
  change it explicitly rather than assuming the default is fine for a new use case
  (e.g. release distribution).

## Environment quirks worth knowing

- `NODE_OPTIONS: --openssl-legacy-provider` is set globally and again with
  `--max_old_space_size=4096` at build time. If a Node/OpenSSL-related build error shows
  up, check whether this flag combination is still correct for the current Node version
  on `ubuntu-latest` before adding a different workaround on top.

## Build timeouts

- Job timeout is **50 minutes** (`timeout-minutes: 50`). If a build starts hitting this,
  raise it further only after checking whether the `--local` build is doing unnecessary
  work (e.g. cache misses) rather than reflexively bumping the number.
- `bun`'s package cache is already restored via `actions/cache@v6` keyed on
  `bun.lock` — if builds are slow, verify this cache is actually hitting before adding a
  second caching layer.

## Checklist for a CI/build change

- [ ] Change expressed in `eas.json` (build profile) or the workflow YAML — not a new
  manual Gradle/keystore step
- [ ] No checked-in keystore or `keytool` step introduced — credentials stay EAS-managed
- [ ] `--profile staging` / `--local` semantics not silently changed to a cloud or
  production-profile build without the user asking for that
- [ ] `EXPO_TOKEN` still sourced from `secrets.EXPO_TOKEN`
- [ ] `[skip ci]` convention still respected if the change affects commit messages in CI docs
- [ ] If touching timeout/caching: confirmed the `bun` cache is hitting before adding
  new caching complexity

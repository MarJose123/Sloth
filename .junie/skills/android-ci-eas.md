---
name: android-ci-eas
description: Use when working on Android CI/CD, GitHub Actions workflows, eas-cli builds, SDK versions, Bun pinning, or build timeouts.
---

# Android CI/CD via EAS (Sloth)

## How the pipeline works

Command: `eas build --platform android --profile staging --local --non-interactive`

- Builds **on the GH Actions runner** (`--local`), not EAS cloud
- **Debug/staging APK** (`app-dev.apk`) for internal testing
- Triggered on: push to `main` (when package.json/app.json/bun.lock/workflow changes), PRs to `main`, manual dispatch
- Gated by `[skip ci]` commit message convention

## Versions (pinned, don't drift)

| Component | Where | Version |
|---|---|---|
| Android SDK | `app.json` | 36 |
| Build tools | `app.json` | 36.0.0 |
| Min SDK | `app.json` | 31 |
| Bun | `eas.json` | 1.3.14 |
| EAS CLI | `eas.json` | >= 20.5.1 |

## Credentials

**EAS manages signing**, not the repo. No keystore file, no keytool step. If signing fails, check `eas.json` / `eas credentials`, not the workflow.

## Artifacts

- Output: `app-dev.apk`
- Retention: 7 days (via `actions/upload-artifact`)
- Cache: bun cache already wired (actions/cache on `bun.lock`)

## Checklist

- [ ] No manual Gradle/keystore steps added
- [ ] SDK/Bun/CLI versions not pinned in workflow (they live in config files)
- [ ] `EXPO_TOKEN` sourced from `secrets.EXPO_TOKEN`
- [ ] `[skip ci]` convention respected in docs
- [ ] Cache confirmed hitting before adding more layers

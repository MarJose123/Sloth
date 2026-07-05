# Contributing to Sloth

Thanks for your interest in Sloth — a privacy-first, fully offline personal finance tracker.

## License terms you're agreeing to

Sloth is licensed under **GPLv3**. By submitting a contribution (PR, patch, or otherwise), you agree that:

- Your contribution is licensed under GPLv3, same as the rest of the project.
- You have the right to submit the code (it's your own work, or you have permission to relicense it under GPLv3).
- Any fork or derivative of Sloth — including yours — must remain open source under GPLv3 or a compatible license. This isn't optional; it's the whole point of the license choice. If you're building a fork or a commercial product on top of Sloth's code, your source must be made available to your users under the same terms.

We don't require a CLA (Contributor License Agreement) or copyright assignment. You keep copyright on your contributions; you're just licensing them under GPLv3 alongside everyone else's.

## Ground rules

1. **No network calls, ever.** This is non-negotiable and the core product decision. Sloth does not talk to any server, does not sync, does not phone home for analytics, crash reports, or anything else. If your PR adds a `fetch`, `axios`, socket connection, or any remote endpoint (including "just for telemetry"), it will be rejected regardless of how useful it is.
2. **On-device processing only.** Receipt OCR, categorization, and any future ML/heuristic features must run locally on the device. Don't introduce cloud vision APIs, cloud LLM calls, or any SDK that phones home.
3. **Encryption stays intact.** Don't touch the SQLCipher/op-sqlite encryption-at-rest setup without discussion in an issue first. Don't add a code path that writes unencrypted financial data to disk, logs, or crash reporters.
4. **Match the existing stack.** React Native + Expo, op-sqlite (SQLCipher), NativeWind, lottie-react-native. If you want to introduce a new dependency, open an issue first — every added dependency is a bigger attack surface and audit burden for a privacy-focused app.
5. **Android-first.** The app currently targets Android; iOS is a future goal. Don't add iOS-only assumptions (notch-based safe areas, iOS-specific auth flows) without gating them appropriately.

## Before you open a PR

- Open an issue first for anything non-trivial (new feature, architecture change, new dependency). Bug fixes and small polish PRs can skip this.
- Keep PRs scoped to one thing. A PR that fixes a bug and refactors an unrelated component will get asked to split.
- Run the app on a physical Android device if your change touches biometrics, camera/OCR, or file import — emulator behavior for these diverges from real hardware often enough to matter.
- Include a short note in the PR description on how you tested it.

## What to work on

Check open issues labeled `good first issue` or `help wanted`. Feature requests and bug reports both come in through GitHub issues (see the in-app "Request a feature" / "Report an error" links, which just deep-link to issue templates).

## Code style

- TypeScript strict mode; no `any` without a comment explaining why.
- Match existing formatting (Prettier config in the repo — run it before committing).
- Prefer explicit over clever. This is a financial app; a reviewer should be able to follow the money-handling logic without guessing.

## Questions

Open a GitHub Discussion or issue. There's no Discord/Slack — keeping everything on GitHub keeps the project's own footprint as minimal and transparent as the app it builds.

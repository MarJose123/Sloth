# Sloth

A private, fully offline personal finance tracker.

No cloud. No sync. No bank credential sharing. No account to create anywhere but on your own device. Sloth stores everything locally in an encrypted SQLite database and never talks to a server — because it doesn't have one.

## Why

Most finance apps ask you to hand over your bank login to a third party so they can "aggregate" your data — which really means it now lives on someone else's servers, subject to someone else's breach history, business model, and terms of service. Sloth takes the opposite approach: your transactions never leave your phone.

## Features

- **Manual entry, receipt scan, or file import** — never bank-login aggregation
- **On-device OCR** for receipt scanning (no cloud vision API)
- **Local categorization** via a lightweight keyword/Bayesian classifier — no data leaves the device to "learn" from your spending
- **Encrypted at rest** — SQLite via op-sqlite + SQLCipher
- **Biometric lock** (Face/Touch ID) with a 6-digit PIN fallback
- **Multi-account support** — checking, savings, credit, cash, with custom logos/colors
- **CSV / XSLX import** for bulk-loading bank exports, parsed entirely on-device
- **Manual export** — your data, your backup, on your terms

## Tech stack

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)
- [op-sqlite](https://github.com/OP-Engineering/op-sqlite) with SQLCipher for encrypted local storage
- [NativeWind](https://www.nativewind.dev/) for styling
- [lottie-react-native](https://github.com/lottie-react-native/lottie-react-native) for onboarding and key-screen animations
- [Bun](https://bun.sh/) as the package manager / runtime

Currently developed **Android-first**; iOS support is a future target.

## Project status

Sloth is in active development. A full 16-screen mockup covering onboarding, dashboard, accounts, transactions, categories, settings, receipt scanning, and CSV/OFX import has been designed and approved; implementation is ongoing.

## Contributing

Bug reports and feature requests are welcome via [GitHub Issues](https://github.com/MarJose123/sloth/issues). See [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a PR — it covers the project's non-negotiables (no network calls, on-device-only processing, encryption must stay intact) and what the license means for contributions.

## License

Sloth is licensed under the **GNU General Public License v3.0 (GPLv3)** — see [LICENSE](./LICENSE).

In short: you're free to use, study, modify, and share Sloth. If you distribute a modified version — a fork, a rebrand, a build with your own features — you must also make your source available under GPLv3. Forks stay open. That's intentional: a tool built around financial privacy shouldn't itself be a closed box, and we want that to hold for anything built on top of it too.

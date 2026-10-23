# Friction Log

Developer context: solo developer, Apple Silicon MacBook (macOS Sequoia 15.7), new to React Native and Fire TV / Vega. Building an AI fitness coach for the Fire TV track (Vega OS), with Amazon Bedrock for coaching.

Severity: 🔴 blocker · 🟡 slowed me down · 🟢 minor / polish

---

## 2026-10-01: Choosing a Fire TV platform and test target

- **Task:** Figure out whether to build for Fire OS or Vega OS, and whether I can test without hardware.
- **Steps:** Read the hackathon resources page, the Vega docs and the starter repos.
- **Expected:** One page explaining Fire OS vs Vega OS, which one to pick for a new app, and how to test on a Mac without a device.
- **Actual:** I had to piece this together from the release notes, a blog post, the install docs and the READMEs of several sample repos. Sources disagree on whether the Vega Virtual Device on Apple Silicon supports React Native apps or only WebView apps.
- **Severity:** 🟡
- **Workaround:** Read the sample repos' scripts (e.g. `vega:vvd:mseries`) to infer support.
- **Suggestion:** Add a "Start here: Fire OS vs Vega OS" decision page with a platform/simulator support matrix, linked from the hackathon resources page.

## 2026-10-01: Vega SDK prerequisites are incomplete in the install guide

- **Task:** Prepare a Mac for the Vega SDK.
- **Steps:** Followed https://developer.amazon.com/docs/vega/0.24/install-vega-sdk.html.
- **Expected:** A complete list of prerequisites.
- **Actual:** The 0.24 macOS guide says "Node 18.x or later", while other pages say Node 18–20. The guide doesn't mention Java, though other sources list Java 21+. Eight Homebrew packages were missing on a fresh dev machine. Homebrew's `openjdk@21` is keg-only and needs a manual `sudo ln -sfn` before `java` is found.
- **Severity:** 🟡
- **Workaround:** Installed `openjdk@21` with Homebrew and symlinked it. Used fnm to pin Node 20 for the project.
- **Suggestion:** Give a single, versioned prerequisite table (Node range, Java version, disk, brew packages) and a `vega doctor`-style check command.

## 2026-10-01: Installer is interactive by default

- **Task:** Install the SDK from a coding agent or a non-TTY shell.
- **Steps:** Ran `curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash`.
- **Expected:** A documented non-interactive flag.
- **Actual:** The script supports `NONINTERACTIVE=true`, but I only found it by reading the 1,900-line script. In that mode it also silently skips installing the Vega Studio VS Code extension.
- **Severity:** 🟢
- **Workaround:** `NONINTERACTIVE=true bash get_vvm.sh`.
- **Suggestion:** Document `NONINTERACTIVE` (and an opt-in for the extension) in the install guide. AI coding agents increasingly run these installs.

## 2026-10-01: Flagship starter sample lags the current SDK

- **Task:** Pick a starter for a new Vega app on SDK 0.24.
- **Steps:** Cloned `AmazonAppDev/react-native-multi-tv-app-sample` (latest commit Sep 29 2026) and read `apps/vega/package.json`.
- **Expected:** The recommended "comprehensive starter" targets the current SDK's React Native version (0.83, per the 0.24 release notes).
- **Actual:** The Vega app is pinned to `react-native 0.72.0` / React 18.2. It uses `build-kepler` scripts and `kepler-*` package names, while the docs now say "Vega". I had to check the release notes to confirm 0.72 is still supported (it is: "React Native 0.72 remains supported").
- **Severity:** 🟢
- **Workaround:** Start on 0.72 as the sample does. Migrate later only if needed (https://developer.amazon.com/docs/vega/0.24/rn-migration).
- **Suggestion:** Put a "targets RN x.y / SDK z" badge on each sample README. Finish the Kepler → Vega rename in sample scripts and package names, or explain the alias.

## 2026-10-01: Starter sample doesn't build out of the box on SDK 0.24

- **Task:** Build `react-native-multi-tv-app-sample` for the Vega Virtual Device.
- **Steps:** `yarn install` → `yarn build:all` → `yarn build:vega:debug` (as in the README), with Node 20 and SDK 0.24.12112.
- **Expected:** A `.vpkg` I can run on the VVD.
- **Actual:** Three separate failures, one after another:
  1. `yarn build:all` fails with Yarn 4: `workspaces foreach` now needs `-A`/`--all` (`Invalid option schema: missing at least one property from "all", "recursive", "since", or "worktree"`).
  2. The Vega build fails with `[Reanimated] Babel plugin exception: Cannot find module '@babel/plugin-transform-template-literals'`. `@amazon-devices/react-native-reanimated` has peer dependencies that `apps/vega` doesn't declare. Yarn printed warnings at install time, but they were easy to miss among the other peer warnings.
  3. After fixing that, `vega build` refused the package: `Missing [os.version].target. A Vega application must declare its OS version.` This is a new 0.24 requirement the sample's `manifest.toml` doesn't meet. To its credit, the error message tells you the exact fix command.
- **Severity:** 🟡 (about 20 minutes, and a newcomer without an AI assistant could easily get stuck on #2)
- **Workaround:** Added `@babel/plugin-transform-arrow-functions`, `@babel/plugin-transform-shorthand-properties` and `@babel/plugin-transform-template-literals` as devDependencies of `apps/vega`. Ran `vega project update-manifest --os-version 1.2 --os-min 1.2`. Built and launched on the VVD (aarch64) successfully.
- **Suggestion:** Run CI on the flagship samples against each new SDK release, add the missing peer deps, and update `manifest.toml`. Consider having `vega build` print the update-manifest fix *before* compiling, so it fails fast. Happy to open a PR with these fixes.

## 2026-10-01: `vega platform doctor` dumps the entire shell environment

- **Task:** Find which Vega OS versions to target.
- **Steps:** Ran `vega platform doctor`.
- **Expected:** SDK/OS/toolchain diagnostics.
- **Actual:** It prints *every* environment variable, which included a session token from my terminal tooling. Developers routinely paste doctor output into forum posts, so this could leak AWS keys, API tokens and so on.
- **Severity:** 🟡 (security hygiene)
- **Workaround:** Don't paste doctor output publicly without scrubbing it.
- **Suggestion:** Allowlist the relevant variables (PATH, KEPLER_SDK_PATH, NODE, JAVA_HOME…) or redact names that match `*TOKEN*|*KEY*|*SECRET*`. Separately, there's no `vega platform list` / `vega sdk os-versions` command to discover valid `--os-version` values. I found `1.2` only from the dry-run default.

## 2026-10-01: `vega build` rewrites a tracked `manifest.toml`

- **Task:** Make a clean, reviewable PR to `react-native-multi-tv-app-sample` with the fixes above.
- **Steps:** Edited `apps/vega/manifest.toml`, ran `yarn build:vega:debug`, then `git diff`.
- **Expected:** The build leaves source files alone.
- **Actual:** The build (KMMB, per the `update-manifest` output: "SDK package module entries are regenerated at build time") inserted 14 `[[needs.module]]` entries and about 14 blank lines into the committed manifest, under the `## Offers` comment header. `buildinfo.json` (tracked in the sample) is also modified on every build. Any contributor who builds before committing ends up with noisy, misleading diffs.
- **Severity:** 🟡
- **Workaround:** Ran `git checkout` on the manifest and re-applied only the intended edits after building.
- **Suggestion:** Write generated module entries to a build-output copy of the manifest, not the source file. Otherwise document that the file is generated, and gitignore `buildinfo.json` in samples.

## 2026-10-01: `vega project update-manifest` inserts entries in the wrong section

- **Task:** Add the required `[os.version]` to an existing, well-commented manifest.
- **Steps:** `vega project update-manifest --os-version 1.2 --os-min 1.2`.
- **Expected:** `[[needs.module]] /com.amazon.vega.os@IVega_1_2` placed with the other `needs` entries.
- **Actual:** It was appended under the `## Offers` header comment. That's valid TOML, but it reads as an "offers" entry to humans and reviewers.
- **Severity:** 🟢
- **Workaround:** Moved it by hand.
- **Suggestion:** Insert after the last existing `[[needs.*]]` entry, or print the snippet and let the developer place it.

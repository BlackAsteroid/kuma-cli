## [1.0.1](https://github.com/BlackAsteroid/kuma-cli/compare/v1.0.0...v1.0.1) (2026-03-18)

### 🐛 Bug Fixes

* kuma upgrade now installs from npm instead of GitHub source ([e066fd1](https://github.com/BlackAsteroid/kuma-cli/commit/e066fd1213e18a90ece4814985df4521898c49b6))

## 1.0.0 (2026-03-18)

### 🚀 Features

* add logout command + fix tsconfig moduleResolution ([acba98d](https://github.com/BlackAsteroid/kuma-cli/commit/acba98d8993716a8b73a53a9532be6454c7702e2))
* add monitors update command + editMonitor client method ([b927ee2](https://github.com/BlackAsteroid/kuma-cli/commit/b927ee27e6bde4704861759c348905d42a57af99))
* agent-compatible JSON mode (--json flag + KUMA_JSON env var) ([925beba](https://github.com/BlackAsteroid/kuma-cli/commit/925beba3c39bbb4fa5c5eef0f7647ac1e01a311d)), closes [#17](https://github.com/BlackAsteroid/kuma-cli/issues/17)
* improve --help output with Quick Start, examples, and better descriptions ([7627984](https://github.com/BlackAsteroid/kuma-cli/commit/7627984c885c2ee548c02fa1fcf89281f6cd37d4)), closes [#16](https://github.com/BlackAsteroid/kuma-cli/issues/16)
* initial kuma-cli scaffold ([cfb77bf](https://github.com/BlackAsteroid/kuma-cli/commit/cfb77bfbcd34aa46b612db77660ab15f3de0cbd3))
* kuma upgrade self-update command ([f50dbd4](https://github.com/BlackAsteroid/kuma-cli/commit/f50dbd40b0d5cd97990ab426c3dfa7ea58ef7a94)), closes [#15](https://github.com/BlackAsteroid/kuma-cli/issues/15)
* monitors update with --active/--no-active flags and full object fetch ([a9ee7a3](https://github.com/BlackAsteroid/kuma-cli/commit/a9ee7a3e84902077994a9334f3bf7e0588777017))

### 🐛 Bug Fixes

* add files field to package.json to include dist/ in npm install ([4774860](https://github.com/BlackAsteroid/kuma-cli/commit/4774860ed722ae94763c519f08b007af48f04fc0))
* add prepare script so npm install from GitHub builds dist/ ([80b797a](https://github.com/BlackAsteroid/kuma-cli/commit/80b797a1cb06a6e91ffb7ea2b94222bd4291ee88))
* buffer heartbeatList/uptime events on connect for reliable monitor status ([5068ed6](https://github.com/BlackAsteroid/kuma-cli/commit/5068ed6f6fefe1598fe64e705aad3ab2c2ef5916))
* bundle all deps into dist for global install support ([ab01f68](https://github.com/BlackAsteroid/kuma-cli/commit/ab01f68212f7b1d218e6df22324b8365482ec196))
* getMonitorList now waits for heartbeatList/uptime push events ([6f83e4a](https://github.com/BlackAsteroid/kuma-cli/commit/6f83e4aba76a4e94180639cf86d46d8486720783))
* heartbeat and status-pages timeouts (BUG-01, BUG-02) ([78f74ff](https://github.com/BlackAsteroid/kuma-cli/commit/78f74ffedb0c669cff9c79289d08c1d051a1a1b0))
* resolve BUG-01 through BUG-04 from Jawad's QA report ([de00991](https://github.com/BlackAsteroid/kuma-cli/commit/de00991a43aba0b0e957fc0eafa74bbb2c81f9bd))

### 📚 Documentation

* full command reference in README ([4d66ca1](https://github.com/BlackAsteroid/kuma-cli/commit/4d66ca18e6e3c96e620a2f09970dcc09d2aa43a9))
* humanize README prose ([dd26387](https://github.com/BlackAsteroid/kuma-cli/commit/dd2638735e9d391bd4ea2045cd37fb164f9605f6))

# Changelog

All notable changes to this project will be documented in this file.

This file is generated automatically by [semantic-release](https://github.com/semantic-release/semantic-release).
Do not edit it manually.

# crankshaft

## Steam client plugin manager and framework

Crankshaft lets you install and create plugins to add more functionality to your Steam client.

[![builds.sr.ht status](https://builds.sr.ht/~avery/crankshaft.svg)](https://builds.sr.ht/~avery/crankshaft?)

## Usage

See installation instructions at [crankshaft.space](https://crankshaft.space/).

## Development

Crankshaft requires the following dependencies:

- [Go](https://go.dev/)
- [Yarn](https://yarnpkg.com/)
- [js-beautify](https://github.com/beautify-web/js-beautify)
- [libappindicator-gtk3](https://launchpad.net/libappindicator)

Crankshaft on Windows requires the following dependencies:
- [Go](https://go.dev/doc/install)
- [Yarn](https://yarnpkg.com/getting-started/install)
- [NodeJS](https://nodejs.org/en/download/)
- [js-beautify](https://github.com/beautify-web/js-beautify)
- ['Make' via Chocolatey](https://stackoverflow.com/a/54086635/2616233)

To set up your development environment:

- Clone this repo: `git clone https://git.sr.ht/~avery/crankshaft`
- Set up Git commit hooks: `make configure-git-hooks`
- Install Javascript dependencies: `make install-js-deps`
- Compile and run Crankshaft: `make run`

## Distribution

Currently, Crankshaft is only distributed as a Flatpak. Crankshaft is [available on Flathub](https://flathub.org/apps/details/space.crankshaft.Crankshaft).

To create a new Flatpak release:

- Bump the version number in [build/build.go](build/build.go)
- Add a new releases to the releases section in the [Appstream metadata](desktop/space.crankshaft.Crankshaft.metainfo.xml)
	- Add release notes, you can generate a list of commits since the previous version to help:
	- `git log --pretty=format:'%s' $(git describe --tags --abbrev=0)..HEAD`
	- Validate the metadata: `flatpak run --env=G_DEBUG=fatal-criticals org.freedesktop.appstream-glib validate desktop/space.crankshaft.Crankshaft.metainfo.xml`
- Commit these changes
- Create a tag for the new version
  - `git tag -a X.Y.Z`
  - In the message, paste the release notes you made earlier
- Push your commit and tag to `main`
- Update the archive URL and checksum in the Flatpak manifest
- Push the manifest change and wait for it to be built and released
- Release new version of @crankshaft/types NPM package
  - `make api-extractor`
  - `cd injected/crankshaft-types`
  - `yarn publish --access public`
  	- Bump version number to match new Crankshaft version
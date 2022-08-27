//go:build !dev

package inject

import (
	_ "embed"
)

// When in release mode, these scripts should be built and placed in a scripts
// folder next to this file.

//go:embed scripts/shared.js
var sharedScript string

//go:embed scripts/library.js
var libraryScript string

//go:embed scripts/keyboard.js
var keyboardScript string

//go:embed scripts/menu.js
var menuScript string

//go:embed scripts/quick-access.js
var quickAccessScript string

//go:embed scripts/app-properties.js
var appPropertiesScript string

//go:build dev

package inject

// In dev mode, these scripts will be bundled at run time, so we just declare
// them as empty strings for now.

var sharedScript string
var libraryScript string
var menuScript string
var quickAccessScript string

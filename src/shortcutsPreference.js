const SHORTCUTS_DISMISSED_KEY = "detranRJ.shortcutsDismissed.v1";

export function loadShortcutsDismissed() {
  try {
    return localStorage.getItem(SHORTCUTS_DISMISSED_KEY) === "true";
  } catch (_error) {
    return false;
  }
}

export function saveShortcutsDismissed() {
  try {
    localStorage.setItem(SHORTCUTS_DISMISSED_KEY, "true");
  } catch (_error) {
    // Keep the session usable even if localStorage is unavailable.
  }
}

// One place that owns the home screen icon badge.
//
// Two things can put a number on the icon: unread check-ins, and a pending
// app update. Keeping both in here means they add up instead of overwriting
// each other, which is what happened when each caller set the badge itself.
//
// The Badging API needs an installed web app (iOS 16.4+ or Chromium desktop)
// AND notification permission, so every call is feature-detected and failures
// are ignored.

const UPDATE_PENDING_KEY = "rbt_update_pending_v1";

let unreadCount = 0;

function readUpdatePending() {
  try {
    return window.localStorage.getItem(UPDATE_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

async function apply() {
  const total = unreadCount + (readUpdatePending() ? 1 : 0);

  try {
    if ("setAppBadge" in navigator) {
      if (total > 0) await navigator.setAppBadge(total);
      else await navigator.clearAppBadge();
    }
    // Tell the service worker too, so the count survives the app closing.
    const reg = await navigator.serviceWorker?.ready;
    reg?.active?.postMessage({ type: "SET_BADGE", count: total });
  } catch {
    // Unsupported, or permission not granted. Nothing to do.
  }
}

// Called by the inbox and on app load.
export function setUnreadCount(n) {
  unreadCount = Number.isFinite(n) ? n : 0;
  return apply();
}

// Called by the update banner when a new build is published, and again with
// false once the person has refreshed onto it.
export function setUpdatePending(pending) {
  try {
    if (pending) window.localStorage.setItem(UPDATE_PENDING_KEY, "1");
    else window.localStorage.removeItem(UPDATE_PENDING_KEY);
  } catch {
    // Private mode or storage disabled -- the badge just won't persist.
  }
  return apply();
}

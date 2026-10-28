/**
 * Steady scene clock in seconds. React Three Fiber resets its own clock each time
 * rendering pauses (the scene pauses offscreen), so timelines use this instead.
 */
let start = 0;
let opened = false;

export function resetSceneTime() {
  start = performance.now();
}

/**
 * The timeline (entrance, golden hour, dusk) starts when the guest opens the
 * envelope, so nothing plays unseen behind it. Gate calls this on open.
 */
export function markInvitationOpened() {
  if (opened) return;
  opened = true;
  resetSceneTime();
  window.dispatchEvent(new Event("invitation:opened"));
}

export const invitationOpened = () => opened;

/** Seconds since the invitation was opened (0 while the envelope is still closed). */
export function sceneTime() {
  if (!opened) return 0;
  return (performance.now() - start) / 1000;
}

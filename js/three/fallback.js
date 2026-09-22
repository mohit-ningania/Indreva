/**
 * #scene-fallback (see layout.css) is always mounted — it's the site's
 * permanent backdrop, not just a no-WebGL substitute.
 *
 *   initFallback()    — cleanup for the no-WebGL path: drop the now-unused
 *                        <canvas> so it isn't sitting in the DOM doing nothing.
 *   initFlowyVideo()  — disabled. It used to point the background <video>
 *                        at assets/video/flow-*.{webm,mp4} (a soft drifting
 *                        cloud/mist clip) — reviewer feedback called that
 *                        exact look a "spray"/cloud effect, too blue, not
 *                        professional. #scene-fallback's own plain gradient
 *                        (layout.css) is the backdrop now. Left as a no-op
 *                        rather than deleted/unwired from main.js: once real
 *                        trade/logistics photography exists, swapping in a
 *                        new clip (or a photo crossfade) here is the natural
 *                        next home for it — see also the video/poster files
 *                        still sitting in assets/video/, now unused.
 */
export function initFallback() {
  document.getElementById('scene-canvas')?.remove();
}

export function initFlowyVideo() {
  // No-op — see module header. Re-enabling: point #scene-fallback
  // .flowy-bg__video's <source>s at the new clip, set .poster, call
  // .load()/.play(), and toggle the .is-ready class once it has a frame
  // (search git history for this file's previous version for the full
  // implementation this replaced).
}

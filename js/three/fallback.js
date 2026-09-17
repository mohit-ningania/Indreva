/**
 * The flowy blob background (#scene-fallback, see layout.css) is always
 * mounted — it's the site's permanent backdrop, not just a no-WebGL
 * substitute. This module has two small, independent jobs:
 *
 *   initFallback()    — cleanup for the no-WebGL path: drop the now-unused
 *                        <canvas> so it isn't sitting in the DOM doing nothing.
 *   initFlowyVideo()  — optional upgrade: point the background's <video> at
 *                        the Flow-generated clip for this page's tone and
 *                        fade it in once it actually has a frame to show.
 *                        If the file doesn't exist yet, the video simply
 *                        never fires `loadeddata` and stays invisible —
 *                        the CSS blobs underneath keep showing, no error
 *                        handling required.
 */
import { capabilities } from '../core/device.js';

export function initFallback() {
  document.getElementById('scene-canvas')?.remove();
}

export function initFlowyVideo(pageKey) {
  const video = document.querySelector('#scene-fallback .flowy-bg__video');
  if (!video) return;
  if (capabilities.reducedMotion || capabilities.saveData) return;

  const tone = pageKey === 'vision' ? 'vision' : 'light';
  const src = `assets/video/flow-${tone}.mp4`;
  const poster = `assets/video/flow-${tone}-poster.jpg`;

  if (video.dataset.tone === tone) return; // already pointed at the right clip
  video.dataset.tone = tone;
  video.classList.remove('is-ready');

  // The poster shows natively the instant it loads, well before the video
  // itself is ready — fade the layer in as soon as either one exists so
  // there's no flash of empty background while the clip buffers.
  video.poster = poster;
  const posterProbe = new Image();
  posterProbe.onload = () => video.classList.add('is-ready');
  posterProbe.src = poster;

  video.innerHTML = '';
  const source = document.createElement('source');
  source.src = src;
  source.type = 'video/mp4';
  video.appendChild(source);
  video.load();
  video.addEventListener('loadeddata', () => video.classList.add('is-ready'), { once: true });
  video.play().catch(() => {}); // autoplay can be blocked; blobs remain the visible background either way
}

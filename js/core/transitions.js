/**
 * Fake-SPA page transitions. Every route is still a real, fully-formed
 * HTML document (crawlable, linkable, works with JS disabled) — this layer
 * only intercepts same-origin nav clicks so moving between pages doesn't
 * hard-reload, and choreographs the diagonal exit/enter wipe in lock-step
 * with the 3D camera's `travelTo()`.
 */
import { scrollToTopInstant } from './smooth-scroll.js';

const PAGE_FILES = ['index.html', 'about.html', 'capabilities.html', 'why-indreva.html', 'vision.html', 'contact.html'];

function pathToPageKey(pathname) {
  const file = pathname.split('/').pop() || 'index.html';
  const name = file.replace('.html', '') || 'index';
  return name === 'index' ? 'home' : name;
}

function isInternalNavigable(anchor) {
  if (!anchor || !anchor.href) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  const file = url.pathname.split('/').pop();
  if (file && !PAGE_FILES.includes(file) && file !== '') return false;
  return true;
}

export function initTransitions(deps) {
  const {
    gsap,
    onBeforeLeave,   // (pageKey) -> optional destroy hook for the outgoing page module
    onAfterEnter,    // (pageKey) -> init hook for the incoming page module
    onContentSwapped, // () -> re-run reveal/nav bindings on the new DOM
    travelTo,        // (nextPageKey, duration) -> Promise, 3D camera travel (no-op if no scene)
    refreshForPage,  // (pageKey) -> re-bind per-page ScrollTrigger after DOM swap
  } = deps;

  const overlay = document.querySelector('.transition-overlay');
  const panel = overlay?.querySelector('.transition-overlay__panel');
  const announcer = document.getElementById('route-announcer');
  const TRANSITION_DURATION = 0.6;

  let currentPageKey = document.body.dataset.page || 'home';
  let isTransitioning = false;

  async function fetchPage(url) {
    const res = await fetch(url, { headers: { 'X-Requested-With': 'fetch' } });
    if (!res.ok) throw new Error('Navigation fetch failed: ' + res.status);
    const html = await res.text();
    return new DOMParser().parseFromString(html, 'text/html');
  }

  function swapDocumentMeta(doc) {
    document.title = doc.title;
    const desc = doc.querySelector('meta[name="description"]');
    if (desc) {
      let liveDesc = document.querySelector('meta[name="description"]');
      if (!liveDesc) {
        liveDesc = document.createElement('meta');
        liveDesc.setAttribute('name', 'description');
        document.head.appendChild(liveDesc);
      }
      liveDesc.setAttribute('content', desc.getAttribute('content') || '');
    }
    const canonical = doc.querySelector('link[rel="canonical"]');
    if (canonical) {
      let liveCanonical = document.querySelector('link[rel="canonical"]');
      if (liveCanonical) liveCanonical.setAttribute('href', canonical.getAttribute('href'));
    }
  }

  function exitAnimation() {
    const outgoing = document.getElementById('page-content');
    const tl = gsap.timeline();
    if (overlay && panel) {
      gsap.set(overlay, { visibility: 'visible' });
      tl.fromTo(panel,
        { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' },
        { clipPath: 'polygon(0 0, 120% 0, 100% 100%, -20% 100%)', duration: TRANSITION_DURATION * 0.6, ease: 'power3.in' },
        0
      );
    }
    if (outgoing) {
      tl.to(outgoing, { autoAlpha: 0, x: -60, y: -20, duration: TRANSITION_DURATION * 0.5, ease: 'power2.in' }, 0);
    }
    return tl;
  }

  function enterAnimation() {
    const incoming = document.getElementById('page-content');
    const tl = gsap.timeline();
    if (incoming) {
      gsap.set(incoming, { autoAlpha: 0, x: 60, y: 20 });
      tl.to(incoming, { autoAlpha: 1, x: 0, y: 0, duration: TRANSITION_DURATION * 0.7, ease: 'power3.out' });
    }
    if (overlay && panel) {
      tl.to(panel,
        { clipPath: 'polygon(120% 0, 120% 0, 100% 100%, -20% 100%)', duration: TRANSITION_DURATION * 0.55, ease: 'power3.out',
          onComplete: () => gsap.set(overlay, { visibility: 'hidden' }) },
        '<0.05'
      );
    }
    return tl;
  }

  async function navigate(url, pushHistory) {
    if (isTransitioning) return;
    isTransitioning = true;
    document.body.classList.add('is-transitioning');

    const nextKey = pathToPageKey(new URL(url, window.location.href).pathname);

    try {
      const [doc] = await Promise.all([
        fetchPage(url),
        exitAnimation().then(),
        travelTo ? travelTo(nextKey, TRANSITION_DURATION) : Promise.resolve(),
      ]);

      const newMain = doc.getElementById('page-content');
      const container = document.getElementById('page-content');
      if (newMain && container) {
        onBeforeLeave?.(currentPageKey);
        container.replaceWith(newMain);
        swapDocumentMeta(doc);
        document.body.dataset.page = nextKey;
        newMain.setAttribute('tabindex', '-1');
        scrollToTopInstant();
        window.scrollTo(0, 0);

        if (pushHistory) window.history.pushState({ pageKey: nextKey }, '', url);

        onContentSwapped?.();
        refreshForPage?.(nextKey);
        onAfterEnter?.(nextKey);
        newMain.focus({ preventScroll: true });
        if (announcer) announcer.textContent = `Navigated to ${doc.title}`;

        currentPageKey = nextKey;
      }
    } catch (err) {
      window.location.href = url; // graceful degrade: real navigation
      return;
    } finally {
      await enterAnimation();
      document.body.classList.remove('is-transitioning');
      isTransitioning = false;
    }
  }

  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (!anchor) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!isInternalNavigable(anchor)) return;

    const url = new URL(anchor.href, window.location.href);
    if (url.pathname === window.location.pathname) return; // same page — let hash/native handling occur

    e.preventDefault();
    navigate(anchor.href, true);
  });

  window.addEventListener('popstate', () => {
    navigate(window.location.href, false);
  });
}

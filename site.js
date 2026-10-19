(() => {
  'use strict';
  const dialog = document.getElementById('image-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = document.getElementById('enlarged-image');
  const caption = document.getElementById('image-caption');
  let lastTrigger = null;
  document.querySelectorAll('.shot-button').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      lastTrigger = link;
      const thumbnail = link.querySelector('img');
      image.src = link.dataset.image;
      image.alt = thumbnail.alt;
      image.width = Number(thumbnail.getAttribute('width'));
      image.height = Number(thumbnail.getAttribute('height'));
      caption.textContent = link.dataset.caption;
      dialog.showModal();
      document.body.classList.add('dialog-open');
      document.dispatchEvent(new Event('galleryopen'));
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    document.dispatchEvent(new Event('galleryclose'));
  });
})();

(() => {
  'use strict';
  const video = document.getElementById('trailer');
  const soundButton = document.getElementById('sound-button');
  const playButton = document.getElementById('video-play');
  if (!video || !soundButton || !playButton) return;
  let ratio = 0;
  let inView = false;
  let overlayOpen = false;
  let manuallyPaused = false;
  let pending = false;
  let generation = 0;
  let hasStarted = false;
  const allowedHere = () => inView && !document.hidden && !overlayOpen;
  const updateSound = () => { soundButton.hidden = !video.muted; };
  const stop = () => {
    generation += 1;
    pending = false;
    video.pause();
  };
  const start = async () => {
    if (!allowedHere() || manuallyPaused || pending || !video.paused) return;
    pending = true;
    const request = ++generation;
    if (video.ended) video.currentTime = 0;
    try {
      await video.play();
    } catch (error) {
      if (request !== generation || !allowedHere()) return;
      if (error.name === 'NotAllowedError' && !video.muted) {
        // Try sound first; a blocked request falls back to muted playback.
        video.muted = true;
        updateSound();
        try { await video.play(); }
        catch (_) { if (allowedHere()) playButton.hidden = false; }
      } else if (error.name !== 'AbortError') {
        playButton.hidden = false;
      }
    } finally {
      if (request === generation) pending = false;
      if (!allowedHere()) video.pause();
    }
  };
  video.addEventListener('playing', () => {
    hasStarted = true;
    playButton.hidden = true;
    if (!allowedHere()) video.pause();
  });
  video.addEventListener('pause', () => {
    if (allowedHere() && !video.ended && !pending) manuallyPaused = true;
  });
  video.addEventListener('play', () => { manuallyPaused = false; });
  video.addEventListener('volumechange', updateSound);
  video.addEventListener('error', () => { if (inView) playButton.hidden = false; });
  const playWithSound = () => {
    manuallyPaused = false;
    video.muted = false;
    updateSound();
    const request = video.play();
    if (request) request.catch(() => { playButton.hidden = false; });
  };
  soundButton.addEventListener('click', playWithSound);
  playButton.addEventListener('click', playWithSound);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (ratio >= .55 && !manuallyPaused) start();
  });
  document.addEventListener('galleryopen', () => { overlayOpen = true; stop(); });
  document.addEventListener('galleryclose', () => {
    overlayOpen = false;
    if (ratio >= .55 && !manuallyPaused) start();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      ratio = entry.intersectionRatio;
      const wasInView = inView;
      inView = entry.isIntersecting && ratio >= .15;
      if (!inView) {
        stop();
        if (wasInView) manuallyPaused = false;
      } else if (ratio >= .55 && (!manuallyPaused || !hasStarted)) {
        start();
      }
    }, { threshold: [0, .15, .55, 1] });
    observer.observe(video);
  }
  updateSound();
})();

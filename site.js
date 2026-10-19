(() => {
  'use strict';
  const dialog = document.getElementById('image-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = document.getElementById('enlarged-image');
  const caption = document.getElementById('image-caption');
  let lastTrigger = null;
  const close = () => dialog.close();

  document.querySelectorAll('.shot-button').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      lastTrigger = button;
      const thumbnail = button.querySelector('img');
      image.src = button.dataset.image;
      image.alt = thumbnail.alt;
      image.width = Number(thumbnail.getAttribute('width'));
      image.height = Number(thumbnail.getAttribute('height'));
      caption.textContent = button.dataset.caption;
      dialog.showModal();
      document.body.classList.add('dialog-open');
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', close);
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  });
})();

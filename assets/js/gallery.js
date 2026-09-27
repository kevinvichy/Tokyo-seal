(() => {
  'use strict';

  const revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }, { rootMargin: '0px 0px -8% 0px' });
      revealables.forEach((el) => io.observe(el));
    } else {
      revealables.forEach((el) => el.classList.add('is-visible'));
    }
  }

  const groups = document.querySelectorAll('[data-lightbox]');
  if (!groups.length || typeof HTMLDialogElement !== 'function') return;

  const items = [];
  for (const group of groups) {
    for (const img of group.querySelectorAll('.photo > img[data-full]')) {
      const index = items.length;
      items.push({ full: img.dataset.full, alt: img.alt || '' });

      const figure = img.closest('.photo');
      figure.tabIndex = 0;
      figure.setAttribute('role', 'button');
      figure.setAttribute('aria-label', `放大查看 ${img.alt || ''}`.trim());
      figure.classList.add('is-zoomable');

      const open = (event) => { event.preventDefault(); show(index); };
      figure.addEventListener('click', open);
      figure.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') open(event);
      });
    }
  }
  if (!items.length) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.innerHTML = `
    <div class="lightbox__stage"><img alt=""></div>
    <button class="lightbox__prev" type="button" aria-label="上一张">←</button>
    <button class="lightbox__next" type="button" aria-label="下一张">→</button>
    <button class="lightbox__close" type="button" aria-label="关闭">✕</button>
    <p class="lightbox__caption"></p>`;
  document.body.appendChild(dialog);

  const stage = dialog.querySelector('img');
  const caption = dialog.querySelector('.lightbox__caption');
  let current = 0;

  function show(index) {
    current = (index + items.length) % items.length;
    stage.src = items[current].full;
    stage.alt = items[current].alt;
    caption.textContent = `${current + 1} / ${items.length}`;
    if (!dialog.open) {
      dialog.showModal();
      document.documentElement.classList.add('lightbox-open');
    }
    for (const step of [1, -1]) {
      new Image().src = items[(current + step + items.length) % items.length].full;
    }
  }

  dialog.querySelector('.lightbox__prev').addEventListener('click', () => show(current - 1));
  dialog.querySelector('.lightbox__next').addEventListener('click', () => show(current + 1));
  dialog.querySelector('.lightbox__close').addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.classList.contains('lightbox__stage')) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('lightbox-open');
    stage.removeAttribute('src');
  });
})();

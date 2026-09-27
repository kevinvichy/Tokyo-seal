/* Language switch.
 *
 * Visible copy for both languages is present in the HTML and hidden with CSS
 * (.t-zh / .t-en), so this file never injects content — it only flips the root
 * attribute, swaps the strings that have to live in attributes (title, alt,
 * aria-label), and remembers the choice. The pre-paint bootstrap that reads
 * localStorage is inline in every page's <head>, so there is no flash.
 *
 * Attribute pairs look like:  data-i18n alt="… 封面" data-en-alt="… cover"
 * The Chinese value stays in the real attribute, so it is what a crawler and a
 * JS-less visitor see.
 */
(function () {
  var root = document.documentElement;
  var KEY = 'tsp-lang';

  function applyAttrs(lang) {
    var nodes = document.querySelectorAll('[data-i18n]');

    Array.prototype.forEach.call(nodes, function (el) {
      Array.prototype.slice.call(el.attributes).forEach(function (attr) {
        if (attr.name.indexOf('data-en-') !== 0) return;

        var target = attr.name.slice(8);          // 'alt', 'aria-label', 'text'
        var stash = 'data-zh-' + target;

        if (!el.hasAttribute(stash)) {
          el.setAttribute(stash, target === 'text'
            ? el.textContent
            : (el.getAttribute(target) || ''));
        }

        var value = lang === 'en' ? attr.value : el.getAttribute(stash);
        if (target === 'text') el.textContent = value;
        else el.setAttribute(target, value);
      });
    });
  }

  function setLang(lang, persist) {
    root.setAttribute('data-lang', lang);
    root.lang = lang === 'en' ? 'en' : 'zh-Hant';
    applyAttrs(lang);

    if (persist) {
      try { localStorage.setItem(KEY, lang); } catch (e) {}
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-lang-toggle]');
    if (!btn) return;
    setLang(root.getAttribute('data-lang') === 'en' ? 'zh' : 'en', true);
  });

  applyAttrs(root.getAttribute('data-lang') === 'en' ? 'en' : 'zh');
})();

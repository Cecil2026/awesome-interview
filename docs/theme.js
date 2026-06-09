(function () {
  const KEY = 'awesome-interview-theme';
  const VALID = new Set(['light', 'dark']);

  function detect() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function read() {
    const saved = localStorage.getItem(KEY);
    return VALID.has(saved) ? saved : detect();
  }

  function apply(theme) {
    const next = VALID.has(theme) ? theme : detect();
    document.documentElement.setAttribute('data-theme', next);
    return next;
  }

  // Apply ASAP to avoid flash of wrong theme.
  apply(read());

  window.AwesomeTheme = {
    get: read,
    set(theme) {
      const next = apply(theme);
      localStorage.setItem(KEY, next);
      return next;
    },
    apply,
    wire(selectEl, onChange) {
      if (!selectEl) return;
      const current = read();
      selectEl.value = current;
      apply(current);
      selectEl.addEventListener('change', (event) => {
        const next = window.AwesomeTheme.set(event.target.value);
        if (onChange) onChange(next);
      });
    },
  };
})();

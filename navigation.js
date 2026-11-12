(() => {
  const panel = document.getElementById('navigation');
  const toggle = document.getElementById('navToggle');
  const close = document.getElementById('navClose');
  const backdrop = document.getElementById('navBackdrop');
  const main = document.getElementById('mainContent');
  const headerMenu = document.getElementById('headerMenu');
  const mobile = window.matchMedia('(max-width: 700px)');
  let collapsed = false;
  let drawerOpen = false;

  headerMenu.open = false;
  headerMenu.addEventListener('click', event => {
    if (event.target.closest('.header-menu-content button')) headerMenu.open = false;
  });
  document.addEventListener('click', event => {
    if (headerMenu.open && !headerMenu.contains(event.target)) headerMenu.open = false;
  });

  function sync() {
    const expanded = mobile.matches ? drawerOpen : !collapsed;
    document.body.classList.toggle('nav-collapsed', !mobile.matches && collapsed);
    document.body.classList.toggle('nav-open', mobile.matches && drawerOpen);
    panel.inert = !expanded;
    panel.setAttribute('aria-hidden', String(!expanded));
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? 'បិទម៉ឺនុយ' : 'បើកម៉ឺនុយ');
    backdrop.hidden = !(mobile.matches && drawerOpen);
    main.inert = mobile.matches && drawerOpen;
    if (mobile.matches && drawerOpen) {
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
    } else {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
    }
  }
  function dismiss() {
    if (mobile.matches) drawerOpen = false;
    else collapsed = true;
    sync();
    toggle.focus();
  }
  toggle.addEventListener('click', () => {
    if (mobile.matches) drawerOpen = !drawerOpen;
    else collapsed = !collapsed;
    sync();
    if (mobile.matches && drawerOpen) close.focus();
  });
  close.addEventListener('click', dismiss);
  backdrop.addEventListener('click', dismiss);
  panel.addEventListener('click', event => {
    if (mobile.matches && drawerOpen && event.target.closest('.nav')) dismiss();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && headerMenu.open) {
      headerMenu.open = false;
      headerMenu.querySelector('summary').focus();
    }
    if (!mobile.matches || !drawerOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); dismiss(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('a[href],button:not(:disabled),[tabindex="0"]')]
      .filter(el => el.getClientRects().length > 0);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
      event.preventDefault(); first?.focus();
    }
  });
  mobile.addEventListener('change', () => {
    const focusInside = panel.contains(document.activeElement);
    drawerOpen = false;
    headerMenu.open = false;
    sync();
    if (focusInside && panel.inert) toggle.focus();
  });
  sync();
})();

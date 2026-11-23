(function () {
  const ESTILOS_TEMA = `
    /* Quitar íconos redundantes externos al interruptor */
    .theme-icon, .theme-label, #themeIcon {
      display: none !important;
    }

    .kixuz-theme-switch {
      position: relative;
      width: 54px;
      height: 28px;
      border-radius: 999px;
      background: #2A164B;
      border: 1px solid rgba(108, 60, 224, 0.7);
      cursor: pointer;
      padding: 0 6px;
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      transition: background 0.25s, border-color 0.25s;
    }

    .kixuz-theme-switch svg {
      width: 13px;
      height: 13px;
      z-index: 1;
      pointer-events: none;
      transition: opacity 0.25s, color 0.25s;
    }

    .kixuz-theme-switch .icon-sun {
      color: #FBBF24;
      opacity: 0.45;
    }

    .kixuz-theme-switch .icon-moon {
      color: #2DD4C4;
      opacity: 0.95;
    }

    .kixuz-theme-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #EDE7E0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s;
      z-index: 2;
    }

    html[data-theme="light"] .kixuz-theme-switch {
      background: #E9E2F8;
      border-color: rgba(108, 60, 224, 0.5);
    }

    html[data-theme="light"] .kixuz-theme-switch .icon-sun {
      opacity: 1;
      color: #D97706;
    }

    html[data-theme="light"] .kixuz-theme-switch .icon-moon {
      opacity: 0.35;
      color: #6C3CE0;
    }

    html[data-theme="light"] .kixuz-theme-thumb {
      transform: translateX(26px);
      background: #6C3CE0;
    }
  `;

  function aplicarTema(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('kixuz_theme', tema);
    const btn = document.getElementById('kixuzThemeSwitch');
    if (btn) {
      btn.setAttribute('aria-label', tema === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
      btn.setAttribute('title', tema === 'light' ? 'Modo claro activo' : 'Modo oscuro activo');
    }
  }

  function initTema() {
    if (!document.getElementById('kixuz-theme-styles')) {
      const style = document.createElement('style');
      style.id = 'kixuz-theme-styles';
      style.textContent = ESTILOS_TEMA;
      document.head.appendChild(style);
    }

    const temaGuardado = localStorage.getItem('kixuz_theme') || 'dark';
    aplicarTema(temaGuardado);

    const header = document.querySelector('header');
    if (!header) return;

    // Limpiar switches viejos si existen
    header.querySelectorAll('.theme-toggle, .theme-switch, #themeToggle').forEach(el => {
      if (el.parentElement && el.parentElement.classList.contains('theme-wrapper')) {
        el.parentElement.remove();
      } else {
        el.remove();
      }
    });

    if (document.getElementById('kixuzThemeSwitch')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'kixuzThemeSwitch';
    btn.className = 'kixuz-theme-switch';
    btn.innerHTML = `
      <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      </svg>
      <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
      <span class="kixuz-theme-thumb"></span>
    `;

    btn.addEventListener('click', () => {
      const actual = document.documentElement.getAttribute('data-theme') || 'dark';
      aplicarTema(actual === 'dark' ? 'light' : 'dark');
    });

    const userControls = header.querySelector('.user-menu, .header-right, .nav-actions');
    if (userControls) header.insertBefore(btn, userControls.firstChild);
    else header.appendChild(btn);

    aplicarTema(temaGuardado);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTema);
  } else {
    initTema();
  }
})();
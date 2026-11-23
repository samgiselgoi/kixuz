(function () {
  const ESTILOS_NAV = `
    header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      flex-wrap: nowrap !important;
      gap: 14px !important;
      padding: 12px 26px !important;
    }

    .nav-links {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      flex-wrap: nowrap !important;
    }

    .nav-links a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      height: 38px;
      padding: 0 12px;
      border-radius: 10px;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600;
      font-size: 14px;
      color: var(--texto);
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.2s, color 0.2s;
    }

    /* Botones solo-ícono (Inicio y Mi Personaje) */
    .nav-links a.nav-icon-only {
      width: 38px;
      padding: 0;
    }

    .nav-links a:hover {
      background: rgba(108, 60, 224, 0.24);
      color: #2DD4C4;
    }

    .nav-links a.active {
      background: rgba(108, 60, 224, 0.34);
      color: #2DD4C4;
    }

    .user-menu, .header-right, .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .kixuz-auth-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #2DD4C4;
      color: #150A24 !important;
      text-decoration: none;
      flex-shrink: 0;
      transition: transform 0.18s, box-shadow 0.18s;
    }

    .kixuz-auth-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(45, 212, 196, 0.35);
    }

    @media (max-width: 960px) {
      header {
        flex-wrap: wrap !important;
        padding: 12px 16px !important;
      }
      .kixuz-search-wrap {
        width: 100% !important;
        order: 3;
      }
    }
  `;

  const SVGS = {
    inicio: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>`,
    personaje: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>`,
    universos: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-25 12 12)"/></svg>`,
    familia: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v6c0 5-3.5 7.8-8 9-4.5-1.2-8-4-8-9V7l8-4z"/></svg>`,
    entrar: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`
  };

  function initNavbarUI() {
    if (!document.getElementById('kixuz-nav-styles')) {
      const style = document.createElement('style');
      style.id = 'kixuz-nav-styles';
      style.textContent = ESTILOS_NAV;
      document.head.appendChild(style);
    }

    const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
    const nav = document.querySelector('header .nav-links');

    if (nav) {
      nav.innerHTML = `
        <a href="index.html" class="nav-icon-only ${paginaActual === 'index.html' ? 'active' : ''}" title="Inicio" aria-label="Inicio">
          ${SVGS.inicio}
        </a>
        <a href="perfil.html" class="nav-icon-only ${paginaActual === 'perfil.html' ? 'active' : ''}" title="Mi Personaje" aria-label="Mi Personaje">
          ${SVGS.personaje}
        </a>
        <a href="universo.html" class="${paginaActual === 'universo.html' ? 'active' : ''}">
          ${SVGS.universos}
          <span>Universos</span>
        </a>
        <a href="familia.html" class="${paginaActual === 'familia.html' ? 'active' : ''}">
          ${SVGS.familia}
          <span>Familia / Clan</span>
        </a>
      `;
    }

    // Reemplazar botón de "Entrar" con emoji de llave por botón SVG limpio
    const authLink = document.querySelector('header a[href*="registro.html"], header a[href*="login"]');
    if (authLink) {
      authLink.className = 'kixuz-auth-btn';
      authLink.setAttribute('title', 'Entrar / Registro');
      authLink.setAttribute('aria-label', 'Entrar o registrarse');
      authLink.innerHTML = SVGS.entrar;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbarUI);
  } else {
    initNavbarUI();
  }
})();
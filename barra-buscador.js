(function () {
  const ESTILOS_BUSCADOR = `
    .kixuz-search-wrap {
      position: relative;
      width: 240px;
      flex-shrink: 0;
      font-family: 'Inter', sans-serif;
    }

    .kixuz-search-box {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      height: 38px;
      background: rgba(12, 6, 22, 0.78);
      border: 1px solid rgba(108, 60, 224, 0.55);
      border-radius: 999px;
      padding: 0 34px 0 14px;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    }

    .kixuz-search-box:focus-within {
      border-color: #2DD4C4;
      box-shadow: 0 0 0 3px rgba(45, 212, 196, 0.16);
      background: rgba(12, 6, 22, 0.95);
    }

    .kixuz-search-input {
      width: 100%;
      border: none;
      background: transparent;
      color: #EDE7E0;
      font-family: 'Inter', sans-serif;
      font-size: 13.5px;
      outline: none;
    }

    .kixuz-search-input::placeholder {
      color: rgba(237, 231, 224, 0.55);
    }

    .kixuz-search-clear {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: none;
      background: rgba(108, 60, 224, 0.35);
      color: #EDE7E0;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: background 0.2s, color 0.2s;
    }

    .kixuz-search-clear.visible {
      display: flex;
    }

    .kixuz-search-clear:hover {
      background: #2DD4C4;
      color: #150A24;
    }

    .kixuz-search-results {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 310px;
      max-height: 340px;
      overflow-y: auto;
      background: #1B0E30;
      border: 1px solid rgba(108, 60, 224, 0.65);
      border-radius: 14px;
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.6);
      padding: 6px;
      display: none;
      z-index: 9999;
    }

    .kixuz-search-results.open {
      display: block;
    }

    .kixuz-res-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 9px 11px;
      border-radius: 10px;
      text-decoration: none !important;
      color: #EDE7E0 !important;
      transition: background 0.18s;
    }

    .kixuz-res-item:hover {
      background: rgba(108, 60, 224, 0.32);
    }

    .kixuz-res-main {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .kixuz-res-name {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 13.5px;
      color: #EDE7E0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kixuz-res-handle {
      font-size: 12px;
      color: #2DD4C4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kixuz-res-badge {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(108, 60, 224, 0.35);
      border: 1px solid rgba(108, 60, 224, 0.6);
      color: #EDE7E0;
      flex-shrink: 0;
    }

    .kixuz-res-empty {
      padding: 12px;
      text-align: center;
      font-size: 13px;
      color: rgba(237, 231, 224, 0.7);
    }

    /* Modo Claro */
    html[data-theme="light"] .kixuz-search-box {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(108, 60, 224, 0.4);
    }
    html[data-theme="light"] .kixuz-search-input {
      color: #150A24;
    }
    html[data-theme="light"] .kixuz-search-input::placeholder {
      color: rgba(21, 10, 36, 0.5);
    }
    html[data-theme="light"] .kixuz-search-results {
      background: #FFFFFF;
      border-color: rgba(108, 60, 224, 0.35);
      box-shadow: 0 12px 30px rgba(21, 10, 36, 0.16);
    }
    html[data-theme="light"] .kixuz-res-item,
    html[data-theme="light"] .kixuz-res-name {
      color: #150A24 !important;
    }
    html[data-theme="light"] .kixuz-res-item:hover {
      background: rgba(108, 60, 224, 0.12);
    }
    html[data-theme="light"] .kixuz-res-badge {
      background: rgba(108, 60, 224, 0.12);
      color: #4C24B5;
    }
  `;

  function inyectarEstilos() {
    if (document.getElementById('kixuz-search-styles')) return;
    const style = document.createElement('style');
    style.id = 'kixuz-search-styles';
    style.textContent = ESTILOS_BUSCADOR;
    document.head.appendChild(style);
  }

  function obtenerDatosBusqueda() {
    const base = [
      { tipo: 'Personaje', nombre: 'Cypher', handle: '@cypher', url: 'perfil.html?char=@cypher' },
      { tipo: 'Personaje', nombre: 'Elara Vance', handle: '@elara_vance', url: 'perfil.html?char=@elara_vance' },
      { tipo: 'Personaje', nombre: 'Theo Kwon', handle: '@theo', url: 'perfil.html?char=@theo' },
      { tipo: 'Personaje', nombre: 'Liam Miller', handle: '@liam_miller', url: 'perfil.html?char=@liam_miller' },
      { tipo: 'Universo', nombre: 'Sector 4', handle: '#Sector4', url: 'universo.html?u=Sector4' },
      { tipo: 'Universo', nombre: 'Nexo Central', handle: '#NexoCentral', url: 'universo.html?u=NexoCentral' },
      { tipo: 'Familia / Clan', nombre: 'Orden del Eclipse', handle: 'Facción', url: 'familia.html' }
    ];

    try {
      const guardados = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
      guardados.forEach(p => {
        if (p && p.nombre && p.handle) {
          base.unshift({
            tipo: 'Personaje',
            nombre: p.nombre,
            handle: p.handle,
            url: `perfil.html?char=${encodeURIComponent(p.handle)}`
          });
        }
      });
    } catch (e) {}

    return base;
  }

  function initBuscador() {
    inyectarEstilos();
    const header = document.querySelector('header');
    if (!header) return;

    // Eliminar buscadores viejos si existieran
    header.querySelectorAll('.global-search, .search-container, .kixuz-search-wrap').forEach(el => el.remove());

    const wrap = document.createElement('div');
    wrap.className = 'kixuz-search-wrap';
    wrap.innerHTML = `
      <div class="kixuz-search-box">
        <input type="text" class="kixuz-search-input" placeholder="Buscar personaje, @usuario, clan..." aria-label="Buscar en KIXUZ" autocomplete="off">
        <button type="button" class="kixuz-search-clear" title="Limpiar búsqueda" aria-label="Limpiar búsqueda">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="kixuz-search-results" role="listbox"></div>
    `;

    // Insertar justo antes de los controles de usuario o al final de la nav
    const userControls = header.querySelector('.user-menu, .header-right, .nav-actions');
    if (userControls) header.insertBefore(wrap, userControls);
    else header.appendChild(wrap);

    const input = wrap.querySelector('.kixuz-search-input');
    const clearBtn = wrap.querySelector('.kixuz-search-clear');
    const resultsBox = wrap.querySelector('.kixuz-search-results');

    function renderResultados(q) {
      const term = q.trim().toLowerCase();
      clearBtn.classList.toggle('visible', term.length > 0);

      if (!term) {
        resultsBox.classList.remove('open');
        resultsBox.innerHTML = '';
        return;
      }

      const items = obtenerDatosBusqueda().filter(item =>
        item.nombre.toLowerCase().includes(term) ||
        item.handle.toLowerCase().includes(term) ||
        item.tipo.toLowerCase().includes(term)
      );

      if (!items.length) {
        resultsBox.innerHTML = `<div class="kixuz-res-empty">Sin resultados para "${q.replace(/</g, '&lt;')}"</div>`;
      } else {
        resultsBox.innerHTML = items.slice(0, 8).map(item => `
          <a href="${item.url}" class="kixuz-res-item">
            <div class="kixuz-res-main">
              <span class="kixuz-res-name">${item.nombre}</span>
              <span class="kixuz-res-handle">${item.handle}</span>
            </div>
            <span class="kixuz-res-badge">${item.tipo}</span>
          </a>
        `).join('');
      }
      resultsBox.classList.add('open');
    }

    input.addEventListener('input', () => renderResultados(input.value));
    input.addEventListener('focus', () => {
      if (input.value.trim()) renderResultados(input.value);
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      renderResultados('');
      input.focus();
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) resultsBox.classList.remove('open');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBuscador);
  } else {
    initBuscador();
  }
})();
(() => {
    const style = document.createElement('style');
    style.id = 'kixuz-nav-styles';
    style.textContent = `
        header {
            position: sticky !important;
            top: 0 !important;
            z-index: 1000 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            flex-wrap: nowrap !important;
            gap: 12px !important;
            padding: 10px 24px !important;
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s !important;
        }
        header.kixuz-header-hidden {
            transform: translateY(-105%) !important;
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
            color: var(--texto, #EDE7E0);
            text-decoration: none;
            white-space: nowrap;
            transition: background 0.2s, color 0.2s;
        }
        .nav-links a.nav-icon-only {
            width: 38px;
            padding: 0;
        }
        .nav-links a:hover, .nav-links a.active {
            background: rgba(108, 60, 224, 0.28);
            color: var(--acento, #2DD4C4);
        }
        .user-menu {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            flex-shrink: 0 !important;
        }
        .kixuz-auth-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: var(--acento, #2DD4C4);
            color: #150A24 !important;
            text-decoration: none;
            flex-shrink: 0;
            transition: transform 0.18s;
        }
        .kixuz-auth-btn:hover {
            transform: translateY(-1px);
        }
        @media (max-width: 820px) {
            header {
                padding: 10px 14px !important;
                gap: 8px !important;
            }
            .nav-links a span {
                display: none;
            }
            .nav-links a {
                width: 36px;
                padding: 0;
            }
        }
    `;
    if (!document.getElementById('kixuz-nav-styles')) {
        document.head.appendChild(style);
    }

    const SVGS = {
        inicio: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>`,
        personaje: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>`,
        universos: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-25 12 12)"/></svg>`,
        familia: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v6c0 5-3.5 7.8-8 9-4.5-1.2-8-4-8-9V7l8-4z"/></svg>`,
        entrar: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`
    };

    const HANDLES_PRUEBA = new Set(['@theo', '@cypher', '@elara_vance', '@liam_miller']);

    function limpiarSelectorPersonajes() {
        const sel = document.getElementById('activeCharSelect');
        if (!sel) return;

        let propios = [];
        try {
            const raw = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            if (Array.isArray(raw)) {
                propios = raw.filter(p => p && (p.nombre || p.handle));
            }
        } catch {}

        // Filtrar cualquier personaje de prueba que no pertenezca a tus subpersonajes reales
        const propiosHandles = new Set(propios.map(p => String(p.handle || '').trim().toLowerCase()));
        Array.from(sel.options).forEach(opt => {
            const val = String(opt.value || '').trim().toLowerCase();
            if (val === '__cuenta_maestra__' || val === 'crear') return;
            if (HANDLES_PRUEBA.has(val) && !propiosHandles.has(val)) {
                opt.remove();
            }
        });

        // Asegurar opción de "Mi Cuenta Maestra" para gestionar cuentas solo allí
        if (!Array.from(sel.options).some(o => o.value === '__cuenta_maestra__')) {
            const optCM = document.createElement('option');
            optCM.value = '__cuenta_maestra__';
            optCM.textContent = '👑 Mi Cuenta Maestra';
            sel.appendChild(optCM);
        }

        if (!sel.dataset.cmBound) {
            sel.dataset.cmBound = '1';
            sel.addEventListener('change', () => {
                if (sel.value === '__cuenta_maestra__') {
                    window.location.href = 'cuenta-maestra.html';
                }
            });
        }
    }

    function initNavbar() {
        const header = document.querySelector('header');
        if (!header) return;

        // 1. Restaurar logo original de KIXUZ
        const brand = header.querySelector('.brand, .logo');
        if (brand) {
            brand.innerHTML = `<img src="img/logo-kixuz.png" alt="Logo KIXUZ" style="height: 34px; width: auto; display: block;">`;
        }

        // 2. Navegación con SVGs (Inicio y Mi Personaje solo icono)
        const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
        const nav = header.querySelector('.nav-links');
        if (nav) {
            nav.innerHTML = `
                <a href="index.html" class="nav-icon-only ${paginaActual === 'index.html' ? 'active' : ''}" title="Inicio" aria-label="Inicio">
                    ${SVGS.inicio}
                </a>
                <a href="perfil.html" class="nav-icon-only ${paginaActual === 'perfil.html' ? 'active' : ''}" title="Mi Personaje" aria-label="Mi Personaje">
                    ${SVGS.personaje}
                </a>
                <a href="universo.html" class="${paginaActual === 'universo.html' ? 'active' : ''}" title="Universos">
                    ${SVGS.universos}
                    <span>Universos</span>
                </a>
                <a href="familia.html" class="${paginaActual === 'familia.html' ? 'active' : ''}" title="Familia / Clan">
                    ${SVGS.familia}
                    <span>Familia / Clan</span>
                </a>
            `;
        }

        // 3. Botón de acceso con SVG limpio
        const authLink = header.querySelector('a[href*="registro.html"]');
        if (authLink) {
            authLink.className = 'kixuz-auth-btn';
            authLink.setAttribute('title', 'Entrar / Registro');
            authLink.setAttribute('aria-label', 'Entrar / Registro');
            authLink.innerHTML = SVGS.entrar;
        }

        // 4. Limpiar personajes de prueba del desplegable
        limpiarSelectorPersonajes();

        // 5. Ocultar barra superior al bajar scroll y mostrar al subir
        if (!window._kixuzScrollBound) {
            window._kixuzScrollBound = true;
            let lastScrollY = window.scrollY;
            window.addEventListener('scroll', () => {
                const currentY = window.scrollY;
                if (currentY > 70 && currentY > lastScrollY) {
                    header.classList.add('kixuz-header-hidden');
                } else if (currentY < lastScrollY || currentY <= 40) {
                    header.classList.remove('kixuz-header-hidden');
                }
                lastScrollY = currentY;
            }, { passive: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavbar);
    } else {
        initNavbar();
    }
    window.addEventListener('kixuz:personajes-actualizados', limpiarSelectorPersonajes);
    window.addEventListener('load', initNavbar);
})();

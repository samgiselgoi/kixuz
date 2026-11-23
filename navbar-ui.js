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
            gap: 10px !important;
            padding: 10px 22px !important;
            height: 60px !important;
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s !important;
        }
        header.kixuz-header-hidden {
            transform: translateY(-105%) !important;
        }
        .brand, .logo {
            display: inline-flex !important;
            align-items: center !important;
            flex-shrink: 0 !important;
            text-decoration: none !important;
        }
        .nav-links {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            flex-wrap: nowrap !important;
            flex-shrink: 0 !important;
        }
        .nav-links a {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            height: 36px !important;
            padding: 0 10px !important;
            border-radius: 10px !important;
            font-family: 'Space Grotesk', sans-serif !important;
            font-weight: 600 !important;
            font-size: 13.5px !important;
            color: var(--texto, #EDE7E0) !important;
            text-decoration: none !important;
            white-space: nowrap !important;
            transition: background 0.2s, color 0.2s !important;
        }
        .nav-links a.nav-icon-only {
            width: 36px !important;
            padding: 0 !important;
        }
        .nav-links a:hover, .nav-links a.active {
            background: rgba(108, 60, 224, 0.28) !important;
            color: var(--acento, #2DD4C4) !important;
        }
        .user-menu {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            flex-wrap: nowrap !important;
            flex-shrink: 0 !important;
        }
        .user-menu select, .user-menu .dropdown, #activeCharSelect {
            height: 36px !important;
            max-width: 215px !important;
            padding: 0 10px !important;
            border-radius: 10px !important;
            border: 1px solid var(--borde, rgba(108, 60, 224, 0.45)) !important;
            background: var(--tarjeta, rgba(34, 17, 61, 0.92)) !important;
            color: var(--texto, #EDE7E0) !important;
            font-family: 'Space Grotesk', sans-serif !important;
            font-weight: 600 !important;
            font-size: 12.5px !important;
            outline: none !important;
            cursor: pointer !important;
        }
        html[data-theme="light"] .user-menu select,
        html[data-theme="light"] #activeCharSelect {
            background: #FFFFFF !important;
            color: #150A24 !important;
        }
        .kixuz-auth-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 36px !important;
            height: 36px !important;
            border-radius: 10px !important;
            background: var(--acento, #2DD4C4) !important;
            color: #150A24 !important;
            text-decoration: none !important;
            flex-shrink: 0 !important;
        }
        @media (max-width: 860px) {
            header { padding: 8px 12px !important; gap: 6px !important; }
            .nav-links a span { display: none !important; }
            .nav-links a { width: 34px !important; padding: 0 !important; }
            .user-menu select { max-width: 145px !important; }
        }
    `;
    if (!document.getElementById('kixuz-nav-styles')) {
        document.head.appendChild(style);
    }

    const SVGS = {
        inicio: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>`,
        personaje: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>`,
        universos: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-25 12 12)"/></svg>`,
        familia: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v6c0 5-3.5 7.8-8 9-4.5-1.2-8-4-8-9V7l8-4z"/></svg>`,
        entrar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`
    };

    const normH = v => {
        const s = String(v || '').trim().toLowerCase().replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    function recolectarPersonajesRegistrados() {
        const mapa = new Map();
        const add = (p, origen = 'Registro') => {
            if (!p) return;
            const handle = normH(p.handle || p.autorHandle || p.usuario || '');
            const nombre = String(p.nombre || p.autorNombre || p.author || '').trim() || (handle ? handle.slice(1) : '');
            if (!handle && !nombre) return;
            const key = handle || nombre.toLowerCase();
            const prev = mapa.get(key) || {};
            mapa.set(key, {
                nombre: nombre || prev.nombre,
                handle: handle || prev.handle,
                clan: p.clan || prev.clan || '',
                universos: Array.isArray(p.universos) && p.universos.length ? p.universos : (prev.universos || []),
                origen: prev.origen === 'Subpersonaje' ? 'Subpersonaje' : origen
            });
        };

        try {
            const subs = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            if (Array.isArray(subs)) subs.forEach(p => add(p, 'Subpersonaje'));
        } catch {}
        try {
            const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
            if (act) add(act, 'Subpersonaje');
        } catch {}
        try {
            const fam = JSON.parse(localStorage.getItem('kixuz_familia_clan_v1') || '{}');
            (fam.familia || []).forEach(m => add({ nombre: m.nombre, handle: m.handle }, 'Familia/Clan'));
            (fam.clan || []).forEach(m => add({ nombre: m.nombre, handle: m.handle, clan: m.clanNombre }, 'Familia/Clan'));
        } catch {}
        try {
            const p1 = JSON.parse(localStorage.getItem('kixuz_posts_v1') || '[]');
            const p2 = JSON.parse(localStorage.getItem('kixuz_posts') || '[]');
            [...(Array.isArray(p1) ? p1 : []), ...(Array.isArray(p2) ? p2 : [])].forEach(post => {
                add({ nombre: post.autorNombre || post.author, handle: post.autorHandle || post.handle }, 'Muro');
            });
        } catch {}

        return Array.from(mapa.values());
    }

    window.KIXUZ_NAV = { recolectarPersonajesRegistrados };

    function garantizarCuentaMaestraFija() {
        const header = document.querySelector('header');
        if (!header) return;

        header.querySelectorAll('a[href*="cuenta-maestra.html"]').forEach(a => a.remove());

        document.querySelectorAll('#activeCharSelect, .user-menu select, select.dropdown').forEach(sel => {
            let optCM = Array.from(sel.options).find(o => o.value === '__cuenta_maestra__');
            if (!optCM) {
                optCM = document.createElement('option');
                optCM.value = '__cuenta_maestra__';
                optCM.textContent = 'Mi Cuenta Maestra';
                sel.appendChild(optCM);
            } else {
                optCM.textContent = 'Mi Cuenta Maestra';
            }

            if (!sel.dataset.cmFixedBound) {
                sel.dataset.cmFixedBound = '1';
                sel.addEventListener('change', () => {
                    if (sel.value === '__cuenta_maestra__') {
                        window.location.href = 'cuenta-maestra.html';
                    }
                }, true);
            }
        });
    }

    function initNavbar() {
        const header = document.querySelector('header');
        if (!header) return;

        const brand = header.querySelector('.brand, .logo');
        if (brand) {
            brand.innerHTML = `<img src="img/logo-kixuz.png" alt="Logo KIXUZ" style="height: 34px; width: auto; display: block;">`;
        }

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

        const authLink = header.querySelector('a[href*="registro.html"]');
        if (authLink) {
            authLink.className = 'kixuz-auth-btn';
            authLink.setAttribute('title', 'Entrar / Registro');
            authLink.setAttribute('aria-label', 'Entrar / Registro');
            authLink.innerHTML = SVGS.entrar;
        }

        garantizarCuentaMaestraFija();

        // Observar cambios en el <select> para que "Mi Cuenta Maestra" nunca se pierda al repoblar opciones
        const selMain = document.getElementById('activeCharSelect');
        if (selMain && !selMain.dataset.cmObserved) {
            selMain.dataset.cmObserved = '1';
            const obs = new MutationObserver(() => garantizarCuentaMaestraFija());
            obs.observe(selMain, { childList: true });
        }

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
    window.addEventListener('kixuz:personajes-actualizados', garantizarCuentaMaestraFija);
    window.addEventListener('kixuz:sesion-actualizada', garantizarCuentaMaestraFija);
    window.addEventListener('load', initNavbar);
})();

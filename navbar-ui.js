(() => {
    const norm = v => String(v || '').trim().toLowerCase();
    const normHandle = h => {
        const s = norm(h).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    const ESTILOS_NAV = `
        header {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            flex-wrap: nowrap !important;
            gap: 10px !important;
            padding: 10px 22px !important;
            position: sticky;
            top: 0;
            z-index: 900;
            transition: transform 0.24s ease;
        }

        header.header-hidden {
            transform: translateY(-105%);
        }

        header .logo {
            display: inline-flex !important;
            align-items: center !important;
            text-decoration: none !important;
            flex-shrink: 0 !important;
        }

        header .logo img {
            display: block !important;
            height: 34px !important;
            width: auto !important;
        }

        .nav-links {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            flex-wrap: nowrap !important;
            flex-shrink: 0;
        }

        .nav-links a {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px;
            height: 36px;
            padding: 0 11px;
            border-radius: 10px;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 600;
            font-size: 13.5px;
            color: var(--texto, #EDE7E0);
            text-decoration: none;
            white-space: nowrap;
            transition: background 0.2s, color 0.2s;
        }

        .nav-links a.nav-icon-only {
            width: 36px;
            padding: 0;
        }

        .nav-links a:hover {
            background: rgba(108, 60, 224, 0.24);
            color: var(--acento, #2DD4C4);
        }

        .nav-links a.active {
            background: rgba(108, 60, 224, 0.34);
            color: var(--acento, #2DD4C4);
        }

        .user-menu {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            flex-shrink: 0;
            flex-wrap: nowrap !important;
        }

        .kixuz-auth-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: var(--acento, #2DD4C4);
            color: #150A24 !important;
            text-decoration: none;
            flex-shrink: 0;
            transition: transform 0.18s, box-shadow 0.18s;
        }

        .kixuz-auth-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 14px rgba(45, 212, 196, 0.35);
        }

        @media (max-width: 820px) {
            header {
                flex-wrap: wrap !important;
                padding: 10px 14px !important;
            }
        }
    `;

    const SVGS = {
        inicio: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>`,
        personaje: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>`,
        universos: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-25 12 12)"/></svg>`,
        // Arbolito genealógico con tronco, ramas y nodos en las puntas
        familia: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="21" x2="12" y2="9"/><path d="M12 15l-5.5-4.5"/><path d="M12 13l5.5-4.5"/><circle cx="12" cy="6.5" r="2.5"/><circle cx="5.5" cy="9.5" r="2.2"/><circle cx="18.5" cy="7.5" r="2.2"/></svg>`,
        entrar: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`
    };

    function leerSubpersonajesPropios() {
        try {
            const arr = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            if (!Array.isArray(arr)) return [];
            return arr.filter(p => p && !p.esPlaceholder && normHandle(p.handle) !== '@cypher_hacker');
        } catch {
            return [];
        }
    }

    function leerPersonajeActivo() {
        const subs = leerSubpersonajesPropios();
        try {
            const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
            if (act && !act.esPlaceholder && (act.handle || act.nombre)) {
                const match = subs.find(p =>
                    (act.handle && normHandle(p.handle) === normHandle(act.handle)) ||
                    (act.nombre && norm(p.nombre) === norm(act.nombre))
                );
                if (match) return match;
            }
        } catch {}
        if (subs.length > 0) {
            try { localStorage.setItem('kixuz_personaje_activo', JSON.stringify(subs[0])); } catch {}
            return subs[0];
        }
        return null;
    }

    function asegurarSelectorPersonajes() {
        const select = document.getElementById('activeCharSelect') || document.querySelector('header select');
        if (!select) return;

        const subs = leerSubpersonajesPropios().slice().sort((a, b) =>
            String(a.nombre || a.handle || '').localeCompare(String(b.nombre || b.handle || ''), 'es', { numeric: true, sensitivity: 'base' })
        );
        const activo = leerPersonajeActivo();
        window.KIXUZ_ACTIVE_CHAR = activo;

        const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
        select.innerHTML = '';

        const optMaestra = document.createElement('option');
        optMaestra.value = '__cuenta_maestra__';
        optMaestra.textContent = 'Mi Cuenta Maestra';
        if (paginaActual === 'cuenta-maestra.html') optMaestra.selected = true;
        select.appendChild(optMaestra);

        if (subs.length > 0) {
            const grp = document.createElement('optgroup');
            grp.label = 'Mis personajes';
            subs.forEach(p => {
                const opt = document.createElement('option');
                const h = normHandle(p.handle || p.nombre);
                opt.value = h;
                opt.textContent = `${p.nombre || h.replace(/^@/, '')} (${h})`;
                if (paginaActual !== 'cuenta-maestra.html' && activo && normHandle(activo.handle || activo.nombre) === h) {
                    opt.selected = true;
                }
                grp.appendChild(opt);
            });
            select.appendChild(grp);
        }

        const optCrear = document.createElement('option');
        optCrear.value = '__crear_personaje__';
        optCrear.textContent = '+ Crear personaje';
        select.appendChild(optCrear);

        if (!select.dataset.kixuzNavSelectBound) {
            select.dataset.kixuzNavSelectBound = '1';
            select.addEventListener('change', e => {
                const v = e.target.value;
                if (v === '__cuenta_maestra__') {
                    window.location.href = 'cuenta-maestra.html';
                    return;
                }
                if (v === '__crear_personaje__') {
                    window.location.href = 'crear-personaje.html';
                    return;
                }
                const elegida = leerSubpersonajesPropios().find(p => normHandle(p.handle || p.nombre) === normHandle(v));
                if (elegida) {
                    try { localStorage.setItem('kixuz_personaje_activo', JSON.stringify(elegida)); } catch {}
                    window.KIXUZ_ACTIVE_CHAR = elegida;
                    window.dispatchEvent(new CustomEvent('kixuz:personaje-cambiado', { detail: elegida }));
                    window.dispatchEvent(new Event('kixuz:personajes-actualizados'));
                }
            });
        }
    }

    function initNavbarUI() {
        if (!document.getElementById('kixuz-nav-styles')) {
            const style = document.createElement('style');
            style.id = 'kixuz-nav-styles';
            style.textContent = ESTILOS_NAV;
            document.head.appendChild(style);
        }

        const header = document.querySelector('header');
        if (!header) return;

        header.querySelectorAll('a[href="cuenta-maestra.html"]').forEach(a => a.remove());

        let logo = header.querySelector('.logo');
        if (!logo) {
            logo = document.createElement('a');
            logo.href = 'index.html';
            logo.className = 'logo';
            header.prepend(logo);
        }
        logo.innerHTML = `<img src="img/logo-kixuz.png" alt="Logo KIXUZ">`;

        header.querySelectorAll('.logo').forEach((el, idx) => {
            if (idx > 0) el.remove();
        });
        header.querySelectorAll('img').forEach(img => {
            if (!logo.contains(img) && /logo/i.test(img.src || img.alt || '')) {
                const parentA = img.closest('a');
                if (parentA && parentA !== logo) parentA.remove();
                else img.remove();
            }
        });

        const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
        let nav = header.querySelector('.nav-links');
        if (!nav) {
            nav = document.createElement('nav');
            nav.className = 'nav-links';
            logo.insertAdjacentElement('afterend', nav);
        }

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
                <span>Familia</span>
            </a>
        `;

        const userMenu = header.querySelector('.user-menu');
        if (userMenu) {
            let authLink = userMenu.querySelector('a[href*="registro.html"], a[href*="login"]');
            if (!authLink) {
                authLink = document.createElement('a');
                authLink.href = 'registro.html';
                userMenu.appendChild(authLink);
            }
            authLink.className = 'kixuz-auth-btn';
            authLink.setAttribute('title', 'Entrar / Registro');
            authLink.setAttribute('aria-label', 'Entrar o registrarse');
            authLink.innerHTML = SVGS.entrar;
        }

        asegurarSelectorPersonajes();

        if (window.KIXUZ_THEME?.mount) {
            window.KIXUZ_THEME.mount();
        }
    }

    let lastScrollY = window.scrollY || 0;
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (!header) return;
        const currY = window.scrollY || 0;
        if (currY > 90 && currY > lastScrollY + 6) {
            header.classList.add('header-hidden');
        } else if (currY < lastScrollY - 4 || currY <= 40) {
            header.classList.remove('header-hidden');
        }
        lastScrollY = currY;
    }, { passive: true });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavbarUI);
    } else {
        initNavbarUI();
    }
    window.addEventListener('kixuz:personajes-actualizados', asegurarSelectorPersonajes);
    window.addEventListener('kixuz:sesion-actualizada', asegurarSelectorPersonajes);
})();

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
            background: rgba(21, 10, 36, 0.92) !important;
            backdrop-filter: blur(12px) !important;
            border-bottom: 1px solid var(--borde, rgba(108, 60, 224, 0.45)) !important;
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s !important;
        }
        html[data-theme="light"] header {
            background: rgba(244, 241, 250, 0.94) !important;
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
            padding: 0 11px !important;
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
            max-width: 210px !important;
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
            height: 36px !important;
            padding: 0 12px !important;
            border-radius: 10px !important;
            background: var(--acento, #2DD4C4) !important;
            color: #150A24 !important;
            font-family: 'Space Grotesk', sans-serif !important;
            font-size: 12.5px !important;
            font-weight: 700 !important;
            text-decoration: none !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
        }
        @media (max-width: 860px) {
            header { padding: 8px 12px !important; gap: 6px !important; }
            .nav-links a:not(.nav-icon-only) span { display: none !important; }
            .nav-links a:not(.nav-icon-only) { width: 34px !important; padding: 0 !important; }
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
        familia: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v6c0 5-3.5 7.8-8 9-4.5-1.2-8-4-8-9V7l8-4z"/></svg>`
    };

    function asegurarSelectorEnHeader(header) {
        let userMenu = header.querySelector('.user-menu');
        if (!userMenu) {
            userMenu = document.createElement('div');
            userMenu.className = 'user-menu';
            header.appendChild(userMenu);
        }

        let sel = document.getElementById('activeCharSelect') || userMenu.querySelector('select');
        if (!sel) {
            sel = document.createElement('select');
            sel.id = 'activeCharSelect';
            sel.className = 'dropdown';
            sel.setAttribute('aria-label', 'Personaje activo');
            userMenu.prepend(sel);
        }

        if (!sel.options.length) {
            try {
                const subs = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
                if (Array.isArray(subs) && subs.length) {
                    subs.forEach(p => {
                        if (!p?.handle) return;
                        const opt = document.createElement('option');
                        opt.value = p.handle;
                        opt.textContent = `${p.nombre || p.handle.replace(/^@/, '')} (${p.handle})`;
                        sel.appendChild(opt);
                    });
                }
            } catch {}
        }

        let optCM = Array.from(sel.options).find(o => o.value === '__cuenta_maestra__');
        if (!optCM) {
            optCM = document.createElement('option');
            optCM.value = '__cuenta_maestra__';
            optCM.textContent = 'Mi Cuenta Maestra';
            sel.appendChild(optCM);
        } else {
            optCM.textContent = 'Mi Cuenta Maestra';
        }

        if (!sel.dataset.cmNavBound) {
            sel.dataset.cmNavBound = '1';
            sel.addEventListener('change', () => {
                if (sel.value === '__cuenta_maestra__') {
                    window.location.href = 'cuenta-maestra.html';
                }
            }, true);
        }

        let authLink = header.querySelector('a[href*="registro.html"]');
        if (!authLink) {
            authLink = document.createElement('a');
            authLink.href = 'registro.html';
            authLink.textContent = 'Entrar';
            userMenu.appendChild(authLink);
        }
        authLink.className = 'kixuz-auth-btn';
        authLink.textContent = 'Entrar';
    }

    function initNavbar() {
        const header = document.querySelector('header');
        if (!header) return;

        const brand = header.querySelector('.brand, .logo');
        if (brand) {
            brand.innerHTML = `<img src="img/logo-kixuz.png" alt="Logo KIXUZ" style="height: 34px; width: auto; display: block;">`;
        }

        const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
        let nav = header.querySelector('.nav-links');
        if (!nav) {
            nav = document.createElement('nav');
            nav.className = 'nav-links';
            nav.setAttribute('aria-label', 'Navegación principal');
            header.appendChild(nav);
        }

        nav.innerHTML = `
            <a href="index.html" class="nav-icon-only ${paginaActual === 'index.html' ? 'active' : ''}" title="Inicio" aria-label="Inicio">
                ${SVGS.inicio}
            </a>
            <a href="perfil.html" class="nav-icon-only ${paginaActual === 'perfil.html' ? 'active' : ''}" title="Mi Perfil" aria-label="Mi Perfil">
                ${SVGS.personaje}
            </a>
            <a href="universo.html" class="${paginaActual === 'universo.html' ? 'active' : ''}" title="Universos">
                ${SVGS.universos}
                <span>Universos</span>
            </a>
            <a href="familia.html" class="${paginaActual === 'familia.html' ? 'active' : ''}" title="Familia">
                ${SVGS.familia}
                <span>Familia</span>
            </a>
        `;

        asegurarSelectorEnHeader(header);

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
    window.addEventListener('kixuz:personajes-actualizados', initNavbar);
    window.addEventListener('load', initNavbar);
})();
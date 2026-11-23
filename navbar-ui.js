(() => {
    const style = document.createElement('style');
    style.id = 'kixuz-nav-ui-styles';
    style.textContent = `
        header {
            position: sticky;
            top: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 22px;
            background: rgba(21, 10, 36, 0.94);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(108, 60, 224, 0.35);
            transition: transform 0.25s ease, background 0.25s ease;
        }
        html[data-theme="light"] header { background: rgba(244, 241, 250, 0.95); }
        header.kixuz-header-hidden { transform: translateY(-100%); }
        .brand, .logo { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: var(--texto, #EDE7E0); flex-shrink: 0; }
        .nav-links { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .nav-links a {
            display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
            border-radius: 10px; text-decoration: none; color: var(--texto, #EDE7E0);
            font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 13.5px; white-space: nowrap;
        }
        .nav-links a:hover, .nav-links a.active { background: rgba(108, 60, 224, 0.28); color: var(--acento, #2DD4C4); }
        .user-menu { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .user-menu select, .user-menu .dropdown, #activeCharSelect {
            height: 36px; max-width: 230px; padding: 0 10px; border-radius: 10px;
            border: 1px solid rgba(108, 60, 224, 0.45); background: rgba(34, 18, 58, 0.92);
            color: var(--texto, #EDE7E0); font-family: 'Space Grotesk', sans-serif;
            font-weight: 600; font-size: 12.5px; outline: none; cursor: pointer;
        }
        html[data-theme="light"] .user-menu select, html[data-theme="light"] #activeCharSelect {
            background: #FFFFFF; color: #150A24;
        }
        .kixuz-auth-pill {
            display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px;
            border-radius: 10px; background: var(--acento, #2DD4C4); color: #150A24 !important;
            text-decoration: none; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 12.5px;
        }
        @media (max-width: 720px) {
            header { padding: 8px 12px; gap: 8px; }
            .nav-links a { padding: 6px 8px; font-size: 12.5px; }
            .user-menu select { max-width: 155px; font-size: 12px; }
        }
    `;
    if (!document.getElementById('kixuz-nav-ui-styles')) document.head.appendChild(style);

    const ICONS = {
        inicio: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>`,
        perfil: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>`,
        universos: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-25 12 12)"/></svg>`,
        familia: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v6c0 5-3.5 7.8-8 9-4.5-1.2-8-4-8-9V7l8-4z"/></svg>`,
        entrar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`
    };

    const MASTER_VALUE = '__cuenta_maestra__';

    function asegurarCuentaMaestraEnSelect() {
        const header = document.querySelector('header');
        if (!header) return;
        header.querySelectorAll('a[href*="cuenta-maestra.html"]').forEach(a => a.remove());

        document.querySelectorAll('#activeCharSelect, .user-menu select, select.dropdown').forEach(select => {
            let optMaster = Array.from(select.options).find(o => o.value === MASTER_VALUE);
            if (!optMaster) {
                optMaster = document.createElement('option');
                optMaster.value = MASTER_VALUE;
                optMaster.textContent = 'Mi Cuenta Maestra';
                select.insertBefore(optMaster, select.firstChild);
            } else {
                optMaster.textContent = 'Mi Cuenta Maestra';
            }

            if (window.location.pathname.endsWith('cuenta-maestra.html')) {
                select.value = MASTER_VALUE;
            }

            if (!select.dataset.cmBound) {
                select.dataset.cmBound = '1';
                select.addEventListener('change', e => {
                    if (e.target.value === MASTER_VALUE) {
                        window.location.href = 'cuenta-maestra.html';
                    }
                }, true);
            }

            if (!select.dataset.cmObserved) {
                select.dataset.cmObserved = '1';
                const observer = new MutationObserver(() => asegurarCuentaMaestraEnSelect());
                observer.observe(select, { childList: true });
            }
        });
    }

    function initHeader() {
        const header = document.querySelector('header');
        if (!header) return;

        const brand = header.querySelector('.brand, .logo');
        if (brand && !brand.querySelector('img')) {
            brand.innerHTML = `<img src="img/logo-kixuz.png" alt="Logo KIXUZ" style="height: 34px; width: auto; display: block;">`;
        }

        const page = window.location.pathname.split('/').pop() || 'index.html';
        const nav = header.querySelector('.nav-links');
        if (nav) {
            nav.innerHTML = `
                <a href="index.html" class="${page === 'index.html' ? 'active' : ''}">${ICONS.inicio}<span>Inicio</span></a>
                <a href="perfil.html" class="${page === 'perfil.html' ? 'active' : ''}">${ICONS.perfil}<span>Mi Perfil</span></a>
                <a href="universo.html" class="${page === 'universo.html' ? 'active' : ''}">${ICONS.universos}<span>Universos</span></a>
                <a href="familia.html" class="${page === 'familia.html' ? 'active' : ''}">${ICONS.familia}<span>Familia / Clan</span></a>
            `;
        }

        const authLink = header.querySelector('a[href*="registro.html"]');
        if (authLink) {
            authLink.className = 'kixuz-auth-pill';
            authLink.innerHTML = `${ICONS.entrar}<span>Entrar</span>`;
        }

        asegurarCuentaMaestraEnSelect();

        if (!window._kixuzScrollHideBound) {
            window._kixuzScrollHideBound = true;
            let lastY = window.scrollY;
            window.addEventListener('scroll', () => {
                const y = window.scrollY;
                if (y > 80 && y > lastY) header.classList.add('kixuz-header-hidden');
                else if (y < lastY || y <= 45) header.classList.remove('kixuz-header-hidden');
                lastY = y;
            }, { passive: true });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHeader);
    else initHeader();
    window.addEventListener('kixuz:personajes-actualizados', asegurarCuentaMaestraEnSelect);
    window.addEventListener('kixuz:sesion-actualizada', asegurarCuentaMaestraEnSelect);
    window.addEventListener('load', initHeader);
})();

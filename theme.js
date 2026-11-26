(() => {
    const STORAGE_KEY = 'kixuz_theme';
    const root = document.documentElement;

    const SVG_SUN = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"/></svg>`;
    const SVG_MOON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

    function getPreferredTheme() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'light' || saved === 'dark') return saved;
        } catch {}
        return 'dark';
    }

    function actualizarBotonesTema(t) {
        document.querySelectorAll('.kixuz-theme-toggle-btn').forEach(btn => {
            if (t === 'light') {
                btn.innerHTML = `${SVG_MOON}<span>Oscuro</span>`;
                btn.setAttribute('aria-label', 'Cambiar a modo oscuro');
                btn.setAttribute('title', 'Cambiar a modo oscuro');
            } else {
                btn.innerHTML = `${SVG_SUN}<span>Claro</span>`;
                btn.setAttribute('aria-label', 'Cambiar a modo claro');
                btn.setAttribute('title', 'Cambiar a modo claro');
            }
        });
    }

    function applyTheme(theme) {
        const t = theme === 'light' ? 'light' : 'dark';
        if (t === 'light') {
            root.setAttribute('data-theme', 'light');
        } else {
            root.removeAttribute('data-theme');
        }
        try { localStorage.setItem(STORAGE_KEY, t); } catch {}
        actualizarBotonesTema(t);
        window.dispatchEvent(new CustomEvent('kixuz:theme-changed', { detail: { theme: t } }));
    }

    const style = document.createElement('style');
    style.id = 'kixuz-global-responsive-theme';
    style.textContent = `
        html, body {
            max-width: 100% !important;
            overflow-x: hidden !important;
        }
        img, video, svg {
            max-width: 100%;
        }

        html[data-theme="light"] {
            --bg-principal: #F4F1FA;
            --bg-secundario: #6C3CE0;
            --acento: #0F9D8E;
            --texto: #150A24;
            --bg-tarjeta: rgba(255, 255, 255, 0.9);
            --tarjeta: rgba(255, 255, 255, 0.9);
            --borde: rgba(108, 60, 224, 0.25);
        }
        html[data-theme="light"] body {
            background-color: var(--bg-principal) !important;
            color: var(--texto) !important;
        }
        html[data-theme="light"] header {
            background: rgba(244, 241, 250, 0.96) !important;
            border-bottom-color: rgba(108, 60, 224, 0.25) !important;
        }

        .kixuz-theme-toggle-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            height: 36px !important;
            padding: 0 11px !important;
            border-radius: 10px !important;
            background: rgba(108, 60, 224, 0.24);
            color: var(--texto, #EDE7E0);
            border: 1px solid rgba(108, 60, 224, 0.48);
            font-family: 'Space Grotesk', sans-serif;
            font-size: 12.5px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
            flex-shrink: 0;
            line-height: 1;
            transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .kixuz-theme-toggle-btn:hover {
            border-color: var(--acento, #2DD4C4);
            color: var(--acento, #2DD4C4);
        }
        html[data-theme="light"] .kixuz-theme-toggle-btn {
            background: rgba(108, 60, 224, 0.12);
            color: #150A24;
        }
        @media (max-width: 860px) {
            .kixuz-theme-toggle-btn span { display: none !important; }
            .kixuz-theme-toggle-btn { width: 36px !important; padding: 0 !important; }
        }

        @media (max-width: 900px) {
            .profile-layout,
            .detail-body {
                grid-template-columns: 1fr !important;
            }
            .side-column {
                position: static !important;
                top: auto !important;
            }
        }

        @media (max-width: 640px) {
            .container,
            .page-wrapper,
            .profile-layout {
                margin: 16px auto 76px !important;
                padding: 0 12px !important;
            }
            .grid-universos,
            .universes-grid,
            .zones-grid,
            .new-u-grid {
                grid-template-columns: 1fr !important;
            }
        }
    `;
    document.head.appendChild(style);

    function mountThemeButton() {
        const header = document.querySelector('header');
        if (!header) return;

        let userMenu = header.querySelector('.user-menu');
        if (!userMenu) {
            userMenu = document.createElement('div');
            userMenu.className = 'user-menu';
            header.appendChild(userMenu);
        }

        // Evita duplicados si ya existe
        const existentes = userMenu.querySelectorAll('.kixuz-theme-toggle-btn');
        if (existentes.length > 1) {
            for (let i = 1; i < existentes.length; i++) existentes[i].remove();
        }

        let btn = userMenu.querySelector('.kixuz-theme-toggle-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'kixuz-theme-toggle-btn';
            btn.addEventListener('click', () => {
                const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
                applyTheme(current === 'light' ? 'dark' : 'light');
            });
            userMenu.appendChild(btn);
        }

        applyTheme(getPreferredTheme());
    }

    window.KIXUZ_THEME = {
        getTheme: getPreferredTheme,
        setTheme: applyTheme,
        mount: mountThemeButton
    };

    applyTheme(getPreferredTheme());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountThemeButton);
    } else {
        mountThemeButton();
    }
    window.addEventListener('load', mountThemeButton);
})();
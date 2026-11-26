(() => {
    const STORAGE_KEY = 'kixuz_theme';
    const root = document.documentElement;

    function getPreferredTheme() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'light' || saved === 'dark') return saved;
        } catch {}
        return 'dark';
    }

    function applyTheme(theme) {
        const t = theme === 'light' ? 'light' : 'dark';
        if (t === 'light') {
            root.setAttribute('data-theme', 'light');
        } else {
            root.removeAttribute('data-theme');
        }
        try { localStorage.setItem(STORAGE_KEY, t); } catch {}
        document.querySelectorAll('.kixuz-theme-toggle-btn').forEach(btn => {
            btn.textContent = t === 'light' ? '🌙 Oscuro' : '☀️ Claro';
            btn.setAttribute('aria-label', t === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
        });
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

        /* --- MODO CLARO --- */
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

        /* --- BOTÓN DE TEMA --- */
        .kixuz-theme-toggle-btn {
            background: rgba(108, 60, 224, 0.22);
            color: var(--texto, #EDE7E0);
            border: 1px solid rgba(108, 60, 224, 0.48);
            border-radius: 9px;
            padding: 6px 10px;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
            flex-shrink: 0;
            line-height: 1.2;
        }
        html[data-theme="light"] .kixuz-theme-toggle-btn {
            background: rgba(108, 60, 224, 0.12);
            color: #150A24;
        }

        /* --- CABECERA FLUIDA SIN SUPERPOSICIÓN NI BLOQUEO AL SCROLLEAR --- */
        header {
            position: static !important;
            top: auto !important;
            width: 100%;
            box-sizing: border-box;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
            padding: 10px 16px !important;
            overflow: visible !important;
        }
        header > * {
            min-width: 0;
            box-sizing: border-box;
        }
        header .logo,
        header .logo-placeholder {
            display: inline-flex !important;
            align-items: center !important;
            flex-shrink: 0 !important;
        }
        header .nav-links {
            display: flex !important;
            align-items: center !important;
            flex-wrap: nowrap !important;
            gap: 8px !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            max-width: 100% !important;
        }
        header .nav-links::-webkit-scrollbar {
            display: none;
        }
        header .nav-links a {
            flex-shrink: 0 !important;
            white-space: nowrap !important;
            margin-left: 0 !important;
            padding: 5px 9px !important;
            font-size: 13px !important;
        }
        header .user-menu {
            display: flex !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            max-width: 100% !important;
        }

        /* --- ADAPTACIÓN TABLET Y CELULAR --- */
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
            header {
                padding: 9px 12px !important;
                gap: 8px !important;
            }
            header .nav-links {
                order: 3;
                width: 100%;
                border-top: 1px solid rgba(108, 60, 224, 0.22);
                padding-top: 6px !important;
            }
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
        if (!header || header.querySelector('.kixuz-theme-toggle-btn')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'kixuz-theme-toggle-btn';
        btn.addEventListener('click', () => {
            const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            applyTheme(current === 'light' ? 'dark' : 'light');
        });

        const userMenu = header.querySelector('.user-menu');
        if (userMenu) {
            userMenu.appendChild(btn);
        } else {
            header.appendChild(btn);
        }

        applyTheme(getPreferredTheme());
    }

    applyTheme(getPreferredTheme());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountThemeButton);
    } else {
        mountThemeButton();
    }
})();
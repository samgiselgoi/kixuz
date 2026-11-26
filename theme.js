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
            } else {
                btn.innerHTML = `${SVG_SUN}<span>Claro</span>`;
                btn.setAttribute('aria-label', 'Cambiar a modo claro');
            }
        });
    }

    function applyTheme(theme) {
        const t = theme === 'light' ? 'light' : 'dark';
        if (t === 'light') root.setAttribute('data-theme', 'light');
        else root.removeAttribute('data-theme');
        try { localStorage.setItem(STORAGE_KEY, t); } catch {}
        actualizarBotonesTema(t);
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
        }
        html[data-theme="light"] .kixuz-theme-toggle-btn {
            background: rgba(108, 60, 224, 0.12);
            color: #150A24;
        }

        /* === ADAPTACIÓN COMPLETA PARA TABLET Y CELULAR (SIN OCULTAR NADA DE PC) === */
        @media (max-width: 900px) {
            .profile-layout,
            .detail-body {
                grid-template-columns: 1fr !important;
                gap: 16px !important;
            }
            .character-sidebar,
            .side-column {
                position: static !important;
                top: auto !important;
                width: 100% !important;
            }
        }

        @media (max-width: 680px) {
            header {
                height: auto !important;
                min-height: 54px !important;
                padding: 8px 10px !important;
                flex-wrap: wrap !important;
                gap: 6px !important;
            }
            header .nav-links {
                order: 3;
                width: 100%;
                justify-content: flex-start !important;
                overflow-x: auto !important;
                padding-top: 4px !important;
                border-top: 1px solid rgba(108, 60, 224, 0.22);
            }
            header .user-menu {
                margin-left: auto;
                gap: 6px !important;
            }
            #activeCharSelect,
            .user-menu select {
                max-width: 155px !important;
                font-size: 12px !important;
                height: 34px !important;
            }
            .kixuz-theme-toggle-btn span {
                display: none !important;
            }
            .kixuz-theme-toggle-btn {
                width: 34px !important;
                height: 34px !important;
                padding: 0 !important;
            }
            .container,
            .page-wrap,
            .page-wrapper,
            .profile-layout {
                margin: 14px auto 84px !important;
                padding: 0 10px !important;
            }
            .panel,
            .panel-box,
            .create-post,
            .post-card {
                padding: 14px !important;
                border-radius: 14px !important;
            }
            .form-row,
            .create-post-controls,
            .kixuz-modal-grid,
            .grid-universos {
                grid-template-columns: 1fr !important;
            }
            /* Familia en 2 tarjetas por fila en celular para ver todo el árbol */
            .generation {
                gap: 10px !important;
            }
            .member-card {
                width: calc(50% - 6px) !important;
                min-width: 142px !important;
                max-width: 190px !important;
                padding: 12px 8px !important;
            }
            .member-img {
                width: 52px !important;
                height: 52px !important;
                font-size: 17px !important;
            }
            /* Chat a pantalla completa limpia en celular */
            .kixuz-chat-sidebar {
                width: 100vw !important;
                max-width: 100vw !important;
                right: -105vw !important;
                border-left: none !important;
            }
            .kixuz-chat-sidebar.active {
                right: 0 !important;
            }
            .kixuz-chat-trigger {
                width: 50px !important;
                height: 50px !important;
                right: 12px !important;
                bottom: 12px !important;
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

    window.KIXUZ_THEME = { getTheme: getPreferredTheme, setTheme: applyTheme, mount: mountThemeButton };
    applyTheme(getPreferredTheme());
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountThemeButton);
    else mountThemeButton();
    window.addEventListener('load', mountThemeButton);
})();
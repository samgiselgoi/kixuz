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

    // Inyectar estilos globales de tema + corrección definitiva de superposición en cabecera (móvil, zoom y PC)
    const style = document.createElement('style');
    style.id = 'kixuz-global-theme-and-header-fix';
    style.textContent = `
        /* --- VARIABLES MODO CLARO --- */
        html[data-theme="light"] {
            --bg-principal: #F4F1FA;
            --bg-secundario: #6C3CE0;
            --acento: #0F9D8E;
            --texto: #150A24;
            --tarjeta: rgba(255, 255, 255, 0.92);
            --borde: rgba(108, 60, 224, 0.25);
        }

        html[data-theme="light"] body {
            background-color: #F4F1FA !important;
            color: #150A24 !important;
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

        /* --- ARREGLO DEFINITIVO DE SUPERPOSICIÓN EN BARRA SUPERIOR (PC, ZOOM Y MÓVIL) --- */
        header {
            position: relative !important;
            top: auto !important;
            z-index: 900;
            width: 100%;
            box-sizing: border-box;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 10px !important;
            padding: 10px 16px !important;
            flex-wrap: wrap !important;
            overflow: visible !important;
        }

        header > * {
            min-width: 0;
            box-sizing: border-box;
        }

        header .logo {
            display: inline-flex !important;
            align-items: center !important;
            flex-shrink: 0 !important;
            margin-right: 2px;
        }

        header .logo img {
            height: 30px !important;
            width: auto !important;
            display: block;
        }

        /* Buscador inline sin aplastar ni ser tapado */
        header .kixuz-inline-search-box,
        header #kixuzInlineSearchBox {
            position: relative !important;
            flex: 1 1 130px !important;
            min-width: 115px !important;
            max-width: 210px !important;
            width: auto !important;
        }

        header .kixuz-inline-search-input,
        header #kixuzTopSearchInput {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            padding: 6px 10px !important;
            font-size: 12.5px !important;
        }

        /* Enlaces de navegación: nunca se enciman entre sí ni con el menú derecho */
        header .nav-links {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            max-width: 100% !important;
            flex: 1 1 auto !important;
            padding: 2px 0 !important;
        }
        header .nav-links::-webkit-scrollbar {
            display: none;
        }

        header .nav-links a {
            flex-shrink: 0 !important;
            white-space: nowrap !important;
            font-size: 13px !important;
            padding: 5px 9px !important;
            border-radius: 8px !important;
            margin: 0 !important;
        }

        /* Controles de usuario (desplegable personaje, campana, llave, tema) */
        header .user-menu {
            display: flex !important;
            align-items: center !important;
            gap: 7px !important;
            flex-wrap: nowrap !important;
            flex-shrink: 0 !important;
            max-width: 100% !important;
        }

        header #activeCharSelect,
        header .user-menu select,
        header select.dropdown {
            min-width: 110px !important;
            max-width: 165px !important;
            width: auto !important;
            flex-shrink: 1 !important;
            text-overflow: ellipsis !important;
            overflow: hidden !important;
            white-space: nowrap !important;
            font-size: 12.5px !important;
            padding: 6px 8px !important;
        }

        header .btn-auth-link {
            flex-shrink: 0 !important;
            white-space: nowrap !important;
            padding: 6px 9px !important;
            font-size: 12.5px !important;
        }

        /* Pantallas medianas / zoom alto (<= 1040px): 2 filas ordenadas sin superposición */
        @media (max-width: 1040px) {
            header {
                padding: 9px 12px !important;
                row-gap: 8px !important;
                column-gap: 8px !important;
            }
            /* Fila 1: Logo + Buscador + Controles de cuenta */
            header .logo {
                order: 1;
            }
            header .kixuz-inline-search-box,
            header #kixuzInlineSearchBox {
                order: 2;
                flex: 1 1 120px !important;
                max-width: none !important;
            }
            header .user-menu {
                order: 3;
                margin-left: auto;
            }
            /* Fila 2 completa: enlaces de navegación limpios y con scroll suave si hace falta */
            header .nav-links {
                order: 4;
                flex: 1 0 100% !important;
                width: 100% !important;
                justify-content: flex-start !important;
                border-top: 1px solid rgba(108, 60, 224, 0.22);
                padding-top: 7px !important;
                gap: 6px !important;
            }
        }

        /* Móviles estrechos (<= 520px) */
        @media (max-width: 520px) {
            header {
                padding: 8px 10px !important;
                gap: 6px !important;
            }
            header .logo img {
                height: 26px !important;
            }
            header .kixuz-inline-search-box,
            header #kixuzInlineSearchBox {
                min-width: 90px !important;
            }
            header #activeCharSelect,
            header .user-menu select,
            header select.dropdown {
                max-width: 118px !important;
                min-width: 85px !important;
                font-size: 12px !important;
                padding: 5px 6px !important;
            }
            header .nav-links a {
                font-size: 12.5px !important;
                padding: 5px 8px !important;
            }
            .kixuz-theme-toggle-btn {
                padding: 5px 8px !important;
                font-size: 11.5px !important;
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

(() => {
    const STORAGE_KEY = 'kixuz_theme';
    const root = document.documentElement;

    const style = document.createElement('style');
    style.id = 'kixuz-theme-switch-styles';
    style.textContent = `
        /* Ocultar botones o íconos viejos de tema para evitar duplicados */
        .kixuz-theme-btn,
        .kixuz-theme-toggle,
        .kixuz-theme-toggle-btn,
        .kixuz-theme-switch-wrap,
        #kixuzThemeBtn,
        #kixuzThemeToggle,
        #kixuzThemeToggleBtn,
        .theme-icon,
        .theme-label {
            display: none !important;
        }

        /* Interruptor deslizante con SVG integrados */
        .kixuz-svg-switch {
            position: relative;
            width: 56px;
            height: 28px;
            border-radius: 999px;
            background: #23123D;
            border: 1.5px solid rgba(108, 60, 224, 0.75);
            padding: 0 7px;
            display: inline-flex !important;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            flex-shrink: 0;
            outline: none;
            box-sizing: border-box;
            transition: background 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease;
        }

        .kixuz-svg-switch:hover {
            border-color: var(--acento, #2DD4C4);
            box-shadow: 0 0 10px rgba(45, 212, 196, 0.25);
        }

        .kixuz-svg-switch svg {
            width: 13px;
            height: 13px;
            z-index: 1;
            pointer-events: none;
            flex-shrink: 0;
            transition: opacity 0.25s ease, transform 0.25s ease, color 0.25s ease;
        }

        .kixuz-svg-switch .svg-sun {
            color: #FBBF24;
            opacity: 0.45;
            transform: scale(0.9);
        }

        .kixuz-svg-switch .svg-moon {
            color: #2DD4C4;
            opacity: 1;
            transform: scale(1);
        }

        .kixuz-svg-thumb {
            position: absolute;
            top: 3px;
            left: 3px;
            width: 19px;
            height: 19px;
            border-radius: 50%;
            background: #EDE7E0;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.45);
            z-index: 2;
            transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.28s ease;
        }

        html[data-theme="light"] .kixuz-svg-switch {
            background: #E2D9F3;
            border-color: rgba(108, 60, 224, 0.55);
        }

        html[data-theme="light"] .kixuz-svg-switch .svg-sun {
            color: #D97706;
            opacity: 1;
            transform: scale(1);
        }

        html[data-theme="light"] .kixuz-svg-switch .svg-moon {
            color: #6C3CE0;
            opacity: 0.4;
            transform: scale(0.9);
        }

        html[data-theme="light"] .kixuz-svg-thumb {
            transform: translateX(27px);
            background: #6C3CE0;
        }

        html[data-theme="light"] {
            --bg-principal: #EDE7E0;
            --bg: #EDE7E0;
            --texto: #150A24;
            --bg-secundario: #6C3CE0;
            --acento: #0E8F82;
            --accent: #0E8F82;
            --bg-tarjeta: rgba(255, 255, 255, 0.88);
            --tarjeta: rgba(255, 255, 255, 0.88);
            --card: #FFFFFF;
            --card-2: #F4EFEA;
            --borde: rgba(108, 60, 224, 0.28);
            --border: rgba(108, 60, 224, 0.28);
            --muted: rgba(21, 10, 36, 0.68);
        }

        html[data-theme="light"] body {
            background-color: #EDE7E0 !important;
            color: #150A24 !important;
        }

        html[data-theme="light"] header {
            background-color: rgba(237, 231, 224, 0.95) !important;
            border-bottom-color: rgba(108, 60, 224, 0.25) !important;
        }

        html[data-theme="light"] input,
        html[data-theme="light"] textarea,
        html[data-theme="light"] select {
            background-color: rgba(255, 255, 255, 0.92) !important;
            color: #150A24 !important;
        }

        html[data-theme="light"] .kixuz-chat-sidebar {
            background-color: rgba(237, 231, 224, 0.98) !important;
            color: #150A24 !important;
        }
    `;

    if (!document.getElementById('kixuz-theme-switch-styles')) {
        document.head.appendChild(style);
    }

    function leerTema() {
        try {
            const guardado = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('kixuz_theme_mode');
            if (guardado === 'light' || guardado === 'dark') return guardado;
        } catch {}
        return 'dark';
    }

    function aplicarTema(tema) {
        const modo = tema === 'light' ? 'light' : 'dark';
        root.setAttribute('data-theme', modo);
        try {
            localStorage.setItem(STORAGE_KEY, modo);
            localStorage.setItem('kixuz_theme_mode', modo);
        } catch {}

        const sw = document.getElementById('kixuzThemeSwitch');
        if (sw) {
            sw.setAttribute('aria-checked', modo === 'light' ? 'true' : 'false');
            sw.setAttribute('title', modo === 'light' ? 'Modo Claro activo (cambiar a Oscuro)' : 'Modo Oscuro activo (cambiar a Claro)');
        }
        window.dispatchEvent(new CustomEvent('kixuz:theme-changed', { detail: { theme: modo } }));
    }

    function montarInterruptor() {
        const header = document.querySelector('header');
        if (!header) return;

        let sw = document.getElementById('kixuzThemeSwitch');
        if (!sw) {
            sw = document.createElement('button');
            sw.type = 'button';
            sw.id = 'kixuzThemeSwitch';
            sw.className = 'kixuz-svg-switch';
            sw.setAttribute('role', 'switch');
            sw.setAttribute('aria-label', 'Interruptor de modo claro y oscuro');
            sw.innerHTML = `
                <svg class="svg-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                </svg>
                <svg class="svg-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span class="kixuz-svg-thumb"></span>
            `;

            sw.addEventListener('click', () => {
                const actual = root.getAttribute('data-theme') || leerTema();
                aplicarTema(actual === 'light' ? 'dark' : 'light');
            });
        }

        const userMenu = header.querySelector('.user-menu');
        if (userMenu) {
            if (sw.parentElement !== userMenu) userMenu.appendChild(sw);
        } else if (!sw.parentElement) {
            header.appendChild(sw);
        }

        aplicarTema(leerTema());
    }

    window.KIXUZ_THEME = {
        getTheme: leerTema,
        setTheme: aplicarTema,
        mount: montarInterruptor
    };

    aplicarTema(leerTema());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', montarInterruptor);
    } else {
        montarInterruptor();
    }
    window.addEventListener('load', montarInterruptor);
})();

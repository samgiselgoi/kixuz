(() => {
    const STORAGE_KEY = 'kixuz_theme';

    const style = document.createElement('style');
    style.id = 'kixuz-theme-styles';
    style.textContent = `
        .theme-icon, .theme-label, #themeIcon, #kixuzThemeToggleBtn, .kixuz-theme-btn {
            display: none !important;
        }
        .kixuz-theme-switch {
            position: relative;
            width: 52px;
            height: 28px;
            border-radius: 999px;
            background: #2A164B;
            border: 1px solid rgba(108, 60, 224, 0.7);
            cursor: pointer;
            padding: 0 6px;
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
            transition: background 0.25s, border-color 0.25s;
        }
        .kixuz-theme-switch svg {
            width: 13px;
            height: 13px;
            z-index: 1;
            pointer-events: none;
            transition: opacity 0.25s, color 0.25s;
        }
        .kixuz-theme-switch .icon-sun {
            color: #FBBF24;
            opacity: 0.4;
        }
        .kixuz-theme-switch .icon-moon {
            color: #2DD4C4;
            opacity: 0.95;
        }
        .kixuz-theme-thumb {
            position: absolute;
            top: 3px;
            left: 3px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #EDE7E0;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s;
            z-index: 2;
        }
        html[data-theme="light"] .kixuz-theme-switch {
            background: #E9E2F8;
            border-color: rgba(108, 60, 224, 0.5);
        }
        html[data-theme="light"] .kixuz-theme-switch .icon-sun {
            opacity: 1;
            color: #D97706;
        }
        html[data-theme="light"] .kixuz-theme-switch .icon-moon {
            opacity: 0.35;
            color: #6C3CE0;
        }
        html[data-theme="light"] .kixuz-theme-thumb {
            transform: translateX(24px);
            background: #6C3CE0;
        }
    `;
    if (!document.getElementById('kixuz-theme-styles')) {
        document.head.appendChild(style);
    }

    function aplicarTema(tema) {
        const finalTheme = tema === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', finalTheme);
        try { localStorage.setItem(STORAGE_KEY, finalTheme); } catch {}
        const btn = document.getElementById('kixuzThemeSwitch');
        if (btn) {
            btn.setAttribute('aria-label', finalTheme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
            btn.setAttribute('title', finalTheme === 'light' ? 'Modo claro activo' : 'Modo oscuro activo');
        }
    }

    function montarSwitch() {
        const header = document.querySelector('header');
        if (!header) return;

        let btn = document.getElementById('kixuzThemeSwitch');
        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'kixuzThemeSwitch';
            btn.className = 'kixuz-theme-switch';
            btn.innerHTML = `
                <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                </svg>
                <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span class="kixuz-theme-thumb"></span>
            `;
            btn.addEventListener('click', () => {
                const actual = document.documentElement.getAttribute('data-theme') || 'dark';
                aplicarTema(actual === 'light' ? 'dark' : 'light');
            });
        }

        const userMenu = header.querySelector('.user-menu');
        if (userMenu && btn.parentElement !== userMenu) {
            userMenu.insertBefore(btn, userMenu.firstChild);
        } else if (!userMenu && !btn.parentElement) {
            header.appendChild(btn);
        }

        aplicarTema(localStorage.getItem(STORAGE_KEY) || 'dark');
    }

    aplicarTema(localStorage.getItem(STORAGE_KEY) || 'dark');
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', montarSwitch);
    } else {
        montarSwitch();
    }
    window.addEventListener('load', montarSwitch);
})();

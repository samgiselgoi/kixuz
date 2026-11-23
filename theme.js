(() => {
    const THEME_KEY = 'kixuz_theme_mode';
    const root = document.documentElement;

    function leerTema() {
        try {
            const t = localStorage.getItem(THEME_KEY);
            if (t === 'light' || t === 'dark') return t;
        } catch {}
        return 'dark';
    }

    function sincronizarSwitches() {
        const esClaro = leerTema() === 'light';
        document.querySelectorAll('input.kixuz-theme-switch-input').forEach(inp => {
            inp.checked = esClaro;
        });
        document.querySelectorAll('.kixuz-theme-icon').forEach(ic => {
            ic.textContent = esClaro ? '☀️' : '🌙';
        });
    }

    function aplicarTema(modo) {
        const val = modo === 'light' ? 'light' : 'dark';
        root.setAttribute('data-theme', val);
        try { localStorage.setItem(THEME_KEY, val); } catch {}
        sincronizarSwitches();
        window.dispatchEvent(new CustomEvent('kixuz:tema-cambiado', { detail: { theme: val } }));
    }

    function montarInterruptor() {
        if (document.getElementById('kixuzThemeSwitchWrap')) {
            sincronizarSwitches();
            return;
        }

        const header = document.querySelector('header');
        if (!header) return;

        const style = document.createElement('style');
        style.id = 'kixuz-theme-switch-style';
        style.textContent = `
            .kixuz-theme-switch-wrap {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                user-select: none;
            }
            .kixuz-theme-icon {
                font-size: 13px;
                line-height: 1;
            }
            .kixuz-switch {
                position: relative;
                display: inline-block;
                width: 42px;
                height: 22px;
                flex-shrink: 0;
            }
            .kixuz-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .kixuz-slider {
                position: absolute;
                cursor: pointer;
                inset: 0;
                background-color: rgba(108, 60, 224, 0.55);
                border: 1px solid var(--borde, rgba(108, 60, 224, 0.5));
                transition: 0.22s ease;
                border-radius: 999px;
            }
            .kixuz-slider::before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 2px;
                bottom: 2px;
                background-color: #EDE7E0;
                transition: 0.22s ease;
                border-radius: 50%;
            }
            .kixuz-switch input:checked + .kixuz-slider {
                background-color: var(--acento, #2DD4C4);
                border-color: var(--acento, #2DD4C4);
            }
            .kixuz-switch input:checked + .kixuz-slider::before {
                transform: translateX(20px);
                background-color: #150A24;
            }
        `;
        document.head.appendChild(style);

        const wrap = document.createElement('div');
        wrap.id = 'kixuzThemeSwitchWrap';
        wrap.className = 'kixuz-theme-switch-wrap';
        wrap.title = 'Cambiar entre tema claro y oscuro';
        wrap.innerHTML = `
            <span class="kixuz-theme-icon" aria-hidden="true">🌙</span>
            <label class="kixuz-switch" aria-label="Interruptor modo claro u oscuro">
                <input type="checkbox" class="kixuz-theme-switch-input" id="kixuzThemeToggleInput">
                <span class="kixuz-slider"></span>
            </label>
        `;

        const userMenu = header.querySelector('.user-menu');
        if (userMenu) {
            userMenu.prepend(wrap);
        } else {
            header.appendChild(wrap);
        }

        const inp = wrap.querySelector('#kixuzThemeToggleInput');
        inp.checked = leerTema() === 'light';
        inp.addEventListener('change', () => {
            aplicarTema(inp.checked ? 'light' : 'dark');
        });

        sincronizarSwitches();
    }

    window.KIXUZ_THEME = {
        aplicarTema,
        leerTema,
        montarInterruptor
    };

    aplicarTema(leerTema());
    window.addEventListener('DOMContentLoaded', montarInterruptor);
})();

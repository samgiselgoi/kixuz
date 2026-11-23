(() => {
    const THEME_KEY = 'kixuz_theme_mode';
    const root = document.documentElement;

    function aplicarTema(modo) {
        const val = modo === 'light' ? 'light' : 'dark';
        root.setAttribute('data-theme', val);
        try { localStorage.setItem(THEME_KEY, val); } catch {}
    }

    function leerTema() {
        try {
            const t = localStorage.getItem(THEME_KEY);
            if (t === 'light' || t === 'dark') return t;
        } catch {}
        return 'dark';
    }

    window.KIXUZ_THEME = { aplicarTema, leerTema };
    aplicarTema(leerTema());
})();

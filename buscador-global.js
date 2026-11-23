(() => {
    const style = document.createElement('style');
    style.id = 'kixuz-search-guest-styles';
    style.textContent = `
        .kixuz-search-wrap { position: relative; display: inline-flex; align-items: center; flex-shrink: 0; }
        .kixuz-search-toggle {
            height: 36px; padding: 0 11px; border-radius: 10px;
            border: 1px solid rgba(108, 60, 224, 0.45); background: rgba(108, 60, 224, 0.16);
            color: var(--texto, #EDE7E0); display: inline-flex; align-items: center; gap: 6px;
            font-family: 'Space Grotesk', sans-serif; font-size: 12.5px; font-weight: 600; cursor: pointer;
        }
        .kixuz-search-toggle:hover, .kixuz-search-wrap.open .kixuz-search-toggle {
            border-color: var(--acento, #2DD4C4); color: var(--acento, #2DD4C4);
        }
        .kixuz-search-panel {
            display: none; position: absolute; top: calc(100% + 8px); right: 0; width: 330px;
            max-width: calc(100vw - 24px); background: #1B0E30; border: 1px solid var(--acento, #2DD4C4);
            border-radius: 14px; padding: 10px; box-shadow: 0 16px 36px rgba(0, 0, 0, 0.72); z-index: 99999;
        }
        .kixuz-search-wrap.open .kixuz-search-panel { display: block; }
        html[data-theme="light"] .kixuz-search-panel { background: #FFFFFF; box-shadow: 0 14px 30px rgba(21, 10, 36, 0.18); }
        .kixuz-search-input {
            width: 100%; height: 36px; padding: 0 12px; border-radius: 999px;
            border: 1px solid rgba(108, 60, 224, 0.6); background: rgba(12, 6, 22, 0.85);
            color: var(--texto, #EDE7E0); font-family: 'Inter', sans-serif; font-size: 13.5px; outline: none;
        }
        html[data-theme="light"] .kixuz-search-input { background: #F4F1FA; color: #150A24; }
        .kixuz-search-list { margin-top: 8px; max-height: 290px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
        .kixuz-search-row {
            display: flex; align-items: center; justify-content: space-between; gap: 8px;
            padding: 8px 10px; border-radius: 9px; text-decoration: none; color: var(--texto, #EDE7E0);
        }
        html[data-theme="light"] .kixuz-search-row { color: #150A24; }
        .kixuz-search-row:hover { background: rgba(108, 60, 224, 0.28); }
        .kixuz-search-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 13px; }
        .kixuz-search-sub { font-size: 11.5px; color: var(--acento, #2DD4C4); }
        .kixuz-search-tag { font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(108, 60, 224, 0.3); flex-shrink: 0; }
    `;
    if (!document.getElementById('kixuz-search-guest-styles')) document.head.appendChild(style);

    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const norm = s => String(s || '').trim().toLowerCase();
    const normHandle = h => {
        const s = norm(h).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    let personajesCache = [];

    async function cargarPersonajes() {
        const mapa = new Map();
        const addChar = p => {
            if (!p) return;
            const handle = normHandle(p.handle || p.autorHandle || p.usuario || '');
            const nombre = String(p.nombre || p.autorNombre || p.author || '').trim() || (handle ? handle.slice(1) : '');
            if (!nombre && !handle) return;
            const k = handle || norm(nombre);
            const prev = mapa.get(k) || {};
            mapa.set(k, {
                nombre: nombre || prev.nombre,
                handle: handle || prev.handle || ('@' + norm(nombre).replace(/\s+/g, '_'))
            });
        };

        try {
            const subs = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            if (Array.isArray(subs)) subs.forEach(addChar);
            const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
            if (act) addChar(act);
            const fam = JSON.parse(localStorage.getItem('kixuz_familia_clan_v1') || '{}');
            (fam.familia || []).forEach(m => addChar({ nombre: m.nombre, handle: m.handle }));
            (fam.clan || []).forEach(m => addChar({ nombre: m.nombre, handle: m.handle }));
            const p1 = JSON.parse(localStorage.getItem('kixuz_posts_v1') || '[]');
            const p2 = JSON.parse(localStorage.getItem('kixuz_posts') || '[]');
            [...(Array.isArray(p1) ? p1 : []), ...(Array.isArray(p2) ? p2 : [])].forEach(post => {
                addChar({ nombre: post.autorNombre || post.author, handle: post.autorHandle || post.handle });
            });
        } catch {}

        if (window.KIXUZ_DB?.listarPersonajesPublicos) {
            try {
                const pub = await window.KIXUZ_DB.listarPersonajesPublicos();
                (pub || []).forEach(addChar);
            } catch {}
        }

        personajesCache = Array.from(mapa.values());
    }

    function urlPerfilInvitado(handle) {
        return `perfil.html?char=${encodeURIComponent(handle)}&guest=1`;
    }

    function initSearch() {
        const header = document.querySelector('header');
        if (!header || document.getElementById('kixuzSearchWrap')) return;

        const wrap = document.createElement('div');
        wrap.id = 'kixuzSearchWrap';
        wrap.className = 'kixuz-search-wrap';
        wrap.innerHTML = `
            <button type="button" class="kixuz-search-toggle" id="kixuzSearchToggle" aria-label="Buscar personaje">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="7"></circle>
                    <line x1="20" y1="20" x2="16.35" y2="16.35"></line>
                </svg>
                <span>Buscar</span>
            </button>
            <div class="kixuz-search-panel" id="kixuzSearchPanel">
                <input type="text" class="kixuz-search-input" id="kixuzSearchInput" placeholder="Buscar personaje o @usuario..." autocomplete="off">
                <div class="kixuz-search-list" id="kixuzSearchList"></div>
            </div>
        `;

        const userMenu = header.querySelector('.user-menu');
        if (userMenu) userMenu.insertBefore(wrap, userMenu.firstChild);
        else header.appendChild(wrap);

        const toggle = document.getElementById('kixuzSearchToggle');
        const input = document.getElementById('kixuzSearchInput');
        const listEl = document.getElementById('kixuzSearchList');

        function render(q = '') {
            const rawQ = String(q || '').trim();
            const term = norm(rawQ).replace(/^@+/, '');

            const coincidencias = term
                ? personajesCache.filter(p =>
                    norm(p.nombre).includes(term) ||
                    norm(p.handle).replace(/^@+/, '').includes(term)
                )
                : personajesCache.slice(0, 8);

            let html = coincidencias.slice(0, 8).map(p => `
                <a href="${urlPerfilInvitado(p.handle)}" class="kixuz-search-row">
                    <div>
                        <div class="kixuz-search-title">${esc(p.nombre)}</div>
                        <div class="kixuz-search-sub">${esc(p.handle)}</div>
                    </div>
                    <span class="kixuz-search-tag">Perfil (invitado)</span>
                </a>
            `).join('');

            const handleDirecto = normHandle(rawQ);
            if (handleDirecto && !coincidencias.some(c => normHandle(c.handle) === handleDirecto)) {
                html += `
                    <a href="${urlPerfilInvitado(handleDirecto)}" class="kixuz-search-row">
                        <div>
                            <div class="kixuz-search-title">Ver ${esc(handleDirecto)}</div>
                            <div class="kixuz-search-sub">Entrar como invitado</div>
                        </div>
                        <span class="kixuz-search-tag">Ir →</span>
                    </a>
                `;
            }

            listEl.innerHTML = html || `<div style="padding:10px;font-size:12px;opacity:0.75;text-align:center;">Escribí un nombre o @usuario para ir al perfil como invitado</div>`;
        }

        toggle.addEventListener('click', async e => {
            e.stopPropagation();
            const abierto = wrap.classList.toggle('open');
            if (abierto) {
                await cargarPersonajes();
                render(input.value);
                setTimeout(() => input.focus(), 20);
            }
        });

        input.addEventListener('input', () => render(input.value));
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const firstLink = listEl.querySelector('a[href]');
                if (firstLink) {
                    e.preventDefault();
                    window.location.href = firstLink.getAttribute('href');
                }
            }
        });

        document.addEventListener('click', e => {
            if (!wrap.contains(e.target)) wrap.classList.remove('open');
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSearch);
    else initSearch();
    window.addEventListener('load', initSearch);
})();

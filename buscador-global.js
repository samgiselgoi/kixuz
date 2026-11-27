(() => {
    const norm = v => String(v || '').trim().toLowerCase();
    const normHandle = h => {
        const s = norm(h).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };
    const esc = s => String(s || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const style = document.createElement('style');
    style.id = 'kixuz-global-search-style';
    style.textContent = `
        .kixuz-search-toggle-wrap {
            position: relative;
            display: inline-flex;
            align-items: center;
            flex-shrink: 0;
        }
        .kixuz-search-icon-btn {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            border: 1px solid rgba(108, 60, 224, 0.45);
            background: rgba(108, 60, 224, 0.18);
            color: var(--texto, #EDE7E0);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: border-color 0.2s, color 0.2s;
        }
        .kixuz-search-icon-btn:hover {
            border-color: var(--acento, #2DD4C4);
            color: var(--acento, #2DD4C4);
        }
        .kixuz-search-popover {
            display: none;
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            width: 290px;
            max-width: calc(100vw - 24px);
            background: #1a0d2e;
            color: var(--texto, #EDE7E0);
            border: 1px solid var(--acento, #2DD4C4);
            border-radius: 12px;
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.78);
            padding: 8px;
            z-index: 9999;
        }
        html[data-theme="light"] .kixuz-search-popover {
            background: #ffffff;
            color: #150A24;
        }
        .kixuz-search-popover.open {
            display: block;
        }
        .kixuz-search-popover input {
            width: 100%;
            padding: 8px 10px;
            border-radius: 8px;
            border: 1px solid rgba(108, 60, 224, 0.45);
            background: rgba(0, 0, 0, 0.3);
            color: inherit;
            font-size: 13px;
            outline: none;
        }
        .kixuz-search-list {
            max-height: 270px;
            overflow-y: auto;
            margin-top: 6px;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .kixuz-search-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 7px 9px;
            border-radius: 8px;
            text-decoration: none;
            color: inherit;
            font-size: 12.5px;
        }
        .kixuz-search-row:hover {
            background: rgba(45, 212, 196, 0.16);
        }
    `;
    if (!document.getElementById('kixuz-global-search-style')) {
        document.head.appendChild(style);
    }

    let catalogo = [];

    function recolectarLocal() {
        const mapa = new Map();
        const add = p => {
            if (!p) return;
            const nombre = String(p.nombre || p.autorNombre || '').trim();
            const handle = normHandle(p.handle || p.autorHandle || '');
            if (!nombre && !handle) return;
            if (handle === '@cypher_hacker') return;
            const k = handle || norm(nombre);
            mapa.set(k, {
                nombre: nombre || handle.replace(/^@/, ''),
                handle: handle || ('@' + norm(nombre).replace(/\s+/g, '_')),
                clan: p.clan || ''
            });
        };
        try { JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]').forEach(add); } catch {}
        try {
            const fam = JSON.parse(localStorage.getItem('kixuz_familia_clan_v1') || '{}');
            (fam.familia || []).forEach(add);
            (fam.clan || []).forEach(c => add({ nombre: c.nombre, handle: c.handle, clan: c.clanNombre }));
        } catch {}
        try {
            JSON.parse(localStorage.getItem('kixuz_posts_v1') || '[]').forEach(p => {
                add({ nombre: p.autorNombre, handle: p.autorHandle });
                if (p.muroHandle) add({ nombre: p.muroNombre, handle: p.muroHandle });
            });
        } catch {}
        return Array.from(mapa.values());
    }

    async function cargarTodo() {
        const mapa = new Map();
        recolectarLocal().forEach(p => mapa.set(p.handle, p));
        if (window.KIXUZ_DB?.listarPersonajesPublicos) {
            try {
                const rem = await window.KIXUZ_DB.listarPersonajesPublicos();
                (rem || []).forEach(p => {
                    const h = normHandle(p.handle || p.nombre);
                    if (h && h !== '@cypher_hacker') {
                        mapa.set(h, { nombre: p.nombre || h.replace(/^@/, ''), handle: h, clan: p.clan || '' });
                    }
                });
            } catch {}
        }
        catalogo = Array.from(mapa.values());
    }

    function montarBuscador() {
        const header = document.querySelector('header');
        if (!header || document.getElementById('kixuzSearchToggleWrap')) return;

        const wrap = document.createElement('div');
        wrap.id = 'kixuzSearchToggleWrap';
        wrap.className = 'kixuz-search-toggle-wrap';
        wrap.innerHTML = `
            <button type="button" class="kixuz-search-icon-btn" id="kixuzSearchBtn" title="Buscar personajes, @usuarios, clanes o universos" aria-label="Buscar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <div class="kixuz-search-popover" id="kixuzSearchPopover">
                <input type="search" id="kixuzSearchInput" placeholder="Buscar @usuario, personaje o clan..." autocomplete="off">
                <div class="kixuz-search-list" id="kixuzSearchList"></div>
            </div>
        `;

        const userMenu = header.querySelector('.user-menu');
        if (userMenu) userMenu.prepend(wrap);
        else header.appendChild(wrap);

        const btn = document.getElementById('kixuzSearchBtn');
        const pop = document.getElementById('kixuzSearchPopover');
        const input = document.getElementById('kixuzSearchInput');
        const list = document.getElementById('kixuzSearchList');

        function render(qRaw) {
            const q = norm(qRaw).replace(/^@+/, '');
            const filtrados = q
                ? catalogo.filter(p => norm(p.nombre).includes(q) || norm(p.handle).includes(q) || norm(p.clan).includes(q))
                : catalogo.slice(0, 8);

            let html = filtrados.slice(0, 8).map(p => `
                <a href="perfil.html?char=${encodeURIComponent(p.handle)}" class="kixuz-search-row">
                    <div>
                        <div style="font-weight:700;">${esc(p.nombre)}</div>
                        <div style="font-size:11px; color:var(--acento);">${esc(p.handle)}${p.clan ? ' · ' + esc(p.clan) : ''}</div>
                    </div>
                    <span style="font-size:11px; opacity:0.75;">Ver</span>
                </a>
            `).join('');

            const hDirecto = normHandle(qRaw);
            if (hDirecto && !filtrados.some(p => p.handle === hDirecto)) {
                html += `
                    <a href="perfil.html?char=${encodeURIComponent(hDirecto)}" class="kixuz-search-row" style="border-top:1px solid rgba(108,60,224,0.25);">
                        <div>
                            <div style="font-weight:700;">Visitar ${esc(hDirecto)}</div>
                            <div style="font-size:11px; opacity:0.75;">Abrir perfil</div>
                        </div>
                        <span>→</span>
                    </a>
                `;
            }

            list.innerHTML = html || `<div style="padding:8px; font-size:12px; opacity:0.75;">Sin resultados</div>`;
        }

        btn.addEventListener('click', async e => {
            e.stopPropagation();
            const abierto = pop.classList.toggle('open');
            if (abierto) {
                catalogo = recolectarLocal();
                render(input.value);
                input.focus();
                await cargarTodo();
                render(input.value);
            }
        });

        input.addEventListener('input', () => render(input.value));
        document.addEventListener('click', e => {
            if (!wrap.contains(e.target)) pop.classList.remove('open');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', montarBuscador);
    } else {
        montarBuscador();
    }
})();

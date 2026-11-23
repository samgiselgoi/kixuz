(() => {
    const style = document.createElement('style');
    style.id = 'kixuz-search-styles';
    style.textContent = `
        .kixuz-search-wrap {
            position: relative;
            display: inline-flex;
            align-items: center;
            flex-shrink: 0;
            z-index: 9510;
        }
        .kixuz-search-toggle {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            border: 1px solid rgba(108, 60, 224, 0.45);
            background: rgba(108, 60, 224, 0.16);
            color: var(--texto, #EDE7E0);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .kixuz-search-toggle:hover,
        .kixuz-search-wrap.expanded .kixuz-search-toggle {
            background: rgba(108, 60, 224, 0.34);
            border-color: var(--acento, #2DD4C4);
            color: var(--acento, #2DD4C4);
        }
        .kixuz-search-popover {
            display: none;
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            width: 330px;
            max-width: calc(100vw - 24px);
            background: #1B0E30;
            border: 1px solid var(--acento, #2DD4C4);
            border-radius: 14px;
            box-shadow: 0 16px 38px rgba(0, 0, 0, 0.75);
            padding: 10px;
            z-index: 99999;
        }
        .kixuz-search-wrap.expanded .kixuz-search-popover {
            display: block;
        }
        html[data-theme="light"] .kixuz-search-popover {
            background: #FFFFFF;
            box-shadow: 0 14px 32px rgba(21, 10, 36, 0.18);
        }
        .kixuz-search-box {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
            height: 38px;
            background: rgba(12, 6, 22, 0.85);
            border: 1px solid rgba(108, 60, 224, 0.6);
            border-radius: 999px;
            padding: 0 34px 0 14px;
        }
        html[data-theme="light"] .kixuz-search-box { background: #F4F1FA; }
        .kixuz-search-box:focus-within { border-color: var(--acento, #2DD4C4); }
        .kixuz-search-input {
            width: 100%;
            border: none;
            background: transparent;
            color: var(--texto, #EDE7E0);
            font-family: 'Inter', sans-serif;
            font-size: 13.5px;
            outline: none;
        }
        html[data-theme="light"] .kixuz-search-input { color: #150A24; }
        .kixuz-search-clear {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: none;
            background: rgba(108, 60, 224, 0.35);
            color: var(--texto, #EDE7E0);
            display: none;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 0;
        }
        .kixuz-search-clear.visible { display: flex; }
        .kixuz-search-results {
            margin-top: 8px;
            max-height: 290px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .kixuz-res-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 8px 10px;
            border-radius: 9px;
            text-decoration: none !important;
            color: var(--texto, #EDE7E0) !important;
            transition: background 0.18s;
        }
        html[data-theme="light"] .kixuz-res-item { color: #150A24 !important; }
        .kixuz-res-item:hover { background: rgba(108, 60, 224, 0.28); }
        .kixuz-res-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 13px; }
        .kixuz-res-handle { font-size: 11.5px; color: var(--acento, #2DD4C4); font-weight: 600; }
        .kixuz-res-badge {
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 999px;
            background: rgba(108, 60, 224, 0.3);
            color: var(--texto, #EDE7E0);
            flex-shrink: 0;
        }
        html[data-theme="light"] .kixuz-res-badge { background: rgba(108, 60, 224, 0.12); color: #4C24B5; }
    `;
    if (!document.getElementById('kixuz-search-styles')) {
        document.head.appendChild(style);
    }

    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const norm = s => String(s || '').trim().toLowerCase();
    const normHandle = h => {
        const s = norm(h).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    let catalogo = [];

    async function cargarCatalogo() {
        const mapa = new Map();
        const agregar = (p, etiqueta = 'Ficha') => {
            if (!p) return;
            const nombre = String(p.nombre || p.autorNombre || p.author || '').trim();
            const handle = normHandle(p.handle || p.autorHandle || p.usuario || '');
            if (!nombre && !handle) return;
            const k = handle || norm(nombre);
            const prev = mapa.get(k) || {};
            mapa.set(k, {
                nombre: nombre || prev.nombre || handle.replace(/^@/, ''),
                handle: handle || prev.handle || ('@' + norm(nombre).replace(/\s+/g, '_')),
                clan: p.clan || prev.clan || '',
                etiqueta: prev.etiqueta === 'Mi Personaje' ? 'Mi Personaje' : etiqueta,
                url: `perfil.html?char=${encodeURIComponent(handle || prev.handle || ('@' + norm(nombre).replace(/\s+/g, '_')))}`
            });
        };

        try {
            const subs = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            if (Array.isArray(subs)) subs.forEach(p => agregar(p, 'Mi Personaje'));
        } catch {}

        try {
            const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
            if (act) agregar(act, 'Mi Personaje');
        } catch {}

        try {
            const fam = JSON.parse(localStorage.getItem('kixuz_familia_clan_v1') || '{}');
            if (Array.isArray(fam.familia)) fam.familia.forEach(m => agregar({ nombre: m.nombre, handle: m.handle }, 'Visitar'));
            if (Array.isArray(fam.clan)) fam.clan.forEach(m => agregar({ nombre: m.nombre, handle: m.handle, clan: m.clanNombre }, 'Visitar'));
        } catch {}

        try {
            const posts = [
                ...JSON.parse(localStorage.getItem('kixuz_posts_v1') || '[]'),
                ...JSON.parse(localStorage.getItem('kixuz_posts') || '[]')
            ];
            posts.forEach(p => agregar(p, 'Visitar'));
        } catch {}

        if (window.KIXUZ_DB?.listarPersonajesPublicos) {
            try {
                const pub = await window.KIXUZ_DB.listarPersonajesPublicos();
                (pub || []).forEach(p => agregar(p, 'Visitar'));
            } catch {}
        }

        catalogo = Array.from(mapa.values());
    }

    function initBuscador() {
        const header = document.querySelector('header');
        if (!header || document.getElementById('kixuzSearchWrap')) return;

        header.querySelectorAll('.kixuz-top-search-strip, .kixuz-inline-search-box').forEach(el => el.remove());

        const wrap = document.createElement('div');
        wrap.id = 'kixuzSearchWrap';
        wrap.className = 'kixuz-search-wrap';
        wrap.innerHTML = `
            <button type="button" class="kixuz-search-toggle" id="kixuzSearchToggle" title="Buscar" aria-label="Buscar">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="7"></circle>
                    <line x1="20" y1="20" x2="16.35" y2="16.35"></line>
                </svg>
            </button>
            <div class="kixuz-search-popover" id="kixuzSearchPopover">
                <div class="kixuz-search-box">
                    <input type="text" class="kixuz-search-input" id="kixuzSearchInput" placeholder="Buscar personaje, @usuario, clan..." autocomplete="off">
                    <button type="button" class="kixuz-search-clear" id="kixuzSearchClear" aria-label="Limpiar">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="kixuz-search-results" id="kixuzSearchResults"></div>
            </div>
        `;

        const userMenu = header.querySelector('.user-menu');
        if (userMenu) userMenu.insertBefore(wrap, userMenu.firstChild);
        else header.appendChild(wrap);

        const toggle = document.getElementById('kixuzSearchToggle');
        const input = document.getElementById('kixuzSearchInput');
        const clearBtn = document.getElementById('kixuzSearchClear');
        const resultsBox = document.getElementById('kixuzSearchResults');

        function renderResultados(q) {
            const term = norm(q).replace(/^@+/, '');
            clearBtn.classList.toggle('visible', q.trim().length > 0);

            const matches = term
                ? catalogo.filter(item =>
                    norm(item.nombre).includes(term) ||
                    norm(item.handle).replace(/^@+/, '').includes(term) ||
                    norm(item.clan).includes(term)
                )
                : catalogo.slice(0, 8);

            let html = matches.slice(0, 8).map(item => `
                <a href="${item.url}" class="kixuz-res-item">
                    <div>
                        <div class="kixuz-res-name">${esc(item.nombre)}</div>
                        <div class="kixuz-res-handle">${esc(item.handle)}${item.clan ? ' · ' + esc(item.clan) : ''}</div>
                    </div>
                    <span class="kixuz-res-badge">${esc(item.etiqueta)}</span>
                </a>
            `).join('');

            const directH = term ? normHandle(q) : '';
            if (directH && !matches.some(m => normHandle(m.handle) === directH)) {
                html += `
                    <a href="perfil.html?char=${encodeURIComponent(directH)}" class="kixuz-res-item">
                        <div>
                            <div class="kixuz-res-name">Visitar ${esc(directH)}</div>
                            <div class="kixuz-res-handle">Abrir perfil como visitante</div>
                        </div>
                        <span class="kixuz-res-badge">Ir →</span>
                    </a>
                `;
            }

            resultsBox.innerHTML = html || `<div style="padding:10px;font-size:12px;opacity:0.75;text-align:center;">Escribí un @usuario para visitar su perfil</div>`;
        }

        toggle.addEventListener('click', async (e) => {
            e.stopPropagation();
            const abierto = wrap.classList.toggle('expanded');
            if (abierto) {
                await cargarCatalogo();
                renderResultados(input.value);
                setTimeout(() => input.focus(), 30);
            }
        });

        input.addEventListener('input', () => renderResultados(input.value));
        clearBtn.addEventListener('click', () => {
            input.value = '';
            renderResultados('');
            input.focus();
        });

        document.addEventListener('click', (e) => {
            if (!wrap.contains(e.target)) wrap.classList.remove('expanded');
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBuscador);
    else initBuscador();
    window.addEventListener('load', initBuscador);
})();

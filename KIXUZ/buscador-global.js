(() => {
    const style = document.createElement('style');
    style.textContent = `
        .kixuz-inline-search-box {
            position: relative;
            width: clamp(92px, 13vw, 175px) !important;
            max-width: 175px !important;
            min-width: 82px !important;
            flex: 0 1 auto !important;
            z-index: 9510;
        }
        .kixuz-inline-search-input {
            width: 100% !important;
            background: rgba(0, 0, 0, 0.36);
            color: var(--texto, #EDE7E0);
            border: 1px solid rgba(45, 212, 196, 0.55);
            border-radius: 9px;
            padding: clamp(4px, 0.5vw, 6px) clamp(7px, 0.8vw, 10px);
            font-family: 'Inter', sans-serif;
            font-size: clamp(11px, 0.95vw, 12.5px);
            outline: none;
        }
        html[data-theme="light"] .kixuz-inline-search-input {
            background: #ffffff;
            color: #150A24;
        }
        .kixuz-inline-search-input:focus {
            border-color: var(--acento, #2DD4C4);
        }
        .kixuz-inline-search-dropdown {
            display: none;
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            width: 280px;
            max-width: calc(100vw - 24px);
            max-height: 320px;
            overflow-y: auto;
            background: #1a0d2e;
            color: var(--texto, #EDE7E0);
            border: 1px solid var(--acento, #2DD4C4);
            border-radius: 12px;
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.78);
            z-index: 99999;
            padding: 6px;
        }
        html[data-theme="light"] .kixuz-inline-search-dropdown {
            background: #ffffff;
            color: #150A24;
        }
        .kixuz-inline-search-dropdown.open {
            display: block;
        }
        .kixuz-inline-search-item {
            padding: 8px 10px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            color: inherit;
            font-size: 12.5px;
            cursor: pointer;
        }
        .kixuz-inline-search-item:hover {
            background: rgba(108, 60, 224, 0.28);
        }
        .kixuz-inline-search-handle {
            font-size: 11px;
            color: var(--acento, #2DD4C4);
            font-weight: 700;
        }
    `;
    document.head.appendChild(style);

    const esc = s => String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const norm = s => String(s || '').trim().toLowerCase();
    const normHandle = h => {
        const s = norm(h).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    let catalogo = [];
    let timer = null;

    function recolectarCatalogoLocal() {
        const mapa = new Map();
        const agregar = p => {
            if (!p) return;
            const nombre = String(p.nombre || p.autorNombre || '').trim();
            const handle = normHandle(p.handle || p.autorHandle || (nombre ? '@' + nombre : ''));
            if (!nombre && !handle) return;
            const key = handle || norm(nombre);
            const prev = mapa.get(key) || {};
            mapa.set(key, {
                ...prev,
                nombre: nombre || prev.nombre || handle.replace(/^@/, ''),
                handle: handle || prev.handle,
                clan: p.clan || prev.clan || '',
                universos: Array.isArray(p.universos) && p.universos.length ? p.universos : (prev.universos || [])
            });
        };

        try {
            const subs = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            if (Array.isArray(subs)) subs.forEach(agregar);
        } catch {}
        try {
            const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
            if (act && !act.esPlaceholder) agregar(act);
        } catch {}
        try {
            const fam = JSON.parse(localStorage.getItem('kixuz_familia_clan_v1') || '{}');
            if (Array.isArray(fam.familia)) fam.familia.forEach(m => agregar({ nombre: m.nombre, handle: m.handle }));
            if (Array.isArray(fam.clan)) fam.clan.forEach(m => agregar({ nombre: m.nombre, handle: m.handle, clan: m.clanNombre || '' }));
        } catch {}
        try {
            const am = JSON.parse(localStorage.getItem('kixuz_solicitudes_amistad_v1') || '[]');
            if (Array.isArray(am)) {
                am.forEach(s => {
                    agregar({ nombre: s.deNombre, handle: s.deHandle });
                    agregar({ nombre: s.paraNombre, handle: s.paraHandle });
                });
            }
        } catch {}
        try {
            const posts = JSON.parse(localStorage.getItem('kixuz_posts_v1') || '[]');
            if (Array.isArray(posts)) {
                posts.forEach(p => {
                    agregar({ nombre: p.autorNombre, handle: p.autorHandle, universos: p.universo ? [p.universo] : [] });
                    if (p.muroHandle) agregar({ nombre: p.muroNombre, handle: p.muroHandle });
                });
            }
        } catch {}

        return Array.from(mapa.values());
    }

    async function cargarCatalogo() {
        const mapa = new Map();
        recolectarCatalogoLocal().forEach(p => {
            const k = normHandle(p.handle) || norm(p.nombre);
            if (k) mapa.set(k, p);
        });
        if (window.KIXUZ_DB?.listarPersonajesPublicos) {
            try {
                const pub = await window.KIXUZ_DB.listarPersonajesPublicos();
                (pub || []).forEach(p => {
                    if (!p) return;
                    const h = normHandle(p.handle);
                    const k = h || norm(p.nombre);
                    if (k) {
                        const prev = mapa.get(k) || {};
                        mapa.set(k, {
                            ...prev,
                            ...p,
                            nombre: p.nombre || prev.nombre || h.replace(/^@/, ''),
                            handle: h || prev.handle
                        });
                    }
                });
            } catch {}
        }
        catalogo = Array.from(mapa.values());
    }

    function limpiarBarrasViejas() {
        document.querySelectorAll('#kixuzTopSearchStrip, .kixuz-top-search-strip').forEach(el => el.remove());
    }

    function montarBuscadorEnLinea() {
        limpiarBarrasViejas();
        const header = document.querySelector('header');
        if (!header || document.getElementById('kixuzInlineSearchBox')) return;

        const box = document.createElement('div');
        box.id = 'kixuzInlineSearchBox';
        box.className = 'kixuz-inline-search-box';
        box.innerHTML = `
            <input type="search" id="kixuzTopSearchInput" class="kixuz-inline-search-input" placeholder="🔍 Buscar..." autocomplete="off">
            <div id="kixuzTopSearchDropdown" class="kixuz-inline-search-dropdown"></div>
        `;

        const logo = header.querySelector('.logo');
        if (logo && logo.nextSibling) {
            header.insertBefore(box, logo.nextSibling);
        } else {
            header.prepend(box);
        }

        const input = document.getElementById('kixuzTopSearchInput');
        input.addEventListener('focus', async () => {
            catalogo = recolectarCatalogoLocal();
            renderResultados(input.value);
            await cargarCatalogo();
            renderResultados(input.value);
        });
        input.addEventListener('input', () => {
            catalogo = recolectarCatalogoLocal();
            renderResultados(input.value);
            clearTimeout(timer);
            timer = setTimeout(async () => {
                await cargarCatalogo();
                renderResultados(input.value);
            }, 140);
        });
        document.addEventListener('click', e => {
            const drop = document.getElementById('kixuzTopSearchDropdown');
            if (!box.contains(e.target) && drop) {
                drop.classList.remove('open');
            }
        });
    }

    function renderResultados(textoRaw) {
        const drop = document.getElementById('kixuzTopSearchDropdown');
        if (!drop) return;

        const q = norm(textoRaw).replace(/^@+/, '');
        if (!q) {
            drop.classList.remove('open');
            return;
        }

        const coincidencias = catalogo.filter(p => {
            const nombre = norm(p.nombre);
            const handle = norm(p.handle).replace(/^@+/, '');
            const clan = norm(p.clan);
            const unis = Array.isArray(p.universos) ? norm(p.universos.join(' ')) : '';
            return nombre.includes(q) || handle.includes(q) || clan.includes(q) || unis.includes(q);
        });

        const handleDirecto = normHandle(textoRaw);
        const yaEsta = handleDirecto && coincidencias.some(p => normHandle(p.handle) === handleDirecto);

        let html = coincidencias.slice(0, 7).map(p => {
            const h = normHandle(p.handle) || ('@' + norm(p.nombre).replace(/\s+/g, '_'));
            return `
                <a href="perfil.html?char=${encodeURIComponent(h)}" class="kixuz-inline-search-item">
                    <div>
                        <div style="font-weight:700;">${esc(p.nombre || 'Personaje')}</div>
                        <div class="kixuz-inline-search-handle">${esc(h)}${p.clan ? ' · ' + esc(p.clan) : ''}</div>
                    </div>
                    <span style="font-size:11px; opacity:0.78;">Ver →</span>
                </a>
            `;
        }).join('');

        if (handleDirecto && !yaEsta) {
            html += `
                <a href="perfil.html?char=${encodeURIComponent(handleDirecto)}" class="kixuz-inline-search-item" style="border-top:1px solid rgba(108,60,224,0.25); margin-top:4px;">
                    <div>
                        <div style="font-weight:700;">Abrir ${esc(handleDirecto)}</div>
                        <div class="kixuz-inline-search-handle">Ir al perfil</div>
                    </div>
                    <span style="font-size:11px; opacity:0.78;">→</span>
                </a>
            `;
        }

        if (!html) {
            html = `<div style="padding:9px; font-size:12px; opacity:0.75;">Sin resultados para "${esc(textoRaw)}".</div>`;
        }

        drop.innerHTML = html;
        drop.classList.add('open');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            montarBuscadorEnLinea();
            catalogo = recolectarCatalogoLocal();
            await cargarCatalogo();
        });
    } else {
        montarBuscadorEnLinea();
        catalogo = recolectarCatalogoLocal();
        cargarCatalogo();
    }

    window.addEventListener('kixuz:personajes-actualizados', () => {
        catalogo = recolectarCatalogoLocal();
        cargarCatalogo();
    });
})();

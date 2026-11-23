(() => {
    const style = document.createElement('style');
    style.id = 'kixuz-search-all-styles';
    style.textContent = `
        .kixuz-search-wrap {
            position: relative;
            display: inline-flex;
            align-items: center;
            flex-shrink: 0;
        }
        .kixuz-search-toggle {
            height: 36px;
            padding: 0 11px;
            border-radius: 10px;
            border: 1px solid rgba(108, 60, 224, 0.45);
            background: rgba(108, 60, 224, 0.16);
            color: var(--texto, #EDE7E0);
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
        }
        .kixuz-search-toggle:hover,
        .kixuz-search-wrap.open .kixuz-search-toggle {
            border-color: var(--acento, #2DD4C4);
            color: var(--acento, #2DD4C4);
        }
        .kixuz-search-panel {
            display: none;
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            width: 340px;
            max-width: calc(100vw - 24px);
            background: #1B0E30;
            border: 1px solid var(--acento, #2DD4C4);
            border-radius: 14px;
            padding: 10px;
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.72);
            z-index: 99999;
        }
        .kixuz-search-wrap.open .kixuz-search-panel {
            display: block;
        }
        html[data-theme="light"] .kixuz-search-panel {
            background: #FFFFFF;
            box-shadow: 0 14px 30px rgba(21, 10, 36, 0.18);
        }
        .kixuz-search-input {
            width: 100%;
            height: 36px;
            padding: 0 12px;
            border-radius: 999px;
            border: 1px solid rgba(108, 60, 224, 0.6);
            background: rgba(12, 6, 22, 0.85);
            color: var(--texto, #EDE7E0);
            font-family: 'Inter', sans-serif;
            font-size: 13.5px;
            outline: none;
        }
        html[data-theme="light"] .kixuz-search-input {
            background: #F4F1FA;
            color: #150A24;
        }
        .kixuz-search-list {
            margin-top: 8px;
            max-height: 300px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .kixuz-search-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 8px 10px;
            border-radius: 9px;
            text-decoration: none;
            color: var(--texto, #EDE7E0);
            transition: background 0.16s ease;
        }
        html[data-theme="light"] .kixuz-search-row {
            color: #150A24;
        }
        .kixuz-search-row:hover {
            background: rgba(108, 60, 224, 0.28);
        }
        .kixuz-search-title {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 13px;
        }
        .kixuz-search-sub {
            font-size: 11.5px;
            color: var(--acento, #2DD4C4);
        }
        .kixuz-search-tag {
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 999px;
            background: rgba(108, 60, 224, 0.3);
            flex-shrink: 0;
        }
    `;
    if (!document.getElementById('kixuz-search-all-styles')) {
        document.head.appendChild(style);
    }

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

    let resultadosCache = [];

    async function construirIndice() {
        const items = [];
        const vistos = new Set();

        const pushItem = (key, item) => {
            if (!key || vistos.has(key)) return;
            vistos.add(key);
            items.push(item);
        };

        // 1. Personajes / usuarios (locales + públicos)
        const charMap = new Map();
        const addChar = (p, badge = 'Usuario') => {
            if (!p) return;
            const handle = normHandle(p.handle || p.autorHandle || p.usuario || '');
            const nombre = String(p.nombre || p.autorNombre || p.author || '').trim() || (handle ? handle.slice(1) : '');
            if (!nombre && !handle) return;
            const k = handle || norm(nombre);
            const prev = charMap.get(k) || {};
            charMap.set(k, {
                nombre: nombre || prev.nombre,
                handle: handle || prev.handle,
                clan: p.clan || prev.clan || '',
                badge: prev.badge || badge
            });
        };

        try {
            const subs = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            if (Array.isArray(subs)) subs.forEach(p => addChar(p, 'Personaje'));
            const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
            if (act) addChar(act, 'Personaje');
            const p1 = JSON.parse(localStorage.getItem('kixuz_posts_v1') || '[]');
            const p2 = JSON.parse(localStorage.getItem('kixuz_posts') || '[]');
            [...(Array.isArray(p1) ? p1 : []), ...(Array.isArray(p2) ? p2 : [])].forEach(post => {
                addChar({ nombre: post.autorNombre || post.author, handle: post.autorHandle || post.handle }, 'Usuario');
            });
        } catch {}

        if (window.KIXUZ_DB?.listarPersonajesPublicos) {
            try {
                const pub = await window.KIXUZ_DB.listarPersonajesPublicos();
                (pub || []).forEach(p => addChar(p, 'Usuario'));
            } catch {}
        }

        charMap.forEach(c => {
            pushItem(`char_${c.handle || norm(c.nombre)}`, {
                tipo: 'char',
                titulo: c.nombre,
                subtitulo: `${c.handle}${c.clan ? ' · ' + c.clan : ''}`,
                badge: c.badge,
                url: `perfil.html?char=${encodeURIComponent(c.handle)}`
            });
        });

        // 2. Familia / Clan
        try {
            const fam = JSON.parse(localStorage.getItem('kixuz_familia_clan_v1') || '{}');
            (fam.familia || []).forEach(m => {
                if (!m) return;
                pushItem(`fam_${m.id || m.handle}_${m.relacion || ''}`, {
                    tipo: 'familia',
                    titulo: m.nombre || m.handle || 'Familia',
                    subtitulo: `Familia · ${m.relacion || 'Vínculo'} (${m.handle || ''})`,
                    badge: 'Familia',
                    url: `familia.html?char=${encodeURIComponent(normHandle(m.duenoHandle || m.handle))}`
                });
            });
            (fam.clan || []).forEach(m => {
                if (!m) return;
                const cNom = m.clanNombre || 'Clan';
                pushItem(`clan_${m.id || cNom}_${m.handle || ''}`, {
                    tipo: 'clan',
                    titulo: `${cNom}${m.nombre ? ' · ' + m.nombre : ''}`,
                    subtitulo: `${m.rango || 'Miembro'}${m.handle ? ' · ' + m.handle : ''}`,
                    badge: 'Clan',
                    url: `familia.html?char=${encodeURIComponent(normHandle(m.duenoHandle || m.handle))}#clan`
                });
            });
        } catch {}

        // 3. Universos
        const uniSet = new Set(['#Kixuz']);
        if (window.KIXUZ_UNIVERSOS?.leerUniversos) {
            try {
                window.KIXUZ_UNIVERSOS.leerUniversos().forEach(u => {
                    if (u?.tag) uniSet.add(u.tag.startsWith('#') ? u.tag : '#' + u.tag.replace(/^#+/, ''));
                });
            } catch {}
        }
        charMap.forEach(c => {
            if (Array.isArray(c.universos)) {
                c.universos.forEach(u => {
                    if (u) uniSet.add(String(u).startsWith('#') ? String(u) : '#' + String(u).replace(/^#+/, ''));
                });
            }
        });
        try {
            const p1 = JSON.parse(localStorage.getItem('kixuz_posts_v1') || '[]');
            const p2 = JSON.parse(localStorage.getItem('kixuz_posts') || '[]');
            [...(Array.isArray(p1) ? p1 : []), ...(Array.isArray(p2) ? p2 : [])].forEach(post => {
                const u = post.universo || post.universe || '';
                if (u) uniSet.add(String(u).startsWith('#') ? String(u) : '#' + String(u).replace(/^#+/, ''));
            });
        } catch {}

        uniSet.forEach(tag => {
            const slug = tag.replace(/^#/, '');
            pushItem(`uni_${slug.toLowerCase()}`, {
                tipo: 'universo',
                titulo: tag,
                subtitulo: 'Explorar universo',
                badge: 'Universo',
                url: `universo.html?u=${encodeURIComponent(slug)}`
            });
        });

        resultadosCache = items;
    }

    function initSearch() {
        const header = document.querySelector('header');
        if (!header || document.getElementById('kixuzSearchWrap')) return;

        const wrap = document.createElement('div');
        wrap.id = 'kixuzSearchWrap';
        wrap.className = 'kixuz-search-wrap';
        wrap.innerHTML = `
            <button type="button" class="kixuz-search-toggle" id="kixuzSearchToggle" aria-label="Buscar">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="7"></circle>
                    <line x1="20" y1="20" x2="16.35" y2="16.35"></line>
                </svg>
                <span>Buscar</span>
            </button>
            <div class="kixuz-search-panel" id="kixuzSearchPanel">
                <input type="text" class="kixuz-search-input" id="kixuzSearchInput" placeholder="Buscar @usuario, nombre, familia, clan, #universo..." autocomplete="off">
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
            const term = norm(rawQ).replace(/^@+/, '').replace(/^#+/, '');

            const filtrados = term
                ? resultadosCache.filter(item =>
                    norm(item.titulo).replace(/^[@#]+/, '').includes(term) ||
                    norm(item.subtitulo).replace(/^[@#]+/, '').includes(term) ||
                    norm(item.badge).includes(term)
                )
                : resultadosCache.slice(0, 10);

            let html = filtrados.slice(0, 10).map(item => `
                <a href="${esc(item.url)}" class="kixuz-search-row">
                    <div>
                        <div class="kixuz-search-title">${esc(item.titulo)}</div>
                        <div class="kixuz-search-sub">${esc(item.subtitulo)}</div>
                    </div>
                    <span class="kixuz-search-tag">${esc(item.badge)}</span>
                </a>
            `).join('');

            const handleDirecto = normHandle(rawQ);
            if (handleDirecto && !filtrados.some(f => norm(f.subtitulo).includes(handleDirecto))) {
                html += `
                    <a href="perfil.html?char=${encodeURIComponent(handleDirecto)}" class="kixuz-search-row">
                        <div>
                            <div class="kixuz-search-title">Ir a ${esc(handleDirecto)}</div>
                            <div class="kixuz-search-sub">Abrir ficha del usuario</div>
                        </div>
                        <span class="kixuz-search-tag">Perfil</span>
                    </a>
                `;
            }

            listEl.innerHTML = html || `<div style="padding:10px;font-size:12px;opacity:0.75;text-align:center;">Sin resultados para "${esc(rawQ)}"</div>`;
        }

        toggle.addEventListener('click', async e => {
            e.stopPropagation();
            const isOpen = wrap.classList.toggle('open');
            if (isOpen) {
                await construirIndice();
                render(input.value);
                setTimeout(() => input.focus(), 20);
            }
        });

        input.addEventListener('input', () => render(input.value));
        document.addEventListener('click', e => {
            if (!wrap.contains(e.target)) wrap.classList.remove('open');
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSearch);
    else initSearch();
    window.addEventListener('load', initSearch);
})();

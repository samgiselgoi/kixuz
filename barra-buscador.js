(() => {
    const norm = v => String(v || '').trim().toLowerCase();
    const normHandle = h => {
        const s = norm(h).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };
    const esc = s => String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    function leerSubpersonajes() {
        try {
            const arr = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    function leerPersonajeActivo() {
        const lista = leerSubpersonajes();
        try {
            const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
            if (act && (act.handle || act.nombre)) {
                const match = lista.find(p =>
                    (act.handle && normHandle(p.handle) === normHandle(act.handle)) ||
                    (act.nombre && norm(p.nombre) === norm(act.nombre))
                );
                if (match) return match;
                return act;
            }
        } catch {}
        if (lista.length > 0) {
            try { localStorage.setItem('kixuz_personaje_activo', JSON.stringify(lista[0])); } catch {}
            return lista[0];
        }
        return null;
    }

    function poblarDesplegableUnificado() {
        const select = document.getElementById('activeCharSelect') || document.querySelector('header select');
        if (!select) return;

        const subs = leerSubpersonajes();
        const activo = leerPersonajeActivo();
        window.KIXUZ_ACTIVE_CHAR = activo;

        select.innerHTML = '';

        if (subs.length > 0) {
            const grpChars = document.createElement('optgroup');
            grpChars.label = 'Mis personajes';
            subs.forEach(p => {
                const opt = document.createElement('option');
                const val = p.handle || p.nombre || '';
                opt.value = val;
                opt.textContent = `🎭 ${p.nombre || val} ${p.handle ? '(' + normHandle(p.handle) + ')' : ''}`;
                if (activo && (
                    (p.handle && activo.handle && normHandle(p.handle) === normHandle(activo.handle)) ||
                    (p.nombre && activo.nombre && norm(p.nombre) === norm(activo.nombre))
                )) {
                    opt.selected = true;
                }
                grpChars.appendChild(opt);
            });
            select.appendChild(grpChars);
        } else {
            const optEmpty = document.createElement('option');
            optEmpty.value = '';
            optEmpty.textContent = '🎭 Sin personaje activo';
            select.appendChild(optEmpty);
        }

        const grpAcciones = document.createElement('optgroup');
        grpAcciones.label = 'Gestión de cuenta';

        const optCrear = document.createElement('option');
        optCrear.value = '__crear_personaje__';
        optCrear.textContent = '+ Crear personaje';
        grpAcciones.appendChild(optCrear);

        const optMaestra = document.createElement('option');
        optMaestra.value = '__cuenta_maestra__';
        optMaestra.textContent = '👑 Cuenta Maestra (Mis personajes)';
        grpAcciones.appendChild(optMaestra);

        select.appendChild(grpAcciones);

        if (!select.dataset.kixuzUnifiedBound) {
            select.dataset.kixuzUnifiedBound = '1';
            select.addEventListener('change', e => {
                const v = e.target.value;
                if (v === '__crear_personaje__') {
                    window.location.href = 'crear-personaje.html';
                    return;
                }
                if (v === '__cuenta_maestra__') {
                    window.location.href = 'cuenta-maestra.html';
                    return;
                }
                const elegida = leerSubpersonajes().find(
                    p => (p.handle && normHandle(p.handle) === normHandle(v)) ||
                         (p.nombre && norm(p.nombre) === norm(v))
                );
                if (elegida) {
                    try { localStorage.setItem('kixuz_personaje_activo', JSON.stringify(elegida)); } catch {}
                    window.KIXUZ_ACTIVE_CHAR = elegida;
                    window.dispatchEvent(new CustomEvent('kixuz:personaje-cambiado', { detail: elegida }));
                    window.dispatchEvent(new Event('kixuz:personajes-actualizados'));
                }
            });
        }
    }

    async function recolectarResultados(terminoRaw) {
        const q = norm(terminoRaw).replace(/^@+/, '');
        if (!q) return [];

        const resultados = [];
        const vistos = new Set();

        const personajesMap = new Map();
        leerSubpersonajes().forEach(p => {
            const k = normHandle(p.handle || p.nombre);
            if (k) personajesMap.set(k, p);
        });
        if (window.KIXUZ_DB?.listarPersonajesPublicos) {
            try {
                const remotos = await window.KIXUZ_DB.listarPersonajesPublicos();
                if (Array.isArray(remotos)) {
                    remotos.forEach(p => {
                        const k = normHandle(p.handle || p.nombre);
                        if (k) personajesMap.set(k, { ...personajesMap.get(k), ...p });
                    });
                }
            } catch {}
        }

        personajesMap.forEach((p, k) => {
            const nombre = String(p.nombre || '').trim();
            const handle = normHandle(p.handle || nombre);
            const handleSinArroba = handle.replace(/^@+/, '');
            if (norm(nombre).includes(q) || handleSinArroba.includes(q) || handle.includes(q)) {
                const key = 'char:' + k;
                if (!vistos.has(key)) {
                    vistos.add(key);
                    resultados.push({
                        categoria: '👤 Usuario / Personaje',
                        titulo: nombre || handle,
                        subtitulo: handle + (p.clan ? ` · ${p.clan}` : ''),
                        url: `perfil.html?char=${encodeURIComponent(handle || nombre)}`
                    });
                }
            }
        });

        try {
            const unis = JSON.parse(localStorage.getItem('kixuz_universos_v1') || '[]');
            if (Array.isArray(unis)) {
                unis.forEach(u => {
                    const nombreU = String(u.nombre || '').trim();
                    const tagU = String(u.tag || '').trim();
                    const descU = String(u.descripcion || '').trim();
                    if (norm(nombreU).includes(q) || norm(tagU).replace(/^#+/, '').includes(q) || norm(descU).includes(q)) {
                        const key = 'uni:' + norm(tagU || nombreU);
                        if (!vistos.has(key)) {
                            vistos.add(key);
                            const paramU = encodeURIComponent(tagU || nombreU);
                            resultados.push({
                                categoria: '🌌 Universo',
                                titulo: nombreU || tagU,
                                subtitulo: `${tagU || ''} ${descU ? '· ' + descU.slice(0, 48) : ''}`.trim(),
                                url: `universo.html?u=${paramU}`
                            });
                        }
                    }
                });
            }
        } catch {}

        try {
            const famData = JSON.parse(localStorage.getItem('kixuz_familia_clan_v1') || '{}');
            const clanes = Array.isArray(famData.clan) ? famData.clan : [];
            const familias = Array.isArray(famData.familia) ? famData.familia : [];

            clanes.forEach(c => {
                const clanNom = String(c.clanNombre || '').trim();
                const miemNom = String(c.nombre || '').trim();
                const miemH = normHandle(c.handle || '');
                if (norm(clanNom).includes(q) || norm(miemNom).includes(q) || norm(miemH).includes(q)) {
                    const key = 'clan:' + norm(clanNom) + ':' + norm(miemH || miemNom);
                    if (!vistos.has(key)) {
                        vistos.add(key);
                        const refChar = miemH || normHandle(c.duenoHandle) || '';
                        resultados.push({
                            categoria: '🛡️ Clan',
                            titulo: clanNom || 'Clan',
                            subtitulo: `${miemNom} ${miemH} · ${c.rango || 'Miembro'}`.trim(),
                            url: refChar ? `familia.html?char=${encodeURIComponent(refChar)}#clan` : 'familia.html#clan'
                        });
                    }
                }
            });

            familias.forEach(f => {
                const nomF = String(f.nombre || '').trim();
                const hF = normHandle(f.handle || '');
                const relF = String(f.relacion || '').trim();
                if (norm(nomF).includes(q) || norm(hF).includes(q) || norm(relF).includes(q)) {
                    const key = 'fam:' + norm(hF || nomF) + ':' + norm(relF);
                    if (!vistos.has(key)) {
                        vistos.add(key);
                        const refChar = hF || normHandle(f.duenoHandle) || '';
                        resultados.push({
                            categoria: '🌳 Familia',
                            titulo: nomF || hF,
                            subtitulo: `${hF} · ${relF || 'Vínculo familiar'}`.trim(),
                            url: refChar ? `familia.html?char=${encodeURIComponent(refChar)}#familia` : 'familia.html#familia'
                        });
                    }
                }
            });
        } catch {}

        try {
            const posts = JSON.parse(localStorage.getItem('kixuz_posts_v1') || '[]');
            if (Array.isArray(posts)) {
                posts.forEach(p => {
                    const txt = String(p.contenido || '').trim();
                    const autor = String(p.autorNombre || '').trim();
                    const hAutor = normHandle(p.autorHandle || '');
                    const uniP = String(p.universo || '').trim();
                    if (norm(txt).includes(q) || norm(autor).includes(q) || norm(hAutor).includes(q) || norm(uniP).includes(q)) {
                        const key = 'post:' + String(p.id || txt.slice(0, 24));
                        if (!vistos.has(key)) {
                            vistos.add(key);
                            resultados.push({
                                categoria: '📝 Publicación',
                                titulo: `${autor || 'Personaje'} ${hAutor}`,
                                subtitulo: txt.slice(0, 68) + (txt.length > 68 ? '...' : ''),
                                url: 'index.html'
                            });
                        }
                    }
                });
            }
        } catch {}

        return resultados.slice(0, 12);
    }

    function montarBarraYBuscador() {
        const header = document.querySelector('header');
        if (!header) return;

        const userMenu = header.querySelector('.user-menu');
        if (userMenu && !userMenu.querySelector('a[href="registro.html"]')) {
            const regLink = document.createElement('a');
            regLink.href = 'registro.html';
            regLink.className = 'btn-auth-link';
            regLink.title = 'Entrar / Registro';
            regLink.setAttribute('aria-label', 'Entrar / Registro');
            regLink.textContent = '🔑 Entrar';
            userMenu.appendChild(regLink);
        }

        if (!document.getElementById('kixuzGlobalSearchInput')) {
            const searchWrap = document.createElement('div');
            searchWrap.className = 'kixuz-search-wrap';
            searchWrap.innerHTML = `
                <div class="kixuz-search-box">
                    <span class="kixuz-search-icon" aria-hidden="true">🔍</span>
                    <input
                        type="text"
                        id="kixuzGlobalSearchInput"
                        placeholder="Buscar @usuario, personaje, familia, clan o universo..."
                        aria-label="Buscador global de KIXUZ"
                        autocomplete="off"
                    >
                    <button type="button" id="kixuzGlobalSearchClear" class="kixuz-search-clear" title="Limpiar búsqueda" aria-label="Limpiar búsqueda">✕</button>
                </div>
                <div id="kixuzGlobalSearchResults" class="kixuz-search-results" role="listbox"></div>
            `;

            if (userMenu) {
                header.insertBefore(searchWrap, userMenu);
            } else {
                header.appendChild(searchWrap);
            }
        }

        const input = document.getElementById('kixuzGlobalSearchInput');
        const clearBtn = document.getElementById('kixuzGlobalSearchClear');
        const box = document.getElementById('kixuzGlobalSearchResults');

        if (input) {
            input.disabled = false;
            input.readOnly = false;
        }

        async function actualizarResultados() {
            if (!input || !box) return;
            const val = String(input.value || '').trim();
            if (clearBtn) clearBtn.style.display = val ? 'inline-flex' : 'none';
            if (!val) {
                box.classList.remove('open');
                box.innerHTML = '';
                return;
            }

            const items = await recolectarResultados(val);
            if (!items.length) {
                box.innerHTML = `<div class="kixuz-search-empty">No se encontraron coincidencias para "<strong>${esc(val)}</strong>".</div>`;
                box.classList.add('open');
                return;
            }

            box.innerHTML = items.map(it => `
                <a href="${esc(it.url)}" class="kixuz-search-item" role="option">
                    <span class="kixuz-search-cat">${esc(it.categoria)}</span>
                    <div class="kixuz-search-main">
                        <div class="kixuz-search-title">${esc(it.titulo)}</div>
                        ${it.subtitulo ? `<div class="kixuz-search-sub">${esc(it.subtitulo)}</div>` : ''}
                    </div>
                </a>
            `).join('');
            box.classList.add('open');
        }

        if (input && !input.dataset.kixuzSearchBound) {
            input.dataset.kixuzSearchBound = '1';
            input.addEventListener('input', actualizarResultados);
            input.addEventListener('keyup', actualizarResultados);
            input.addEventListener('focus', () => {
                if (String(input.value || '').trim()) actualizarResultados();
            });
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    input.value = '';
                    actualizarResultados();
                    input.focus();
                });
            }
            document.addEventListener('click', e => {
                if (!e.target.closest('.kixuz-search-wrap')) {
                    box?.classList.remove('open');
                }
            });
        }

        poblarDesplegableUnificado();
    }

    let lastScrollY = window.scrollY || 0;
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        const box = document.getElementById('kixuzGlobalSearchResults');
        if (!header) return;
        const currY = window.scrollY || 0;
        if (currY > 90 && currY > lastScrollY + 6) {
            header.classList.add('header-hidden');
            if (box) box.classList.remove('open');
        } else if (currY < lastScrollY - 4 || currY <= 40) {
            header.classList.remove('header-hidden');
        }
        lastScrollY = currY;
    }, { passive: true });

    window.addEventListener('DOMContentLoaded', montarBarraYBuscador);
    window.addEventListener('kixuz:personajes-actualizados', poblarDesplegableUnificado);
    window.addEventListener('kixuz:sesion-actualizada', poblarDesplegableUnificado);
})();

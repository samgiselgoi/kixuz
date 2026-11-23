(() => {
    const UNIVERSOS_KEY = 'kixuz_universos_v1';
    const SOL_UNIVERSOS_KEY = 'kixuz_solicitudes_universos_v1';
    const H72_MS = 72 * 60 * 60 * 1000;

    const norm = s => String(s || '').trim().toLowerCase();
    const normHandle = h => {
        const s = norm(h).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };
    const normUniTag = u => {
        const limp = String(u || '').trim().replace(/^#+/, '').replace(/\s+/g, '');
        return limp ? '#' + limp : '';
    };

    const UNIVERSO_OFICIAL_KIXUZ = {
        id: 'uni_kixuz_oficial',
        nombre: 'Kixuz',
        tag: '#Kixuz',
        descripcion: 'Canal oficial de anuncios, novedades y actualizaciones de la plataforma KIXUZ. Solo la cuenta maestra Kixuz puede entrar y publicar aquí; sus avisos se fijan 72h en el Inicio para todos.',
        reglas: 'Espacio oficial de comunicados de KIXUZ.',
        fundadorHandle: '@kixuz',
        fundadorNombre: 'Kixuz',
        esOficialKixuz: true,
        privado: true,
        miembros: [],
        recursos: []
    };

    function obtenerPersonajeActivo() {
        const ac = window.KIXUZ_ACTIVE_CHAR;
        if (ac && !ac.esPlaceholder && ac.handle) {
            return { nombre: ac.nombre || ac.handle.replace(/^@/, ''), handle: normHandle(ac.handle) };
        }
        try {
            const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
            if (act?.handle) {
                return { nombre: act.nombre || act.handle.replace(/^@/, ''), handle: normHandle(act.handle) };
            }
        } catch {}
        return { nombre: 'Personaje', handle: '@rol' };
    }

    function esCuentaMaestraKixuz() {
        if (window.KIXUZ_DB?.esCuentaKixuz && window.KIXUZ_DB.esCuentaKixuz()) return true;
        try {
            const loc = JSON.parse(localStorage.getItem('kixuz_usuario_local') || 'null');
            if (norm(loc?.nombreMaestro) === 'kixuz') return true;
        } catch {}
        return false;
    }

    function leerTodosUniversosInterno() {
        let guardados = [];
        try {
            const raw = JSON.parse(localStorage.getItem(UNIVERSOS_KEY) || '[]');
            if (Array.isArray(raw)) guardados = raw;
        } catch {}

        const mapa = new Map();
        mapa.set('kixuz', { ...UNIVERSO_OFICIAL_KIXUZ });

        guardados.forEach(u => {
            if (!u || (!u.nombre && !u.tag)) return;
            const key = norm(u.nombre || u.tag).replace(/^#+/, '');
            if (!key) return;
            if (key === 'kixuz') {
                mapa.set('kixuz', {
                    ...UNIVERSO_OFICIAL_KIXUZ,
                    ...u,
                    esOficialKixuz: true,
                    recursos: Array.isArray(u.recursos) ? u.recursos : []
                });
            } else {
                const tag = normUniTag(u.tag || u.nombre);
                mapa.set(key, {
                    id: u.id || 'uni_' + key,
                    nombre: u.nombre || tag.replace(/^#/, ''),
                    tag,
                    descripcion: u.descripcion || '',
                    reglas: u.reglas || '',
                    fundadorHandle: normHandle(u.fundadorHandle || ''),
                    fundadorNombre: u.fundadorNombre || '',
                    esOficialKixuz: false,
                    privado: Boolean(u.privado),
                    miembros: Array.isArray(u.miembros) ? u.miembros : [],
                    recursos: Array.isArray(u.recursos) ? u.recursos : []
                });
            }
        });

        return Array.from(mapa.values());
    }

    // Solo la cuenta maestra "Kixuz" puede ver el Universo "Kixuz" en la lista/buscador de universos
    function leerUniversos() {
        const todos = leerTodosUniversosInterno();
        if (esCuentaMaestraKixuz()) return todos;
        return todos.filter(u => !u.esOficialKixuz && norm(u.nombre).replace(/^#+/, '') !== 'kixuz');
    }

    function guardarUniversos(lista) {
        try {
            localStorage.setItem(UNIVERSOS_KEY, JSON.stringify(lista));
        } catch {}
        window.dispatchEvent(new CustomEvent('kixuz:universos-actualizados'));
    }

    function leerSolicitudesUniversos() {
        try {
            const raw = JSON.parse(localStorage.getItem(SOL_UNIVERSOS_KEY) || '[]');
            return Array.isArray(raw) ? raw : [];
        } catch {
            return [];
        }
    }

    function guardarSolicitudesUniversos(lista) {
        try {
            localStorage.setItem(SOL_UNIVERSOS_KEY, JSON.stringify(lista));
        } catch {}
        window.dispatchEvent(new CustomEvent('kixuz:universos-actualizados'));
    }

    function obtenerUniversoPorTagONombre(valor) {
        const key = norm(valor).replace(/^#+/, '');
        if (!key) return null;
        if (key === 'kixuz' && !esCuentaMaestraKixuz()) return null;
        return leerTodosUniversosInterno().find(u =>
            norm(u.nombre).replace(/^#+/, '') === key || norm(u.tag).replace(/^#+/, '') === key
        ) || null;
    }

    function esMiembroDeUniverso(universo, handle) {
        if (!universo) return false;
        if (universo.esOficialKixuz) return esCuentaMaestraKixuz();
        const h = normHandle(handle || obtenerPersonajeActivo().handle);
        if (!h || h === '@rol') return false;
        if (normHandle(universo.fundadorHandle) === h) return true;
        const miembros = Array.isArray(universo.miembros) ? universo.miembros : [];
        if (miembros.some(m => normHandle(typeof m === 'string' ? m : m.handle) === h)) return true;

        try {
            const subs = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            const pj = subs.find(p => normHandle(p.handle) === h);
            if (pj && Array.isArray(pj.universos)) {
                const targetKey = norm(universo.tag).replace(/^#+/, '');
                if (pj.universos.some(u => norm(u).replace(/^#+/, '') === targetKey)) return true;
            }
        } catch {}

        return false;
    }

    function puedePublicarEnUniverso(universo) {
        if (!universo) return false;
        if (universo.esOficialKixuz) return esCuentaMaestraKixuz();
        return esMiembroDeUniverso(universo, obtenerPersonajeActivo().handle);
    }

    async function agregarRecursoUniverso(universoId, { titulo = '', tipo = 'imagen', url = '' }) {
        const cleanUrl = String(url || '').trim();
        if (!cleanUrl) return;
        const pj = obtenerPersonajeActivo();
        const lista = leerTodosUniversosInterno();
        const idx = lista.findIndex(u => String(u.id) === String(universoId));
        if (idx < 0) return;

        const actual = { ...lista[idx] };
        if (!puedePublicarEnUniverso(actual)) return;

        const recursos = Array.isArray(actual.recursos) ? [...actual.recursos] : [];
        recursos.unshift({
            id: 'rec_' + Date.now(),
            titulo: String(titulo || (tipo === 'mapa' ? 'Mapa del universo' : 'Imagen del universo')).trim(),
            tipo: tipo === 'mapa' ? 'mapa' : 'imagen',
            url: cleanUrl,
            autorNombre: actual.esOficialKixuz ? 'Kixuz' : pj.nombre,
            autorHandle: actual.esOficialKixuz ? '@kixuz' : pj.handle
        });
        actual.recursos = recursos.slice(0, 40);
        lista[idx] = actual;
        guardarUniversos(lista);

        if (window.KIXUZ_DB?.guardarUniverso) {
            try { await window.KIXUZ_DB.guardarUniverso(actual); } catch {}
        }
    }

    async function eliminarRecursoUniverso(universoId, recursoId) {
        const lista = leerTodosUniversosInterno();
        const idx = lista.findIndex(u => String(u.id) === String(universoId));
        if (idx < 0) return;
        const actual = { ...lista[idx] };
        actual.recursos = (Array.isArray(actual.recursos) ? actual.recursos : []).filter(r => String(r.id) !== String(recursoId));
        lista[idx] = actual;
        guardarUniversos(lista);

        if (window.KIXUZ_DB?.guardarUniverso) {
            try { await window.KIXUZ_DB.guardarUniverso(actual); } catch {}
        }
    }

    async function unirseASalirUniverso(universoId, unirse = true) {
        const pj = obtenerPersonajeActivo();
        if (!pj.handle || pj.handle === '@rol') return;
        const lista = leerTodosUniversosInterno();
        const idx = lista.findIndex(u => String(u.id) === String(universoId));
        if (idx < 0 || lista[idx].esOficialKixuz) return;

        const u = { ...lista[idx] };
        const miembros = Array.isArray(u.miembros) ? [...u.miembros] : [];
        const filtrados = miembros.filter(m => normHandle(typeof m === 'string' ? m : m.handle) !== pj.handle);

        if (unirse) {
            filtrados.push({ nombre: pj.nombre, handle: pj.handle, rol: 'Miembro' });
        }
        u.miembros = filtrados;
        lista[idx] = u;
        guardarUniversos(lista);

        if (window.KIXUZ_DB?.guardarUniverso) {
            try { await window.KIXUZ_DB.guardarUniverso(u); } catch {}
        }
    }

    async function crearSolicitudUniverso({ nombre, descripcion, reglas, privado = false }) {
        const pj = obtenerPersonajeActivo();
        const cleanName = String(nombre || '').trim().replace(/^#+/, '');
        if (!cleanName) return null;

        const sol = {
            id: 'sol_uni_' + Date.now(),
            nombre: cleanName,
            tag: normUniTag(cleanName),
            descripcion: String(descripcion || '').trim(),
            reglas: String(reglas || '').trim(),
            privado: Boolean(privado),
            solicitanteNombre: pj.nombre,
            solicitanteHandle: pj.handle,
            estado: 'pendiente',
            creadoMs: Date.now()
        };

        const actuales = leerSolicitudesUniversos();
        actuales.unshift(sol);
        guardarSolicitudesUniversos(actuales);

        if (window.KIXUZ_DB?.solicitarUniverso) {
            try {
                const rid = await window.KIXUZ_DB.solicitarUniverso(sol);
                if (rid) {
                    sol.id = rid;
                    guardarSolicitudesUniversos(actuales);
                }
            } catch {}
        }
        return sol;
    }

    async function aprobarSolicitudUniverso(solId) {
        if (!esCuentaMaestraKixuz()) return;
        const sols = leerSolicitudesUniversos();
        const sol = sols.find(s => String(s.id) === String(solId));
        if (!sol) return;

        const nuevoUni = {
            id: 'uni_' + norm(sol.nombre).replace(/[^a-z0-9_]+/g, '_') + '_' + Date.now(),
            nombre: sol.nombre,
            tag: normUniTag(sol.tag || sol.nombre),
            descripcion: sol.descripcion || '',
            reglas: sol.reglas || '',
            fundadorNombre: sol.solicitanteNombre || 'Fundador',
            fundadorHandle: normHandle(sol.solicitanteHandle),
            esOficialKixuz: false,
            privado: Boolean(sol.privado),
            miembros: sol.solicitanteHandle
                ? [{ nombre: sol.solicitanteNombre || 'Fundador', handle: normHandle(sol.solicitanteHandle), rol: 'Fundador / Narrador' }]
                : [],
            recursos: []
        };

        const universos = leerTodosUniversosInterno();
        universos.push(nuevoUni);
        guardarUniversos(universos);

        const restantes = sols.filter(s => String(s.id) !== String(solId));
        guardarSolicitudesUniversos(restantes);

        if (window.KIXUZ_DB?.aprobarUniverso) {
            try { await window.KIXUZ_DB.aprobarUniverso(sol, nuevoUni); } catch {}
        }
    }

    async function rechazarSolicitudUniverso(solId) {
        if (!esCuentaMaestraKixuz()) return;
        const restantes = leerSolicitudesUniversos().filter(s => String(s.id) !== String(solId));
        guardarSolicitudesUniversos(restantes);
        if (window.KIXUZ_DB?.rechazarSolicitudUniverso) {
            try { await window.KIXUZ_DB.rechazarSolicitudUniverso(solId); } catch {}
        }
    }

    // Todos los usuarios siguen viendo el anuncio oficial de Kixuz en el Inicio durante 72h
    function obtenerAnuncioKixuzVigente(posts) {
        if (!Array.isArray(posts)) return null;
        const ahora = Date.now();
        const oficiales = posts
            .filter(p => p && (p.esAnuncioKixuz || norm(p.universo).replace(/^#+/, '') === 'kixuz'))
            .map(p => ({
                ...p,
                _ts: Number(p.createdAtMs || (p.creadoEn?.seconds ? p.creadoEn.seconds * 1000 : 0))
            }))
            .sort((a, b) => b._ts - a._ts);

        if (!oficiales.length) return null;
        const ultimo = oficiales[0];
        if (!ultimo._ts || (ahora - ultimo._ts) <= H72_MS) {
            return ultimo;
        }
        return null;
    }

    function puedeVerPost(post, contexto = 'inicio') {
        if (!post) return false;
        const yoH = obtenerPersonajeActivo().handle;
        const autorH = normHandle(post.autorHandle);
        const uniTag = normUniTag(post.universo || (post.alcanceTipo === 'universo' ? post.alcanceValor : ''));
        const uniKey = norm(uniTag).replace(/^#+/, '');

        if (post.esAnuncioKixuz || uniKey === 'kixuz') {
            if (contexto === 'perfil') return true;
            if (contexto === 'universo') return esCuentaMaestraKixuz();
            return false; // En inicio se muestra solo el vigente arriba mediante obtenerAnuncioKixuzVigente()
        }

        if (yoH && autorH && yoH === autorH) return true;

        const tipo = post.alcanceTipo || (uniTag ? 'universo' : 'global');

        if (tipo === 'universo' && uniTag) {
            const uni = leerTodosUniversosInterno().find(u => norm(u.tag).replace(/^#+/, '') === uniKey);
            if (!uni) return true;
            return esMiembroDeUniverso(uni, yoH);
        }

        if (tipo === 'familia') {
            if (!yoH || yoH === '@rol') return false;
            try {
                const fam = JSON.parse(localStorage.getItem('kixuz_familia_clan_v1') || '{}');
                const lista = Array.isArray(fam.familia) ? fam.familia : [];
                return lista.some(item =>
                    (normHandle(item?.duenoHandle) === autorH && normHandle(item?.handle) === yoH) ||
                    (normHandle(item?.duenoHandle) === yoH && normHandle(item?.handle) === autorH)
                );
            } catch {
                return false;
            }
        }

        if (tipo === 'clan') {
            if (!yoH || yoH === '@rol') return false;
            const clanObjetivo = norm(post.alcanceValor || '');
            try {
                const fam = JSON.parse(localStorage.getItem('kixuz_familia_clan_v1') || '{}');
                const lista = Array.isArray(fam.clan) ? fam.clan : [];
                const enClanAutor = lista.some(item =>
                    (normHandle(item?.duenoHandle) === autorH && normHandle(item?.handle) === yoH) ||
                    (normHandle(item?.duenoHandle) === yoH && normHandle(item?.handle) === autorH)
                );
                if (enClanAutor) return true;

                if (clanObjetivo) {
                    const subs = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
                    const pj = subs.find(p => normHandle(p.handle) === yoH);
                    if (pj && norm(pj.clan) === clanObjetivo) return true;
                }
            } catch {}
            return false;
        }

        return true;
    }

    window.KIXUZ_UNIVERSOS = {
        UNIVERSO_OFICIAL_KIXUZ,
        esCuentaMaestraKixuz,
        leerUniversos,
        guardarUniversos,
        leerSolicitudesUniversos,
        obtenerUniversoPorTagONombre,
        esMiembroDeUniverso,
        puedePublicarEnUniverso,
        agregarRecursoUniverso,
        eliminarRecursoUniverso,
        unirseASalirUniverso,
        crearSolicitudUniverso,
        aprobarSolicitudUniverso,
        rechazarSolicitudUniverso,
        obtenerAnuncioKixuzVigente,
        puedeVerPost
    };

    window.addEventListener('load', () => {
        if (window.KIXUZ_DB?.activo && window.KIXUZ_DB?.escucharUniversos) {
            window.KIXUZ_DB.escucharUniversos(remotos => {
                if (!Array.isArray(remotos)) return;
                const locales = leerTodosUniversosInterno();
                const mapa = new Map();
                locales.forEach(u => mapa.set(norm(u.nombre).replace(/^#+/, ''), u));
                remotos.forEach(u => {
                    const k = norm(u.nombre || u.tag).replace(/^#+/, '');
                    if (k) mapa.set(k, { ...mapa.get(k), ...u });
                });
                guardarUniversos(Array.from(mapa.values()));
            });
        }
        if (window.KIXUZ_DB?.activo && window.KIXUZ_DB?.escucharSolicitudesUniverso) {
            window.KIXUZ_DB.escucharSolicitudesUniverso(remotas => {
                if (!Array.isArray(remotas)) return;
                guardarSolicitudesUniversos(remotas);
            });
        }
    });
})();

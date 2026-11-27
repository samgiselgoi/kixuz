(() => {
    const SUBS_KEY = 'kixuz_subpersonajes';
    const ACT_KEY = 'kixuz_personaje_activo';

    const norm = v => String(v || '').trim().toLowerCase();
    const normHandle = v => {
        const s = norm(v).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    function normalizarFicha(raw = {}) {
        const handle = normHandle(raw.handle || raw.usuario || raw.nombre || '');
        const nombre = String(raw.nombre || handle.replace(/^@/, '') || 'Personaje').trim();
        return {
            ...raw,
            nombre,
            handle,
            avatar: raw.avatar || raw.avatarData || raw.fotoPerfil || '',
            banner: raw.banner || raw.bannerData || raw.portada || '',
            fondo: raw.fondo || raw.fondoData || raw.background || '',
            bio: raw.bio || raw.biografia || '',
            edad: raw.edad || '',
            especie: raw.especie || raw.raza || '',
            genero: raw.genero || '',
            ocupacion: raw.ocupacion || '',
            universo: raw.universo || (Array.isArray(raw.universos) ? raw.universos[0] : '') || '',
            pareja: raw.pareja || raw.estadoSentimentalHandle || '',
            habilidades: Array.isArray(raw.habilidades) ? raw.habilidades : [],
            debilidades: Array.isArray(raw.debilidades) ? raw.debilidades : []
        };
    }

    function obtenerPersonajesPropios() {
        try {
            const arr = JSON.parse(localStorage.getItem(SUBS_KEY) || '[]');
            if (!Array.isArray(arr)) return [];
            return arr
                .filter(p => p && !p.esPlaceholder && normHandle(p.handle) !== '@cypher_hacker')
                .map(normalizarFicha);
        } catch {
            return [];
        }
    }

    function obtenerPersonajeActivo() {
        const propios = obtenerPersonajesPropios();
        try {
            const act = JSON.parse(localStorage.getItem(ACT_KEY) || 'null');
            if (act && !act.esPlaceholder && (act.handle || act.nombre)) {
                const match = propios.find(p => normHandle(p.handle) === normHandle(act.handle || act.nombre));
                const resolved = match || normalizarFicha(act);
                window.KIXUZ_ACTIVE_CHAR = resolved;
                return resolved;
            }
        } catch {}
        if (propios.length > 0) {
            try { localStorage.setItem(ACT_KEY, JSON.stringify(propios[0])); } catch {}
            window.KIXUZ_ACTIVE_CHAR = propios[0];
            return propios[0];
        }
        window.KIXUZ_ACTIVE_CHAR = null;
        return null;
    }

    async function esperarKixuzDB(timeoutMs = 2200) {
        if (window.KIXUZ_DB?.buscarPersonajePublico) return window.KIXUZ_DB;
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            await new Promise(r => setTimeout(r, 80));
            if (window.KIXUZ_DB?.buscarPersonajePublico) return window.KIXUZ_DB;
        }
        return window.KIXUZ_DB || null;
    }

    function buscarEnPostsLocales(handle) {
        try {
            const posts = JSON.parse(localStorage.getItem('kixuz_posts_v1') || '[]');
            if (!Array.isArray(posts)) return null;
            const p = posts.find(x => normHandle(x.autorHandle) === handle);
            if (!p) return null;
            return normalizarFicha({
                nombre: p.autorNombre || handle.replace(/^@/, ''),
                handle,
                avatar: p.autorAvatar || ''
            });
        } catch {
            return null;
        }
    }

    async function obtenerPersonajeParaVista(charParam) {
        const propios = obtenerPersonajesPropios();
        const activo = obtenerPersonajeActivo();
        const targetH = normHandle(charParam || '');

        if (!targetH) {
            if (activo) {
                const esDueno = propios.some(p => p.handle === activo.handle);
                return { personaje: activo, esDueno, esVisitante: !esDueno };
            }
            return {
                personaje: normalizarFicha({ nombre: 'Personaje', handle: '@rol' }),
                esDueno: false,
                esVisitante: false
            };
        }

        // 1. Si es uno de los personajes propios del usuario actual
        const propio = propios.find(p => p.handle === targetH);
        if (propio) {
            return {
                personaje: propio,
                esDueno: true,
                esVisitante: false
            };
        }

        // 2. Si es el personaje de otra cuenta: consultar Firestore (esperando carga del módulo si hace falta)
        const dbApi = await esperarKixuzDB();
        if (dbApi?.buscarPersonajePublico) {
            try {
                const remoto = await dbApi.buscarPersonajePublico(targetH);
                if (remoto) {
                    const ficha = normalizarFicha(remoto);
                    return {
                        personaje: ficha,
                        esDueno: Boolean(dbApi.esAdmin),
                        esVisitante: !dbApi.esAdmin
                    };
                }
            } catch (e) {
                console.warn('Error consultando perfil público:', e);
            }
        }

        // 3. Respaldo si apareció en publicaciones locales
        const desdePost = buscarEnPostsLocales(targetH);
        if (desdePost) {
            return {
                personaje: desdePost,
                esDueno: false,
                esVisitante: true
            };
        }

        return {
            personaje: normalizarFicha({
                nombre: targetH.replace(/^@/, ''),
                handle: targetH
            }),
            esDueno: false,
            esVisitante: true
        };
    }

    window.KIXUZ_CHARS = {
        obtenerPersonajesPropios,
        obtenerPersonajeActivo,
        obtenerPersonajeParaVista,
        normalizarFicha
    };

    obtenerPersonajeActivo();
    window.addEventListener('kixuz:personajes-actualizados', obtenerPersonajeActivo);
})();

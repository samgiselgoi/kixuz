(() => {
    const UNIS_KEY = 'kixuz_universos_v1';
    const SOLS_KEY = 'kixuz_solicitudes_universo_v1';
    const norm = v => String(v || '').trim().toLowerCase();
    const normTag = v => {
        const s = norm(v).replace(/^#+/, '').replace(/\s+/g, '');
        return s ? '#' + s : '';
    };
    const normHandle = v => {
        const s = norm(v).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    function esCuentaKixuz() {
        if (window.KIXUZ_DB?.esAdmin) return true;
        const p = window.KIXUZ_DB?.perfilCuenta || {};
        const u = window.KIXUZ_DB?.usuarioActual || {};
        let loc = {};
        try { loc = JSON.parse(localStorage.getItem('kixuz_usuario_local') || '{}') || {}; } catch {}
        const n = norm(p.nombreMaestro || u.displayName || loc.nombreMaestro || loc.nombre || '');
        const e = norm(p.email || u.email || loc.email || '');
        return p.rolSistema === 'admin' || loc.rolSistema === 'admin' || n === 'kixuz' || e.startsWith('kixuz@');
    }

    function leerUniversos() {
        try {
            const arr = JSON.parse(localStorage.getItem(UNIS_KEY) || '[]');
            const lista = Array.isArray(arr) ? arr : [];
            // Si es Kixuz, asegurar que exista el universo oficial #Kixuz para su gestión
            if (esCuentaKixuz() && !lista.some(u => normTag(u.tag) === '#kixuz')) {
                lista.unshift({
                    nombre: 'Kixuz Oficial',
                    tag: '#Kixuz',
                    descripcion: 'Canal oficial de avisos y novedades del multiverso (fijados 72h en Inicio).',
                    reglas: 'Solo la cuenta maestra Kixuz publica aquí.',
                    creadoPorHandle: '@Kixuz',
                    miembros: ['@kixuz'],
                    mapas: []
                });
                guardarUniversos(lista);
            }
            return lista;
        } catch {
            return [];
        }
    }

    function guardarUniversos(arr) {
        try { localStorage.setItem(UNIS_KEY, JSON.stringify(arr)); } catch {}
    }

    function leerSolicitudes() {
        try {
            const arr = JSON.parse(localStorage.getItem(SOLS_KEY) || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    function guardarSolicitudes(arr) {
        try { localStorage.setItem(SOLS_KEY, JSON.stringify(arr)); } catch {}
    }

    function obtenerUniversosVisibles() {
        const todos = leerUniversos();
        if (esCuentaKixuz()) return todos;
        return todos.filter(u => normTag(u.tag) !== '#kixuz');
    }

    function obtenerUniversosDePersonaje(handle) {
        const h = normHandle(handle);
        const set = new Set();
        if (!h) return set;
        leerUniversos().forEach(u => {
            const miembros = Array.isArray(u.miembros) ? u.miembros.map(normHandle) : [];
            if (miembros.includes(h) || normHandle(u.creadoPorHandle) === h) {
                set.add(normTag(u.tag));
            }
        });
        try {
            const subs = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            subs.forEach(p => {
                if (normHandle(p.handle) === h) {
                    const arr = Array.isArray(p.universos) ? p.universos : (p.universo ? [p.universo] : []);
                    arr.forEach(x => { const t = normTag(x); if (t) set.add(t); });
                }
            });
        } catch {}
        return set;
    }

    function puedeVerPublicacion(post) {
        if (!post) return false;
        if (esCuentaKixuz()) return true;
        const tipo = norm(post.alcanceTipo || 'general');
        if (!tipo || tipo === 'general') return true;
        const ac = window.KIXUZ_ACTIVE_CHAR;
        const miH = normHandle(ac?.handle || '');
        if (miH && normHandle(post.autorHandle) === miH) return true;

        const destino = norm(post.alcanceDestino || post.universo || '');
        if (!destino) return true;

        if (tipo === 'universo') {
            return obtenerUniversosDePersonaje(miH).has(normTag(destino));
        }
        if (tipo === 'familia') {
            try {
                const famData = JSON.parse(localStorage.getItem('kixuz_familia_clan_v1') || '{}');
                const fams = Array.isArray(famData.familia) ? famData.familia : [];
                return fams.some(f => normHandle(f.duenoHandle) === miH || normHandle(f.handle) === miH);
            } catch { return false; }
        }
        if (tipo === 'clan') {
            try {
                const famData = JSON.parse(localStorage.getItem('kixuz_familia_clan_v1') || '{}');
                const clans = Array.isArray(famData.clan) ? famData.clan : [];
                return clans.some(c =>
                    norm(c.clanNombre) === destino &&
                    (normHandle(c.duenoHandle) === miH || normHandle(c.handle) === miH)
                );
            } catch { return false; }
        }
        return true;
    }

    window.KIXUZ_UNIVERSOS = {
        esCuentaKixuz,
        leerUniversos,
        guardarUniversos,
        leerSolicitudes,
        guardarSolicitudes,
        obtenerUniversosVisibles,
        obtenerUniversosDePersonaje,
        puedeVerPublicacion,
        normTag
    };
})();

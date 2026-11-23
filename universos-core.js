(() => {
    const UNIS_KEY = 'kixuz_universos_v1';
    const norm = v => String(v || '').trim().toLowerCase();
    const normTag = v => {
        const s = norm(v).replace(/^#+/, '').replace(/\s+/g, '');
        return s ? '#' + s : '';
    };
    const normHandle = v => {
        const s = norm(v).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    function leerUniversos() {
        try {
            const arr = JSON.parse(localStorage.getItem(UNIS_KEY) || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    function guardarUniversos(arr) {
        try { localStorage.setItem(UNIS_KEY, JSON.stringify(arr)); } catch {}
    }

    function crearUniverso({ nombre, tag, descripcion = '', reglas = '', creadorHandle = '' }) {
        const nom = String(nombre || '').trim();
        const tg = normTag(tag || nom);
        if (!nom || !tg) return null;

        const lista = leerUniversos();
        const existente = lista.find(u => normTag(u.tag) === tg || norm(u.nombre) === norm(nom));
        if (existente) return existente;

        const h = normHandle(creadorHandle);
        const nuevo = {
            id: 'uni_' + Date.now(),
            nombre: nom,
            tag: tg,
            descripcion: String(descripcion || '').trim(),
            reglas: String(reglas || '').trim(),
            creadoPorHandle: h,
            miembros: h ? [h] : [],
            mapas: []
        };
        lista.unshift(nuevo);
        guardarUniversos(lista);
        window.dispatchEvent(new Event('kixuz:universos-actualizados'));
        return nuevo;
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
        leerUniversos,
        guardarUniversos,
        crearUniverso,
        obtenerUniversosDePersonaje,
        puedeVerPublicacion,
        normTag
    };
})();

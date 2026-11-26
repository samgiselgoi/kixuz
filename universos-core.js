(() => {
    const STORAGE_KEY = 'kixuz_universos_v2';
    const LEGACY_KEY = 'kixuz_universos_v1';

    const normTag = tag => {
        const clean = String(tag || '').trim().replace(/^#+/, '').replace(/\s+/g, '');
        return clean ? '#' + clean : '';
    };

    function leerUniversos() {
        try {
            const rawV2 = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            const rawV1 = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]');
            const fuente = Array.isArray(rawV2) ? rawV2 : (Array.isArray(rawV1) ? rawV1 : []);
            const mapa = new Map();

            fuente.forEach(u => {
                if (!u || (!u.tag && !u.nombre)) return;
                const tag = normTag(u.tag || u.nombre);
                if (!tag) return;
                mapa.set(tag.toLowerCase(), {
                    id: u.id || ('uni_' + tag.slice(1).toLowerCase()),
                    nombre: String(u.nombre || tag.slice(1)).trim(),
                    tag,
                    descripcion: String(u.descripcion || '').trim(),
                    reglas: String(u.reglas || '').trim(),
                    banner: String(u.banner || '').trim(),
                    avatar: String(u.avatar || '').trim(),
                    fondo: String(u.fondo || '').trim(),
                    miembros: Array.isArray(u.miembros) ? u.miembros : [],
                    mapas: Array.isArray(u.mapas) ? u.mapas : []
                });
            });

            return Array.from(mapa.values());
        } catch {
            return [];
        }
    }

    function guardarUniversos(lista) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
            window.dispatchEvent(new Event('kixuz:universos-actualizados'));
        } catch {}
    }

    function crearUniverso({ nombre, tag, descripcion, reglas, banner, avatar, fondo, creadorHandle }) {
        const tagNorm = normTag(tag || nombre);
        if (!tagNorm) return null;

        const actual = leerUniversos();
        const key = tagNorm.toLowerCase();
        const existente = actual.find(u => normTag(u.tag).toLowerCase() === key);
        if (existente) return existente;

        const nuevo = {
            id: 'uni_' + Date.now(),
            nombre: String(nombre || tagNorm.slice(1)).trim(),
            tag: tagNorm,
            descripcion: String(descripcion || '').trim(),
            reglas: String(reglas || '').trim(),
            banner: String(banner || '').trim(),
            avatar: String(avatar || '').trim(),
            fondo: String(fondo || '').trim(),
            miembros: creadorHandle ? [String(creadorHandle).trim()] : [],
            mapas: []
        };

        actual.unshift(nuevo);
        guardarUniversos(actual);
        return nuevo;
    }

    window.KIXUZ_UNIVERSOS = {
        normTag,
        leerUniversos,
        guardarUniversos,
        crearUniverso
    };
})();
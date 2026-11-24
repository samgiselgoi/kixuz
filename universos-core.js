(() => {
    const STORAGE_KEY = 'kixuz_universos_v1';

    const normTag = tag => {
        const clean = String(tag || '').trim().replace(/^#+/, '').replace(/\s+/g, '');
        return clean ? '#' + clean : '';
    };

    function leerUniversos() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (!Array.isArray(raw)) return [];
            const mapa = new Map();
            raw.forEach(u => {
                if (!u || !u.tag) return;
                const tag = normTag(u.tag);
                if (!tag) return;
                mapa.set(tag.toLowerCase(), {
                    ...u,
                    tag,
                    nombre: String(u.nombre || tag.slice(1)).trim(),
                    descripcion: String(u.descripcion || '').trim(),
                    reglas: String(u.reglas || '').trim(),
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

    function crearUniversoDirecto({ nombre, tag, descripcion, reglas, creadorHandle }) {
        const tagNorm = normTag(tag || nombre);
        if (!tagNorm) return null;

        const actual = leerUniversos();
        const key = tagNorm.toLowerCase();
        if (actual.some(u => normTag(u.tag).toLowerCase() === key)) {
            return actual.find(u => normTag(u.tag).toLowerCase() === key) || null;
        }

        const miembrosIniciales = creadorHandle ? [String(creadorHandle).trim()] : [];
        const nuevo = {
            id: 'uni_' + Date.now(),
            nombre: String(nombre || tagNorm.slice(1)).trim(),
            tag: tagNorm,
            descripcion: String(descripcion || '').trim(),
            reglas: String(reglas || '').trim(),
            creadorHandle: String(creadorHandle || '').trim(),
            miembros: miembrosIniciales,
            mapas: []
        };

        actual.unshift(nuevo);
        guardarUniversos(actual);
        return nuevo;
    }

    function puedeVerPost(post, contexto = 'inicio') {
        if (!post) return false;
        const tagPost = normTag(post.universo || post.universe || '');
        if (contexto === 'inicio') {
            return true;
        }
        if (!tagPost) return false;
        return true;
    }

    window.KIXUZ_UNIVERSOS = {
        normTag,
        leerUniversos,
        guardarUniversos,
        crearUniversoDirecto,
        puedeVerPost
    };
})();

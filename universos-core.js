(() => {
    const STORAGE_KEY = 'kixuz_universos_v1';

    const normTag = tag => {
        const clean = String(tag || '').trim().replace(/^#+/, '').replace(/\s+/g, '');
        return clean ? '#' + clean : '';
    };

    const normHandle = h => {
        const s = String(h || '').trim().toLowerCase().replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    const esUniversoPrueba = (u, tagNorm) => {
        if (!u || !tagNorm) return true;
        if (u.esDemo || u.esPrueba) return true;
        const t = tagNorm.toLowerCase();
        const nom = String(u.nombre || '').trim().toLowerCase();
        return t === '#sector4' || nom === 'sector4' || nom === 'sector 4';
    };

    function leerUniversos() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (!Array.isArray(raw)) return [];
            const mapa = new Map();
            let huboPrueba = false;
            raw.forEach(u => {
                const tag = normTag(u?.tag);
                if (esUniversoPrueba(u, tag)) {
                    huboPrueba = true;
                    return;
                }
                mapa.set(tag.toLowerCase(), {
                    ...u,
                    tag,
                    nombre: String(u.nombre || tag.slice(1)).trim(),
                    descripcion: String(u.descripcion || '').trim(),
                    reglas: String(u.reglas || '').trim(),
                    avatar: String(u.avatar || '').trim(),
                    banner: String(u.banner || '').trim(),
                    fondo: String(u.fondo || '').trim(),
                    miembros: Array.isArray(u.miembros) ? u.miembros : [],
                    mapas: Array.isArray(u.mapas) ? u.mapas : []
                });
            });
            const limpios = Array.from(mapa.values());
            if (huboPrueba) {
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(limpios)); } catch {}
            }
            return limpios;
        } catch {
            return [];
        }
    }

    function guardarUniversos(lista) {
        try {
            const filtrados = (Array.isArray(lista) ? lista : []).filter(u => {
                const tag = normTag(u?.tag);
                return !esUniversoPrueba(u, tag);
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtrados));
            window.dispatchEvent(new Event('kixuz:universos-actualizados'));
        } catch {}
    }

    function crearUniversoDirecto({ nombre, tag, descripcion, reglas, creadorHandle, avatar, banner, fondo }) {
        const tagNorm = normTag(tag || nombre);
        if (!tagNorm || esUniversoPrueba({ nombre, tag: tagNorm }, tagNorm)) return null;

        const actual = leerUniversos();
        const key = tagNorm.toLowerCase();
        if (actual.some(u => normTag(u.tag).toLowerCase() === key)) {
            return actual.find(u => normTag(u.tag).toLowerCase() === key) || null;
        }

        const creador = normHandle(creadorHandle) || String(creadorHandle || '').trim();
        const miembrosIniciales = creador ? [creador] : [];
        const nuevo = {
            id: 'uni_' + Date.now(),
            nombre: String(nombre || tagNorm.slice(1)).trim(),
            tag: tagNorm,
            descripcion: String(descripcion || '').trim(),
            reglas: String(reglas || '').trim(),
            creadorHandle: creador,
            avatar: String(avatar || '').trim(),
            banner: String(banner || '').trim(),
            fondo: String(fondo || '').trim(),
            miembros: miembrosIniciales,
            mapas: []
        };

        actual.unshift(nuevo);
        guardarUniversos(actual);
        return nuevo;
    }

    function agregarMiembroAUniverso(tag, handleOrName) {
        const tagNorm = normTag(tag);
        const h = normHandle(handleOrName) || String(handleOrName || '').trim();
        if (!tagNorm || !h || esUniversoPrueba({ tag: tagNorm }, tagNorm)) return false;
        const lista = leerUniversos();
        const target = lista.find(u => u.tag.toLowerCase() === tagNorm.toLowerCase());
        if (!target) return false;
        target.miembros = Array.isArray(target.miembros) ? target.miembros : [];
        const claveNueva = normHandle(h) || h.toLowerCase();
        if (!target.miembros.some(m => (normHandle(m) || String(m).toLowerCase()) === claveNueva)) {
            target.miembros.push(h);
            guardarUniversos(lista);
        }
        return true;
    }

    function quitarMiembroDeUniverso(tag, handleOrName) {
        const tagNorm = normTag(tag);
        const claveQuitar = normHandle(handleOrName) || String(handleOrName || '').trim().toLowerCase();
        if (!tagNorm || !claveQuitar) return false;
        const lista = leerUniversos();
        const target = lista.find(u => u.tag.toLowerCase() === tagNorm.toLowerCase());
        if (!target) return false;
        target.miembros = (Array.isArray(target.miembros) ? target.miembros : []).filter(
            m => (normHandle(m) || String(m).toLowerCase()) !== claveQuitar
        );
        guardarUniversos(lista);
        return true;
    }

    function eliminarUniverso(tag) {
        const tagNorm = normTag(tag);
        if (!tagNorm) return false;
        const next = leerUniversos().filter(u => u.tag.toLowerCase() !== tagNorm.toLowerCase());
        guardarUniversos(next);
        return true;
    }

    function actualizarAparienciaUniverso(tag, { avatar, banner, fondo }) {
        const tagNorm = normTag(tag);
        if (!tagNorm) return false;
        const lista = leerUniversos();
        const target = lista.find(u => u.tag.toLowerCase() === tagNorm.toLowerCase());
        if (!target) return false;
        if (avatar !== undefined) target.avatar = avatar;
        if (banner !== undefined) target.banner = banner;
        if (fondo !== undefined) target.fondo = fondo;
        guardarUniversos(lista);
        return true;
    }

    window.KIXUZ_UNIVERSOS = {
        normTag,
        normHandle,
        leerUniversos,
        guardarUniversos,
        crearUniversoDirecto,
        agregarMiembroAUniverso,
        quitarMiembroDeUniverso,
        eliminarUniverso,
        actualizarAparienciaUniverso
    };
})();

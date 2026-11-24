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
                    avatar: String(u.avatar || '').trim(),
                    banner: String(u.banner || '').trim(),
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

    function crearUniversoDirecto({ nombre, tag, descripcion, reglas, creadorHandle, avatar, banner, fondo }) {
        const tagNorm = normTag(tag || nombre);
        if (!tagNorm) return null;

        const actual = leerUniversos();
        const key = tagNorm.toLowerCase();
        if (actual.some(u => normTag(u.tag).toLowerCase() === key)) {
            return actual.find(u => normTag(u.tag).toLowerCase() === key) || null;
        }

        const miembrosIniciales = creadorHandle ? [normHandle(creadorHandle) || String(creadorHandle).trim()] : [];
        const nuevo = {
            id: 'uni_' + Date.now(),
            nombre: String(nombre || tagNorm.slice(1)).trim(),
            tag: tagNorm,
            descripcion: String(descripcion || '').trim(),
            reglas: String(reglas || '').trim(),
            creadorHandle: normHandle(creadorHandle) || String(creadorHandle || '').trim(),
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
        if (!tagNorm || !h) return false;
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
        actualizarAparienciaUniverso
    };
})();

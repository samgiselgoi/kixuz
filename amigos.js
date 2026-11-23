(() => {
    const AMIGOS_REQ_KEY = 'kixuz_solicitudes_amistad_v1';

    const norm = s => String(s || '').trim().toLowerCase();
    const normHandle = h => {
        const limp = norm(h).replace(/^@+/, '').replace(/\s+/g, '_');
        return limp ? '@' + limp : '';
    };

    let solicitudes = [];

    function obtenerMiPersonaje() {
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

    function leerLocal() {
        try {
            const raw = JSON.parse(localStorage.getItem(AMIGOS_REQ_KEY) || '[]');
            return Array.isArray(raw) ? raw : [];
        } catch {
            return [];
        }
    }

    function guardarLocal() {
        try {
            localStorage.setItem(AMIGOS_REQ_KEY, JSON.stringify(solicitudes.slice(0, 200)));
        } catch {}
    }

    function estadoRelacionCon(otroHandle) {
        const yo = obtenerMiPersonaje().handle;
        const otro = normHandle(otroHandle);
        if (!yo || !otro || yo === otro) return { estado: 'self' };

        const rel = solicitudes.find(s => {
            const de = normHandle(s.deHandle);
            const para = normHandle(s.paraHandle);
            return (de === yo && para === otro) || (de === otro && para === yo);
        });

        if (!rel) return { estado: 'ninguno' };
        if (rel.estado === 'aceptada') return { estado: 'amigo', solicitud: rel };
        if (normHandle(rel.deHandle) === yo) return { estado: 'enviada', solicitud: rel };
        return { estado: 'recibida', solicitud: rel };
    }

    function listarParaPersonaje(personajeHandle) {
        const target = normHandle(personajeHandle || obtenerMiPersonaje().handle);
        if (!target) return { amigos: [], recibidas: [], enviadas: [] };

        const amigos = solicitudes
            .filter(s => s.estado === 'aceptada' && (normHandle(s.deHandle) === target || normHandle(s.paraHandle) === target))
            .map(s => {
                const soyEmisor = normHandle(s.deHandle) === target;
                return {
                    id: s.id,
                    nombre: soyEmisor ? (s.paraNombre || s.paraHandle) : (s.deNombre || s.deHandle),
                    handle: normHandle(soyEmisor ? s.paraHandle : s.deHandle)
                };
            });

        const recibidas = solicitudes.filter(s => s.estado === 'pendiente' && normHandle(s.paraHandle) === target);
        const enviadas = solicitudes.filter(s => s.estado === 'pendiente' && normHandle(s.deHandle) === target);

        return { amigos, recibidas, enviadas };
    }

    async function enviarSolicitud({ nombre = '', handle = '' }) {
        const yo = obtenerMiPersonaje();
        const paraH = normHandle(handle || nombre);
        if (!yo.handle || !paraH || yo.handle === paraH) return null;

        const existente = estadoRelacionCon(paraH);
        if (existente.estado !== 'ninguno') return existente.solicitud;

        const paraNombre = String(nombre || paraH.replace(/^@/, '')).trim();
        const nueva = {
            id: 'local_am_' + Date.now(),
            deNombre: yo.nombre,
            deHandle: yo.handle,
            paraNombre,
            paraHandle: paraH,
            estado: 'pendiente'
        };

        solicitudes.unshift(nueva);
        guardarLocal();
        window.dispatchEvent(new CustomEvent('kixuz:amigos-actualizados'));

        if (window.KIXUZ_DB?.enviarSolicitudAmistad) {
            try {
                const remoteId = await window.KIXUZ_DB.enviarSolicitudAmistad({
                    destinoNombre: paraNombre,
                    destinoHandle: paraH
                });
                if (remoteId) {
                    nueva.id = remoteId;
                    guardarLocal();
                }
            } catch {}
        }
        return nueva;
    }

    async function aceptarSolicitud(id) {
        const idx = solicitudes.findIndex(s => String(s.id) === String(id));
        if (idx < 0) return;
        solicitudes[idx] = { ...solicitudes[idx], estado: 'aceptada' };
        guardarLocal();
        window.dispatchEvent(new CustomEvent('kixuz:amigos-actualizados'));

        if (window.KIXUZ_DB?.aceptarSolicitudAmistad) {
            try { await window.KIXUZ_DB.aceptarSolicitudAmistad(id); } catch {}
        }
    }

    async function eliminarRelacion(id) {
        solicitudes = solicitudes.filter(s => String(s.id) !== String(id));
        guardarLocal();
        window.dispatchEvent(new CustomEvent('kixuz:amigos-actualizados'));

        if (window.KIXUZ_DB?.eliminarSolicitudAmistad) {
            try { await window.KIXUZ_DB.eliminarSolicitudAmistad(id); } catch {}
        }
    }

    solicitudes = leerLocal();

    window.KIXUZ_AMIGOS = {
        estadoRelacionCon,
        listarParaPersonaje,
        enviarSolicitud,
        aceptarSolicitud,
        eliminarRelacion
    };

    window.addEventListener('load', () => {
        if (window.KIXUZ_DB?.activo && window.KIXUZ_DB?.escucharSolicitudesAmistad) {
            window.KIXUZ_DB.escucharSolicitudesAmistad(nubeSols => {
                if (!Array.isArray(nubeSols)) return;
                const mapa = new Map();
                solicitudes.filter(s => String(s.id).startsWith('local_am_')).forEach(s => mapa.set(String(s.id), s));
                nubeSols.forEach(ns => mapa.set(String(ns.id), ns));
                solicitudes = Array.from(mapa.values());
                guardarLocal();
                window.dispatchEvent(new CustomEvent('kixuz:amigos-actualizados'));
            });
        }
    });
})();

(() => {
    const STORAGE_LIST = 'kixuz_subpersonajes';
    const STORAGE_ACTIVE = 'kixuz_personaje_activo';

    const norm = v => String(v || '').trim().toLowerCase();
    const normHandle = v => {
        const limp = norm(v).replace(/^@+/, '').replace(/\s+/g, '_');
        return limp ? '@' + limp : '';
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

    function obtenerSubpersonajes() {
        try {
            const list = JSON.parse(localStorage.getItem(STORAGE_LIST) || '[]');
            return Array.isArray(list) ? list : [];
        } catch {
            return [];
        }
    }

    function obtenerPersonajeActivo() {
        const lista = obtenerSubpersonajes();
        try {
            const act = JSON.parse(localStorage.getItem(STORAGE_ACTIVE) || 'null');
            if (act && act.handle) {
                const match = lista.find(p => normHandle(p.handle) === normHandle(act.handle));
                if (match) return match;
                return act;
            }
        } catch {}
        if (lista.length > 0) {
            try { localStorage.setItem(STORAGE_ACTIVE, JSON.stringify(lista[0])); } catch {}
            return lista[0];
        }
        return null;
    }

    function esPersonajePropio(personaje) {
        if (!personaje) return false;
        const miUid = norm(window.KIXUZ_DB?.usuarioActual?.uid || window.KIXUZ_DB?.perfilCuenta?.uid || '');
        const duenioUid = norm(personaje.uidMaestro || '');
        if (duenioUid && miUid && duenioUid === miUid) return true;
        const lista = obtenerSubpersonajes();
        return lista.some(p => normHandle(p.handle) === normHandle(personaje.handle));
    }

    async function resolverPersonajeInspeccionado() {
        const params = new URLSearchParams(window.location.search || '');
        const charParam = params.get('char') || '';
        const activo = obtenerPersonajeActivo();

        if (!charParam) {
            return activo;
        }

        const targetHandle = normHandle(charParam);
        const lista = obtenerSubpersonajes();
        const propioMatch = lista.find(p => normHandle(p.handle) === targetHandle);
        if (propioMatch) {
            return propioMatch;
        }

        // Si no es de tus personajes guardados localmente, solo Kixuz (admin) puede ver personajes de otras cuentas
        if (!esCuentaKixuz()) {
            return activo;
        }

        if (window.KIXUZ_DB?.buscarPersonajePublico) {
            try {
                const externo = await window.KIXUZ_DB.buscarPersonajePublico(targetHandle);
                if (externo) return externo;
            } catch {}
        }

        return activo;
    }

    function sincronizarSelector() {
        const select = document.getElementById('activeCharSelect') || document.querySelector('.user-menu select');
        if (!select) return;

        const lista = obtenerSubpersonajes();
        const activo = obtenerPersonajeActivo();
        window.KIXUZ_ACTIVE_CHAR = activo;

        select.innerHTML = '';

        if (!lista.length) {
            const optVacio = document.createElement('option');
            optVacio.value = '';
            optVacio.textContent = 'Sin personaje activo';
            select.appendChild(optVacio);
        } else {
            lista.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.handle || p.nombre;
                opt.textContent = `${p.nombre} (${p.handle || '@rol'})`;
                if (activo && normHandle(p.handle) === normHandle(activo.handle)) {
                    opt.selected = true;
                }
                select.appendChild(opt);
            });
        }

        const optCrear = document.createElement('option');
        optCrear.value = '__crear__';
        optCrear.textContent = '+ Crear personaje';
        select.appendChild(optCrear);

        if (!select.dataset.kixuzBound) {
            select.dataset.kixuzBound = '1';
            select.addEventListener('change', e => {
                if (e.target.value === '__crear__') {
                    window.location.href = 'crear-personaje.html';
                    return;
                }
                const elegida = obtenerSubpersonajes().find(
                    p => normHandle(p.handle || p.nombre) === normHandle(e.target.value)
                );
                if (elegida) {
                    try { localStorage.setItem(STORAGE_ACTIVE, JSON.stringify(elegida)); } catch {}
                    window.KIXUZ_ACTIVE_CHAR = elegida;
                    window.dispatchEvent(new CustomEvent('kixuz:personaje-cambiado', { detail: elegida }));
                    window.dispatchEvent(new Event('kixuz:personajes-actualizados'));
                }
            });
        }
    }

    window.KIXUZ_CHARS = {
        obtenerSubpersonajes,
        obtenerPersonajeActivo,
        esPersonajePropio,
        resolverPersonajeInspeccionado,
        sincronizarSelector
    };

    window.KIXUZ_ACTIVE_CHAR = obtenerPersonajeActivo();

    window.addEventListener('DOMContentLoaded', async () => {
        sincronizarSelector();
        const vista = await resolverPersonajeInspeccionado();
        if (vista) {
            window.dispatchEvent(new CustomEvent('kixuz:perfil-resuelto', { detail: vista }));
        }
    });

    window.addEventListener('kixuz:personajes-actualizados', sincronizarSelector);
    window.addEventListener('kixuz:sesion-actualizada', sincronizarSelector);
})();

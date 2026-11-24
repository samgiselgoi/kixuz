(() => {
    const STORAGE_LIST = 'kixuz_subpersonajes';
    const STORAGE_ACTIVE = 'kixuz_personaje_activo';
    const MASTER_VALUE = '__cuenta_maestra__';
    const CREATE_VALUE = '__crear_personaje__';

    const norm = v => String(v || '').trim().toLowerCase();
    const normHandle = h => {
        const s = norm(h).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    // Sin límite de cantidad de personajes: conserva todos los personajes creados
    function leerPersonajes() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_LIST) || '[]');
            if (!Array.isArray(raw)) return [];
            const mapa = new Map();
            raw.forEach(p => {
                if (!p) return;
                const h = normHandle(p.handle || '');
                const nom = String(p.nombre || '').trim();
                if (!h && !nom) return;
                const key = h || norm(nom);
                mapa.set(key, {
                    ...p,
                    nombre: nom || h.slice(1),
                    handle: h || ('@' + norm(nom).replace(/\s+/g, '_'))
                });
            });
            return Array.from(mapa.values());
        } catch {
            return [];
        }
    }

    function obtenerActivo(lista) {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_ACTIVE) || 'null');
            if (raw && raw.handle) {
                const found = lista.find(p => normHandle(p.handle) === normHandle(raw.handle));
                if (found) return found;
            }
        } catch {}
        return lista[0] || { nombre: 'Sin personaje', handle: '@nuevo', esPlaceholder: true };
    }

    function sincronizarDesplegable() {
        const lista = leerPersonajes();
        const activo = obtenerActivo(lista);
        window.KIXUZ_ACTIVE_CHAR = activo;

        document.querySelectorAll('#activeCharSelect, .user-menu select, select.dropdown').forEach(select => {
            select.innerHTML = '';

            const optMaster = document.createElement('option');
            optMaster.value = MASTER_VALUE;
            optMaster.textContent = 'Mi Cuenta Maestra';
            select.appendChild(optMaster);

            lista.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.handle;
                opt.textContent = `${p.nombre} (${p.handle})`;
                select.appendChild(opt);
            });

            const optCreate = document.createElement('option');
            optCreate.value = CREATE_VALUE;
            optCreate.textContent = '+ Crear personaje';
            select.appendChild(optCreate);

            const page = window.location.pathname.split('/').pop() || '';
            if (page === 'cuenta-maestra.html') {
                select.value = MASTER_VALUE;
            } else if (activo && !activo.esPlaceholder) {
                select.value = activo.handle;
            } else {
                select.value = MASTER_VALUE;
            }

            if (!select.dataset.kixuzUnifiedBound) {
                select.dataset.kixuzUnifiedBound = '1';
                select.addEventListener('change', e => {
                    const val = e.target.value;
                    if (val === MASTER_VALUE) {
                        window.location.href = 'cuenta-maestra.html';
                        return;
                    }
                    if (val === CREATE_VALUE) {
                        window.location.href = 'crear-personaje.html';
                        return;
                    }
                    const actualLista = leerPersonajes();
                    const elegido = actualLista.find(p => normHandle(p.handle) === normHandle(val));
                    if (elegido) {
                        try { localStorage.setItem(STORAGE_ACTIVE, JSON.stringify(elegido)); } catch {}
                        window.KIXUZ_ACTIVE_CHAR = elegido;
                        window.dispatchEvent(new Event('kixuz:personajes-actualizados'));
                        if (window.location.pathname.endsWith('perfil.html')) {
                            window.location.href = `perfil.html?char=${encodeURIComponent(elegido.handle)}`;
                        }
                    }
                });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', sincronizarDesplegable);
    } else {
        sincronizarDesplegable();
    }
    window.addEventListener('kixuz:personajes-actualizados', sincronizarDesplegable);
    window.addEventListener('load', sincronizarDesplegable);
})();

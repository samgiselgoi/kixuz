(() => {
    const norm = v => String(v || '').trim().toLowerCase();

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

    function aplicarPermisosAdmin() {
        if (!esCuentaKixuz() || !window.KIXUZ_DB) return;
        window.KIXUZ_DB.esAdmin = true;
        window.KIXUZ_DB.puedeEliminar = () => true;
    }

    window.addEventListener('DOMContentLoaded', aplicarPermisosAdmin);
    window.addEventListener('kixuz:sesion-actualizada', aplicarPermisosAdmin);
})();

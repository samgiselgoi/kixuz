(() => {
    // Modo cuenta estándar por usuario: cada cuenta administra sus propios personajes y contenido.
    if (window.KIXUZ_DB) {
        window.KIXUZ_DB.esAdmin = false;
    }
})();

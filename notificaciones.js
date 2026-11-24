(() => {
    const STORAGE_KEY = 'kixuz_notificaciones_v1';

    const SVG_BELL = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
    `;

    const esc = s => String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const normHandle = h => {
        const s = String(h || '').trim().toLowerCase().replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    function getPersonajesPropiosSet() {
        const set = new Set();
        try {
            const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
            if (act?.handle) set.add(normHandle(act.handle));
        } catch {}
        try {
            const subs = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            if (Array.isArray(subs)) subs.forEach(p => { if (p?.handle) set.add(normHandle(p.handle)); });
        } catch {}
        return set;
    }

    function leerNotificaciones() {
        try {
            const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    function guardarNotificaciones(arr) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(0, 60)));
        } catch {}
    }

    function registrarNotificacion({ destinoHandle, actorNombre, actorHandle, texto, enlace, tipo }) {
        const dest = normHandle(destinoHandle);
        if (!dest) return;
        const lista = leerNotificaciones();
        lista.unshift({
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            destinoHandle: dest,
            actorNombre: actorNombre || 'Alguien',
            actorHandle: normHandle(actorHandle) || '',
            texto: String(texto || '').trim(),
            enlace: enlace || 'index.html',
            tipo: tipo || 'actividad',
            leida: false,
            fecha: Date.now()
        });
        guardarNotificaciones(lista);
        renderBellBadge();
    }

    function obtenerMisNotificaciones() {
        const mios = getPersonajesPropiosSet();
        return leerNotificaciones().filter(n => !n.destinoHandle || mios.has(normHandle(n.destinoHandle)));
    }

    function injectStyles() {
        if (document.getElementById('kixuz-notif-bell-styles')) return;
        const st = document.createElement('style');
        st.id = 'kixuz-notif-bell-styles';
        st.textContent = `
            .kixuz-bell-wrap {
                position: relative;
                display: inline-flex;
                align-items: center;
            }
            .kixuz-bell-btn {
                position: relative;
                width: 36px;
                height: 36px;
                border-radius: 10px;
                border: 1px solid rgba(108, 60, 224, 0.45);
                background: rgba(108, 60, 224, 0.2);
                color: var(--texto, #EDE7E0);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            }
            .kixuz-bell-btn:hover {
                border-color: var(--acento, #2DD4C4);
                color: var(--acento, #2DD4C4);
            }
            .kixuz-bell-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                min-width: 17px;
                height: 17px;
                padding: 0 4px;
                border-radius: 999px;
                background: #ff4d6d;
                color: #fff;
                font-size: 10.5px;
                font-weight: 800;
                display: none;
                align-items: center;
                justify-content: center;
            }
            .kixuz-bell-badge.visible { display: inline-flex; }
            .kixuz-bell-panel {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                width: 310px;
                max-width: 88vw;
                max-height: 380px;
                overflow-y: auto;
                background: var(--bg-principal, #150A24);
                color: var(--texto, #EDE7E0);
                border: 1px solid var(--acento, #2DD4C4);
                border-radius: 14px;
                box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
                padding: 12px;
                z-index: 99999;
                display: none;
            }
            .kixuz-bell-panel.open { display: block; }
            .kixuz-notif-item {
                display: block;
                padding: 8px 10px;
                border-radius: 9px;
                border: 1px solid rgba(108, 60, 224, 0.3);
                background: rgba(108, 60, 224, 0.14);
                color: inherit;
                text-decoration: none;
                font-size: 12.5px;
                margin-top: 7px;
            }
            .kixuz-notif-item.unread {
                border-color: var(--acento, #2DD4C4);
                background: rgba(45, 212, 196, 0.14);
            }
        `;
        document.head.appendChild(st);
    }

    function renderBellBadge() {
        const badge = document.getElementById('kixuzBellBadge');
        const list = document.getElementById('kixuzBellList');
        const mias = obtenerMisNotificaciones();
        const noLeidas = mias.filter(n => !n.leida).length;

        if (badge) {
            badge.textContent = noLeidas > 9 ? '9+' : String(noLeidas);
            badge.classList.toggle('visible', noLeidas > 0);
        }

        if (list) {
            list.innerHTML = mias.length
                ? mias.slice(0, 20).map(n => `
                    <a href="${esc(n.enlace || 'index.html')}" class="kixuz-notif-item ${n.leida ? '' : 'unread'}" data-nid="${esc(n.id)}">
                        <strong style="color:var(--acento,#2DD4C4);">${esc(n.actorNombre)} ${esc(n.actorHandle)}</strong>
                        <div>${esc(n.texto)}</div>
                    </a>
                `).join('')
                : `<div style="font-size:12.5px;opacity:0.72;padding:8px 2px;">Sin notificaciones nuevas.</div>`;

            list.querySelectorAll('[data-nid]').forEach(el => {
                el.addEventListener('click', () => {
                    const id = el.dataset.nid;
                    const todas = leerNotificaciones().map(x => String(x.id) === String(id) ? { ...x, leida: true } : x);
                    guardarNotificaciones(todas);
                });
            });
        }
    }

    function montarCampanita() {
        injectStyles();
        const userMenu = document.querySelector('header .user-menu') || document.querySelector('header');
        if (!userMenu || document.getElementById('kixuzBellWrap')) return;

        const wrap = document.createElement('div');
        wrap.id = 'kixuzBellWrap';
        wrap.className = 'kixuz-bell-wrap';
        wrap.innerHTML = `
            <button type="button" class="kixuz-bell-btn" id="kixuzBellBtn" aria-label="Notificaciones" title="Notificaciones">
                ${SVG_BELL}
                <span class="kixuz-bell-badge" id="kixuzBellBadge">0</span>
            </button>
            <div class="kixuz-bell-panel" id="kixuzBellPanel">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                    <strong style="font-family:'Space Grotesk',sans-serif;font-size:13.5px;color:var(--acento,#2DD4C4);">Notificaciones</strong>
                    <button type="button" id="kixuzMarkAllRead" style="background:none;border:none;color:var(--acento,#2DD4C4);font-size:11.5px;font-weight:700;cursor:pointer;">Marcar leídas</button>
                </div>
                <div id="kixuzBellList"></div>
            </div>
        `;

        userMenu.insertBefore(wrap, userMenu.firstChild);

        const btn = document.getElementById('kixuzBellBtn');
        const panel = document.getElementById('kixuzBellPanel');

        btn?.addEventListener('click', e => {
            e.stopPropagation();
            panel?.classList.toggle('open');
            renderBellBadge();
        });

        document.getElementById('kixuzMarkAllRead')?.addEventListener('click', e => {
            e.stopPropagation();
            const mios = getPersonajesPropiosSet();
            const todas = leerNotificaciones().map(n => (!n.destinoHandle || mios.has(normHandle(n.destinoHandle))) ? { ...n, leida: true } : n);
            guardarNotificaciones(todas);
            renderBellBadge();
        });

        document.addEventListener('click', ev => {
            if (!wrap.contains(ev.target)) panel?.classList.remove('open');
        });

        renderBellBadge();
    }

    window.KIXUZ_NOTIF = {
        registrar: registrarNotificacion,
        refrescar: renderBellBadge
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montarCampanita);
    else montarCampanita();
    window.addEventListener('kixuz:personajes-actualizados', renderBellBadge);
})();

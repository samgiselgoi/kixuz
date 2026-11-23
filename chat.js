(() => {
    const CHATS_KEY = 'kixuz_chats_v1';
    const BACKUP_KEYS = ['kixuz_chats', 'kixuz_chats_backup_v1', 'kixuz_conversaciones_v1'];
    const READ_KEY = 'kixuz_chats_leidos_v1';

    const esc = s => String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const norm = v => String(v || '').trim().toLowerCase();
    const normHandle = h => {
        const limp = norm(h).replace(/^@+/, '').replace(/\s+/g, '_');
        return limp ? '@' + limp : '';
    };

    let chatsCache = [];
    let activeChatId = null;
    let drawerOpen = false;

    function getEmisor() {
        const ac = window.KIXUZ_ACTIVE_CHAR;
        if (ac && (ac.nombre || ac.handle)) {
            return {
                nombre: String(ac.nombre || ac.handle.replace(/^@/, '')).trim(),
                handle: normHandle(ac.handle || ac.nombre) || '@rol'
            };
        }
        try {
            const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
            if (act && (act.nombre || act.handle)) {
                return {
                    nombre: String(act.nombre || act.handle.replace(/^@/, '')).trim(),
                    handle: normHandle(act.handle || act.nombre) || '@rol'
                };
            }
        } catch {}
        return { nombre: 'Personaje', handle: '@rol' };
    }

    function parseArrayStorage(key) {
        try {
            const raw = JSON.parse(localStorage.getItem(key) || 'null');
            if (Array.isArray(raw)) return raw;
            if (raw && typeof raw === 'object') {
                return Object.entries(raw).map(([id, val]) => ({ id, ...(val && typeof val === 'object' ? val : {}) }));
            }
        } catch {}
        return [];
    }

    function normalizarChat(raw, idx = 0) {
        if (!raw || typeof raw !== 'object') return null;
        const id = String(raw.id || raw.chatId || `chat_rec_${idx}`);
        const mensajesRaw = Array.isArray(raw.mensajes)
            ? raw.mensajes
            : (Array.isArray(raw.messages) ? raw.messages : []);

        const mensajes = mensajesRaw.map(m => {
            if (!m || typeof m !== 'object') return null;
            return {
                autorNombre: String(m.autorNombre || m.senderNombre || m.autor || 'Personaje').trim(),
                autorHandle: normHandle(m.autorHandle || m.senderHandle || m.handle || ''),
                texto: String(m.texto ?? m.mensaje ?? m.text ?? '')
            };
        }).filter(m => m && m.texto !== '');

        const participantes = Array.isArray(raw.participantes)
            ? raw.participantes.map(normHandle).filter(Boolean)
            : [];
        const hUsuario = normHandle(raw.usuario || raw.destinoHandle || '');
        if (hUsuario && !participantes.includes(hUsuario)) participantes.push(hUsuario);

        return {
            id,
            nombre: String(raw.nombre || raw.titulo || raw.usuario || 'Conversación').trim(),
            usuario: hUsuario,
            tipo: raw.tipo || 'privado',
            creadorHandle: normHandle(raw.creadorHandle || raw.autorHandle || ''),
            participantes,
            mensajes
        };
    }

    function leerTodosLosChatsRecuperados() {
        const mapa = new Map();

        // Leer respaldos primero y luego `kixuz_chats_v1` encima para conservar el estado más reciente
        [...BACKUP_KEYS, CHATS_KEY].forEach(k => {
            const arr = parseArrayStorage(k);
            arr.forEach((item, idx) => {
                const c = normalizarChat(item, idx);
                if (!c) return;
                const prev = mapa.get(c.id);
                if (!prev) {
                    mapa.set(c.id, c);
                } else {
                    const msgs = c.mensajes.length >= prev.mensajes.length ? c.mensajes : prev.mensajes;
                    mapa.set(c.id, {
                        ...prev,
                        ...c,
                        participantes: Array.from(new Set([...(prev.participantes || []), ...(c.participantes || [])])),
                        mensajes: msgs
                    });
                }
            });
        });

        const lista = Array.from(mapa.values());
        return lista;
    }

    function guardarChats(arr) {
        try {
            const limpia = Array.isArray(arr) ? arr : [];
            localStorage.setItem(CHATS_KEY, JSON.stringify(limpia));
            localStorage.setItem(BACKUP_KEYS[1], JSON.stringify(limpia));
        } catch {}
    }

    function leerLeidos() {
        try {
            const obj = JSON.parse(localStorage.getItem(READ_KEY) || '{}');
            return obj && typeof obj === 'object' ? obj : {};
        } catch { return {}; }
    }

    function guardarLeidos(obj) {
        try { localStorage.setItem(READ_KEY, JSON.stringify(obj)); } catch {}
    }

    function contarMensajesSinLeer() {
        const em = getEmisor();
        const miH = normHandle(em.handle);
        const leidos = leerLeidos();
        let total = 0;
        chatsCache.forEach(c => {
            if (!puedeVerChat(c)) return;
            const msgs = Array.isArray(c.mensajes) ? c.mensajes : [];
            const visto = Number(leidos[c.id] || 0);
            msgs.forEach((m, i) => {
                if (i >= visto && normHandle(m.autorHandle) !== miH) {
                    total += 1;
                }
            });
        });
        return total;
    }

    function marcarLeido(chat) {
        if (!chat) return;
        const leidos = leerLeidos();
        leidos[chat.id] = Array.isArray(chat.mensajes) ? chat.mensajes.length : 0;
        guardarLeidos(leidos);
        actualizarBadge();
    }

    function actualizarBadge() {
        const badge = document.getElementById('kixuzChatBadge');
        if (!badge) return;
        const n = contarMensajesSinLeer();
        badge.textContent = n > 0 ? String(n) : '';
        badge.style.display = n > 0 ? 'inline-flex' : 'none';
    }

    function puedeVerChat(c) {
        if (!c) return false;
        if (c.tipo === 'general') return true;
        const em = getEmisor();
        const miH = normHandle(em.handle);
        if (!miH || miH === '@rol' || miH === '@invitado') return true;
        if (c.creadorHandle && normHandle(c.creadorHandle) === miH) return true;
        const parts = Array.isArray(c.participantes) ? c.participantes.map(normHandle) : [];
        if (parts.length === 0) return true;
        if (parts.includes(miH)) return true;
        if (c.usuario && normHandle(c.usuario) === miH) return true;
        return false;
    }

    function obtenerSugerenciasPersonajes() {
        const map = new Map();
        try {
            const subs = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            if (Array.isArray(subs)) {
                subs.forEach(p => {
                    const h = normHandle(p.handle || p.nombre);
                    if (h) map.set(h, { nombre: p.nombre || h.replace(/^@/, ''), handle: h });
                });
            }
        } catch {}
        chatsCache.forEach(c => {
            (c.participantes || []).forEach(h => {
                const nh = normHandle(h);
                if (nh && !map.has(nh)) map.set(nh, { nombre: nh.replace(/^@/, ''), handle: nh });
            });
        });
        return Array.from(map.values());
    }

    function montarChatUI() {
        if (document.getElementById('kixuzChatBubble')) return;

        const style = document.createElement('style');
        style.id = 'kixuz-chat-styles';
        style.textContent = `
            #kixuzChatBubble {
                position: fixed;
                right: 18px;
                bottom: 18px;
                z-index: 1100;
                background: var(--acento, #2DD4C4);
                color: #150A24;
                border: none;
                border-radius: 999px;
                padding: 11px 16px;
                font-family: 'Space Grotesk', sans-serif;
                font-weight: 700;
                font-size: 13.5px;
                cursor: pointer;
                box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
                display: inline-flex;
                align-items: center;
                gap: 7px;
            }
            #kixuzChatBadge {
                background: #e03c6c;
                color: #ffffff;
                border-radius: 999px;
                padding: 1px 7px;
                font-size: 11px;
                font-weight: 800;
                display: none;
            }
            #kixuzChatDrawer {
                position: fixed;
                top: 0;
                right: 0;
                width: 375px;
                max-width: 100vw;
                height: 100vh;
                z-index: 1150;
                background: #1a0c2e;
                color: var(--texto, #EDE7E0);
                border-left: 1px solid var(--borde, rgba(108,60,224,0.45));
                box-shadow: -12px 0 32px rgba(0, 0, 0, 0.55);
                transform: translateX(100%);
                transition: transform 0.24s ease;
                display: flex;
                flex-direction: column;
            }
            html[data-theme="light"] #kixuzChatDrawer {
                background: #ffffff;
                color: #150A24;
            }
            #kixuzChatDrawer.open {
                transform: translateX(0);
            }
            .kixuz-chat-head {
                padding: 12px 14px;
                border-bottom: 1px solid var(--borde, rgba(108,60,224,0.35));
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
            }
            .kixuz-chat-controls {
                padding: 10px 14px;
                border-bottom: 1px solid var(--borde, rgba(108,60,224,0.25));
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .kixuz-chat-body {
                flex: 1;
                overflow-y: auto;
                padding: 12px 14px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .kixuz-msg-row {
                display: flex;
                flex-direction: column;
                max-width: 82%;
            }
            .kixuz-msg-row.mine {
                align-self: flex-end;
                align-items: flex-end;
            }
            .kixuz-msg-row.other {
                align-self: flex-start;
                align-items: flex-start;
            }
            .kixuz-msg-bubble {
                padding: 8px 11px;
                border-radius: 12px;
                font-size: 13.5px;
                white-space: pre-wrap;
                word-break: break-word;
                line-height: 1.45;
            }
            .kixuz-msg-row.mine .kixuz-msg-bubble {
                background: rgba(45, 212, 196, 0.22);
                border: 1px solid rgba(45, 212, 196, 0.5);
            }
            .kixuz-msg-row.other .kixuz-msg-bubble {
                background: rgba(108, 60, 224, 0.28);
                border: 1px solid rgba(108, 60, 224, 0.45);
            }
            .kixuz-chat-tabs {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
                max-height: 86px;
                overflow-y: auto;
            }
            .kixuz-chat-pill {
                padding: 4px 9px;
                border-radius: 8px;
                border: 1px solid var(--borde, rgba(108,60,224,0.35));
                background: rgba(108, 60, 224, 0.2);
                color: inherit;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
            }
            .kixuz-chat-pill.active {
                background: var(--acento, #2DD4C4);
                color: #150A24;
                border-color: var(--acento, #2DD4C4);
            }
        `;
        document.head.appendChild(style);

        const bubble = document.createElement('button');
        bubble.type = 'button';
        bubble.id = 'kixuzChatBubble';
        bubble.innerHTML = `💬 Chat <span id="kixuzChatBadge"></span>`;

        const drawer = document.createElement('aside');
        drawer.id = 'kixuzChatDrawer';
        drawer.innerHTML = `
            <div class="kixuz-chat-head">
                <strong style="font-family:'Space Grotesk',sans-serif; color:var(--acento, #2DD4C4);">💬 Chat KIXUZ</strong>
                <button type="button" id="kixuzChatClose" style="background:none; border:none; color:inherit; font-size:18px; cursor:pointer;" aria-label="Cerrar chat">✕</button>
            </div>
            <div class="kixuz-chat-controls">
                <input type="search" id="kixuzChatSearch" placeholder="Buscar conversación o @usuario..." style="width:100%; padding:7px 10px; border-radius:8px; border:1px solid var(--borde, rgba(108,60,224,0.35)); background:rgba(0,0,0,0.25); color:inherit; font-size:13px;">
                <form id="kixuzCreateChatForm" style="display:flex; gap:6px; flex-wrap:wrap;">
                    <input type="text" id="kixuzNewChatTarget" list="kixuzChatCharSuggestions" placeholder="@usuario o nombre de chat" style="flex:1 1 135px; padding:7px 9px; border-radius:8px; border:1px solid var(--borde, rgba(108,60,224,0.35)); background:rgba(0,0,0,0.25); color:inherit; font-size:12.5px;">
                    <datalist id="kixuzChatCharSuggestions"></datalist>
                    <select id="kixuzNewChatTipo" style="padding:7px 8px; border-radius:8px; border:1px solid var(--borde, rgba(108,60,224,0.35)); background:rgba(0,0,0,0.25); color:inherit; font-size:12px;">
                        <option value="privado">1×1</option>
                        <option value="grupal">Grupal</option>
                        <option value="general">General</option>
                    </select>
                    <button type="submit" id="kixuzCreateChatBtn" class="btn" style="padding:7px 11px; font-size:12px;">+ Crear</button>
                </form>
                <div id="kixuzChatList" class="kixuz-chat-tabs"></div>
            </div>
            <div class="kixuz-chat-body" id="kixuzChatMessages"></div>
            <form id="kixuzChatSendForm" style="padding:10px 14px; border-top:1px solid var(--borde, rgba(108,60,224,0.35)); display:flex; gap:8px; align-items:flex-end;">
                <textarea id="kixuzChatInput" rows="1" placeholder="Escribí un mensaje... (Shift + Enter: salto de línea)" style="flex:1; padding:8px 10px; border-radius:8px; border:1px solid var(--borde, rgba(108,60,224,0.35)); background:rgba(0,0,0,0.25); color:inherit; font-size:13px; resize:none;"></textarea>
                <button type="submit" class="btn" style="padding:8px 12px;">Enviar</button>
            </form>
        `;

        document.body.appendChild(bubble);
        document.body.appendChild(drawer);

        bubble.addEventListener('click', () => {
            drawerOpen = !drawer.classList.contains('open');
            drawer.classList.toggle('open', drawerOpen);
            if (drawerOpen) {
                poblarSugerencias();
                renderChatDrawer();
            }
        });

        document.getElementById('kixuzChatClose').addEventListener('click', () => {
            drawerOpen = false;
            drawer.classList.remove('open');
        });

        function poblarSugerencias() {
            const dl = document.getElementById('kixuzChatCharSuggestions');
            if (!dl) return;
            const sugs = obtenerSugerenciasPersonajes();
            dl.innerHTML = sugs.map(s => `<option value="${esc(s.handle)}">${esc(s.nombre)} (${esc(s.handle)})</option>`).join('');
        }

        function renderChatDrawer() {
            const q = norm(document.getElementById('kixuzChatSearch')?.value || '');
            const listEl = document.getElementById('kixuzChatList');
            const msgEl = document.getElementById('kixuzChatMessages');
            if (!listEl || !msgEl) return;

            const em = getEmisor();
            const visibles = chatsCache.filter(c => {
                if (!puedeVerChat(c)) return false;
                if (!q) return true;
                const enParts = (c.participantes || []).some(p => norm(p).includes(q));
                return norm(c.nombre).includes(q) || norm(c.usuario).includes(q) || enParts;
            });

            if ((!activeChatId || !visibles.some(c => c.id === activeChatId)) && visibles.length > 0) {
                activeChatId = visibles[0].id;
            }

            listEl.innerHTML = visibles.map(c => {
                const isAct = c.id === activeChatId;
                return `<button type="button" class="kixuz-chat-pill ${isAct ? 'active' : ''}" data-cid="${esc(c.id)}">${esc(c.nombre || c.usuario || 'Chat')}</button>`;
            }).join('') || `<span class="muted">Todavía no tenés chats creados. Usá <strong>+ Crear</strong> arriba.</span>`;

            listEl.querySelectorAll('[data-cid]').forEach(b => {
                b.addEventListener('click', () => {
                    activeChatId = b.dataset.cid;
                    const found = chatsCache.find(x => x.id === activeChatId);
                    if (found) marcarLeido(found);
                    renderChatDrawer();
                });
            });

            const actual = chatsCache.find(x => x.id === activeChatId && puedeVerChat(x));
            if (!actual) {
                msgEl.innerHTML = `<div class="muted">Creá un chat 1×1, grupal o general arriba para empezar a conversar.</div>`;
                return;
            }

            marcarLeido(actual);
            const msgs = Array.isArray(actual.mensajes) ? actual.mensajes : [];
            const miH = normHandle(em.handle);

            msgEl.innerHTML = msgs.map((m, idx) => {
                const mine = Boolean(m.autorHandle && miH && normHandle(m.autorHandle) === miH);
                return `
                    <div class="kixuz-msg-row ${mine ? 'mine' : 'other'}">
                        <span style="font-size:11px; opacity:0.75; margin-bottom:2px;">${esc(m.autorNombre || m.autorHandle || 'Personaje')}</span>
                        <div class="kixuz-msg-bubble">${esc(m.texto || '')}</div>
                        ${mine ? `<button type="button" data-midx="${idx}" class="kixuz-del-m" style="background:none; border:none; color:#ff9bb4; font-size:10.5px; cursor:pointer; margin-top:2px;">Borrar</button>` : ''}
                    </div>
                `;
            }).join('') || `<div class="muted">Sin mensajes en <strong>${esc(actual.nombre)}</strong> todavía.</div>`;

            msgEl.querySelectorAll('.kixuz-del-m').forEach(db => {
                db.addEventListener('click', async () => {
                    const i = Number(db.dataset.midx);
                    if (i < 0 || i >= msgs.length) return;
                    msgs.splice(i, 1);
                    actual.mensajes = msgs;
                    guardarChats(chatsCache);
                    renderChatDrawer();
                    if (window.KIXUZ_DB?.guardarMensajesChat) {
                        try { await window.KIXUZ_DB.guardarMensajesChat(actual.id, msgs); } catch {}
                    }
                });
            });

            msgEl.scrollTop = msgEl.scrollHeight;
        }

        document.getElementById('kixuzChatSearch').addEventListener('input', renderChatDrawer);

        document.getElementById('kixuzCreateChatForm').addEventListener('submit', async e => {
            e.preventDefault();
            const targetRaw = document.getElementById('kixuzNewChatTarget').value.trim();
            const tipo = document.getElementById('kixuzNewChatTipo').value || 'privado';
            const em = getEmisor();

            const rawParts = targetRaw
                ? targetRaw.split(',').map(s => s.trim()).filter(Boolean)
                : [];
            const handlesParts = rawParts.map(normHandle).filter(Boolean);
            const principalHandle = handlesParts[0] || '';

            if (!targetRaw && tipo !== 'general') {
                alert('Ingresá un @usuario o nombre para crear el chat.');
                return;
            }

            const nombreSala = targetRaw || 'Sala General';
            const participantes = Array.from(new Set([
                normHandle(em.handle),
                ...handlesParts
            ].filter(Boolean)));

            const existente = chatsCache.find(c =>
                c.tipo === tipo &&
                norm(c.nombre) === norm(nombreSala) &&
                puedeVerChat(c)
            );

            if (existente) {
                activeChatId = existente.id;
                document.getElementById('kixuzNewChatTarget').value = '';
                renderChatDrawer();
                return;
            }

            const nuevo = {
                id: 'chat_' + Date.now(),
                nombre: nombreSala,
                usuario: principalHandle,
                tipo,
                creadorHandle: normHandle(em.handle),
                participantes,
                mensajes: []
            };

            chatsCache = [nuevo, ...chatsCache];
            activeChatId = nuevo.id;
            guardarChats(chatsCache);
            marcarLeido(nuevo);

            document.getElementById('kixuzNewChatTarget').value = '';
            poblarSugerencias();
            renderChatDrawer();
            actualizarBadge();

            if (window.KIXUZ_DB?.crearConversacionChat) {
                try {
                    const creada = await window.KIXUZ_DB.crearConversacionChat({
                        nombre: nombreSala,
                        usuario: principalHandle,
                        tipo,
                        participantesExtra: handlesParts.slice(1)
                    });
                    if (creada && creada.id) {
                        nuevo.id = creada.id;
                        activeChatId = creada.id;
                        guardarChats(chatsCache);
                        renderChatDrawer();
                    }
                } catch {}
            }
        });

        const cTa = document.getElementById('kixuzChatInput');
        const cForm = document.getElementById('kixuzChatSendForm');
        cTa.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                cForm.requestSubmit();
            }
        });

        cForm.addEventListener('submit', async e => {
            e.preventDefault();
            const txt = String(cTa.value || '').replace(/^\n+|\n+$/g, '');
            if (!txt.trim()) return;

            if (!activeChatId) {
                const em = getEmisor();
                const autoSala = {
                    id: 'chat_' + Date.now(),
                    nombre: 'Chat General',
                    usuario: '',
                    tipo: 'general',
                    creadorHandle: normHandle(em.handle),
                    participantes: [normHandle(em.handle)].filter(Boolean),
                    mensajes: []
                };
                chatsCache.unshift(autoSala);
                activeChatId = autoSala.id;
            }

            const actual = chatsCache.find(x => x.id === activeChatId);
            if (!actual) return;

            const em = getEmisor();
            actual.mensajes = Array.isArray(actual.mensajes) ? actual.mensajes : [];
            actual.mensajes.push({
                autorNombre: em.nombre,
                autorHandle: normHandle(em.handle),
                texto: txt
            });

            guardarChats(chatsCache);
            marcarLeido(actual);
            cTa.value = '';
            renderChatDrawer();
            actualizarBadge();

            if (window.KIXUZ_DB?.guardarMensajesChat) {
                try { await window.KIXUZ_DB.guardarMensajesChat(actual.id, actual.mensajes); } catch {}
            }
        });

        chatsCache = leerTodosLosChatsRecuperados();
        guardarChats(chatsCache);
        poblarSugerencias();
        actualizarBadge();

        window.addEventListener('load', () => {
            if (window.KIXUZ_DB?.activo && window.KIXUZ_DB?.escucharChats) {
                window.KIXUZ_DB.escucharChats(nube => {
                    if (!Array.isArray(nube)) return;
                    const mapa = new Map();
                    chatsCache.forEach(c => mapa.set(String(c.id), c));
                    nube.forEach((raw, idx) => {
                        const c = normalizarChat(raw, idx);
                        if (!c) return;
                        const prev = mapa.get(c.id);
                        if (!prev) {
                            mapa.set(c.id, c);
                        } else {
                            const msgs = c.mensajes.length >= prev.mensajes.length ? c.mensajes : prev.mensajes;
                            mapa.set(c.id, {
                                ...prev,
                                ...c,
                                participantes: Array.from(new Set([...(prev.participantes || []), ...(c.participantes || [])])),
                                mensajes: msgs
                            });
                        }
                    });
                    chatsCache = Array.from(mapa.values());
                    guardarChats(chatsCache);
                    poblarSugerencias();
                    actualizarBadge();
                    if (drawerOpen) renderChatDrawer();
                });
            }
        });
    }

    window.addEventListener('DOMContentLoaded', montarChatUI);
    window.addEventListener('kixuz:personaje-cambiado', () => {
        actualizarBadge();
        if (drawerOpen) {
            const dl = document.getElementById('kixuzChatCharSuggestions');
            if (dl) {
                dl.innerHTML = obtenerSugerenciasPersonajes()
                    .map(s => `<option value="${esc(s.handle)}">${esc(s.nombre)} (${esc(s.handle)})</option>`)
                    .join('');
            }
        }
    });
})();

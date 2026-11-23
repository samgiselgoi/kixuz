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
    let createBoxOpen = false;

    function getEmisor() {
        const ac = window.KIXUZ_ACTIVE_CHAR;
        if (ac && (ac.nombre || ac.handle)) {
            return {
                nombre: String(ac.nombre || ac.handle.replace(/^@/, '')).trim(),
                handle: normHandle(ac.handle || ac.nombre) || '@rol',
                uid: window.KIXUZ_DB?.usuarioActual?.uid || window.KIXUZ_DB?.perfilCuenta?.uid || ''
            };
        }
        try {
            const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
            if (act && (act.nombre || act.handle)) {
                return {
                    nombre: String(act.nombre || act.handle.replace(/^@/, '')).trim(),
                    handle: normHandle(act.handle || act.nombre) || '@rol',
                    uid: window.KIXUZ_DB?.usuarioActual?.uid || window.KIXUZ_DB?.perfilCuenta?.uid || ''
                };
            }
        } catch {}
        return { nombre: 'Personaje', handle: '@rol', uid: '' };
    }

    function esCreadorDeChat(c) {
        if (!c) return false;
        const em = getEmisor();
        const miH = normHandle(em.handle);
        if (c.uidMaestro && em.uid && norm(c.uidMaestro) === norm(em.uid)) return true;
        if (c.creadorHandle && miH && normHandle(c.creadorHandle) === miH) return true;
        return false;
    }

    function esCreadorDeMensaje(m) {
        if (!m) return false;
        const em = getEmisor();
        const miH = normHandle(em.handle);
        if (m.autorUid && em.uid && norm(m.autorUid) === norm(em.uid)) return true;
        if (m.autorHandle && miH && normHandle(m.autorHandle) === miH) return true;
        return false;
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

        const mensajes = mensajesRaw.map((m, mIdx) => {
            if (!m || typeof m !== 'object') return null;
            return {
                id: String(m.id || `msg_${idx}_${mIdx}`),
                autorNombre: String(m.autorNombre || m.senderNombre || m.autor || 'Personaje').trim(),
                autorHandle: normHandle(m.autorHandle || m.senderHandle || m.handle || ''),
                autorUid: String(m.autorUid || ''),
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
            uidMaestro: String(raw.uidMaestro || ''),
            participantes,
            mensajes
        };
    }

    function leerTodosLosChatsRecuperados() {
        const mapa = new Map();
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
        return Array.from(mapa.values());
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
        if (esCreadorDeChat(c)) return true;
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
                position: fixed; right: 18px; bottom: 18px; z-index: 1100;
                background: var(--acento, #2DD4C4); color: #150A24; border: none;
                border-radius: 999px; padding: 11px 16px; font-family: 'Space Grotesk', sans-serif;
                font-weight: 700; font-size: 13.5px; cursor: pointer;
                box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45); display: inline-flex; align-items: center; gap: 7px;
            }
            #kixuzChatBadge {
                background: #e03c6c; color: #ffffff; border-radius: 999px;
                padding: 1px 7px; font-size: 11px; font-weight: 800; display: none;
            }
            #kixuzChatDrawer {
                position: fixed; top: 0; right: 0; width: 380px; max-width: 100vw; height: 100vh;
                z-index: 1150; background: #1a0c2e; color: var(--texto, #EDE7E0);
                border-left: 1px solid var(--borde, rgba(108,60,224,0.45));
                box-shadow: -12px 0 32px rgba(0, 0, 0, 0.55);
                transform: translateX(100%); transition: transform 0.24s ease;
                display: flex; flex-direction: column;
            }
            html[data-theme="light"] #kixuzChatDrawer { background: #ffffff; color: #150A24; }
            #kixuzChatDrawer.open { transform: translateX(0); }

            /* Sección emergente aparte para crear chats */
            #kixuzCreateChatFloatingBox {
                display: none;
                position: fixed;
                right: 396px;
                top: 16px;
                width: 310px;
                max-width: calc(100vw - 32px);
                z-index: 1200;
                background: #22103c;
                color: var(--texto, #EDE7E0);
                border: 1px solid var(--acento, #2DD4C4);
                border-radius: 14px;
                padding: 14px;
                box-shadow: 0 14px 34px rgba(0, 0, 0, 0.65);
                flex-direction: column;
                gap: 8px;
            }
            @media (max-width: 760px) {
                #kixuzCreateChatFloatingBox {
                    right: 16px;
                    top: 64px;
                }
            }
            html[data-theme="light"] #kixuzCreateChatFloatingBox {
                background: #ffffff;
                color: #150A24;
            }
            #kixuzCreateChatFloatingBox.open {
                display: flex;
            }

            .kixuz-chat-top-bar {
                padding: 12px 14px;
                border-bottom: 1px solid var(--borde, rgba(108,60,224,0.35));
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .kixuz-chat-list-wrap {
                padding: 10px 14px;
                border-bottom: 1px solid var(--borde, rgba(108,60,224,0.25));
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-height: 210px;
                overflow-y: auto;
            }
            /* Filas de chats más gruesas en lista vertical */
            .kixuz-chat-item-card {
                width: 100%;
                padding: 11px 12px;
                border-radius: 12px;
                border: 1px solid var(--borde, rgba(108,60,224,0.38));
                background: rgba(108, 60, 224, 0.2);
                color: inherit;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                transition: background 0.18s ease, border-color 0.18s ease;
            }
            .kixuz-chat-item-card:hover {
                border-color: var(--acento, #2DD4C4);
            }
            .kixuz-chat-item-card.active {
                background: var(--acento, #2DD4C4);
                color: #150A24;
                border-color: var(--acento, #2DD4C4);
            }
            .kixuz-chat-body {
                flex: 1; overflow-y: auto; padding: 12px 14px;
                display: flex; flex-direction: column; gap: 10px;
            }
            .kixuz-msg-row { display: flex; flex-direction: column; max-width: 82%; }
            .kixuz-msg-row.mine { align-self: flex-end; align-items: flex-end; }
            .kixuz-msg-row.other { align-self: flex-start; align-items: flex-start; }
            .kixuz-msg-bubble {
                padding: 9px 12px; border-radius: 12px; font-size: 13.5px;
                white-space: pre-wrap; word-break: break-word; line-height: 1.45;
            }
            .kixuz-msg-row.mine .kixuz-msg-bubble {
                background: rgba(45, 212, 196, 0.22); border: 1px solid rgba(45, 212, 196, 0.5);
            }
            .kixuz-msg-row.other .kixuz-msg-bubble {
                background: rgba(108, 60, 224, 0.28); border: 1px solid rgba(108, 60, 224, 0.45);
            }
        `;
        document.head.appendChild(style);

        const bubble = document.createElement('button');
        bubble.type = 'button';
        bubble.id = 'kixuzChatBubble';
        bubble.innerHTML = `💬 <span id="kixuzChatBadge"></span>`;

        const drawer = document.createElement('aside');
        drawer.id = 'kixuzChatDrawer';
        drawer.innerHTML = `
            <div class="kixuz-chat-top-bar">
                <input type="search" id="kixuzChatSearch" placeholder="Buscar chat o @usuario..." style="flex:1; padding:8px 11px; border-radius:9px; border:1px solid var(--borde, rgba(108,60,224,0.35)); background:rgba(0,0,0,0.25); color:inherit; font-size:13px;">
                <button type="button" id="kixuzOpenCreateFloatBtn" class="btn" style="padding:8px 12px; font-size:12.5px; white-space:nowrap;">+ Crear</button>
                <button type="button" id="kixuzChatClose" style="background:none; border:none; color:inherit; font-size:18px; cursor:pointer; padding:2px 6px;" aria-label="Cerrar">✕</button>
            </div>
            <div id="kixuzChatList" class="kixuz-chat-list-wrap"></div>
            <div class="kixuz-chat-body" id="kixuzChatMessages"></div>
            <form id="kixuzChatSendForm" style="padding:10px 14px; border-top:1px solid var(--borde, rgba(108,60,224,0.35)); display:flex; gap:8px; align-items:flex-end;">
                <textarea id="kixuzChatInput" rows="1" placeholder="Escribí un mensaje... (Shift + Enter: salto de línea)" style="flex:1; padding:8px 10px; border-radius:8px; border:1px solid var(--borde, rgba(108,60,224,0.35)); background:rgba(0,0,0,0.25); color:inherit; font-size:13px; resize:none;"></textarea>
                <button type="submit" class="btn" style="padding:8px 12px;">Enviar</button>
            </form>
        `;

        const createFloatBox = document.createElement('div');
        createFloatBox.id = 'kixuzCreateChatFloatingBox';
        createFloatBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-family:'Space Grotesk',sans-serif; font-size:13.5px; color:var(--acento, #2DD4C4);">➕ Nueva conversación</strong>
                <button type="button" id="kixuzCloseCreateFloatBtn" style="background:none; border:none; color:inherit; font-size:15px; cursor:pointer;">✕</button>
            </div>
            <form id="kixuzCreateChatForm" style="display:flex; flex-direction:column; gap:8px;">
                <input type="text" id="kixuzNewChatTarget" list="kixuzChatCharSuggestions" placeholder="@usuario o participantes (ej. @Demian, @Lia)" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid var(--borde, rgba(108,60,224,0.35)); background:rgba(0,0,0,0.25); color:inherit; font-size:12.5px;">
                <datalist id="kixuzChatCharSuggestions"></datalist>
                <select id="kixuzNewChatTipo" style="width:100%; padding:8px 10px; border-radius:8px; border:1px solid var(--borde, rgba(108,60,224,0.35)); background:rgba(0,0,0,0.25); color:inherit; font-size:12.5px;">
                    <option value="privado">1×1 (Privado)</option>
                    <option value="grupal">Grupal</option>
                    <option value="general">General</option>
                </select>
                <button type="submit" id="kixuzCreateChatBtn" class="btn" style="width:100%; justify-content:center; padding:8px 12px; font-size:12.5px;">Crear</button>
            </form>
        `;

        document.body.appendChild(bubble);
        document.body.appendChild(drawer);
        document.body.appendChild(createFloatBox);

        bubble.addEventListener('click', () => {
            drawerOpen = !drawer.classList.contains('open');
            drawer.classList.toggle('open', drawerOpen);
            if (!drawerOpen) {
                createBoxOpen = false;
                createFloatBox.classList.remove('open');
            } else {
                poblarSugerencias();
                renderChatDrawer();
            }
        });

        document.getElementById('kixuzChatClose').addEventListener('click', () => {
            drawerOpen = false;
            createBoxOpen = false;
            drawer.classList.remove('open');
            createFloatBox.classList.remove('open');
        });

        document.getElementById('kixuzOpenCreateFloatBtn').addEventListener('click', () => {
            createBoxOpen = !createFloatBox.classList.contains('open');
            createFloatBox.classList.toggle('open', createBoxOpen);
            if (createBoxOpen) {
                poblarSugerencias();
                document.getElementById('kixuzNewChatTarget')?.focus();
            }
        });

        document.getElementById('kixuzCloseCreateFloatBtn').addEventListener('click', () => {
            createBoxOpen = false;
            createFloatBox.classList.remove('open');
        });

        function poblarSugerencias() {
            const dl = document.getElementById('kixuzChatCharSuggestions');
            if (!dl) return;
            const sugs = obtenerSugerenciasPersonajes();
            dl.innerHTML = sugs.map(s => `<option value="${esc(s.handle)}">${esc(s.nombre)} (${esc(s.handle)})</option>`).join('');
        }

        async function eliminarChatPorId(cid) {
            const target = chatsCache.find(x => String(x.id) === String(cid));
            if (!target || !esCreadorDeChat(target)) return;
            chatsCache = chatsCache.filter(x => String(x.id) !== String(cid));
            if (String(activeChatId) === String(cid)) {
                activeChatId = chatsCache[0]?.id || null;
            }
            guardarChats(chatsCache);
            renderChatDrawer();
            actualizarBadge();
            if (window.KIXUZ_DB?.eliminarConversacionChat) {
                try { await window.KIXUZ_DB.eliminarConversacionChat(cid); } catch {}
            }
        }

        function renderChatDrawer() {
            const q = norm(document.getElementById('kixuzChatSearch')?.value || '');
            const listEl = document.getElementById('kixuzChatList');
            const msgEl = document.getElementById('kixuzChatMessages');
            if (!listEl || !msgEl) return;

            const visibles = chatsCache.filter(c => {
                if (!puedeVerChat(c)) return false;
                if (!q) return true;
                const enParts = (c.participantes || []).some(p => norm(p).includes(q));
                return norm(c.nombre).includes(q) || norm(c.usuario).includes(q) || enParts;
            });

            if ((!activeChatId || !visibles.some(c => c.id === activeChatId)) && visibles.length > 0) {
                activeChatId = visibles[0].id;
            }

            if (!visibles.length) {
                listEl.innerHTML = `<span class="muted">Todavía no tenés chats. Tocá <strong>+ Crear</strong> arriba.</span>`;
            } else {
                listEl.innerHTML = '';
                visibles.forEach(c => {
                    const isAct = String(c.id) === String(activeChatId);
                    const countMsgs = Array.isArray(c.mensajes) ? c.mensajes.length : 0;
                    const soyCreador = esCreadorDeChat(c);
                    const subInfo = c.tipo === 'general'
                        ? 'General'
                        : ((c.participantes || []).join(', ') || c.usuario || 'Privado');

                    const row = document.createElement('div');
                    row.className = `kixuz-chat-item-card ${isAct ? 'active' : ''}`;
                    row.innerHTML = `
                        <div style="min-width:0; flex:1;">
                            <div style="font-size:13.5px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(c.nombre || c.usuario || 'Conversación')}</div>
                            <div style="font-size:11.5px; opacity:0.8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(subInfo)} · ${countMsgs} msg</div>
                        </div>
                        ${soyCreador ? `<button type="button" class="kixuz-del-chat-btn" title="Eliminar conversación" style="background:rgba(224,60,108,0.22); border:1px solid rgba(224,60,108,0.55); color:#ff9bb4; border-radius:7px; padding:4px 7px; font-size:11.5px; cursor:pointer;">🗑️</button>` : ''}
                    `;

                    row.addEventListener('click', ev => {
                        if (ev.target.closest('.kixuz-del-chat-btn')) return;
                        activeChatId = c.id;
                        marcarLeido(c);
                        renderChatDrawer();
                    });

                    const delChatBtn = row.querySelector('.kixuz-del-chat-btn');
                    if (delChatBtn) {
                        delChatBtn.addEventListener('click', ev => {
                            ev.stopPropagation();
                            eliminarChatPorId(c.id);
                        });
                    }

                    listEl.appendChild(row);
                });
            }

            const actual = chatsCache.find(x => String(x.id) === String(activeChatId) && puedeVerChat(x));
            if (!actual) {
                msgEl.innerHTML = `<div class="muted">Creá una conversación desde <strong>+ Crear</strong> o elegí una de la lista.</div>`;
                return;
            }

            marcarLeido(actual);
            const msgs = Array.isArray(actual.mensajes) ? actual.mensajes : [];

            if (!msgs.length) {
                msgEl.innerHTML = `<div class="muted">Sin mensajes en <strong>${esc(actual.nombre)}</strong> todavía.</div>`;
                return;
            }

            msgEl.innerHTML = '';
            msgs.forEach((m, idx) => {
                const mine = esCreadorDeMensaje(m);
                const msgDiv = document.createElement('div');
                msgDiv.className = `kixuz-msg-row ${mine ? 'mine' : 'other'}`;
                msgDiv.innerHTML = `
                    <span style="font-size:11px; opacity:0.75; margin-bottom:2px;">${esc(m.autorNombre || m.autorHandle || 'Personaje')}</span>
                    <div class="kixuz-msg-bubble">${esc(m.texto || '')}</div>
                    ${mine ? `<button type="button" class="kixuz-del-m" style="background:none; border:none; color:#ff9bb4; font-size:11px; cursor:pointer; margin-top:3px;">Borrar</button>` : ''}
                `;

                const delMsgBtn = msgDiv.querySelector('.kixuz-del-m');
                if (delMsgBtn) {
                    delMsgBtn.addEventListener('click', async () => {
                        if (!esCreadorDeMensaje(m)) return;
                        actual.mensajes.splice(idx, 1);
                        guardarChats(chatsCache);
                        renderChatDrawer();
                        if (window.KIXUZ_DB?.guardarMensajesChat) {
                            try { await window.KIXUZ_DB.guardarMensajesChat(actual.id, actual.mensajes); } catch {}
                        }
                    });
                }

                msgEl.appendChild(msgDiv);
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
                createBoxOpen = false;
                createFloatBox.classList.remove('open');
                renderChatDrawer();
                return;
            }

            const nuevo = {
                id: 'chat_' + Date.now(),
                nombre: nombreSala,
                usuario: principalHandle,
                tipo,
                creadorHandle: normHandle(em.handle),
                uidMaestro: em.uid || '',
                participantes,
                mensajes: []
            };

            chatsCache = [nuevo, ...chatsCache];
            activeChatId = nuevo.id;
            guardarChats(chatsCache);
            marcarLeido(nuevo);

            document.getElementById('kixuzNewChatTarget').value = '';
            createBoxOpen = false;
            createFloatBox.classList.remove('open');
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
                    nombre: 'General',
                    usuario: '',
                    tipo: 'general',
                    creadorHandle: normHandle(em.handle),
                    uidMaestro: em.uid || '',
                    participantes: [normHandle(em.handle)].filter(Boolean),
                    mensajes: []
                };
                chatsCache.unshift(autoSala);
                activeChatId = autoSala.id;
            }

            const actual = chatsCache.find(x => String(x.id) === String(activeChatId));
            if (!actual) return;

            const em = getEmisor();
            actual.mensajes = Array.isArray(actual.mensajes) ? actual.mensajes : [];
            actual.mensajes.push({
                id: 'msg_' + Date.now(),
                autorNombre: em.nombre,
                autorHandle: normHandle(em.handle),
                autorUid: em.uid || '',
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

(() => {
    const STORAGE_KEY = 'kixuz_chat_conversaciones_v5';
    const ALL_CHAT_KEYS = [
        'kixuz_chats_v1',
        'kixuz_chats_v2',
        'kixuz_chat_conversaciones_v1',
        'kixuz_chat_conversaciones_v3',
        'kixuz_chat_conversaciones_v4',
        'kixuz_chat_conversaciones_v5'
    ];
    const STORAGE_LEIDOS = 'kixuz_chat_leidos_v1';

    const esc = str => String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const normToken = v => String(v || '').trim().toLowerCase();
    const normHandle = h => {
        const s = normToken(h).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    const SVG_CHAT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    const SVG_LOCK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
    const SVG_GROUP = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 20a5 5 0 0 1 6 0"/></svg>`;
    const SVG_TRASH = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

    const style = document.createElement('style');
    style.id = 'kixuz-chat-styles';
    style.textContent = `
        .kixuz-chat-trigger {
            position: fixed; right: 20px; bottom: 20px; z-index: 9998;
            width: 56px; height: 56px; border-radius: 50%;
            background-color: var(--bg-secundario, #6C3CE0);
            border: 2.5px solid var(--acento, #2DD4C4);
            cursor: pointer; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.65);
            transition: transform 0.2s ease; display: flex; align-items: center; justify-content: center;
            color: var(--texto, #EDE7E0);
        }
        .kixuz-chat-trigger:hover { transform: scale(1.06); }
        .kixuz-chat-trigger svg { width: 24px; height: 24px; }
        .kixuz-chat-badge {
            position: absolute; top: -3px; right: -3px; background-color: #e03c6c; color: #fff;
            font-size: 11px; font-weight: 700; min-width: 20px; height: 20px; padding: 0 5px;
            border-radius: 20px; font-family: 'Space Grotesk', sans-serif;
            border: 2px solid var(--bg-principal, #150A24);
            display: flex; align-items: center; justify-content: center;
        }
        .kixuz-chat-sidebar {
            position: fixed; top: 0; right: -430px; width: 390px; max-width: 100vw;
            height: 100vh; height: 100dvh;
            background-color: rgba(21, 10, 36, 0.98); backdrop-filter: blur(16px);
            border-left: 2px solid var(--acento, #2DD4C4); box-shadow: -6px 0 30px rgba(0, 0, 0, 0.75);
            transition: right 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: 9999; display: flex; flex-direction: column; overflow: hidden;
            font-family: 'Inter', sans-serif; color: var(--texto, #EDE7E0);
        }
        html[data-theme="light"] .kixuz-chat-sidebar { background-color: rgba(244, 241, 250, 0.98); color: #150A24; }
        .kixuz-chat-sidebar.active { right: 0; }
        .kixuz-chat-header {
            padding: 12px 14px; border-bottom: 1px solid rgba(108, 60, 224, 0.45);
            display: flex; justify-content: space-between; align-items: center; gap: 8px;
            background: rgba(0, 0, 0, 0.22); flex-shrink: 0;
        }
        .kixuz-chat-header h3 { font-family: 'Space Grotesk', sans-serif; margin: 0; color: var(--acento, #2DD4C4); font-size: 16px; }
        .kixuz-chat-icon-btn {
            background: none; border: none; color: inherit; font-size: 16px; cursor: pointer;
            padding: 4px 6px; display: inline-flex; align-items: center; justify-content: center;
        }
        .kixuz-chat-icon-btn:hover { color: var(--acento, #2DD4C4); }
        .kixuz-add-member-btn {
            background: rgba(45, 212, 196, 0.15); border: 1px solid var(--acento, #2DD4C4);
            color: var(--acento, #2DD4C4); border-radius: 8px; padding: 5px 9px;
            font-family: 'Space Grotesk', sans-serif; font-size: 11.5px; font-weight: 700; cursor: pointer;
        }
        .kixuz-chat-toolbar {
            padding: 10px 14px; border-bottom: 1px solid rgba(108, 60, 224, 0.35);
            background: rgba(0, 0, 0, 0.2); display: flex; gap: 8px; align-items: center; flex-shrink: 0;
        }
        .kixuz-chat-toolbar input {
            flex: 1 1 auto; min-width: 0; padding: 9px 12px; border-radius: 10px;
            background: rgba(0, 0, 0, 0.45); border: 1px solid var(--bg-secundario, #6C3CE0);
            color: var(--texto, #EDE7E0); font-family: 'Inter', sans-serif; font-size: 16px; outline: none;
        }
        html[data-theme="light"] .kixuz-chat-toolbar input { background: #fff; color: #150A24; }
        .kixuz-plus-btn {
            width: 38px; height: 38px; border-radius: 11px; background: var(--acento, #2DD4C4); color: #150A24;
            border: none; font-family: 'Space Grotesk', sans-serif; font-size: 21px; font-weight: 700;
            cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .kixuz-chat-list { flex: 1 1 auto; overflow-y: auto; }
        .kixuz-chat-empty { padding: 26px 18px; text-align: center; font-size: 13.5px; opacity: 0.75; }
        .kixuz-chat-item {
            display: flex; gap: 11px; padding: 12px 15px; border-bottom: 1px solid rgba(108, 60, 224, 0.2);
            cursor: pointer; transition: background 0.18s; align-items: center;
        }
        .kixuz-chat-item:hover { background: rgba(108, 60, 224, 0.22); }
        .kixuz-chat-avatar {
            width: 38px; height: 38px; border-radius: 50%; background-color: var(--bg-secundario, #6C3CE0);
            border: 2px solid var(--acento, #2DD4C4); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15px; color: #EDE7E0;
        }
        .kixuz-chat-info { flex-grow: 1; min-width: 0; }
        .kixuz-chat-info h4 { font-family: 'Space Grotesk', sans-serif; margin: 0 0 2px 0; color: var(--acento, #2DD4C4); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; }
        .kixuz-chat-info p { margin: 0; font-size: 12px; opacity: 0.78; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .kixuz-unread-pill {
            background: #e03c6c; color: #fff; font-family: 'Space Grotesk', sans-serif;
            font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 12px; flex-shrink: 0;
        }
        .kixuz-del-conv-btn {
            background: rgba(224, 60, 108, 0.16); border: 1px solid rgba(224, 60, 108, 0.45);
            color: #ff9bb4; border-radius: 8px; width: 26px; height: 26px; font-size: 11px; cursor: pointer; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
        }
        .kixuz-conv-meta-strip {
            padding: 6px 14px; font-size: 11.5px; background: rgba(108, 60, 224, 0.14);
            border-bottom: 1px solid rgba(108, 60, 224, 0.3);
            display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-shrink: 0;
        }
        .kixuz-chat-messages {
            flex: 1 1 auto; padding: 14px 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; font-size: 14px;
        }
        .kixuz-msg {
            padding: 10px 12px; border-radius: 12px; max-width: 84%; word-wrap: break-word;
            display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;
        }
        .kixuz-msg.me {
            align-self: flex-end; background-color: rgba(108, 60, 224, 0.44);
            border: 1px solid rgba(45, 212, 196, 0.35); border-bottom-right-radius: 3px; text-align: left;
        }
        .kixuz-msg.other {
            align-self: flex-start; background-color: rgba(255, 255, 255, 0.07);
            border-bottom-left-radius: 3px; border-left: 3px solid var(--acento, #2DD4C4); text-align: left;
        }
        html[data-theme="light"] .kixuz-msg.other { background-color: rgba(108, 60, 224, 0.1); }
        .kixuz-msg-time { display: block; font-size: 10.5px; opacity: 0.65; margin-top: 3px; }
        .kixuz-msg-del { background: none; border: none; color: #ff9bb4; font-size: 11px; cursor: pointer; padding: 0 2px; flex-shrink: 0; }
        .kixuz-chat-input {
            padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
            border-top: 1px solid rgba(108, 60, 224, 0.5);
            display: flex; gap: 8px; background: rgba(21, 10, 36, 0.96); flex-shrink: 0;
        }
        html[data-theme="light"] .kixuz-chat-input { background: rgba(244, 241, 250, 0.98); }
        .kixuz-chat-input input {
            flex-grow: 1; min-width: 0; padding: 10px 12px; background: rgba(0, 0, 0, 0.45);
            border: 1px solid var(--bg-secundario, #6C3CE0); color: var(--texto, #EDE7E0);
            border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 16px; outline: none;
        }
        html[data-theme="light"] .kixuz-chat-input input { background: #fff; color: #150A24; }
        .kixuz-chat-input button {
            background-color: var(--acento, #2DD4C4); color: #150A24; border: none; padding: 0 15px;
            border-radius: 10px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer;
        }
        .kixuz-chat-modal-backdrop {
            position: fixed; inset: 0; background: rgba(10, 4, 20, 0.72); backdrop-filter: blur(3px); z-index: 10000;
            display: none; align-items: flex-start; justify-content: flex-end; padding: 62px 16px 16px;
        }
        .kixuz-chat-modal-backdrop.open { display: flex; }
        .kixuz-chat-modal {
            width: 100%; max-width: 340px; background: var(--bg-principal, #150A24); color: var(--texto, #EDE7E0);
            border: 1px solid var(--acento, #2DD4C4); border-radius: 14px; padding: 14px;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.65);
        }
        html[data-theme="light"] .kixuz-chat-modal { background: #F4F1FA; color: #150A24; }
        .kixuz-chat-modal-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .kixuz-chat-modal-top h4 { font-family: 'Space Grotesk', sans-serif; font-size: 15px; color: var(--acento, #2DD4C4); margin: 0; }
        .kixuz-chat-modal label { display: block; font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700; margin-bottom: 4px; }
        .kixuz-chat-modal select, .kixuz-chat-modal input {
            width: 100%; padding: 8px 10px; border-radius: 8px; margin-bottom: 10px;
            background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(108, 60, 224, 0.6);
            color: var(--texto, #EDE7E0); font-family: 'Inter', sans-serif; font-size: 16px; outline: none;
        }
        html[data-theme="light"] .kixuz-chat-modal select, html[data-theme="light"] .kixuz-chat-modal input { background: #fff; color: #150A24; }
        .kixuz-quick-handles { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
        .kixuz-chip-btn {
            background: rgba(108, 60, 224, 0.24); border: 1px solid rgba(108, 60, 224, 0.5);
            color: inherit; border-radius: 999px; padding: 3px 8px; font-size: 11.5px; font-weight: 600; cursor: pointer;
        }
        .kixuz-chip-btn:hover { border-color: var(--acento, #2DD4C4); color: var(--acento, #2DD4C4); }
        .kixuz-chat-modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
        .kixuz-modal-btn-cancel { background: transparent; border: 1px solid rgba(108, 60, 224, 0.6); color: inherit; padding: 7px 12px; border-radius: 8px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 12.5px; cursor: pointer; }
        .kixuz-modal-btn-create { background: var(--acento, #2DD4C4); color: #150A24; border: none; padding: 7px 14px; border-radius: 8px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 12.5px; cursor: pointer; }
    `;

    function leerArregloSeguro(key) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    }

    function normalizarConversacion(raw, idx = 0) {
        if (!raw || typeof raw !== 'object') return null;
        const id = String(raw.id || raw.convId || `chat_rec_${idx}_${Date.now()}`);
        const nombre = String(raw.nombre || raw.titulo || raw.usuario || 'Chat').trim();
        const usuario = normHandle(raw.usuario || nombre);
        const msgs = Array.isArray(raw.mensajes) ? raw.mensajes : (Array.isArray(raw.messages) ? raw.messages : []);
        return { ...raw, id, nombre, usuario, tipo: raw.tipo === 'grupo' ? 'grupo' : 'privado', mensajes: msgs };
    }

    function cargarLocal() {
        const mapa = new Map();
        ALL_CHAT_KEYS.forEach((k, kIdx) => {
            leerArregloSeguro(k).forEach((item, i) => {
                const normConv = normalizarConversacion(item, kIdx * 100 + i);
                if (!normConv) return;
                const prev = mapa.get(normConv.id);
                if (!prev) mapa.set(normConv.id, normConv);
                else {
                    const prevMsgs = Array.isArray(prev.mensajes) ? prev.mensajes : [];
                    const nextMsgs = Array.isArray(normConv.mensajes) ? normConv.mensajes : [];
                    mapa.set(normConv.id, { ...prev, ...normConv, mensajes: nextMsgs.length >= prevMsgs.length ? nextMsgs : prevMsgs });
                }
            });
        });
        const combinadas = Array.from(mapa.values());
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(combinadas)); } catch {}
        return combinadas;
    }

    function guardarLocal() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversaciones)); } catch {}
    }

    function leerLeidos() {
        try { return JSON.parse(localStorage.getItem(STORAGE_LEIDOS) || '{}'); } catch { return {}; }
    }

    function guardarLeidos(obj) {
        try { localStorage.setItem(STORAGE_LEIDOS, JSON.stringify(obj)); } catch {}
    }

    let conversaciones = cargarLocal();
    let idsEliminadosRecientemente = new Set();
    let chatActivoId = null;

    function montarChatUI() {
        if (!document.body) return;
        if (!document.getElementById('kixuz-chat-styles')) {
            document.head.appendChild(style);
        }

        document.querySelectorAll('.chat-trigger, .chat-sidebar, .kixuz-chat-trigger, .kixuz-chat-sidebar, .kixuz-chat-modal-backdrop').forEach(el => el.remove());

        const trigger = document.createElement('div');
        trigger.className = 'kixuz-chat-trigger';
        trigger.title = 'Abrir comunicaciones';
        trigger.innerHTML = `${SVG_CHAT}<div class="kixuz-chat-badge" id="kixuzChatBadge" style="display:none;">0</div>`;

        const sidebar = document.createElement('aside');
        sidebar.className = 'kixuz-chat-sidebar';
        sidebar.innerHTML = `
            <div id="kixuzListView" style="display: flex; flex-direction: column; height: 100%;">
                <div class="kixuz-chat-header">
                    <h3>Comunicaciones</h3>
                    <button class="kixuz-chat-icon-btn" id="kixuzClose1" title="Cerrar">✕</button>
                </div>
                <div class="kixuz-chat-toolbar">
                    <input type="text" id="kixuzSearchInput" placeholder="Buscar chat...">
                    <button type="button" class="kixuz-plus-btn" id="kixuzOpenCreateModalBtn" title="Nuevo chat">+</button>
                </div>
                <div class="kixuz-chat-list" id="kixuzChatList"></div>
            </div>
            <div id="kixuzConvView" style="display: none; flex-direction: column; height: 100%;">
                <div class="kixuz-chat-header">
                    <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
                        <button class="kixuz-chat-icon-btn" id="kixuzBackBtn" title="Volver">←</button>
                        <div style="min-width: 0;">
                            <h3 id="kixuzConvTitle" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Chat</h3>
                            <span id="kixuzConvSub" style="font-size: 11.5px; opacity: 0.75; display: block;">Conectado</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                        <button type="button" class="kixuz-add-member-btn" id="kixuzAddMemberBtn">+ Persona</button>
                        <button class="kixuz-chat-icon-btn" id="kixuzDeleteConvHeaderBtn" title="Eliminar chat">${SVG_TRASH}</button>
                        <button class="kixuz-chat-icon-btn" id="kixuzClose2" title="Cerrar">✕</button>
                    </div>
                </div>
                <div class="kixuz-conv-meta-strip">
                    <span id="kixuzSpeakingAs">Hablando como: —</span>
                    <span id="kixuzMembersCount">Privado</span>
                </div>
                <div class="kixuz-chat-messages" id="kixuzMessagesBox"></div>
                <div class="kixuz-chat-input">
                    <input type="text" id="kixuzMsgInput" placeholder="Escribe un mensaje..." autocomplete="off">
                    <button id="kixuzSendBtn" title="Enviar">▶</button>
                </div>
            </div>
        `;

        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'kixuz-chat-modal-backdrop';
        modalBackdrop.id = 'kixuzChatModalBackdrop';
        modalBackdrop.innerHTML = `
            <div class="kixuz-chat-modal" role="dialog" aria-modal="true">
                <div class="kixuz-chat-modal-top">
                    <h4>Nuevo chat</h4>
                    <button type="button" class="kixuz-chat-icon-btn" id="kixuzCancelModalBtn" aria-label="Cerrar">✕</button>
                </div>
                <label for="kixuzModalChatTipo">Modalidad</label>
                <select id="kixuzModalChatTipo">
                    <option value="privado">1×1 Privado</option>
                    <option value="grupo">Grupo</option>
                </select>
                <label for="kixuzModalNewChatInput">@Usuario o participantes</label>
                <input type="text" id="kixuzModalNewChatInput" placeholder="@usuario (separados por coma)" autocomplete="off">
                <div class="kixuz-quick-handles" id="kixuzQuickHandles"></div>
                <div class="kixuz-chat-modal-actions">
                    <button type="button" class="kixuz-modal-btn-create" id="kixuzConfirmCreateBtn">Crear</button>
                </div>
            </div>
        `;

        document.body.appendChild(trigger);
        document.body.appendChild(sidebar);
        document.body.appendChild(modalBackdrop);

        const listView = sidebar.querySelector('#kixuzListView');
        const convView = sidebar.querySelector('#kixuzConvView');
        const chatListEl = sidebar.querySelector('#kixuzChatList');
        const searchInput = sidebar.querySelector('#kixuzSearchInput');
        const newChatInput = modalBackdrop.querySelector('#kixuzModalNewChatInput');
        const chatTipoSelect = modalBackdrop.querySelector('#kixuzModalChatTipo');
        const confirmCreateBtn = modalBackdrop.querySelector('#kixuzConfirmCreateBtn');
        const quickHandlesEl = modalBackdrop.querySelector('#kixuzQuickHandles');
        const messagesBox = sidebar.querySelector('#kixuzMessagesBox');
        const msgInput = sidebar.querySelector('#kixuzMsgInput');
        const badgeEl = trigger.querySelector('#kixuzChatBadge');

        function obtenerChatActivo() {
            return chatActivoId ? conversaciones.find(c => String(c.id) === String(chatActivoId)) || null : null;
        }

        // Claves EXCLUSIVAS del personaje activo actual (no de toda la cuenta maestra)
        function obtenerClavesPersonajeActivo() {
            const set = new Set();
            const add = v => {
                const s = normToken(v);
                if (!s) return;
                set.add(s);
                if (s.startsWith('@')) set.add(s.slice(1));
                else set.add('@' + s.replace(/\s+/g, '_'));
            };

            add(window.KIXUZ_ACTIVE_CHAR?.handle);
            add(window.KIXUZ_ACTIVE_CHAR?.nombre);

            try {
                const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
                if (act) {
                    add(act.handle);
                    add(act.nombre);
                }
            } catch {}

            const selectEl = document.getElementById('activeCharSelect');
            if (selectEl && selectEl.value && !selectEl.value.startsWith('__')) {
                add(selectEl.value);
                const txt = selectEl.options[selectEl.selectedIndex]?.textContent || '';
                const paren = txt.match(/\((@[^)]+)\)/);
                if (paren && paren[1]) add(paren[1]);
            }

            return set;
        }

        // Solo los personajes explícitamente implicados en este chat pueden verlo
        function esImplicado(conv) {
            if (!conv || idsEliminadosRecientemente.has(String(conv.id))) return false;

            const misPjClaves = obtenerClavesPersonajeActivo();
            if (!misPjClaves.size) return false;

            const participantes = [
                ...(Array.isArray(conv.participantes) ? conv.participantes : []),
                ...(Array.isArray(conv.miembros) ? conv.miembros : [])
            ].map(normToken).filter(x => x && x !== 'todos');

            if (participantes.length > 0) {
                return participantes.some(p => misPjClaves.has(p) || misPjClaves.has(normHandle(p)));
            }

            const dest = normToken(conv.usuario);
            return Boolean(dest && (misPjClaves.has(dest) || misPjClaves.has(normHandle(dest))));
        }

        // El mensaje es "mío" solo si lo envió el personaje activo actual
        function esMensajeMio(msg) {
            if (!msg) return false;
            const misPjClaves = obtenerClavesPersonajeActivo();
            const mHandle = normToken(msg.autorHandle);
            const mAutor = normToken(msg.autor);
            return Boolean((mHandle && misPjClaves.has(mHandle)) || (mAutor && misPjClaves.has(mAutor)));
        }

        function contarNoLeidosDeChat(conv) {
            if (!conv || !esImplicado(conv)) return 0;
            const msgs = Array.isArray(conv.mensajes) ? conv.mensajes : [];
            const leidosCount = Number(leerLeidos()[conv.id] || 0);
            return Math.max(0, msgs.filter(m => !esMensajeMio(m)).length - leidosCount);
        }

        function marcarChatComoLeido(conv) {
            if (!conv?.id) return;
            const msgs = Array.isArray(conv.mensajes) ? conv.mensajes : [];
            const obj = leerLeidos();
            obj[conv.id] = msgs.filter(m => !esMensajeMio(m)).length;
            guardarLeidos(obj);
        }

        function actualizarBadge() {
            const total = conversaciones.filter(c => esImplicado(c)).reduce((a, c) => a + contarNoLeidosDeChat(c), 0);
            badgeEl.textContent = total;
            badgeEl.style.display = total > 0 ? 'flex' : 'none';
        }

        function horaCorta() {
            try { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
        }

        function renderSugerenciasRapidas() {
            const handles = new Set();
            try {
                leerArregloSeguro('kixuz_subpersonajes').forEach(p => { if (p?.handle) handles.add(normHandle(p.handle)); });
            } catch {}
            quickHandlesEl.innerHTML = Array.from(handles).filter(Boolean).slice(0, 6).map(h =>
                `<button type="button" class="kixuz-chip-btn" data-h="${esc(h)}">${esc(h)}</button>`
            ).join('');
            quickHandlesEl.querySelectorAll('.kixuz-chip-btn').forEach(b => {
                b.addEventListener('click', () => {
                    const h = b.dataset.h;
                    const cur = newChatInput.value.trim();
                    newChatInput.value = cur ? `${cur}, ${h}` : h;
                    newChatInput.focus();
                });
            });
        }

        function volverLista() {
            chatActivoId = null;
            convView.style.display = 'none';
            listView.style.display = 'flex';
            renderLista(searchInput.value);
            actualizarBadge();
        }

        function renderLista(filtro = '') {
            chatListEl.innerHTML = '';
            const texto = filtro.toLowerCase();
            const filtradas = conversaciones
                .filter(c => esImplicado(c))
                .filter(c => (c.nombre || '').toLowerCase().includes(texto) || (c.usuario || '').toLowerCase().includes(texto));

            if (!filtradas.length) {
                chatListEl.innerHTML = `<div class="kixuz-chat-empty">Solo los personajes implicados pueden leer este chat.<br>Toca <strong>+</strong> para crear una conversación.</div>`;
                return;
            }

            filtradas.forEach(c => {
                const msgs = Array.isArray(c.mensajes) ? c.mensajes : [];
                const ultimo = msgs[msgs.length - 1];
                const noLeidos = contarNoLeidosDeChat(c);
                const item = document.createElement('div');
                item.className = 'kixuz-chat-item';
                const inicial = c.tipo === 'grupo' ? '#' : ((c.nombre || 'C').replace(/^[@#]/, '').charAt(0).toUpperCase() || 'C');
                item.innerHTML = `
                    <div class="kixuz-chat-avatar">${esc(inicial)}</div>
                    <div class="kixuz-chat-info">
                        <h4>${c.tipo === 'grupo' ? SVG_GROUP : SVG_LOCK}${esc(c.nombre)}</h4>
                        <p>${ultimo ? `<strong>${esc(ultimo.autor)}:</strong> ${esc(ultimo.texto)}` : (c.tipo === 'grupo' ? 'Grupo · Solo implicados' : '1×1 Privado · Solo implicados')}</p>
                    </div>
                    ${noLeidos > 0 ? `<span class="kixuz-unread-pill">${noLeidos}</span>` : ''}
                    <button type="button" class="kixuz-del-conv-btn" title="Eliminar">✕</button>
                `;
                item.querySelector('.kixuz-del-conv-btn').addEventListener('click', e => {
                    e.stopPropagation();
                    idsEliminadosRecientemente.add(String(c.id));
                    conversaciones = conversaciones.filter(x => String(x.id) !== String(c.id));
                    guardarLocal();
                    actualizarBadge();
                    if (chatActivoId === String(c.id)) volverLista();
                    else renderLista(searchInput.value);
                });
                item.addEventListener('click', () => abrirConversacion(c));
                chatListEl.appendChild(item);
            });
        }

        function actualizarCabeceraConversacion(conv) {
            const pj = window.KIXUZ_ACTIVE_CHAR && !window.KIXUZ_ACTIVE_CHAR.esPlaceholder ? window.KIXUZ_ACTIVE_CHAR : { nombre: 'Personaje' };
            sidebar.querySelector('#kixuzConvTitle').textContent = conv.nombre || 'Chat';
            sidebar.querySelector('#kixuzConvSub').textContent = conv.tipo === 'grupo' ? 'Grupo · Solo implicados' : '1×1 Privado · Solo implicados';
            sidebar.querySelector('#kixuzSpeakingAs').textContent = `Como: ${pj.nombre}`;
            const total = Array.isArray(conv.participantes) ? conv.participantes.filter(p => p && p !== 'todos').length : 0;
            sidebar.querySelector('#kixuzMembersCount').textContent = total > 0 ? `${total} implicados` : 'Privado';
        }

        function abrirConversacion(conv) {
            if (!conv || !esImplicado(conv)) return;
            chatActivoId = String(conv.id);
            marcarChatComoLeido(conv);
            actualizarBadge();
            actualizarCabeceraConversacion(conv);
            renderMensajes();
            listView.style.display = 'none';
            convView.style.display = 'flex';
            sidebar.classList.add('active');
            setTimeout(() => { try { msgInput.focus(); } catch {} }, 40);
        }

        function renderMensajes() {
            messagesBox.innerHTML = '';
            const conv = obtenerChatActivo();
            if (!conv || !esImplicado(conv)) {
                messagesBox.innerHTML = `<div class="kixuz-chat-empty">Solo los personajes implicados pueden leer esta conversación.</div>`;
                return;
            }
            const msgs = Array.isArray(conv.mensajes) ? conv.mensajes : [];
            if (!msgs.length) {
                messagesBox.innerHTML = `<div class="kixuz-chat-empty">Envía el primer mensaje.</div>`;
                return;
            }
            msgs.forEach((m, idx) => {
                const esMio = esMensajeMio(m);
                const div = document.createElement('div');
                div.className = `kixuz-msg ${esMio ? 'me' : 'other'}`;
                div.innerHTML = `
                    <span><strong style="color:${esMio ? 'var(--acento, #2DD4C4)' : 'var(--bg-secundario, #6C3CE0)'};">${esc(m.autor)}:</strong> ${esc(m.texto)}${m.hora ? `<span class="kixuz-msg-time">${esc(m.hora)}</span>` : ''}</span>
                    ${esMio ? `<button type="button" class="kixuz-msg-del" title="Borrar">✕</button>` : ''}
                `;
                div.querySelector('.kixuz-msg-del')?.addEventListener('click', () => {
                    conv.mensajes.splice(idx, 1);
                    guardarLocal();
                    renderMensajes();
                });
                messagesBox.appendChild(div);
            });
            messagesBox.scrollTop = messagesBox.scrollHeight;
        }

        function crearNuevaConversacion() {
            const raw = (newChatInput.value || '').trim();
            if (!raw) { newChatInput.focus(); return; }
            const tipo = chatTipoSelect.value || 'privado';
            const partes = raw.split(',').map(s => s.trim()).filter(Boolean);
            const primer = partes[0] || raw;
            const usuario = normHandle(primer) || primer.toLowerCase();
            const nombreFinal = tipo === 'grupo' && partes.length > 1 ? partes.join(', ') : primer;

            const misPjClaves = Array.from(obtenerClavesPersonajeActivo());
            const participantes = Array.from(new Set([
                ...misPjClaves,
                usuario,
                ...partes.map(p => normHandle(p) || normToken(p))
            ].filter(Boolean)));

            const nueva = {
                id: 'chat_' + Date.now(),
                nombre: nombreFinal,
                usuario,
                tipo,
                participantes,
                miembros: participantes,
                mensajes: []
            };
            conversaciones.unshift(nueva);
            guardarLocal();
            actualizarBadge();
            modalBackdrop.classList.remove('open');
            abrirConversacion(nueva);
        }

        function enviarMensaje() {
            const conv = obtenerChatActivo();
            if (!conv || !esImplicado(conv)) return;
            const texto = (msgInput.value || '').trim();
            if (!texto) return;

            const pj = window.KIXUZ_ACTIVE_CHAR && !window.KIXUZ_ACTIVE_CHAR.esPlaceholder
                ? window.KIXUZ_ACTIVE_CHAR
                : { nombre: 'Personaje', handle: '@personaje' };

            conv.mensajes = Array.isArray(conv.mensajes) ? conv.mensajes : [];
            conv.mensajes.push({
                de: 'me',
                autor: pj.nombre,
                autorHandle: normHandle(pj.handle),
                hora: horaCorta(),
                texto
            });
            marcarChatComoLeido(conv);
            guardarLocal();
            msgInput.value = '';
            renderMensajes();
            renderLista(searchInput.value);
            actualizarBadge();
        }

        trigger.addEventListener('click', () => { sidebar.classList.add('active'); volverLista(); });
        sidebar.querySelector('#kixuzClose1').addEventListener('click', () => sidebar.classList.remove('active'));
        sidebar.querySelector('#kixuzClose2').addEventListener('click', () => sidebar.classList.remove('active'));
        sidebar.querySelector('#kixuzBackBtn').addEventListener('click', volverLista);
        sidebar.querySelector('#kixuzAddMemberBtn').addEventListener('click', () => {
            const conv = obtenerChatActivo();
            if (!conv || !esImplicado(conv)) return;
            const dato = prompt('Escribe el @usuario del personaje a agregar:');
            if (!dato || !dato.trim()) return;
            const h = normHandle(dato) || normToken(dato);
            conv.participantes = Array.from(new Set([...(conv.participantes || []), h]));
            conv.miembros = Array.from(new Set([...(conv.miembros || []), h]));
            guardarLocal();
            actualizarCabeceraConversacion(conv);
        });
        sidebar.querySelector('#kixuzDeleteConvHeaderBtn').addEventListener('click', () => {
            if (!chatActivoId) return;
            idsEliminadosRecientemente.add(String(chatActivoId));
            conversaciones = conversaciones.filter(x => String(x.id) !== String(chatActivoId));
            guardarLocal();
            actualizarBadge();
            volverLista();
        });
        sidebar.querySelector('#kixuzOpenCreateModalBtn').addEventListener('click', () => {
            newChatInput.value = '';
            renderSugerenciasRapidas();
            modalBackdrop.classList.add('open');
            setTimeout(() => { try { newChatInput.focus(); } catch {} }, 40);
        });
        modalBackdrop.querySelector('#kixuzCancelModalBtn').addEventListener('click', () => modalBackdrop.classList.remove('open'));
        confirmCreateBtn.addEventListener('click', crearNuevaConversacion);
        modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) modalBackdrop.classList.remove('open'); });
        newChatInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); crearNuevaConversacion(); } });
        searchInput.addEventListener('input', e => renderLista(e.target.value));
        sidebar.querySelector('#kixuzSendBtn').addEventListener('click', enviarMensaje);
        msgInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); enviarMensaje(); } });

        // Al cambiar de sub-personaje en el desplegable, refrescar de inmediato los chats visibles y no leídos
        const refrescarPorCambioDePersonaje = () => {
            if (chatActivoId) {
                const act = obtenerChatActivo();
                if (act && esImplicado(act)) {
                    marcarChatComoLeido(act);
                    actualizarCabeceraConversacion(act);
                    renderMensajes();
                } else {
                    volverLista();
                }
            } else {
                renderLista(searchInput.value);
            }
            actualizarBadge();
        };

        window.addEventListener('kixuz:personajes-actualizados', refrescarPorCambioDePersonaje);
        window.addEventListener('kixuz:sesion-actualizada', refrescarPorCambioDePersonaje);
        document.getElementById('activeCharSelect')?.addEventListener('change', () => setTimeout(refrescarPorCambioDePersonaje, 30));

        actualizarBadge();
        renderLista();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', montarChatUI);
    } else {
        montarChatUI();
    }
    window.addEventListener('load', () => {
        if (!document.querySelector('.kixuz-chat-trigger')) montarChatUI();
    });
})();

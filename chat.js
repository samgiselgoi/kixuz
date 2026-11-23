(() => {
    document.querySelectorAll('.chat-trigger, .chat-sidebar, .kixuz-chat-trigger, .kixuz-chat-sidebar, .kixuz-chat-modal-backdrop').forEach(el => el.remove());

    const STORAGE_KEY = 'kixuz_chat_conversaciones_v5';
    const LEGACY_KEYS = ['kixuz_chat_conversaciones_v4', 'kixuz_chat_conversaciones_v3', 'kixuz_chat_conversaciones_v1'];
    const STORAGE_LEIDOS = 'kixuz_chat_leidos_v1';

    const esc = str => String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const SVG_CHAT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    const SVG_LOCK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
    const SVG_GROUP = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 20a5 5 0 0 1 6 0"/></svg>`;
    const SVG_TRASH = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
    const SVG_MASK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>`;

    const style = document.createElement('style');
    style.id = 'kixuz-chat-styles';
    style.textContent = `
        .kixuz-chat-trigger {
            position: fixed; right: 22px; bottom: 22px; z-index: 9998;
            width: 58px; height: 58px; border-radius: 50%;
            background-color: var(--bg-secundario, #6C3CE0);
            border: 2.5px solid var(--acento, #2DD4C4);
            cursor: pointer; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.65);
            transition: transform 0.22s ease; display: flex; align-items: center; justify-content: center;
            color: var(--texto, #EDE7E0);
        }
        .kixuz-chat-trigger:hover { transform: scale(1.07); }
        .kixuz-chat-trigger svg { width: 26px; height: 26px; }
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
            transition: right 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: 9999; display: flex; flex-direction: column; overflow: hidden;
            font-family: 'Inter', sans-serif; color: var(--texto, #EDE7E0);
        }
        html[data-theme="light"] .kixuz-chat-sidebar {
            background-color: rgba(244, 241, 250, 0.98);
            color: #150A24;
        }
        .kixuz-chat-sidebar.active { right: 0; }
        .kixuz-chat-header {
            padding: 13px 15px; border-bottom: 1px solid rgba(108, 60, 224, 0.45);
            display: flex; justify-content: space-between; align-items: center; gap: 8px;
            background: rgba(0, 0, 0, 0.22); flex-shrink: 0;
        }
        .kixuz-chat-header h3 { font-family: 'Space Grotesk', sans-serif; margin: 0; color: var(--acento, #2DD4C4); font-size: 16.5px; }
        .kixuz-chat-icon-btn {
            background: none; border: none; color: inherit;
            font-size: 16px; cursor: pointer; transition: color 0.2s; padding: 4px 6px; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center;
        }
        .kixuz-chat-icon-btn:hover { color: var(--acento, #2DD4C4); }
        .kixuz-chat-icon-btn.danger:hover { color: #e03c6c; }
        .kixuz-add-member-btn {
            background: rgba(45, 212, 196, 0.15); border: 1px solid var(--acento, #2DD4C4);
            color: var(--acento, #2DD4C4); border-radius: 8px; padding: 5px 9px;
            font-family: 'Space Grotesk', sans-serif; font-size: 11.5px; font-weight: 700; cursor: pointer; flex-shrink: 0;
        }
        .kixuz-add-member-btn:hover { background: var(--acento, #2DD4C4); color: #150A24; }
        .kixuz-chat-toolbar {
            padding: 11px 14px; border-bottom: 1px solid rgba(108, 60, 224, 0.35);
            background: rgba(0, 0, 0, 0.2); display: flex; gap: 8px; align-items: center; flex-shrink: 0;
        }
        .kixuz-chat-toolbar input {
            flex: 1 1 auto; min-width: 0; padding: 9px 12px; border-radius: 11px;
            background: rgba(0, 0, 0, 0.45); border: 1px solid var(--bg-secundario, #6C3CE0);
            color: var(--texto, #EDE7E0); font-family: 'Inter', sans-serif; font-size: 14px; outline: none;
        }
        html[data-theme="light"] .kixuz-chat-toolbar input { background: rgba(255, 255, 255, 0.9); color: #150A24; }
        .kixuz-plus-btn {
            width: 38px; height: 38px; border-radius: 10px; background: var(--acento, #2DD4C4); color: #150A24;
            border: none; font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700;
            cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .kixuz-chat-list { flex: 1 1 auto; overflow-y: auto; }
        .kixuz-chat-empty { padding: 28px 20px; text-align: center; font-size: 13.5px; opacity: 0.75; }
        .kixuz-chat-item {
            display: flex; gap: 11px; padding: 12px 15px; border-bottom: 1px solid rgba(108, 60, 224, 0.2);
            cursor: pointer; transition: background 0.2s; align-items: center;
        }
        .kixuz-chat-item:hover { background: rgba(108, 60, 224, 0.22); }
        .kixuz-chat-avatar {
            width: 40px; height: 40px; border-radius: 50%; background-color: var(--bg-secundario, #6C3CE0);
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
        .kixuz-del-conv-btn:hover { background: #e03c6c; color: #fff; }
        .kixuz-conv-meta-strip {
            padding: 6px 14px; font-size: 11.5px; background: rgba(108, 60, 224, 0.14);
            border-bottom: 1px solid rgba(108, 60, 224, 0.3);
            display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; flex-shrink: 0;
        }
        .kixuz-chat-messages {
            flex: 1 1 auto; padding: 14px 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; font-size: 14px;
        }
        .kixuz-msg {
            padding: 10px 12px; border-radius: 12px; background-color: rgba(108, 60, 224, 0.16);
            max-width: 88%; word-wrap: break-word; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;
        }
        .kixuz-msg.me { background-color: rgba(108, 60, 224, 0.38); align-self: flex-end; border-bottom-right-radius: 3px; }
        .kixuz-msg.other { border-bottom-left-radius: 3px; border-left: 2.5px solid var(--acento, #2DD4C4); }
        .kixuz-msg-time { display: block; font-size: 10.5px; opacity: 0.65; margin-top: 3px; }
        .kixuz-msg-del { background: none; border: none; color: #ff9bb4; font-size: 11px; cursor: pointer; padding: 0 2px; opacity: 0.75; flex-shrink: 0; }
        .kixuz-chat-input {
            padding: 10px 12px; border-top: 1px solid rgba(108, 60, 224, 0.5);
            display: flex; gap: 8px; background: rgba(21, 10, 36, 0.96); flex-shrink: 0;
        }
        html[data-theme="light"] .kixuz-chat-input { background: rgba(244, 241, 250, 0.98); }
        .kixuz-chat-input input {
            flex-grow: 1; min-width: 0; padding: 10px 12px; background: rgba(0, 0, 0, 0.45);
            border: 1px solid var(--bg-secundario, #6C3CE0); color: var(--texto, #EDE7E0);
            border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 14px; outline: none;
        }
        html[data-theme="light"] .kixuz-chat-input input { background: #ffffff; color: #150A24; }
        .kixuz-chat-input button {
            background-color: var(--acento, #2DD4C4); color: #150A24; border: none; padding: 0 15px;
            border-radius: 10px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer;
        }
        .kixuz-chat-modal-backdrop {
            position: fixed; inset: 0; background: rgba(10, 4, 20, 0.82); backdrop-filter: blur(5px); z-index: 10000;
            display: none; align-items: center; justify-content: center; padding: 16px;
        }
        .kixuz-chat-modal-backdrop.open { display: flex; }
        .kixuz-chat-modal {
            width: 100%; max-width: 390px; background: var(--bg-principal, #150A24); color: var(--texto, #EDE7E0);
            border: 1px solid var(--acento, #2DD4C4); border-radius: 16px; padding: 18px;
        }
        html[data-theme="light"] .kixuz-chat-modal { background: #F4F1FA; color: #150A24; }
        .kixuz-chat-modal h4 { font-family: 'Space Grotesk', sans-serif; font-size: 17px; color: var(--acento, #2DD4C4); margin: 0 0 12px; display: flex; align-items: center; gap: 8px; }
        .kixuz-chat-modal label { display: block; font-family: 'Space Grotesk', sans-serif; font-size: 12.5px; font-weight: 700; margin-bottom: 5px; }
        .kixuz-chat-modal select, .kixuz-chat-modal input {
            width: 100%; padding: 9px 11px; border-radius: 9px; margin-bottom: 12px;
            background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(108, 60, 224, 0.6);
            color: var(--texto, #EDE7E0); font-family: 'Inter', sans-serif; font-size: 14px; outline: none;
        }
        html[data-theme="light"] .kixuz-chat-modal select, html[data-theme="light"] .kixuz-chat-modal input { background: #ffffff; color: #150A24; }
        .kixuz-chat-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
        .kixuz-modal-btn-cancel { background: transparent; border: 1px solid rgba(108, 60, 224, 0.6); color: inherit; padding: 8px 14px; border-radius: 9px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; cursor: pointer; }
        .kixuz-modal-btn-create { background: var(--acento, #2DD4C4); color: #150A24; border: none; padding: 8px 16px; border-radius: 9px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; cursor: pointer; }
    `;
    if (!document.getElementById('kixuz-chat-styles')) {
        document.head.appendChild(style);
    }

    function leerArregloSeguro(key) {
        try {
            const raw = localStorage.getItem(key);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function cargarLocal() {
        const mapa = new Map();
        const fuentes = [...LEGACY_KEYS.slice().reverse(), STORAGE_KEY];
        fuentes.forEach(k => {
            leerArregloSeguro(k).forEach(c => {
                if (c && (c.id || c.nombre)) {
                    const clave = String(c.id || `${c.tipo || 'chat'}_${c.nombre || ''}`);
                    mapa.set(clave, { ...mapa.get(clave), ...c });
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
    let creandoChat = false;

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
                        <span id="kixuzConvSub" style="font-size: 11.5px; opacity: 0.75; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Conectado</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                    <button type="button" class="kixuz-add-member-btn" id="kixuzAddMemberBtn" title="Agregar persona">+ Persona</button>
                    <button class="kixuz-chat-icon-btn danger" id="kixuzDeleteConvHeaderBtn" title="Eliminar conversación">${SVG_TRASH}</button>
                    <button class="kixuz-chat-icon-btn" id="kixuzClose2" title="Cerrar">✕</button>
                </div>
            </div>
            <div class="kixuz-conv-meta-strip">
                <span id="kixuzSpeakingAs">Hablando como: —</span>
                <span id="kixuzMembersCount">Participantes</span>
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
            <h4>${SVG_CHAT} Crear nueva conversación</h4>
            <label for="kixuzModalChatTipo">Tipo de chat</label>
            <select id="kixuzModalChatTipo">
                <option value="privado">1×1 Privado (solo dos implicados)</option>
                <option value="grupo">Grupo (solo personajes/cuentas incluidos)</option>
            </select>
            <label for="kixuzModalNewChatInput">@Usuario o participantes</label>
            <input type="text" id="kixuzModalNewChatInput" placeholder="Ej. @Asmodeus o @pj1, @pj2" autocomplete="off">
            <div class="kixuz-chat-modal-actions">
                <button type="button" class="kixuz-modal-btn-cancel" id="kixuzCancelModalBtn">Cancelar</button>
                <button type="button" class="kixuz-modal-btn-create" id="kixuzConfirmCreateBtn">Crear chat</button>
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
    const messagesBox = sidebar.querySelector('#kixuzMessagesBox');
    const msgInput = sidebar.querySelector('#kixuzMsgInput');
    const badgeEl = trigger.querySelector('#kixuzChatBadge');

    function obtenerChatActivo() {
        if (!chatActivoId) return null;
        return conversaciones.find(c => String(c.id) === String(chatActivoId)) || null;
    }

    function esImplicado(conv) {
        if (!conv) return false;
        if (idsEliminadosRecientemente.has(String(conv.id))) return false;
        if (String(conv.id).startsWith('chat_')) return true;
        if (window.KIXUZ_DB?.esImplicadoEnChat) return window.KIXUZ_DB.esImplicadoEnChat(conv);
        return true;
    }

    function esMensajeMio(msg) {
        const ids = window.KIXUZ_DB?.obtenerMisIdentificadores ? window.KIXUZ_DB.obtenerMisIdentificadores() : new Set();
        const mUid = String(msg.autorUid || '').toLowerCase();
        const mHandle = String(msg.autorHandle || '').toLowerCase();
        return Boolean((mUid && ids.has(mUid)) || (mHandle && ids.has(mHandle)) || (!msg.autorUid && msg.de === 'me'));
    }

    function contarNoLeidosDeChat(conv) {
        if (!conv || !esImplicado(conv)) return 0;
        const msgs = Array.isArray(conv.mensajes) ? conv.mensajes : [];
        const leidosObj = leerLeidos();
        const leidosCount = Number(leidosObj[conv.id] || 0);
        const recibidosDeOtros = msgs.filter(m => !esMensajeMio(m)).length;
        return Math.max(0, recibidosDeOtros - leidosCount);
    }

    function marcarChatComoLeido(conv) {
        if (!conv || !conv.id) return;
        const msgs = Array.isArray(conv.mensajes) ? conv.mensajes : [];
        const recibidosDeOtros = msgs.filter(m => !esMensajeMio(m)).length;
        const leidosObj = leerLeidos();
        leidosObj[conv.id] = recibidosDeOtros;
        guardarLeidos(leidosObj);
    }

    function puedeBorrarChat(conv) {
        if (!conv) return false;
        const miUid = String(window.KIXUZ_DB?.usuarioActual?.uid || window.KIXUZ_DB?.perfilCuenta?.uid || '').toLowerCase();
        if (miUid && conv.creadorUid && String(conv.creadorUid).toLowerCase() === miUid) return true;
        return Boolean(conv.tipo === 'privado');
    }

    function actualizarBadge() {
        const totalNoLeidos = conversaciones
            .filter(c => esImplicado(c))
            .reduce((acc, c) => acc + contarNoLeidosDeChat(c), 0);
        badgeEl.textContent = totalNoLeidos;
        badgeEl.style.display = totalNoLeidos > 0 ? 'flex' : 'none';
    }

    function horaCorta() {
        try { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
    }

    function eliminarConversacion(id) {
        const strId = String(id);
        const target = conversaciones.find(c => String(c.id) === strId);
        if (target && !puedeBorrarChat(target)) return;
        idsEliminadosRecientemente.add(strId);
        conversaciones = conversaciones.filter(c => String(c.id) !== strId);
        guardarLocal();
        actualizarBadge();
        if (chatActivoId === strId) {
            chatActivoId = null;
            volverLista();
        } else {
            renderLista(searchInput.value);
        }
        if (window.KIXUZ_DB?.eliminarConversacionChat && !strId.startsWith('chat_')) {
            window.KIXUZ_DB.eliminarConversacionChat(strId).catch(() => {});
        }
    }

    function renderLista(filtro = '') {
        chatListEl.innerHTML = '';
        const texto = filtro.toLowerCase();
        const filtradas = conversaciones
            .filter(c => esImplicado(c))
            .filter(c => (c.nombre || '').toLowerCase().includes(texto) || (c.usuario || '').toLowerCase().includes(texto));

        if (!filtradas.length) {
            chatListEl.innerHTML = `<div class="kixuz-chat-empty">No hay conversaciones disponibles.<br>Toca el botón <strong>+</strong> para crear un chat 1×1 o grupal.</div>`;
            return;
        }

        filtradas.forEach(c => {
            const msgs = Array.isArray(c.mensajes) ? c.mensajes : [];
            const ultimo = msgs[msgs.length - 1];
            const noLeidos = contarNoLeidosDeChat(c);
            const item = document.createElement('div');
            item.className = 'kixuz-chat-item';
            item.dataset.chatId = String(c.id);
            const inicial = c.tipo === 'grupo' ? '#' : ((c.nombre || 'C').replace(/^[@#]/, '').charAt(0).toUpperCase() || 'C');
            const delBtnHtml = puedeBorrarChat(c) ? `<button type="button" class="kixuz-del-conv-btn" title="Eliminar chat">✕</button>` : '';
            const unreadHtml = noLeidos > 0 ? `<span class="kixuz-unread-pill">${noLeidos}</span>` : '';

            item.innerHTML = `
                <div class="kixuz-chat-avatar">${esc(inicial)}</div>
                <div class="kixuz-chat-info">
                    <h4>${c.tipo === 'grupo' ? SVG_GROUP : SVG_LOCK}${esc(c.nombre)}</h4>
                    <p>${ultimo ? `<strong>${esc(ultimo.autor)}:</strong> ${esc(ultimo.texto)}` : (c.tipo === 'grupo' ? 'Grupo de miembros incluidos' : 'Chat 1×1 · Solo los dos implicados')}</p>
                </div>
                ${unreadHtml}
                ${delBtnHtml}
            `;
            const delBtn = item.querySelector('.kixuz-del-conv-btn');
            if (delBtn) {
                delBtn.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    eliminarConversacion(c.id);
                });
            }
            item.addEventListener('click', e => {
                if (e.target.closest('.kixuz-del-conv-btn')) return;
                const actual = conversaciones.find(x => String(x.id) === String(c.id)) || c;
                abrirConversacion(actual);
            });
            chatListEl.appendChild(item);
        });
    }

    function actualizarCabeceraConversacion(conv) {
        if (!conv) return;
        const pj = window.KIXUZ_ACTIVE_CHAR && !window.KIXUZ_ACTIVE_CHAR.esPlaceholder
            ? window.KIXUZ_ACTIVE_CHAR
            : { nombre: 'Cuenta', handle: '' };
        sidebar.querySelector('#kixuzConvTitle').textContent = conv.nombre || 'Chat';
        sidebar.querySelector('#kixuzConvSub').textContent = conv.tipo === 'grupo' ? 'Grupo · Solo miembros incluidos' : '1×1 Privado · Solo implicados';
        sidebar.querySelector('#kixuzSpeakingAs').innerHTML = `${SVG_MASK}Hablando como: ${esc(pj.nombre)}`;
        const totalParts = Array.isArray(conv.participantes) ? conv.participantes.filter(p => p !== 'todos').length : 0;
        sidebar.querySelector('#kixuzMembersCount').textContent = totalParts > 0 ? `${totalParts} participantes` : 'Privado';
        sidebar.querySelector('#kixuzDeleteConvHeaderBtn').style.display = puedeBorrarChat(conv) ? 'inline-flex' : 'none';
    }

    function abrirConversacion(conv) {
        if (!conv) return;
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
        if (!conv) return;
        const msgs = Array.isArray(conv.mensajes) ? conv.mensajes : [];
        if (!msgs.length) {
            messagesBox.innerHTML = `<div class="kixuz-chat-empty">Envía el primer mensaje de esta conversación.</div>`;
            return;
        }
        msgs.forEach((m, idx) => {
            const esMio = esMensajeMio(m);
            const div = document.createElement('div');
            div.className = `kixuz-msg ${esMio ? 'me' : 'other'}`;
            const delHtml = esMio ? `<button type="button" class="kixuz-msg-del" title="Eliminar mensaje">✕</button>` : '';
            const horaHtml = m.hora ? `<span class="kixuz-msg-time">${esc(m.hora)}</span>` : '';
            div.innerHTML = `
                <span><strong style="color: ${esMio ? 'var(--acento, #2DD4C4)' : 'var(--bg-secundario, #6C3CE0)'};">${esc(m.autor)}:</strong> ${esc(m.texto)}${horaHtml}</span>
                ${delHtml}
            `;
            const delBtn = div.querySelector('.kixuz-msg-del');
            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    conv.mensajes.splice(idx, 1);
                    guardarLocal();
                    renderMensajes();
                    if (window.KIXUZ_DB?.guardarMensajesChat && !String(conv.id).startsWith('chat_')) {
                        window.KIXUZ_DB.guardarMensajesChat(conv.id, conv.mensajes).catch(() => {});
                    }
                });
            }
            messagesBox.appendChild(div);
        });
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    function abrirModalCrear() {
        creandoChat = false;
        confirmCreateBtn.disabled = false;
        confirmCreateBtn.textContent = 'Crear chat';
        newChatInput.value = '';
        modalBackdrop.classList.add('open');
        setTimeout(() => { try { newChatInput.focus(); } catch {} }, 60);
    }

    function cerrarModalCrear() { modalBackdrop.classList.remove('open'); }

    function crearNuevaConversacion() {
        if (creandoChat) return;
        const raw = (newChatInput.value || '').trim();
        if (!raw) { newChatInput.focus(); return; }

        creandoChat = true;
        confirmCreateBtn.disabled = true;
        confirmCreateBtn.textContent = 'Creando...';

        const tipo = chatTipoSelect.value || 'privado';
        const partesRaw = raw.split(',').map(s => s.trim()).filter(Boolean);
        const primer = partesRaw[0] || raw;
        const usuario = primer.startsWith('@') || primer.startsWith('#') ? primer.toLowerCase() : '@' + primer.replace(/\s+/g, '_').toLowerCase();
        const nombreFinal = tipo === 'grupo' && partesRaw.length > 1 ? partesRaw.join(', ') : primer;
        const extrasIds = [];
        partesRaw.forEach(token => {
            const tLow = token.toLowerCase();
            const tHandle = tLow.startsWith('@') ? tLow : '@' + tLow.replace(/\s+/g, '_');
            extrasIds.push(tLow, tHandle, tHandle.replace(/^@/, ''));
        });

        const miUid = String(window.KIXUZ_DB?.usuarioActual?.uid || window.KIXUZ_DB?.perfilCuenta?.uid || '').toLowerCase();
        const miHandle = String(window.KIXUZ_ACTIVE_CHAR?.handle || '').toLowerCase();
        const participantes = Array.from(new Set([miUid, miHandle, miHandle.replace(/^@/, ''), usuario, ...extrasIds].filter(Boolean)));

        const localId = 'chat_' + Date.now();
        const nuevaLocal = {
            id: localId, nombre: nombreFinal, usuario, tipo,
            creadorUid: miUid, participantes, miembros: participantes, mensajes: []
        };

        conversaciones.unshift(nuevaLocal);
        guardarLocal();
        actualizarBadge();
        cerrarModalCrear();
        abrirConversacion(nuevaLocal);

        creandoChat = false;
        confirmCreateBtn.disabled = false;
        confirmCreateBtn.textContent = 'Crear chat';

        if (window.KIXUZ_DB?.crearConversacionChat) {
            (async () => {
                try {
                    let destinatarioUid = '';
                    if (window.KIXUZ_DB?.buscarDestinatario) {
                        for (const token of partesRaw) {
                            const encontrado = await window.KIXUZ_DB.buscarDestinatario(token);
                            if (encontrado) {
                                if (!destinatarioUid && encontrado.uid) destinatarioUid = encontrado.uid;
                                if (encontrado.uid) extrasIds.push(encontrado.uid.toLowerCase());
                                if (encontrado.handle) extrasIds.push(encontrado.handle.toLowerCase());
                            }
                        }
                    }
                    const creadaNube = await window.KIXUZ_DB.crearConversacionChat({
                        nombre: nombreFinal, usuario, tipo, destinatarioUid, participantesExtra: extrasIds
                    });
                    if (creadaNube && creadaNube.id && creadaNube.id !== localId) {
                        conversaciones = conversaciones.map(c => String(c.id) === localId ? { ...creadaNube } : c);
                        if (chatActivoId === localId) chatActivoId = String(creadaNube.id);
                        guardarLocal();
                        actualizarCabeceraConversacion(creadaNube);
                    }
                } catch {}
            })();
        }
    }

    async function agregarPersonaAlChat() {
        const conv = obtenerChatActivo();
        if (!conv) return;
        const dato = prompt('Escribe el @usuario del personaje, apodo o correo de la persona a incluir:');
        if (!dato || !dato.trim()) return;
        const limpio = dato.trim().toLowerCase();
        const handleConArroba = limpio.startsWith('@') ? limpio : '@' + limpio.replace(/\s+/g, '_');

        const nuevosIds = [limpio, handleConArroba, handleConArroba.replace(/^@/, '')];
        if (window.KIXUZ_DB?.buscarDestinatario) {
            try {
                const usr = await window.KIXUZ_DB.buscarDestinatario(limpio);
                if (usr?.uid) nuevosIds.push(usr.uid.toLowerCase());
                if (usr?.handle) nuevosIds.push(usr.handle.toLowerCase());
            } catch {}
        }

        conv.participantes = Array.from(new Set([...(conv.participantes || []), ...nuevosIds]));
        conv.miembros = Array.from(new Set([...(conv.miembros || []), ...nuevosIds]));
        guardarLocal();
        actualizarCabeceraConversacion(conv);

        for (const idSumado of nuevosIds) {
            if (window.KIXUZ_DB?.agregarParticipanteChat && !String(conv.id).startsWith('chat_')) {
                window.KIXUZ_DB.agregarParticipanteChat(conv.id, idSumado).catch(() => {});
            }
        }

        const autor = (window.KIXUZ_ACTIVE_CHAR && window.KIXUZ_ACTIVE_CHAR.nombre) || 'Sistema';
        conv.mensajes.push({
            de: 'me', autor, autorHandle: window.KIXUZ_ACTIVE_CHAR?.handle || '',
            autorUid: window.KIXUZ_DB?.usuarioActual?.uid || '', hora: horaCorta(),
            texto: `+ Incluyó a ${handleConArroba} en la conversación.`
        });
        guardarLocal();
        renderMensajes();
        if (window.KIXUZ_DB?.guardarMensajesChat && !String(conv.id).startsWith('chat_')) {
            window.KIXUZ_DB.guardarMensajesChat(conv.id, conv.mensajes).catch(() => {});
        }
    }

    function enviarMensaje() {
        const conv = obtenerChatActivo();
        const texto = (msgInput.value || '').trim();
        if (!texto || !conv) return;
        const personaje = window.KIXUZ_ACTIVE_CHAR || { nombre: 'Tú', handle: '@rol' };
        const miUid = window.KIXUZ_DB?.usuarioActual?.uid || window.KIXUZ_DB?.perfilCuenta?.uid || '';

        conv.mensajes = Array.isArray(conv.mensajes) ? conv.mensajes : [];
        conv.mensajes.push({
            de: 'me', autor: personaje.nombre, autorHandle: personaje.handle,
            autorUid: miUid, hora: horaCorta(), texto
        });
        marcarChatComoLeido(conv);
        guardarLocal();
        msgInput.value = '';
        renderMensajes();
        renderLista(searchInput.value);
        actualizarBadge();

        if (window.KIXUZ_DB?.guardarMensajesChat && !String(conv.id).startsWith('chat_')) {
            window.KIXUZ_DB.guardarMensajesChat(conv.id, conv.mensajes).catch(() => {});
        }
    }

    function volverLista() {
        chatActivoId = null;
        convView.style.display = 'none';
        listView.style.display = 'flex';
        renderLista(searchInput.value);
        actualizarBadge();
    }

    trigger.addEventListener('click', () => {
        sidebar.classList.add('active');
        volverLista();
    });
    sidebar.querySelector('#kixuzClose1').addEventListener('click', () => sidebar.classList.remove('active'));
    sidebar.querySelector('#kixuzClose2').addEventListener('click', () => sidebar.classList.remove('active'));
    sidebar.querySelector('#kixuzBackBtn').addEventListener('click', volverLista);
    sidebar.querySelector('#kixuzAddMemberBtn').addEventListener('click', agregarPersonaAlChat);
    sidebar.querySelector('#kixuzDeleteConvHeaderBtn').addEventListener('click', () => { if (chatActivoId) eliminarConversacion(chatActivoId); });
    sidebar.querySelector('#kixuzOpenCreateModalBtn').addEventListener('click', abrirModalCrear);
    modalBackdrop.querySelector('#kixuzCancelModalBtn').addEventListener('click', cerrarModalCrear);
    confirmCreateBtn.addEventListener('click', crearNuevaConversacion);
    modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) cerrarModalCrear(); });
    newChatInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); crearNuevaConversacion(); } });
    searchInput.addEventListener('input', e => renderLista(e.target.value));
    sidebar.querySelector('#kixuzSendBtn').addEventListener('click', enviarMensaje);
    msgInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); enviarMensaje(); } });

    window.addEventListener('kixuz:sesion-actualizada', () => { actualizarBadge(); renderLista(searchInput.value); });
    window.addEventListener('kixuz:personajes-actualizados', () => {
        actualizarBadge();
        renderLista(searchInput.value);
        const conv = obtenerChatActivo();
        if (conv) actualizarCabeceraConversacion(conv);
    });

    window.addEventListener('load', () => {
        if (window.KIXUZ_DB?.activo && window.KIXUZ_DB?.escucharChats) {
            window.KIXUZ_DB.escucharChats(chatsNube => {
                const mapa = new Map();
                conversaciones.forEach(c => { if (c && c.id && !idsEliminadosRecientemente.has(String(c.id))) mapa.set(String(c.id), c); });
                chatsNube.forEach(c => { if (c && c.id && !idsEliminadosRecientemente.has(String(c.id))) mapa.set(String(c.id), c); });
                conversaciones = Array.from(mapa.values());
                guardarLocal();
                actualizarBadge();
                if (chatActivoId) {
                    const actualizada = obtenerChatActivo();
                    if (actualizada) {
                        marcarChatComoLeido(actualizada);
                        actualizarBadge();
                        actualizarCabeceraConversacion(actualizada);
                        renderMensajes();
                    } else {
                        volverLista();
                    }
                } else {
                    renderLista(searchInput.value);
                }
            });
        }
    });

    actualizarBadge();
    renderLista();
})();

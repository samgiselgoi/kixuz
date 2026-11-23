(() => {
    const CHATS_STORAGE_KEY = 'kixuz_chats_v2';
    const LEGACY_CHATS_KEYS = ['kixuz_chats_v1'];
    const READ_STATE_KEY = 'kixuz_chat_read_counts_v2';

    const style = document.createElement('style');
    style.id = 'kixuz-chat-strict-privacy-style';
    style.textContent = `
        .kixuz-chat-fab {
            position: fixed;
            bottom: 66px;
            right: 20px;
            z-index: 99999;
            background: var(--acento, #2DD4C4);
            color: #150A24;
            border: none;
            border-radius: 50px;
            padding: 12px 18px;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 10px 26px rgba(0, 0, 0, 0.55);
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .kixuz-fab-unread {
            background: #e03c6c;
            color: #ffffff;
            border-radius: 999px;
            padding: 2px 7px;
            font-size: 11.5px;
            font-weight: 800;
            line-height: 1.2;
        }
        .kixuz-chat-drawer {
            display: none;
            position: fixed;
            bottom: 122px;
            right: 20px;
            width: 380px;
            max-width: calc(100vw - 20px);
            height: 510px;
            max-height: calc(100dvh - 135px);
            background: rgba(21, 10, 36, 0.99);
            color: var(--texto, #EDE7E0);
            border: 1px solid var(--acento, #2DD4C4);
            border-radius: 16px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.72);
            z-index: 99999;
            flex-direction: column;
            overflow: hidden;
        }
        html[data-theme="light"] .kixuz-chat-drawer {
            background: #F4F1FA;
            color: #150A24;
        }
        .kixuz-chat-drawer.open {
            display: flex;
        }
        .kixuz-chat-head {
            padding: 11px 14px;
            border-bottom: 1px solid rgba(108, 60, 224, 0.35);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 14px;
            gap: 8px;
            flex-shrink: 0;
        }
        .kixuz-chat-top-bar {
            padding: 8px 12px;
            border-bottom: 1px solid rgba(108, 60, 224, 0.28);
            background: rgba(108, 60, 224, 0.08);
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        .kixuz-plus-btn {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            border: none;
            background: var(--acento, #2DD4C4);
            color: #150A24;
            font-size: 21px;
            font-weight: 800;
            line-height: 1;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .kixuz-chat-body {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 9px;
        }
        .kixuz-chat-item {
            padding: 10px 12px;
            border-radius: 10px;
            background: rgba(108, 60, 224, 0.18);
            border: 1px solid rgba(108, 60, 224, 0.35);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
        }
        .kixuz-chat-item:hover {
            border-color: var(--acento, #2DD4C4);
        }
        .kixuz-chat-badge {
            font-size: 10.5px;
            padding: 2px 7px;
            border-radius: 10px;
            background: rgba(45, 212, 196, 0.16);
            border: 1px solid var(--acento, #2DD4C4);
            color: var(--acento, #2DD4C4);
            font-weight: 700;
            margin-left: 6px;
        }
        .kixuz-msg {
            max-width: 82%;
            padding: 9px 12px;
            border-radius: 14px;
            font-size: 14px;
            line-height: 1.45;
            word-break: break-word;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .kixuz-msg.theirs {
            align-self: flex-start;
            background: rgba(108, 60, 224, 0.25);
            border: 1px solid rgba(108, 60, 224, 0.45);
            border-bottom-left-radius: 4px;
        }
        .kixuz-msg.mine {
            align-self: flex-end;
            background: rgba(45, 212, 196, 0.22);
            border: 1px solid var(--acento, #2DD4C4);
            border-bottom-right-radius: 4px;
            text-align: right;
        }
        .kixuz-msg-meta {
            font-size: 11px;
            opacity: 0.78;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
        }
        .kixuz-msg-text {
            white-space: pre-wrap;
            text-align: left;
        }
        .kixuz-modal-backdrop {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(8, 4, 16, 0.78);
            z-index: 100000;
            align-items: center;
            justify-content: center;
            padding: 14px;
        }
        .kixuz-modal-backdrop.open {
            display: flex;
        }
        .kixuz-modal-card {
            width: 100%;
            max-width: 390px;
            max-height: calc(100dvh - 32px);
            overflow-y: auto;
            background: rgba(24, 12, 42, 0.99);
            color: var(--texto, #EDE7E0);
            border: 1px solid var(--acento, #2DD4C4);
            border-radius: 16px;
            padding: 14px;
            box-shadow: 0 20px 45px rgba(0, 0, 0, 0.75);
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        html[data-theme="light"] .kixuz-modal-card {
            background: #F4F1FA;
            color: #150A24;
        }
        .kixuz-suggest-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
            max-height: 130px;
            overflow-y: auto;
            border-radius: 8px;
            border: 1px solid rgba(45, 212, 196, 0.35);
            background: rgba(15, 8, 28, 0.96);
            padding: 4px;
        }
        html[data-theme="light"] .kixuz-suggest-list {
            background: #ffffff;
            color: #150A24;
        }
        .kixuz-suggest-item {
            padding: 7px 9px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
        }
        .kixuz-suggest-item:hover {
            background: rgba(45, 212, 196, 0.18);
        }
        .kixuz-selected-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        .kixuz-chip {
            background: rgba(45, 212, 196, 0.18);
            border: 1px solid var(--acento, #2DD4C4);
            color: var(--acento, #2DD4C4);
            border-radius: 14px;
            padding: 3px 9px;
            font-size: 12px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .kixuz-chat-form {
            padding: 10px;
            border-top: 1px solid rgba(108, 60, 224, 0.35);
            display: flex;
            align-items: flex-end;
            gap: 6px;
            flex-shrink: 0;
            background: inherit;
        }
        .kixuz-chat-drawer input,
        .kixuz-chat-drawer textarea,
        .kixuz-chat-drawer select,
        .kixuz-modal-card input,
        .kixuz-modal-card select {
            padding: 9px 11px;
            border-radius: 9px;
            border: 1px solid rgba(108, 60, 224, 0.45);
            background: rgba(0, 0, 0, 0.28);
            color: inherit;
            font-size: 16px;
            font-family: 'Inter', sans-serif;
            outline: none;
        }
        .kixuz-chat-drawer textarea {
            resize: none;
            min-height: 42px;
            max-height: 115px;
            line-height: 1.4;
        }
        html[data-theme="light"] .kixuz-chat-drawer input,
        html[data-theme="light"] .kixuz-chat-drawer textarea,
        html[data-theme="light"] .kixuz-chat-drawer select,
        html[data-theme="light"] .kixuz-modal-card input,
        html[data-theme="light"] .kixuz-modal-card select {
            background: #fff;
            color: #150A24;
        }
        .kixuz-chat-btn {
            background: var(--acento, #2DD4C4);
            color: #150A24;
            border: none;
            border-radius: 9px;
            padding: 9px 13px;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            white-space: nowrap;
        }
        .kixuz-chat-mini {
            background: transparent;
            color: inherit;
            border: 1px solid rgba(108, 60, 224, 0.45);
            border-radius: 8px;
            padding: 5px 9px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
        }
        @media (max-width: 640px) {
            .kixuz-chat-drawer {
                left: 10px;
                right: 10px;
                bottom: 62px;
                width: auto;
                max-width: none;
                height: min(72dvh, 520px);
                max-height: calc(100dvh - 76px);
            }
            .kixuz-chat-fab {
                bottom: 14px;
                right: 14px;
            }
        }
    `;
    document.head.appendChild(style);

    const esc = s => String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const norm = v => String(v || '').trim().toLowerCase();
    const normHandle = v => {
        const limp = norm(v).replace(/^@+/, '').replace(/\s+/g, '_');
        return limp ? '@' + limp : '';
    };

    let conversaciones = [];
    let chatActivoId = null;
    let mostrarModalCrear = false;
    let directorioUsuarios = [];
    let seleccionadosCrear = [];
    let readCounts = {};

    function leerReadCounts() {
        try {
            const raw = JSON.parse(localStorage.getItem(READ_STATE_KEY) || '{}');
            return raw && typeof raw === 'object' ? raw : {};
        } catch {
            return {};
        }
    }

    function guardarReadCounts() {
        try {
            localStorage.setItem(READ_STATE_KEY, JSON.stringify(readCounts));
        } catch {}
    }

    function leerChatsLocales() {
        try {
            const raw = JSON.parse(localStorage.getItem(CHATS_STORAGE_KEY) || 'null');
            if (Array.isArray(raw)) return raw;
            for (const k of LEGACY_CHATS_KEYS) {
                const legacy = JSON.parse(localStorage.getItem(k) || 'null');
                if (Array.isArray(legacy) && legacy.length) return legacy;
            }
            return [];
        } catch {
            return [];
        }
    }

    function guardarChatsLocales() {
        try {
            localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(conversaciones.slice(0, 120)));
        } catch {}
    }

    function esCuentaKixuzActiva() {
        if (window.KIXUZ_DB?.esAdmin) return true;
        const nombre = norm(
            window.KIXUZ_DB?.perfilCuenta?.nombreMaestro ||
            window.KIXUZ_DB?.usuarioActual?.displayName ||
            ''
        );
        const email = norm(
            window.KIXUZ_DB?.perfilCuenta?.email ||
            window.KIXUZ_DB?.usuarioActual?.email ||
            ''
        );
        return nombre === 'kixuz' || email.startsWith('kixuz@');
    }

    function obtenerIdentidadActiva() {
        const ac = window.KIXUZ_ACTIVE_CHAR;
        let charNombre = '';
        let charHandle = '';

        if (ac && !ac.esPlaceholder && ac.nombre) {
            charNombre = String(ac.nombre).trim();
            charHandle = normHandle(ac.handle);
        } else {
            try {
                const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
                if (act && act.nombre) {
                    charNombre = String(act.nombre).trim();
                    charHandle = normHandle(act.handle);
                }
            } catch {}
        }

        const cuentaNombre = String(
            window.KIXUZ_DB?.perfilCuenta?.nombreMaestro ||
            window.KIXUZ_DB?.usuarioActual?.displayName ||
            ''
        ).trim();

        const uid = norm(
            window.KIXUZ_DB?.usuarioActual?.uid ||
            window.KIXUZ_DB?.perfilCuenta?.uid ||
            ''
        );

        const nombre = charNombre || cuentaNombre || 'Cuenta';
        const handle = charHandle || (cuentaNombre ? normHandle(cuentaNombre) : '');
        const identidadKey = handle || uid || norm(nombre);

        return { nombre, handle, uid, identidadKey };
    }

    function esMensajeMio(msg, identidadActual) {
        if (!msg) return false;
        const msgIdentKey = norm(msg.emisorIdentKey || '');
        if (msgIdentKey && identidadActual.identidadKey) {
            return msgIdentKey === identidadActual.identidadKey;
        }
        const msgH = normHandle(msg.handle || msg.autorHandle || '');
        const actH = normHandle(identidadActual.handle || '');
        if (msgH && actH) return msgH === actH;
        const msgN = norm(msg.autor || '');
        const actN = norm(identidadActual.nombre || '');
        return Boolean(msgN && actN && msgN === actN);
    }

    function puedeBorrarMensajeChat(msg, identidadActual) {
        if (esCuentaKixuzActiva()) return true;
        return esMensajeMio(msg, identidadActual);
    }

    function esParticipantePermitido(chat, identidadActual) {
        if (!chat) return false;
        const tipo = chat.tipo || 'privado';
        const partsRaw = Array.isArray(chat.participantes) ? chat.participantes : [];
        const miembrosRaw = Array.isArray(chat.miembros) ? chat.miembros : [];
        const todos = [...partsRaw, ...miembrosRaw].map(norm).filter(Boolean);
        const todosHandles = [...partsRaw, ...miembrosRaw].map(normHandle).filter(Boolean);

        if (tipo === 'grupo_general' || todos.includes('todos') || todos.includes('*')) {
            return true;
        }

        const activos = new Set([
            norm(identidadActual.uid),
            norm(identidadActual.handle),
            normHandle(identidadActual.handle)
        ].filter(Boolean));

        const creador = norm(chat.creadorUid || chat.creadorIdentKey || '');

        if (tipo === 'privado' || tipo === 'grupo' || tipo === 'grupo_especifico') {
            if (creador && activos.has(creador)) return true;
            if (activos.size > 0 && (todos.some(t => activos.has(t)) || todosHandles.some(h => activos.has(h)))) {
                return true;
            }
            if (!creador && !todos.length) return true;
            return false;
        }

        return false;
    }

    function calcularNoLeidosChat(chat, identidadActual) {
        if (!chat || !Array.isArray(chat.mensajes)) return 0;
        const incomingCount = chat.mensajes.filter(m => !esMensajeMio(m, identidadActual)).length;
        const visto = Number(readCounts[String(chat.id)] || 0);
        return Math.max(0, incomingCount - visto);
    }

    function marcarChatLeido(chat, identidadActual) {
        if (!chat || !Array.isArray(chat.mensajes)) return;
        const incomingCount = chat.mensajes.filter(m => !esMensajeMio(m, identidadActual)).length;
        readCounts[String(chat.id)] = Math.max(Number(readCounts[String(chat.id)] || 0), incomingCount);
        guardarReadCounts();
    }

    function actualizarBurbujaNoLeidos() {
        const badge = document.getElementById('kixuzChatUnreadBadge');
        if (!badge) return;
        const identidadActual = obtenerIdentidadActiva();
        const drawerOpen = document.getElementById('kixuzChatDrawer')?.classList.contains('open');
        const visibles = conversaciones.filter(c => esParticipantePermitido(c, identidadActual));
        let total = 0;

        visibles.forEach(c => {
            if (drawerOpen && chatActivoId && String(c.id) === String(chatActivoId)) {
                marcarChatLeido(c, identidadActual);
            }
            total += calcularNoLeidosChat(c, identidadActual);
        });

        if (total > 0) {
            badge.textContent = total > 99 ? '99+' : String(total);
            badge.style.display = 'inline-block';
        } else {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }

    async function cargarDirectorioUsuarios() {
        const mapa = new Map();
        try {
            const subs = JSON.parse(localStorage.getItem('kixuz_subpersonajes') || '[]');
            if (Array.isArray(subs)) {
                subs.forEach(p => {
                    const h = normHandle(p?.handle);
                    if (h) mapa.set(h, { nombre: p.nombre || h.replace(/^@/, ''), handle: h });
                });
            }
        } catch {}

        if (window.KIXUZ_DB?.listarPersonajesPublicos) {
            try {
                const pub = await window.KIXUZ_DB.listarPersonajesPublicos();
                if (Array.isArray(pub)) {
                    pub.forEach(p => {
                        const h = normHandle(p?.handle);
                        if (h) mapa.set(h, { nombre: p.nombre || h.replace(/^@/, ''), handle: h });
                    });
                }
            } catch {}
        }
        directorioUsuarios = Array.from(mapa.values());
    }

    function hacerVisibleAlEscribir(el) {
        if (!el) return;
        setTimeout(() => {
            try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch {}
        }, 120);
    }

    function autoAjustarAlturaTextarea(ta) {
        if (!ta) return;
        ta.style.height = '42px';
        ta.style.height = Math.min(ta.scrollHeight, 115) + 'px';
    }

    function montarWidget() {
        if (document.getElementById('kixuzChatFab')) return;

        const fab = document.createElement('button');
        fab.type = 'button';
        fab.id = 'kixuzChatFab';
        fab.className = 'kixuz-chat-fab';
        fab.innerHTML = `<span>💬 Chat</span><span id="kixuzChatUnreadBadge" class="kixuz-fab-unread" style="display:none;">0</span>`;
        document.body.appendChild(fab);

        const drawer = document.createElement('div');
        drawer.id = 'kixuzChatDrawer';
        drawer.className = 'kixuz-chat-drawer';
        drawer.innerHTML = `
            <div class="kixuz-chat-head">
                <span id="kixuzChatTitle">💬 Chats</span>
                <div style="display:flex; gap:6px; align-items:center;">
                    <button type="button" class="kixuz-chat-mini" id="kixuzChatBackBtn" style="display:none;">← Lista</button>
                    <button type="button" class="kixuz-chat-mini" id="kixuzChatCloseBtn">✕</button>
                </div>
            </div>
            <div class="kixuz-chat-top-bar" id="kixuzChatTopBar">
                <input type="text" id="kixuzChatSearch" placeholder="🔍 Buscar chat o @usuario..." style="flex:1; min-width:0;">
                <button type="button" class="kixuz-plus-btn" id="kixuzOpenModalBtn" title="Crear nuevo chat" aria-label="Crear nuevo chat">+</button>
            </div>
            <div class="kixuz-chat-body" id="kixuzChatBody"></div>
            <form class="kixuz-chat-form" id="kixuzSendMsgForm" style="display:none;">
                <textarea id="kixuzMsgInput" rows="1" placeholder="Escribe un mensaje... (Shift + Enter para salto de línea)" style="flex:1; min-width:0;"></textarea>
                <button type="submit" class="kixuz-chat-btn">Enviar</button>
            </form>
        `;
        document.body.appendChild(drawer);

        const modal = document.createElement('div');
        modal.id = 'kixuzCreateChatModal';
        modal.className = 'kixuz-modal-backdrop';
        modal.innerHTML = `
            <div class="kixuz-modal-card" role="dialog" aria-modal="true" aria-labelledby="kixuzModalHeading">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong id="kixuzModalHeading" style="font-family:'Space Grotesk',sans-serif; font-size:15px;">Nuevo chat</strong>
                    <button type="button" class="kixuz-chat-mini" id="kixuzCloseModalBtn">✕</button>
                </div>
                <select id="kixuzChatTipo">
                    <option value="privado">1×1 Privado (solo implicados)</option>
                    <option value="grupo">Grupal específico (solo seleccionados)</option>
                    <option value="grupo_general">Grupal general (todos)</option>
                </select>
                <input type="text" id="kixuzGroupTitleInput" placeholder="Nombre del grupo" style="display:none;">
                <div id="kixuzMemberPickerWrap">
                    <input type="text" id="kixuzUserLookupInput" placeholder="Escribe @usuario o nombre para buscar..." autocomplete="off" style="width:100%; box-sizing:border-box;">
                    <div class="kixuz-suggest-list" id="kixuzSuggestList" style="display:none; margin-top:6px;"></div>
                    <div class="kixuz-selected-chips" id="kixuzSelectedChips" style="margin-top:6px;"></div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:4px;">
                    <button type="button" class="kixuz-chat-mini" id="kixuzCancelModalBtn">Cancelar</button>
                    <button type="button" class="kixuz-chat-btn" id="kixuzConfirmCreateBtn">Crear chat</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        fab.addEventListener('click', async () => {
            drawer.classList.toggle('open');
            await cargarDirectorioUsuarios();
            renderChatView();
            actualizarBurbujaNoLeidos();
        });

        document.getElementById('kixuzChatCloseBtn').addEventListener('click', () => {
            drawer.classList.remove('open');
            actualizarBurbujaNoLeidos();
        });

        document.getElementById('kixuzChatBackBtn').addEventListener('click', () => {
            chatActivoId = null;
            const searchInp = document.getElementById('kixuzChatSearch');
            if (searchInp) searchInp.value = '';
            renderChatView();
        });

        const openModal = async () => {
            mostrarModalCrear = true;
            seleccionadosCrear = [];
            await cargarDirectorioUsuarios();
            modal.classList.add('open');
            actualizarCamposModalPorTipo();
            renderChipsSeleccionados();
            renderSugerenciasUsuarios();
            setTimeout(() => document.getElementById('kixuzUserLookupInput')?.focus(), 50);
        };

        const closeModal = () => {
            mostrarModalCrear = false;
            seleccionadosCrear = [];
            modal.classList.remove('open');
        };

        document.getElementById('kixuzOpenModalBtn').addEventListener('click', openModal);
        document.getElementById('kixuzCloseModalBtn').addEventListener('click', closeModal);
        document.getElementById('kixuzCancelModalBtn').addEventListener('click', closeModal);
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });

        document.getElementById('kixuzChatTipo').addEventListener('change', () => {
            actualizarCamposModalPorTipo();
            if (document.getElementById('kixuzChatTipo').value === 'privado' && seleccionadosCrear.length > 1) {
                seleccionadosCrear = seleccionadosCrear.slice(0, 1);
                renderChipsSeleccionados();
            }
        });

        const lookupInp = document.getElementById('kixuzUserLookupInput');
        lookupInp.addEventListener('input', renderSugerenciasUsuarios);
        lookupInp.addEventListener('focus', () => hacerVisibleAlEscribir(lookupInp));
        lookupInp.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const raw = e.target.value.trim();
                const h = normHandle(raw);
                if (h) {
                    const hallado = directorioUsuarios.find(u => u.handle === h);
                    agregarSeleccionado(hallado || { nombre: raw.replace(/^@/, ''), handle: h });
                    e.target.value = '';
                    renderSugerenciasUsuarios();
                }
            }
        });

        const msgInp = document.getElementById('kixuzMsgInput');
        msgInp.addEventListener('focus', () => hacerVisibleAlEscribir(msgInp));
        msgInp.addEventListener('input', () => autoAjustarAlturaTextarea(msgInp));
        msgInp.addEventListener('keydown', e => {
            if (e.key === 'Enter' && e.shiftKey) {
                setTimeout(() => autoAjustarAlturaTextarea(msgInp), 0);
                return;
            }
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('kixuzSendMsgForm')?.requestSubmit();
            }
        });

        document.getElementById('kixuzConfirmCreateBtn').addEventListener('click', async () => {
            await crearConversacion();
            if (!mostrarModalCrear) closeModal();
        });

        document.getElementById('kixuzChatSearch').addEventListener('input', renderChatView);
        document.getElementById('kixuzSendMsgForm').addEventListener('submit', enviarMensajeChat);
    }

    function actualizarCamposModalPorTipo() {
        const tipo = document.getElementById('kixuzChatTipo')?.value || 'privado';
        const grpInp = document.getElementById('kixuzGroupTitleInput');
        const pickerWrap = document.getElementById('kixuzMemberPickerWrap');
        if (grpInp) {
            grpInp.style.display = (tipo === 'grupo' || tipo === 'grupo_general') ? 'block' : 'none';
        }
        if (pickerWrap) {
            pickerWrap.style.display = tipo === 'grupo_general' ? 'none' : 'block';
        }
    }

    function agregarSeleccionado(persona) {
        const tipo = document.getElementById('kixuzChatTipo')?.value || 'privado';
        if (!persona?.handle) return;
        if (tipo === 'privado') {
            seleccionadosCrear = [persona];
        } else if (!seleccionadosCrear.some(x => x.handle === persona.handle)) {
            seleccionadosCrear.push(persona);
        }
        renderChipsSeleccionados();
    }

    function renderChipsSeleccionados() {
        const chipsEl = document.getElementById('kixuzSelectedChips');
        if (!chipsEl) return;
        chipsEl.innerHTML = seleccionadosCrear.map((p, idx) => `
            <span class="kixuz-chip">
                ${esc(p.nombre)} (${esc(p.handle)})
                <span style="cursor:pointer;" data-rm-chip="${idx}">✕</span>
            </span>
        `).join('');
        chipsEl.querySelectorAll('[data-rm-chip]').forEach(el => {
            el.addEventListener('click', () => {
                seleccionadosCrear.splice(Number(el.dataset.rmChip), 1);
                renderChipsSeleccionados();
            });
        });
    }

    function renderSugerenciasUsuarios() {
        const sugBox = document.getElementById('kixuzSuggestList');
        const inp = document.getElementById('kixuzUserLookupInput');
        if (!sugBox || !inp) return;

        const q = inp.value.trim().toLowerCase().replace(/^@+/, '');
        if (!q) {
            sugBox.style.display = 'none';
            return;
        }

        const coincidencias = directorioUsuarios.filter(u =>
            u.handle.toLowerCase().includes(q) || String(u.nombre || '').toLowerCase().includes(q)
        );

        const items = [...coincidencias];
        const manualHandle = normHandle(q);
        if (manualHandle && !items.some(x => x.handle === manualHandle)) {
            items.unshift({ nombre: q, handle: manualHandle, esManual: true });
        }

        if (!items.length) {
            sugBox.style.display = 'none';
            return;
        }

        sugBox.style.display = 'flex';
        sugBox.style.flexDirection = 'column';
        sugBox.innerHTML = '';
        items.slice(0, 8).forEach(u => {
            const row = document.createElement('div');
            row.className = 'kixuz-suggest-item';
            row.innerHTML = `
                <span><strong>${esc(u.nombre)}</strong> <span style="opacity:0.75;">${esc(u.handle)}</span></span>
                <span style="color:var(--acento, #2DD4C4); font-weight:700;">${u.esManual ? 'Usar @' : '+ Elegir'}</span>
            `;
            row.addEventListener('click', () => {
                agregarSeleccionado(u);
                inp.value = '';
                sugBox.style.display = 'none';
            });
            sugBox.appendChild(row);
        });
    }

    function renderChatView() {
        const body = document.getElementById('kixuzChatBody');
        const title = document.getElementById('kixuzChatTitle');
        const backBtn = document.getElementById('kixuzChatBackBtn');
        const topBar = document.getElementById('kixuzChatTopBar');
        const searchInp = document.getElementById('kixuzChatSearch');
        const msgForm = document.getElementById('kixuzSendMsgForm');
        if (!body) return;

        const identidadActual = obtenerIdentidadActiva();
        const permitidas = conversaciones.filter(c => esParticipantePermitido(c, identidadActual));
        const activa = chatActivoId ? permitidas.find(c => String(c.id) === String(chatActivoId)) : null;

        if (chatActivoId && !activa) {
            chatActivoId = null;
        }

        const q = (searchInp?.value || '').trim().toLowerCase();

        if (activa) {
            marcarChatLeido(activa, identidadActual);
            title.textContent = activa.nombre || activa.usuario || 'Chat';
            backBtn.style.display = 'inline-block';
            if (topBar) topBar.style.display = 'none';
            msgForm.style.display = 'flex';

            const todosMsgs = Array.isArray(activa.mensajes) ? activa.mensajes : [];
            const msgs = todosMsgs.filter(m => {
                if (!q) return true;
                return norm(m.texto).includes(q) || norm(m.autor).includes(q);
            });

            const partesTxt = Array.isArray(activa.participantes) && activa.participantes.length && !activa.participantes.includes('todos')
                ? `<div style="font-size:11px; opacity:0.7; text-align:center; margin-bottom:4px;">Participantes: ${esc(activa.participantes.join(', '))}</div>`
                : '';

            body.innerHTML = partesTxt + (msgs.length
                ? msgs.map(m => {
                    const mio = esMensajeMio(m, identidadActual);
                    const puedeBorrarEsteMsg = puedeBorrarMensajeChat(m, identidadActual);
                    const msgIdx = todosMsgs.indexOf(m);
                    return `
                        <div class="kixuz-msg ${mio ? 'mine' : 'theirs'}">
                            <div class="kixuz-msg-meta">
                                <span>${esc(m.autor || 'Personaje')}${m.hora ? ' · ' + esc(m.hora) : ''}</span>
                                ${puedeBorrarEsteMsg && msgIdx >= 0 ? `<button type="button" class="kixuz-chat-mini" data-del-msg="${msgIdx}" title="Borrar mensaje" style="padding:1px 5px; font-size:10.5px; border-color:rgba(224,60,108,0.45); color:#ff9bb4;">🗑️</button>` : ''}
                            </div>
                            <div class="kixuz-msg-text">${esc(m.texto || '')}</div>
                        </div>
                    `;
                }).join('')
                : `<div style="opacity:0.7; font-size:13px; text-align:center; padding:20px;">Chat listo. Escribe tu mensaje abajo (usa Shift + Enter para salto de línea).</div>`);

            body.querySelectorAll('[data-del-msg]').forEach(delBtn => {
                delBtn.addEventListener('click', async ev => {
                    ev.stopPropagation();
                    const idxDel = Number(delBtn.dataset.delMsg);
                    const cIdx = conversaciones.findIndex(x => String(x.id) === String(activa.id));
                    if (cIdx < 0 || isNaN(idxDel) || idxDel < 0) return;
                    const actualMsgs = Array.isArray(conversaciones[cIdx].mensajes) ? [...conversaciones[cIdx].mensajes] : [];
                    if (idxDel >= actualMsgs.length) return;
                    if (!puedeBorrarMensajeChat(actualMsgs[idxDel], obtenerIdentidadActiva())) return;
                    actualMsgs.splice(idxDel, 1);
                    conversaciones[cIdx] = { ...conversaciones[cIdx], mensajes: actualMsgs };
                    guardarChatsLocales();
                    renderChatView();
                    if (window.KIXUZ_DB?.guardarMensajesChat) {
                        try { await window.KIXUZ_DB.guardarMensajesChat(conversaciones[cIdx].id, actualMsgs); } catch {}
                    }
                });
            });

            body.scrollTop = body.scrollHeight;
            actualizarBurbujaNoLeidos();
            return;
        }

        title.textContent = '💬 Chats';
        backBtn.style.display = 'none';
        if (topBar) topBar.style.display = 'flex';
        msgForm.style.display = 'none';

        const filtradas = permitidas.filter(c => {
            if (!q) return true;
            const enNombre = String(c.nombre || '').toLowerCase().includes(q);
            const enUsuario = String(c.usuario || '').toLowerCase().includes(q);
            const enPartes = Array.isArray(c.participantes) && c.participantes.some(p => String(p).toLowerCase().includes(q));
            return enNombre || enUsuario || enPartes;
        });

        if (!filtradas.length) {
            body.innerHTML = `<div style="opacity:0.72; font-size:13px; text-align:center; padding:24px;">${
                q
                    ? 'No tienes ningún chat que coincida con esa búsqueda.'
                    : 'No hay chats disponibles para este perfil. Toca "+" para crear uno.'
            }</div>`;
            actualizarBurbujaNoLeidos();
            return;
        }

        body.innerHTML = '';
        filtradas.forEach(c => {
            const row = document.createElement('div');
            row.className = 'kixuz-chat-item';
            const tipo = c.tipo || 'privado';
            const badgeText = tipo === 'grupo_general' ? 'General' : (tipo === 'grupo' ? 'Grupo' : '1×1');
            const noLeidos = calcularNoLeidosChat(c, identidadActual);
            const ultimo = Array.isArray(c.mensajes) && c.mensajes.length ? c.mensajes[c.mensajes.length - 1].texto.replace(/\n+/g, ' ') : 'Sin mensajes aún';

            row.innerHTML = `
                <div style="min-width:0;">
                    <div style="font-weight:700; font-size:13.5px;">
                        ${esc(c.nombre || c.usuario || 'Chat')}
                        <span class="kixuz-chat-badge">${badgeText}</span>
                        ${noLeidos > 0 ? `<span class="kixuz-fab-unread" style="margin-left:6px;">${noLeidos}</span>` : ''}
                    </div>
                    <div style="font-size:12px; opacity:0.72; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(ultimo)}</div>
                </div>
                <button type="button" class="kixuz-chat-mini" title="Eliminar chat">🗑️</button>
            `;
            row.addEventListener('click', () => {
                chatActivoId = String(c.id);
                marcarChatLeido(c, identidadActual);
                if (searchInp) searchInp.value = '';
                renderChatView();
            });
            row.querySelector('button').addEventListener('click', async ev => {
                ev.stopPropagation();
                conversaciones = conversaciones.filter(x => String(x.id) !== String(c.id));
                delete readCounts[String(c.id)];
                guardarReadCounts();
                if (String(chatActivoId) === String(c.id)) chatActivoId = null;
                guardarChatsLocales();
                renderChatView();
                if (window.KIXUZ_DB?.eliminarConversacionChat) {
                    try { await window.KIXUZ_DB.eliminarConversacionChat(c.id); } catch {}
                }
            });
            body.appendChild(row);
        });

        actualizarBurbujaNoLeidos();
    }

    async function crearConversacion() {
        const tipo = document.getElementById('kixuzChatTipo')?.value || 'privado';
        const grpInp = document.getElementById('kixuzGroupTitleInput');
        const lookupInp = document.getElementById('kixuzUserLookupInput');

        const rawEscrito = (lookupInp?.value || '').trim();
        if (tipo !== 'grupo_general' && rawEscrito) {
            const h = normHandle(rawEscrito);
            const hallado = directorioUsuarios.find(u => u.handle === h);
            agregarSeleccionado(hallado || { nombre: rawEscrito.replace(/^@/, ''), handle: h });
        }

        if (tipo !== 'grupo_general' && !seleccionadosCrear.length) return;

        const identidad = obtenerIdentidadActiva();
        const handlesDestino = seleccionadosCrear.map(p => p.handle).filter(Boolean);
        const nombreGrupo = (grpInp?.value || '').trim();

        const participantes = tipo === 'grupo_general'
            ? ['todos']
            : Array.from(new Set([identidad.uid, identidad.handle, ...handlesDestino].filter(Boolean)));

        const nombreFinal = tipo === 'grupo_general'
            ? (nombreGrupo || 'Chat General')
            : (tipo === 'grupo'
                ? (nombreGrupo || seleccionadosCrear.map(p => p.nombre).join(', '))
                : seleccionadosCrear[0].nombre);

        const nueva = {
            id: 'chat_' + Date.now(),
            nombre: nombreFinal,
            usuario: handlesDestino[0] || '',
            tipo,
            creadorUid: identidad.uid || '',
            creadorIdentKey: identidad.identidadKey || '',
            participantes,
            miembros: tipo === 'grupo_general' ? ['todos'] : participantes,
            mensajes: []
        };

        conversaciones.unshift(nueva);
        chatActivoId = nueva.id;
        mostrarModalCrear = false;
        seleccionadosCrear = [];
        if (grpInp) grpInp.value = '';
        if (lookupInp) lookupInp.value = '';
        guardarChatsLocales();
        renderChatView();

        if (window.KIXUZ_DB?.crearConversacionChat) {
            try {
                const creada = await window.KIXUZ_DB.crearConversacionChat({
                    nombre: nueva.nombre,
                    usuario: nueva.usuario,
                    tipo,
                    participantesExtra: handlesDestino
                });
                if (creada && creada.id) {
                    const idx = conversaciones.findIndex(x => String(x.id) === String(nueva.id));
                    if (idx >= 0) conversaciones[idx] = { ...conversaciones[idx], ...creada };
                    chatActivoId = String(creada.id);
                    guardarChatsLocales();
                }
            } catch {}
        }
    }

    async function enviarMensajeChat(e) {
        e.preventDefault();
        const inp = document.getElementById('kixuzMsgInput');
        const texto = String(inp.value || '').replace(/^\n+|\n+$/g, '');
        if (!texto.trim() || !chatActivoId) return;

        const identidad = obtenerIdentidadActiva();
        const idx = conversaciones.findIndex(c => String(c.id) === String(chatActivoId));
        if (idx < 0 || !esParticipantePermitido(conversaciones[idx], identidad)) return;

        const msg = {
            autor: identidad.nombre,
            handle: identidad.handle,
            emisorIdentKey: identidad.identidadKey,
            texto,
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const msgsActuales = Array.isArray(conversaciones[idx].mensajes) ? [...conversaciones[idx].mensajes, msg] : [msg];
        conversaciones[idx] = { ...conversaciones[idx], mensajes: msgsActuales };
        marcarChatLeido(conversaciones[idx], identidad);
        inp.value = '';
        autoAjustarAlturaTextarea(inp);
        guardarChatsLocales();
        renderChatView();

        if (window.KIXUZ_DB?.guardarMensajesChat) {
            try { await window.KIXUZ_DB.guardarMensajesChat(conversaciones[idx].id, msgsActuales); } catch {}
        }
    }

    window.addEventListener('DOMContentLoaded', async () => {
        readCounts = leerReadCounts();
        conversaciones = leerChatsLocales();
        await cargarDirectorioUsuarios();
        montarWidget();
        renderChatView();
        actualizarBurbujaNoLeidos();
    });

    window.addEventListener('kixuz:personajes-actualizados', () => {
        renderChatView();
        actualizarBurbujaNoLeidos();
    });

    window.addEventListener('load', async () => {
        await cargarDirectorioUsuarios();
        montarWidget();
        if (window.KIXUZ_DB?.activo && window.KIXUZ_DB?.escucharChats) {
            window.KIXUZ_DB.escucharChats(nubeChats => {
                if (!Array.isArray(nubeChats)) return;
                const mapa = new Map();
                conversaciones.forEach(c => mapa.set(String(c.id), c));
                nubeChats.forEach(nc => {
                    const prev = mapa.get(String(nc.id));
                    const msgsPrev = Array.isArray(prev?.mensajes) ? prev.mensajes : [];
                    const msgsNube = Array.isArray(nc.mensajes) ? nc.mensajes : [];
                    mapa.set(String(nc.id), {
                        ...prev,
                        ...nc,
                        mensajes: msgsNube.length >= msgsPrev.length ? msgsNube : msgsPrev
                    });
                });
                conversaciones = Array.from(mapa.values());
                guardarChatsLocales();
                renderChatView();
                actualizarBurbujaNoLeidos();
            });
        }
    });
})();

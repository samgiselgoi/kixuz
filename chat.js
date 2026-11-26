(() => {
    const STORAGE_KEY = "kixuz_chats_v1";
    const KEY_ACTIVO = "kixuz_personaje_activo";
    const KEY_LISTA = "kixuz_subpersonajes";

    const esc = s => String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const normH = h => {
        const s = String(h || "").trim().toLowerCase().replace(/^@+/, "").replace(/\s+/g, "_");
        return s ? "@" + s : "";
    };

    let conversaciones = [];
    let chatActivoId = null;
    let filtroTexto = "";
    let creandoChat = false;
    let unsubscribeNube = null;

    function getPersonajeActivo() {
        if (window.KIXUZ_ACTIVE_CHAR?.handle) {
            return { ...window.KIXUZ_ACTIVE_CHAR, handle: normH(window.KIXUZ_ACTIVE_CHAR.handle) };
        }
        try {
            const raw = JSON.parse(localStorage.getItem(KEY_ACTIVO) || "null");
            if (raw?.handle) return { ...raw, handle: normH(raw.handle) };
        } catch {}
        try {
            const subs = JSON.parse(localStorage.getItem(KEY_LISTA) || "[]");
            if (Array.isArray(subs) && subs[0]?.handle) {
                return { ...subs[0], handle: normH(subs[0].handle) };
            }
        } catch {}
        return { nombre: "Personaje", handle: "" };
    }

    function leerLocal() {
        try {
            const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    function guardarLocal(arr) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        } catch {}
    }

    // Fusiona mensajes por ID evitando duplicados y conservando el más reciente
    function fusionarMensajes(msgsA = [], msgsB = []) {
        const mapa = new Map();
        [...(Array.isArray(msgsA) ? msgsA : []), ...(Array.isArray(msgsB) ? msgsB : [])].forEach(m => {
            if (!m) return;
            const key = String(m.id || `${m.autorHandle || ""}_${m.ts || m.hora || ""}_${m.texto || ""}`);
            const prev = mapa.get(key);
            if (!prev || Number(m.ts || 0) >= Number(prev.ts || 0)) {
                mapa.set(key, m);
            }
        });
        return Array.from(mapa.values()).sort((a, b) => Number(a.ts || 0) - Number(b.ts || 0));
    }

    function fusionarConversaciones(locales = [], remotas = []) {
        const mapa = new Map();
        locales.forEach(c => {
            if (!c?.id) return;
            mapa.set(String(c.id), { ...c, mensajes: Array.isArray(c.mensajes) ? c.mensajes : [] });
        });
        remotas.forEach(r => {
            if (!r?.id) return;
            const id = String(r.id);
            const prev = mapa.get(id);
            const msgs = fusionarMensajes(prev?.mensajes, r.mensajes);
            const participantes = Array.from(new Set([
                ...(Array.isArray(prev?.participantes) ? prev.participantes : []),
                ...(Array.isArray(r.participantes) ? r.participantes : [])
            ].map(normH).filter(Boolean)));

            mapa.set(id, {
                ...(prev || {}),
                ...r,
                id,
                participantes,
                mensajes: msgs,
                actualizadoEn: Math.max(Number(prev?.actualizadoEn || 0), Number(r.actualizadoEn || 0), Number(r.createdAtMs || 0))
            });
        });
        return Array.from(mapa.values()).sort((a, b) => Number(b.actualizadoEn || b.createdAtMs || 0) - Number(a.actualizadoEn || a.createdAtMs || 0));
    }

    function esImplicado(chat) {
        if (!chat) return false;
        const parts = Array.isArray(chat.participantes) ? chat.participantes.map(normH).filter(Boolean) : [];
        if (parts.includes("@todos") || parts.includes("todos")) return true;

        const pj = getPersonajeActivo();
        const miH = normH(pj.handle);
        const miNombre = String(pj.nombre || "").trim().toLowerCase();

        if (miH && parts.includes(miH)) return true;
        if (miH && normH(chat.creadorHandle) === miH) return true;
        if (miH && normH(chat.usuario) === miH) return true;
        if (miNombre && Array.isArray(chat.participantes) && chat.participantes.some(p => String(p || "").trim().toLowerCase() === miNombre)) {
            return true;
        }
        // Si no hay sesión ni personaje seleccionado aún, no ocultar todo en modo solo lectura local
        if (!miH && parts.length === 0) return true;
        return false;
    }

    function esMensajeMio(m) {
        const pj = getPersonajeActivo();
        const miH = normH(pj.handle);
        const mH = normH(m?.autorHandle || m?.handle || "");
        if (miH && mH) return miH === mH;
        const miNombre = String(pj.nombre || "").trim().toLowerCase();
        const mAutor = String(m?.autorNombre || m?.autor || "").trim().toLowerCase();
        return Boolean(miNombre && mAutor && miNombre === mAutor);
    }

    function injectStyles() {
        if (document.getElementById("kixuz-chat-styles")) return;
        const st = document.createElement("style");
        st.id = "kixuz-chat-styles";
        st.textContent = `
            .kixuz-chat-fab {
                position: fixed; right: 20px; bottom: 20px; z-index: 9990;
                height: 46px; padding: 0 16px; border-radius: 999px;
                border: 1px solid var(--acento, #2DD4C4);
                background: var(--card, #1F1135); color: var(--acento, #2DD4C4);
                font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 13.5px;
                cursor: pointer; box-shadow: 0 10px 26px rgba(0,0,0,0.42);
                display: inline-flex; align-items: center; gap: 8px;
            }
            .kixuz-chat-fab:hover { background: var(--acento, #2DD4C4); color: #150A24; }
            .kixuz-chat-drawer {
                position: fixed; right: 20px; bottom: 76px; width: 370px; max-width: calc(100vw - 24px);
                height: 520px; max-height: calc(100vh - 96px);
                background: var(--bg-principal, #150A24); color: var(--texto, #EDE7E0);
                border: 1px solid var(--acento, #2DD4C4); border-radius: 18px;
                box-shadow: 0 18px 44px rgba(0,0,0,0.6); z-index: 9995;
                display: none; flex-direction: column; overflow: hidden;
            }
            .kixuz-chat-drawer.open { display: flex; }
            .kixuz-chat-head {
                padding: 12px 14px; border-bottom: 1px solid rgba(108,60,224,0.35);
                display: flex; align-items: center; justify-content: space-between; gap: 8px;
                background: rgba(108,60,224,0.16);
            }
            .kixuz-chat-top-bar {
                padding: 10px 12px; border-bottom: 1px solid rgba(108,60,224,0.3);
                display: flex; gap: 8px; align-items: center;
            }
            .kixuz-chat-search {
                flex: 1; padding: 8px 10px; border-radius: 9px;
                border: 1px solid rgba(108,60,224,0.4); background: rgba(0,0,0,0.28);
                color: var(--texto, #EDE7E0); font-size: 12.5px; outline: none;
            }
            .kixuz-chat-btn-new {
                padding: 8px 11px; border-radius: 9px; border: none;
                background: var(--acento, #2DD4C4); color: #150A24;
                font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 12px;
                cursor: pointer; white-space: nowrap;
            }
            .kixuz-chat-list { flex: 1; overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
            .kixuz-chat-item {
                padding: 10px 12px; border-radius: 12px;
                border: 1px solid rgba(108,60,224,0.3); background: rgba(108,60,224,0.12);
                cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 8px;
            }
            .kixuz-chat-item:hover { border-color: var(--acento, #2DD4C4); }
            .kixuz-chat-msgs {
                flex: 1; overflow-y: auto; padding: 12px;
                display: flex; flex-direction: column; gap: 8px;
            }
            .kixuz-bubble {
                max-width: 80%; padding: 8px 12px; border-radius: 13px;
                font-size: 13px; line-height: 1.45; word-break: break-word;
            }
            .kixuz-bubble.mine {
                align-self: flex-end;
                background: var(--acento, #2DD4C4); color: #150A24;
                border-bottom-right-radius: 4px;
            }
            .kixuz-bubble.theirs {
                align-self: flex-start;
                background: rgba(108,60,224,0.28); color: var(--texto, #EDE7E0);
                border: 1px solid rgba(108,60,224,0.45);
                border-bottom-left-radius: 4px;
            }
            .kixuz-bubble-meta { font-size: 10.5px; opacity: 0.78; margin-bottom: 2px; font-weight: 700; }
            .kixuz-chat-form {
                padding: 10px; border-top: 1px solid rgba(108,60,224,0.35);
                display: flex; gap: 8px;
            }
            .kixuz-chat-form input {
                flex: 1; padding: 9px 11px; border-radius: 10px;
                border: 1px solid rgba(108,60,224,0.4); background: rgba(0,0,0,0.28);
                color: var(--texto, #EDE7E0); font-size: 13px; outline: none;
            }
            .kixuz-chat-modal {
                position: fixed; inset: 0; background: rgba(10,4,20,0.78);
                display: none; align-items: center; justify-content: center;
                z-index: 10000; padding: 16px;
            }
            .kixuz-chat-modal.open { display: flex; }
            .kixuz-chat-modal-box {
                width: 100%; max-width: 380px; background: var(--bg-principal, #150A24);
                color: var(--texto, #EDE7E0); border: 1px solid var(--acento, #2DD4C4);
                border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 10px;
            }
            .kixuz-chat-modal-box input, .kixuz-chat-modal-box select {
                width: 100%; padding: 9px 11px; border-radius: 10px;
                border: 1px solid rgba(108,60,224,0.45); background: rgba(0,0,0,0.32);
                color: var(--texto, #EDE7E0); font-size: 13px; outline: none;
            }
        `;
        document.head.appendChild(st);
    }

    function montarUI() {
        injectStyles();
        if (document.getElementById("kixuzChatDrawer")) return;

        const fab = document.createElement("button");
        fab.type = "button";
        fab.className = "kixuz-chat-fab";
        fab.id = "kixuzChatFab";
        fab.textContent = "Chat";

        const drawer = document.createElement("aside");
        drawer.className = "kixuz-chat-drawer";
        drawer.id = "kixuzChatDrawer";
        drawer.innerHTML = `
            <div class="kixuz-chat-head">
                <strong id="kixuzChatTitle" style="font-family:'Space Grotesk',sans-serif;font-size:14px;">Chats</strong>
                <div style="display:flex;gap:6px;align-items:center;">
                    <button type="button" id="kixuzChatBackBtn" style="display:none;background:none;border:1px solid var(--acento,#2DD4C4);color:var(--acento,#2DD4C4);border-radius:7px;padding:3px 8px;font-size:11.5px;font-weight:700;cursor:pointer;">Volver</button>
                    <button type="button" id="kixuzChatDelBtn" style="display:none;background:none;border:1px solid #ff6b8b;color:#ff6b8b;border-radius:7px;padding:3px 8px;font-size:11.5px;font-weight:700;cursor:pointer;">Borrar</button>
                    <button type="button" id="kixuzChatCloseBtn" style="background:none;border:none;color:inherit;font-size:16px;font-weight:700;cursor:pointer;padding:0 4px;">✕</button>
                </div>
            </div>
            <div id="kixuzChatListView" style="display:flex;flex-direction:column;flex:1;overflow:hidden;">
                <div class="kixuz-chat-top-bar">
                    <input type="text" class="kixuz-chat-search" id="kixuzChatSearch" placeholder="Buscar chat o @usuario...">
                    <button type="button" class="kixuz-chat-btn-new" id="kixuzOpenNewChat">+ Nuevo</button>
                </div>
                <div class="kixuz-chat-list" id="kixuzChatList"></div>
            </div>
            <div id="kixuzChatConvView" style="display:none;flex-direction:column;flex:1;overflow:hidden;">
                <div class="kixuz-chat-msgs" id="kixuzChatMsgs"></div>
                <form class="kixuz-chat-form" id="kixuzChatSendForm">
                    <input type="text" id="kixuzChatMsgInput" placeholder="Escribe un mensaje..." autocomplete="off" required>
                    <button type="submit" class="kixuz-chat-btn-new">Enviar</button>
                </form>
            </div>
        `;

        const modal = document.createElement("div");
        modal.className = "kixuz-chat-modal";
        modal.id = "kixuzNewChatModal";
        modal.innerHTML = `
            <div class="kixuz-chat-modal-box">
                <strong style="font-family:'Space Grotesk',sans-serif;font-size:15px;color:var(--acento,#2DD4C4);">Nuevo chat</strong>
                <select id="kixuzNewChatType">
                    <option value="privado">1×1 Privado</option>
                    <option value="grupo">Grupo (separados por coma)</option>
                </select>
                <input type="text" id="kixuzNewChatHandle" placeholder="@usuario o @u1, @u2">
                <input type="text" id="kixuzNewChatName" placeholder="Nombre del chat (opcional)">
                <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
                    <button type="button" id="kixuzCancelNewChat" style="background:none;border:1px solid rgba(237,231,224,0.3);color:inherit;border-radius:9px;padding:8px 12px;cursor:pointer;font-size:12.5px;">Cancelar</button>
                    <button type="button" id="kixuzConfirmNewChat" class="kixuz-chat-btn-new">Crear chat</button>
                </div>
            </div>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(drawer);
        document.body.appendChild(modal);

        fab.addEventListener("click", () => {
            drawer.classList.toggle("open");
            if (drawer.classList.contains("open")) {
                renderLista();
                if (chatActivoId) abrirChat(chatActivoId);
            }
        });

        document.getElementById("kixuzChatCloseBtn").addEventListener("click", () => drawer.classList.remove("open"));
        document.getElementById("kixuzChatBackBtn").addEventListener("click", () => {
            chatActivoId = null;
            document.getElementById("kixuzChatConvView").style.display = "none";
            document.getElementById("kixuzChatListView").style.display = "flex";
            document.getElementById("kixuzChatBackBtn").style.display = "none";
            document.getElementById("kixuzChatDelBtn").style.display = "none";
            document.getElementById("kixuzChatTitle").textContent = "Chats";
            renderLista();
        });

        document.getElementById("kixuzChatDelBtn").addEventListener("click", async () => {
            if (!chatActivoId) return;
            const idBorrar = String(chatActivoId);
            conversaciones = conversaciones.filter(c => String(c.id) !== idBorrar);
            guardarLocal(conversaciones);
            if (window.KIXUZ_DB?.eliminarConversacionChat) {
                await window.KIXUZ_DB.eliminarConversacionChat(idBorrar);
            }
            document.getElementById("kixuzChatBackBtn").click();
        });

        document.getElementById("kixuzChatSearch").addEventListener("input", e => {
            filtroTexto = (e.target.value || "").trim().toLowerCase();
            renderLista();
        });

        document.getElementById("kixuzOpenNewChat").addEventListener("click", () => {
            document.getElementById("kixuzNewChatHandle").value = "";
            document.getElementById("kixuzNewChatName").value = "";
            modal.classList.add("open");
            document.getElementById("kixuzNewChatHandle").focus();
        });

        document.getElementById("kixuzCancelNewChat").addEventListener("click", () => modal.classList.remove("open"));

        document.getElementById("kixuzConfirmNewChat").addEventListener("click", async () => {
            if (creandoChat) return;
            const rawInput = (document.getElementById("kixuzNewChatHandle").value || "").trim();
            const tipo = document.getElementById("kixuzNewChatType").value || "privado";
            const nombreCustom = (document.getElementById("kixuzNewChatName").value || "").trim();

            const handles = rawInput.split(",").map(normH).filter(Boolean);
            const principal = handles[0] || "";
            const extras = handles.slice(1);
            const pj = getPersonajeActivo();
            const miH = normH(pj.handle);

            const participantes = Array.from(new Set([miH, principal, ...extras].filter(Boolean)));
            const nombreFinal = nombreCustom || (tipo === "grupo" ? (handles.join(", ") || "Grupo") : (principal || "Chat"));

            creandoChat = true;
            const btn = document.getElementById("kixuzConfirmNewChat");
            btn.textContent = "Creando...";

            const tempId = "chat_" + Date.now();
            const nuevaLocal = {
                id: tempId,
                nombre: nombreFinal,
                usuario: principal,
                tipo,
                participantes,
                creadorHandle: miH,
                mensajes: [],
                createdAtMs: Date.now(),
                actualizadoEn: Date.now()
            };

            conversaciones.unshift(nuevaLocal);
            guardarLocal(conversaciones);
            modal.classList.remove("open");
            drawer.classList.add("open");
            abrirChat(nuevaLocal.id);

            if (window.KIXUZ_DB?.crearConversacionChat) {
                try {
                    const creadaNube = await window.KIXUZ_DB.crearConversacionChat({
                        nombre: nombreFinal,
                        usuario: principal,
                        tipo,
                        participantesExtra: extras
                    });
                    if (creadaNube?.id) {
                        conversaciones = conversaciones.map(c => String(c.id) === tempId ? { ...nuevaLocal, ...creadaNube, id: creadaNube.id } : c);
                        guardarLocal(conversaciones);
                        if (String(chatActivoId) === tempId) {
                            chatActivoId = creadaNube.id;
                        }
                    }
                } catch {}
            }

            creandoChat = false;
            btn.textContent = "Crear chat";
            renderLista();
        });

        document.getElementById("kixuzChatSendForm").addEventListener("submit", async e => {
            e.preventDefault();
            const inp = document.getElementById("kixuzChatMsgInput");
            const texto = (inp.value || "").trim();
            if (!texto || !chatActivoId) return;

            const chat = conversaciones.find(c => String(c.id) === String(chatActivoId));
            if (!chat) return;

            const pj = getPersonajeActivo();
            const msg = {
                id: "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
                autorNombre: pj.nombre || pj.handle || "Personaje",
                autorHandle: normH(pj.handle),
                texto,
                hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                ts: Date.now()
            };

            chat.mensajes = fusionarMensajes(chat.mensajes, [msg]);
            chat.actualizadoEn = Date.now();
            guardarLocal(conversaciones);
            inp.value = "";
            renderMensajes(chat);
            renderLista();

            if (window.KIXUZ_DB?.guardarMensajesChat) {
                await window.KIXUZ_DB.guardarMensajesChat(chat.id, chat.mensajes);
            }
        });
    }

    function renderLista() {
        const listEl = document.getElementById("kixuzChatList");
        if (!listEl) return;

        const visibles = conversaciones.filter(c => {
            if (!esImplicado(c)) return false;
            if (!filtroTexto) return true;
            const hay = `${c.nombre || ""} ${c.usuario || ""} ${(c.participantes || []).join(" ")}`.toLowerCase();
            return hay.includes(filtroTexto);
        });

        if (!visibles.length) {
            listEl.innerHTML = `<div style="font-size:12.5px;opacity:0.7;padding:12px;">No hay conversaciones para este personaje todavía.</div>`;
            return;
        }

        listEl.innerHTML = visibles.map(c => {
            const ultimo = Array.isArray(c.mensajes) && c.mensajes.length ? c.mensajes[c.mensajes.length - 1].texto : "Sin mensajes aún";
            return `
                <div class="kixuz-chat-item" data-cid="${esc(c.id)}">
                    <div style="min-width:0;flex:1;">
                        <div style="font-weight:700;font-size:13px;">${esc(c.nombre || c.usuario || "Chat")}</div>
                        <div style="font-size:11.5px;opacity:0.72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(ultimo)}</div>
                    </div>
                    <span style="font-size:10.5px;color:var(--acento,#2DD4C4);font-weight:700;">${c.tipo === "grupo" ? "Grupo" : "1×1"}</span>
                </div>
            `;
        }).join("");

        listEl.querySelectorAll("[data-cid]").forEach(item => {
            item.addEventListener("click", () => abrirChat(item.dataset.cid));
        });
    }

    function abrirChat(id) {
        const chat = conversaciones.find(c => String(c.id) === String(id));
        if (!chat || !esImplicado(chat)) return;

        chatActivoId = chat.id;
        document.getElementById("kixuzChatListView").style.display = "none";
        document.getElementById("kixuzChatConvView").style.display = "flex";
        document.getElementById("kixuzChatBackBtn").style.display = "inline-block";
        document.getElementById("kixuzChatDelBtn").style.display = "inline-block";
        document.getElementById("kixuzChatTitle").textContent = chat.nombre || chat.usuario || "Chat";
        renderMensajes(chat);
    }

    function renderMensajes(chat) {
        const box = document.getElementById("kixuzChatMsgs");
        if (!box || !chat) return;
        const msgs = Array.isArray(chat.mensajes) ? chat.mensajes : [];
        if (!msgs.length) {
            box.innerHTML = `<div style="font-size:12px;opacity:0.65;text-align:center;margin-top:20px;">Escribe el primer mensaje.</div>`;
            return;
        }
        box.innerHTML = msgs.map(m => {
            const mine = esMensajeMio(m);
            return `
                <div class="kixuz-bubble ${mine ? "mine" : "theirs"}">
                    <div class="kixuz-bubble-meta">${esc(m.autorNombre || m.autorHandle || "Rol")} · ${esc(m.hora || "")}</div>
                    <div>${esc(m.texto || "")}</div>
                </div>
            `;
        }).join("");
        box.scrollTop = box.scrollHeight;
    }

    function iniciarEscuchaNube() {
        if (typeof unsubscribeNube === "function") {
            try { unsubscribeNube(); } catch {}
        }
        if (!window.KIXUZ_DB?.escucharChats) return;

        unsubscribeNube = window.KIXUZ_DB.escucharChats(remotas => {
            conversaciones = fusionarConversaciones(conversaciones, remotas);
            guardarLocal(conversaciones);
            renderLista();
            if (chatActivoId) {
                const act = conversaciones.find(c => String(c.id) === String(chatActivoId));
                if (act && esImplicado(act)) renderMensajes(act);
            }
        });
    }

    function init() {
        conversaciones = leerLocal();
        montarUI();
        renderLista();
        iniciarEscuchaNube();
    }

    window.addEventListener("kixuz:personajes-actualizados", () => {
        renderLista();
        if (chatActivoId) {
            const act = conversaciones.find(c => String(c.id) === String(chatActivoId));
            if (!act || !esImplicado(act)) {
                document.getElementById("kixuzChatBackBtn")?.click();
            } else {
                renderMensajes(act);
            }
        }
    });

    window.addEventListener("kixuz:sesion-actualizada", () => {
        iniciarEscuchaNube();
        renderLista();
    });

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
(() => {
    const CHATS_KEY = 'kixuz_chats_v1';
    const READ_KEY = 'kixuz_chats_leidos_v1';

    const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const norm = v => String(v || '').trim().toLowerCase();
    const normHandle = h => {
        const s = norm(h).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    let chatsCache = [];
    let activeChatId = null;

    function getEmisor() {
        const ac = window.KIXUZ_ACTIVE_CHAR;
        if (ac && (ac.nombre || ac.handle)) {
            return {
                nombre: String(ac.nombre || ac.handle.replace(/^@/, '')).trim(),
                handle: normHandle(ac.handle || ac.nombre) || '@rol'
            };
        }
        return { nombre: 'Invitado', handle: '@invitado' };
    }

    function leerChats() {
        try {
            const arr = JSON.parse(localStorage.getItem(CHATS_KEY) || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch { return []; }
    }

    function guardarChats(arr) {
        try { localStorage.setItem(CHATS_KEY, JSON.stringify(arr)); } catch {}
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
        const leidos = leerLeidos();
        let total = 0;
        chatsCache.forEach(c => {
            const msgs = Array.isArray(c.mensajes) ? c.mensajes : [];
            const vistoCount = Number(leidos[c.id] || 0);
            msgs.forEach((m, idx) => {
                if (idx >= vistoCount && normHandle(m.autorHandle) !== normHandle(em.handle)) {
                    total += 1;
                }
            });
        });
        return total;
    }

    function marcarChatLeido(chat) {
        if (!chat) return;
        const leidos = leerLeidos();
        leidos[chat.id] = Array.isArray(chat.mensajes) ? chat.mensajes.length : 0;
        guardarLeidos(leidos);
        actualizarBadge();
    }

    function actualizarBadge() {
        const badge = document.getElementById('kixuzChatBadge');
        if (!badge) return;
        const sinLeer = contarMensajesSinLeer();
        badge.textContent = sinLeer > 0 ? String(sinLeer) : '';
        badge.style.display = sinLeer > 0 ? 'inline-flex' : 'none';
    }

    function puedeVerChat(c) {
        const em = getEmisor();
        const miH = normHandle(em.handle);
        if (c.tipo === 'general') return true;
        const parts = Array.isArray(c.participantes) ? c.participantes.map(normHandle) : [];
        if (parts.includes(miH)) return true;
        if (c.usuario && normHandle(c.usuario) === miH) return true;
        return false;
    }

    function montarChatUI() {
        if (document.getElementById('kixuzChatBubble')) return;

        const style = document.createElement('style');
        style.textContent = `
            #kixuzChatBubble {
                position: fixed; right: 18px; bottom: 18px; z-index: 1100;
                background: var(--acento, #2DD4C4); color: #150A24; border: none;
                border-radius: 999px; padding: 11px 16px; font-family: 'Space Grotesk', sans-serif;
                font-weight: 700; font-size: 13.5px; cursor: pointer;
                box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45); display: inline-flex; align-items: center; gap: 7px;
            }
            #kixuzChatBadge {
                background: #e03c6c; color: #fff; border-radius: 999px;
                padding: 1px 7px; font-size: 11px; font-weight: 800; display: none;
            }
            #kixuzChatDrawer {
                position: fixed; top: 0; right: 0; width: 360px; max-width: 100vw; height: 100vh;
                z-index: 1150; background: #1a0c2e; color: var(--texto, #EDE7E0);
                border-left: 1px solid var(--borde, rgba(108,60,224,0.45));
                box-shadow: -12px 0 32px rgba(0, 0, 0, 0.55);
                transform: translateX(100%); transition: transform 0.24s ease;
                display: flex; flex-direction: column;
            }
            html[data-theme="light"] #kixuzChatDrawer { background: #ffffff; color: #150A24; }
            #kixuzChatDrawer.open { transform: translateX(0); }
            .kixuz-chat-head {
                padding: 12px 14px; border-bottom: 1px solid var(--borde, rgba(108,60,224,0.35));
                display: flex; justify-content: space-between; align-items: center; gap: 8px;
            }
            .kixuz-chat-body { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
            .kixuz-msg-row { display: flex; flex-direction: column; max-width: 82%; }
            .kixuz-msg-row.mine { align-self: flex-end; align-items: flex-end; }
            .kixuz-msg-row.other { align-self: flex-start; align-items: flex-start; }
            .kixuz-msg-bubble {
                padding: 8px 11px; border-radius: 12px; font-size: 13.5px;
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
        bubble.innerHTML = `💬 Chat <span id="kixuzChatBadge"></span>`;

        const drawer = document.createElement('aside');
        drawer.id = 'kixuzChatDrawer';
        drawer.innerHTML = `
            <div class="kixuz-chat-head">
                <strong style="font-family:'Space Grotesk',sans-serif; color:var(--acento);">💬 Chat KIXUZ</strong>
                <button type="button" id="kixuzChatClose" style="background:none; border:none; color:inherit; font-size:18px; cursor:pointer;">✕</button>
            </div>
            <div style="padding:10px 14px; border-bottom:1px solid var(--borde, rgba(108,60,224,0.25)); display:flex; flex-direction:column; gap:8px;">
                <input type="search" id="kixuzChatSearch" placeholder="Buscar chat o @usuario..." style="width:100%; padding:7px 10px; border-radius:8px; border:1px solid var(--borde, rgba(108,60,224,0.35)); background:rgba(0,0,0,0.25); color:inherit; font-size:13px;">
                <div style="display:flex; gap:6px;">
                    <input type="text" id="kixuzNewChatTarget" placeholder="@usuario o nombre de sala" style="flex:1; padding:7px 9px; border-radius:8px; border:1px solid var(--borde, rgba(108,60,224,0.35)); background:rgba(0,0,0,0.25); color:inherit; font-size:12.5px;">
                    <select id="kixuzNewChatTipo" style="padding:7px 8px; border-radius:8px; border:1px solid var(--borde, rgba(108,60,224,0.35)); background:rgba(0,0,0,0.25); color:inherit; font-size:12px;">
                        <option value="privado">1×1</option>
                        <option value="grupal">Grupal</option>
                        <option value="general">General</option>
                    </select>
                    <button type="button" id="kixuzCreateChatBtn" class="btn" style="padding:7px 10px; font-size:12px;">+ Crear</button>
                </div>
                <div id="kixuzChatList" style="display:flex; gap:6px; flex-wrap:wrap;"></div>
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
            drawer.classList.toggle('open');
            if (drawer.classList.contains('open')) renderChatDrawer();
        });
        document.getElementById('kixuzChatClose').addEventListener('click', () => drawer.classList.remove('open'));

        function renderChatDrawer() {
            const q = norm(document.getElementById('kixuzChatSearch').value);
            const listEl = document.getElementById('kixuzChatList');
            const msgEl = document.getElementById('kixuzChatMessages');
            const em = getEmisor();

            const visibles = chatsCache.filter(c => {
                if (!puedeVerChat(c)) return false;
                if (!q) return true;
                return norm(c.nombre).includes(q) || norm(c.usuario).includes(q);
            });

            if (!activeChatId && visibles.length > 0) activeChatId = visibles[0].id;

            listEl.innerHTML = visibles.map(c => `
                <button type="button" class="kixuz-c-item" data-cid="${esc(c.id)}" style="padding:4px 9px; border-radius:8px; border:1px solid var(--borde, rgba(108,60,224,0.35)); background:${c.id === activeChatId ? 'var(--acento, #2DD4C4)' : 'rgba(108,60,224,0.2)'}; color:${c.id === activeChatId ? '#150A24' : 'inherit'}; font-size:12px; font-weight:700; cursor:pointer;">
                    ${esc(c.nombre || c.usuario || 'Chat')}
                </button>
            `).join('') || `<span class="muted">Sin chats creados aún.</span>`;

            listEl.querySelectorAll('[data-cid]').forEach(b => {
                b.addEventListener('click', () => {
                    activeChatId = b.dataset.cid;
                    const found = chatsCache.find(x => x.id === activeChatId);
                    if (found) marcarChatLeido(found);
                    renderChatDrawer();
                });
            });

            const actual = chatsCache.find(x => x.id === activeChatId);
            if (!actual) {
                msgEl.innerHTML = `<div class="muted">Creá o elegí una conversación arriba.</div>`;
                return;
            }
            marcarChatLeido(actual);

            const msgs = Array.isArray(actual.mensajes) ? actual.mensajes : [];
            msgEl.innerHTML = msgs.map((m, idx) => {
                const mine = normHandle(m.autorHandle) === normHandle(em.handle);
                return `
                    <div class="kixuz-msg-row ${mine ? 'mine' : 'other'}">
                        <span style="font-size:11px; opacity:0.75; margin-bottom:2px;">${esc(m.autorNombre || m.autorHandle || 'Personaje')}</span>
                        <div class="kixuz-msg-bubble">${esc(m.texto || '')}</div>
                        ${mine ? `<button type="button" data-midx="${idx}" class="kixuz-del-m" style="background:none; border:none; color:#ff9bb4; font-size:10.5px; cursor:pointer; margin-top:2px;">Borrar</button>` : ''}
                    </div>
                `;
            }).join('') || `<div class="muted">Todavía no hay mensajes en este chat.</div>`;

            msgEl.querySelectorAll('.kixuz-del-m').forEach(db => {
                db.addEventListener('click', () => {
                    const i = Number(db.dataset.midx);
                    msgs.splice(i, 1);
                    actual.mensajes = msgs;
                    guardarChats(chatsCache);
                    renderChatDrawer();
                });
            });
            msgEl.scrollTop = msgEl.scrollHeight;
        }

        document.getElementById('kixuzChatSearch').addEventListener('input', renderChatDrawer);

        document.getElementById('kixuzCreateChatBtn').addEventListener('click', () => {
            const targetRaw = document.getElementById('kixuzNewChatTarget').value.trim();
            const tipo = document.getElementById('kixuzNewChatTipo').value;
            const em = getEmisor();
            if (!targetRaw && tipo !== 'general') return;

            const hTarget = normHandle(targetRaw);
            const nombreSala = tipo === 'general' ? (targetRaw || 'Sala General') : (targetRaw || hTarget);
            const nueva = {
                id: 'chat_' + Date.now(),
                nombre: nombreSala,
                usuario: hTarget,
                tipo,
                participantes: Array.from(new Set([normHandle(em.handle), hTarget].filter(Boolean))),
                mensajes: []
            };
            chatsCache.unshift(nueva);
            activeChatId = nueva.id;
            guardarChats(chatsCache);
            document.getElementById('kixuzNewChatTarget').value = '';
            renderChatDrawer();
            actualizarBadge();
        });

        const cTa = document.getElementById('kixuzChatInput');
        const cForm = document.getElementById('kixuzChatSendForm');
        cTa.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                cForm.requestSubmit();
            }
        });
        cForm.addEventListener('submit', e => {
            e.preventDefault();
            const txt = String(cTa.value || '').replace(/^\n+|\n+$/g, '');
            if (!txt.trim() || !activeChatId) return;
            const actual = chatsCache.find(x => x.id === activeChatId);
            if (!actual) return;
            const em = getEmisor();
            actual.mensajes = Array.isArray(actual.mensajes) ? actual.mensajes : [];
            actual.mensajes.push({ autorNombre: em.nombre, autorHandle: em.handle, texto: txt });
            guardarChats(chatsCache);
            cTa.value = '';
            renderChatDrawer();
            actualizarBadge();
        });

        chatsCache = leerChats();
        actualizarBadge();
    }

    window.addEventListener('DOMContentLoaded', montarChatUI);
    window.addEventListener('kixuz:personaje-cambiado', actualizarBadge);
})();

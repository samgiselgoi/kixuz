(() => {
    const POSTS_KEY = 'kixuz_posts_v1';
    const NOTIF_KEY = 'kixuz_notificaciones_v1';

    const esc = s => String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const norm = v => String(v || '').trim().toLowerCase();

    const normHandle = v => {
        const s = norm(v).replace(/^@+/, '').replace(/\s+/g, '_');
        return s ? '@' + s : '';
    };

    const style = document.createElement('style');
    style.id = 'kixuz-interacciones-muro-style';
    style.textContent = `
        .kixuz-mode-badge {
            display: inline-flex;
            align-items: center;
            padding: 2px 7px;
            border-radius: 999px;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 10.5px;
            font-weight: 800;
            letter-spacing: 0.4px;
            vertical-align: middle;
        }
        .kixuz-mode-badge.ic {
            background: rgba(45, 212, 196, 0.18);
            color: var(--acento, #2DD4C4);
            border: 1px solid rgba(45, 212, 196, 0.5);
        }
        .kixuz-mode-badge.oc {
            background: rgba(108, 60, 224, 0.28);
            color: #d3bcff;
            border: 1px solid rgba(108, 60, 224, 0.65);
        }
        html[data-theme="light"] .kixuz-mode-badge.oc {
            color: #5528c4;
        }
        .kixuz-oc-ic-switch {
            display: inline-flex;
            background: rgba(0, 0, 0, 0.28);
            border: 1px solid rgba(108, 60, 224, 0.45);
            border-radius: 999px;
            padding: 2px;
            gap: 2px;
            flex-shrink: 0;
        }
        html[data-theme="light"] .kixuz-oc-ic-switch {
            background: rgba(108, 60, 224, 0.1);
        }
        .kixuz-oc-ic-opt {
            border: none;
            background: transparent;
            color: var(--texto, #EDE7E0);
            font-family: 'Space Grotesk', sans-serif;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 9px;
            border-radius: 999px;
            cursor: pointer;
            opacity: 0.72;
            transition: background 0.2s, color 0.2s, opacity 0.2s;
        }
        .kixuz-oc-ic-opt.active {
            background: var(--acento, #2DD4C4);
            color: #150A24;
            opacity: 1;
        }
        .kixuz-muro-post-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 8px;
        }
        .kixuz-kix-btn {
            background: rgba(108, 60, 224, 0.25);
            color: var(--texto, #EDE7E0);
            border: 1px solid rgba(45, 212, 196, 0.45);
            border-radius: 10px;
            padding: 6px 12px;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 12.5px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
        }
        .kixuz-kix-btn:hover {
            transform: translateY(-1px);
            border-color: var(--acento, #2DD4C4);
        }
        .kixuz-kix-btn.active {
            background: rgba(45, 212, 196, 0.22);
            color: var(--acento, #2DD4C4);
            border-color: var(--acento, #2DD4C4);
        }
        .kixuz-kix-btn.active svg {
            color: #ff7b39;
        }
        .kixuz-comments-wrap {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(108, 60, 224, 0.25);
        }
        .kixuz-comment-card {
            background: rgba(21, 10, 36, 0.62);
            border: 1px solid rgba(108, 60, 224, 0.3);
            border-radius: 10px;
            padding: 9px 11px;
            font-size: 13.5px;
        }
        html[data-theme="light"] .kixuz-comment-card {
            background: rgba(244, 239, 234, 0.9);
            color: #150A24;
        }
        .kixuz-comment-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 4px;
            flex-wrap: wrap;
        }
        .kixuz-comment-author {
            font-weight: 700;
            font-size: 12.5px;
            color: var(--acento, #2DD4C4);
            text-decoration: none;
        }
        .kixuz-comment-btns {
            display: inline-flex;
            gap: 5px;
        }
        .kixuz-mini-action {
            background: rgba(108, 60, 224, 0.22);
            color: var(--texto, #EDE7E0);
            border: 1px solid rgba(108, 60, 224, 0.45);
            border-radius: 7px;
            padding: 2px 7px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
        }
        .kixuz-mini-action.danger {
            background: rgba(224, 60, 108, 0.2);
            color: #ff9bb4;
            border-color: rgba(224, 60, 108, 0.5);
        }
        .kixuz-comment-text {
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1.45;
        }
        .kixuz-mention-link {
            color: var(--acento, #2DD4C4);
            font-weight: 700;
            text-decoration: none;
        }
        .kixuz-mention-link:hover {
            text-decoration: underline;
        }
        .kixuz-comment-form {
            display: flex;
            gap: 8px;
            align-items: flex-end;
            margin-top: 4px;
            flex-wrap: wrap;
        }
        .kixuz-comment-textarea {
            flex: 1 1 220px;
            min-height: 38px;
            max-height: 140px;
            resize: none;
            overflow-y: auto;
            padding: 8px 11px;
            border-radius: 10px;
            border: 1px solid rgba(108, 60, 224, 0.45);
            background: rgba(0, 0, 0, 0.3);
            color: var(--texto, #EDE7E0);
            font-family: 'Inter', sans-serif;
            font-size: 13.5px;
            line-height: 1.4;
        }
        html[data-theme="light"] .kixuz-comment-textarea {
            background: rgba(255, 255, 255, 0.92);
            color: #150A24;
        }
        .kixuz-comment-send {
            background: var(--acento, #2DD4C4);
            color: #150A24;
            border: none;
            border-radius: 10px;
            padding: 8px 13px;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 12.5px;
            cursor: pointer;
            flex-shrink: 0;
        }
    `;
    if (!document.getElementById('kixuz-interacciones-muro-style')) {
        document.head.appendChild(style);
    }

    const FLAME_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c.6 3.2-1.2 5.3-3 7.1-1.5 1.5-2.5 3.1-2.5 5.2A5.5 5.5 0 0 0 12 19.8a5.5 5.5 0 0 0 5.5-5.5c0-2.6-1.4-4.7-3.2-6.5-.2 1.4-1 2.4-2.1 2.9.6-2.5.4-5.4-.2-8.7z"/></svg>`;

    function autoGrow(el) {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    }

    function obtenerActorActual() {
        const ac = window.KIXUZ_ACTIVE_CHAR;
        if (ac && String(ac.nombre || '').trim()) {
            const nombre = String(ac.nombre).trim();
            const handle = normHandle(ac.handle || nombre) || '@rol';
            return {
                nombre,
                handle,
                uid: window.KIXUZ_DB?.usuarioActual?.uid || window.KIXUZ_DB?.perfilCuenta?.uid || ''
            };
        }
        try {
            const act = JSON.parse(localStorage.getItem('kixuz_personaje_activo') || 'null');
            if (act && String(act.nombre || '').trim()) {
                const nombre = String(act.nombre).trim();
                const handle = normHandle(act.handle || nombre) || '@rol';
                return {
                    nombre,
                    handle,
                    uid: window.KIXUZ_DB?.usuarioActual?.uid || ''
                };
            }
        } catch {}
        const maestro = String(
            window.KIXUZ_DB?.perfilCuenta?.nombreMaestro ||
            window.KIXUZ_DB?.usuarioActual?.displayName ||
            ''
        ).trim();
        if (maestro) {
            return {
                nombre: maestro,
                handle: normHandle(maestro) || '@maestra',
                uid: window.KIXUZ_DB?.usuarioActual?.uid || window.KIXUZ_DB?.perfilCuenta?.uid || ''
            };
        }
        return { nombre: 'Invitado', handle: '@invitado', uid: '' };
    }

    function puedeGestionarComentario(comment) {
        if (!comment) return false;
        if (window.KIXUZ_DB?.puedeEliminar) {
            if (window.KIXUZ_DB.puedeEliminar(comment.autorUid, comment.autorHandle)) return true;
        }
        const yo = obtenerActorActual();
        if (comment.autorUid && yo.uid && String(comment.autorUid) === String(yo.uid)) {
            if (!comment.autorHandle || normHandle(comment.autorHandle) === normHandle(yo.handle)) return true;
        }
        return Boolean(comment.autorHandle && normHandle(comment.autorHandle) === normHandle(yo.handle));
    }

    function extraerMenciones(texto) {
        const matches = String(texto || '').match(/@[a-zA-Z0-9_.-]+/g) || [];
        return Array.from(new Set(matches.map(m => normHandle(m)).filter(Boolean)));
    }

    function formatearTextoConMenciones(texto) {
        const str = String(texto || '');
        const partes = str.split(/(@[a-zA-Z0-9_.-]+)/g);
        return partes.map(parte => {
            if (/^@[a-zA-Z0-9_.-]+$/.test(parte)) {
                const h = normHandle(parte);
                return `<a href="perfil.html?char=${encodeURIComponent(h)}" class="kixuz-mention-link">${esc(parte)}</a>`;
            }
            return esc(parte);
        }).join('');
    }

    function crearBadgeModo(modoRaw) {
        const m = String(modoRaw || 'IC').toUpperCase() === 'OC' ? 'OC' : 'IC';
        return `<span class="kixuz-mode-badge ${m.toLowerCase()}">${m}</span>`;
    }

    function crearSwitchOcIc(valorInicial = 'IC', onChange) {
        let actual = String(valorInicial || 'IC').toUpperCase() === 'OC' ? 'OC' : 'IC';
        const wrap = document.createElement('div');
        wrap.className = 'kixuz-oc-ic-switch';
        wrap.setAttribute('role', 'group');
        wrap.setAttribute('aria-label', 'Modo IC u OC');
        wrap.innerHTML = `
            <button type="button" class="kixuz-oc-ic-opt ${actual === 'IC' ? 'active' : ''}" data-mode="IC" title="En Personaje (In Character)">IC</button>
            <button type="button" class="kixuz-oc-ic-opt ${actual === 'OC' ? 'active' : ''}" data-mode="OC" title="Fuera de Personaje (Out of Character)">OC</button>
        `;
        wrap.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                actual = btn.dataset.mode;
                wrap.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.mode === actual));
                if (typeof onChange === 'function') onChange(actual);
            });
        });
        wrap.getMode = () => actual;
        return wrap;
    }

    function guardarNotificacionesLocales(lista) {
        try { localStorage.setItem(NOTIF_KEY, JSON.stringify(lista.slice(0, 120))); } catch {}
    }

    function leerNotificacionesLocales() {
        try {
            const arr = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch { return []; }
    }

    function emitirNotificaciones({ texto, post, tipo = 'comentario' }) {
        const actor = obtenerActorActual();
        const menciones = extraerMenciones(texto);
        const destinos = new Set(menciones);

        if (tipo === 'comentario' && post) {
            const autorPost = normHandle(post.autorHandle);
            const muroPost = normHandle(post.muroHandle);
            if (autorPost && autorPost !== normHandle(actor.handle)) destinos.add(autorPost);
            if (muroPost && muroPost !== normHandle(actor.handle)) destinos.add(muroPost);
        }

        if (!destinos.size) return;

        const actuales = leerNotificacionesLocales();
        destinos.forEach(destHandle => {
            if (destHandle === normHandle(actor.handle)) return;
            const esEtiquetaDirecta = menciones.includes(destHandle);
            const msg = esEtiquetaDirecta
                ? `${actor.nombre} (${actor.handle}) te etiquetó: "${String(texto).slice(0, 90)}"`
                : `${actor.nombre} (${actor.handle}) comentó en tu publicación/muro: "${String(texto).slice(0, 90)}"`;

            actuales.unshift({
                id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                paraHandle: destHandle,
                deHandle: actor.handle,
                deNombre: actor.nombre,
                tipo: esEtiquetaDirecta ? 'mencion' : tipo,
                mensaje: msg,
                leida: false,
                creadoEn: Date.now()
            });
        });

        guardarNotificacionesLocales(actuales);
        window.dispatchEvent(new CustomEvent('kixuz:notificaciones-actualizadas', { detail: { notificaciones: actuales } }));
    }

    function leerPosts() {
        try {
            const arr = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch { return []; }
    }

    function guardarPosts(arr) {
        try { localStorage.setItem(POSTS_KEY, JSON.stringify(arr.slice(0, 200))); } catch {}
    }

    function encontrarPostEnStorage(postData) {
        const posts = leerPosts();
        if (!postData) return { posts, index: -1, post: null };
        const idx = posts.findIndex(p => {
            if (postData.id && p.id && String(p.id) === String(postData.id)) return true;
            return p.contenido === postData.contenido && normHandle(p.autorHandle) === normHandle(postData.autorHandle);
        });
        return { posts, index: idx, post: idx >= 0 ? posts[idx] : null };
    }

    window.KIXUZ_INTERACCIONES = {
        obtenerActorActual,
        puedeGestionarComentario,
        extraerMenciones,
        formatearTextoConMenciones,
        crearBadgeModo,
        crearSwitchOcIc,
        emitirNotificaciones,
        async alternarKix(postData) {
            const actor = obtenerActorActual();
            const claveUsuario = actor.handle || actor.uid || 'anon';
            const { posts, index, post } = encontrarPostEnStorage(postData);
            const base = post || postData;
            if (!base) return 0;

            const dioKix = Array.isArray(base.kixPorUsuario) ? base.kixPorUsuario.map(norm) : [];
            const yaDio = dioKix.includes(norm(claveUsuario));
            const delta = yaDio ? -1 : 1;

            const nuevosKixUsers = yaDio
                ? dioKix.filter(x => x !== norm(claveUsuario))
                : [...dioKix, norm(claveUsuario)];

            const nuevoTotal = Math.max(0, Number(base.kixiz || 0) + delta);
            const actualizado = {
                ...base,
                kixiz: nuevoTotal,
                kixPorUsuario: nuevosKixUsers,
                dioKix: !yaDio
            };

            if (index >= 0) {
                posts[index] = actualizado;
                guardarPosts(posts);
            }
            if (window.KIXUZ_DB?.darKix && base.id && !String(base.id).startsWith('local_')) {
                try { await window.KIXUZ_DB.darKix(base.id, delta); } catch {}
            }
            if (!yaDio) {
                emitirNotificaciones({ texto: `dio Kix a tu publicación`, post: actualizado, tipo: 'kix' });
            }
            return nuevoTotal;
        },
        async agregarComentario(postData, textoRaw, modo = 'IC') {
            const texto = String(textoRaw || '').replace(/^\n+|\n+$/g, '');
            if (!texto.trim()) return null;

            const actor = obtenerActorActual();
            const comentario = {
                id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                autorNombre: actor.nombre,
                autorHandle: actor.handle,
                autorUid: actor.uid,
                modo: String(modo || 'IC').toUpperCase() === 'OC' ? 'OC' : 'IC',
                texto,
                creadoEn: Date.now()
            };

            const { posts, index, post } = encontrarPostEnStorage(postData);
            const base = post || postData;
            const respuestas = Array.isArray(base?.respuestas) ? [...base.respuestas, comentario] : [comentario];

            if (index >= 0) {
                posts[index] = { ...posts[index], respuestas };
                guardarPosts(posts);
            } else if (base) {
                posts.unshift({ ...base, respuestas });
                guardarPosts(posts);
            }
            if (window.KIXUZ_DB?.agregarRespuestaPost && base?.id && !String(base.id).startsWith('local_')) {
                try { await window.KIXUZ_DB.agregarRespuestaPost(base.id, comentario); } catch {}
            }

            emitirNotificaciones({ texto, post: base, tipo: 'comentario' });
            return { comentario, respuestas };
        },
        async editarComentario(postData, commentIdOrIndex, nuevoTextoRaw) {
            const nuevoTexto = String(nuevoTextoRaw || '').replace(/^\n+|\n+$/g, '');
            if (!nuevoTexto.trim()) return null;

            const { posts, index, post } = encontrarPostEnStorage(postData);
            const base = post || postData;
            const respuestas = Array.isArray(base?.respuestas) ? [...base.respuestas] : [];
            const targetIdx = typeof commentIdOrIndex === 'number'
                ? commentIdOrIndex
                : respuestas.findIndex(r => String(r.id) === String(commentIdOrIndex));

            if (targetIdx < 0 || targetIdx >= respuestas.length) return null;
            if (!puedeGestionarComentario(respuestas[targetIdx])) return null;

            respuestas[targetIdx] = {
                ...respuestas[targetIdx],
                texto: nuevoTexto,
                editadoEn: Date.now()
            };

            if (index >= 0) {
                posts[index] = { ...posts[index], respuestas };
                guardarPosts(posts);
            }
            if (window.KIXUZ_DB?.actualizarRespuestasPost && base?.id && !String(base.id).startsWith('local_')) {
                try { await window.KIXUZ_DB.actualizarRespuestasPost(base.id, respuestas); } catch {}
            }
            return respuestas;
        },
        async eliminarComentario(postData, commentIdOrIndex) {
            const { posts, index, post } = encontrarPostEnStorage(postData);
            const base = post || postData;
            const respuestas = Array.isArray(base?.respuestas) ? [...base.respuestas] : [];
            const targetIdx = typeof commentIdOrIndex === 'number'
                ? commentIdOrIndex
                : respuestas.findIndex(r => String(r.id) === String(commentIdOrIndex));

            if (targetIdx < 0 || targetIdx >= respuestas.length) return null;
            if (!puedeGestionarComentario(respuestas[targetIdx])) return null;

            respuestas.splice(targetIdx, 1);

            if (index >= 0) {
                posts[index] = { ...posts[index], respuestas };
                guardarPosts(posts);
            }
            if (window.KIXUZ_DB?.actualizarRespuestasPost && base?.id && !String(base.id).startsWith('local_')) {
                try { await window.KIXUZ_DB.actualizarRespuestasPost(base.id, respuestas); } catch {}
            }
            return respuestas;
        },
        montarBloqueInteracciones(contenedor, postObj, onCambio) {
            if (!contenedor || !postObj) return;
            contenedor.innerHTML = '';

            const kixCount = Number(postObj.kixiz || 0);
            const kixLabel = kixCount === 1 ? 'Kix' : 'Kixiz';
            const actor = obtenerActorActual();
            const yaDioKix = Boolean(
                postObj.dioKix ||
                (Array.isArray(postObj.kixPorUsuario) && postObj.kixPorUsuario.map(norm).includes(norm(actor.handle)))
            );
            const respuestas = Array.isArray(postObj.respuestas) ? postObj.respuestas : [];

            const actionsRow = document.createElement('div');
            actionsRow.className = 'kixuz-muro-post-actions';
            actionsRow.innerHTML = `
                <button type="button" class="kixuz-kix-btn ${yaDioKix ? 'active' : ''}">
                    ${FLAME_SVG}
                    <span>${esc(kixLabel)} (${kixCount})</span>
                </button>
                <span style="font-size:12px; opacity:0.75;">${respuestas.length} comentario(s)</span>
            `;

            actionsRow.querySelector('.kixuz-kix-btn').addEventListener('click', async () => {
                const total = await window.KIXUZ_INTERACCIONES.alternarKix(postObj);
                postObj.kixiz = total;
                postObj.dioKix = !yaDioKix;
                if (typeof onCambio === 'function') onCambio(postObj);
                else window.KIXUZ_INTERACCIONES.montarBloqueInteracciones(contenedor, postObj, onCambio);
            });

            const commentsWrap = document.createElement('div');
            commentsWrap.className = 'kixuz-comments-wrap';

            respuestas.forEach((r, idx) => {
                const card = document.createElement('div');
                card.className = 'kixuz-comment-card';
                const canManage = puedeGestionarComentario(r);
                const linkHref = `perfil.html?char=${encodeURIComponent(r.autorHandle || r.autorNombre || '')}`;
                const badgeModo = crearBadgeModo(r.modo || 'IC');

                card.innerHTML = `
                    <div class="kixuz-comment-top">
                        <div style="display:inline-flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            ${badgeModo}
                            <a href="${linkHref}" class="kixuz-comment-author">
                                ${esc(r.autorNombre || 'Personaje')} <span style="opacity:0.7; font-weight:500;">${esc(r.autorHandle || '')}</span>
                            </a>
                        </div>
                        ${canManage ? `
                            <div class="kixuz-comment-btns">
                                <button type="button" class="kixuz-mini-action btn-edit-c">Editar</button>
                                <button type="button" class="kixuz-mini-action danger btn-del-c">Borrar</button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="kixuz-comment-text">${formatearTextoConMenciones(r.texto || '')}${r.editadoEn ? ' <span style="font-size:11px; opacity:0.65;">(editado)</span>' : ''}</div>
                `;

                if (canManage) {
                    const editBtn = card.querySelector('.btn-edit-c');
                    const delBtn = card.querySelector('.btn-del-c');
                    const textDiv = card.querySelector('.kixuz-comment-text');

                    editBtn.addEventListener('click', () => {
                        if (card.querySelector('.kixuz-edit-comment-box')) return;
                        const editBox = document.createElement('div');
                        editBox.className = 'kixuz-edit-comment-box';
                        editBox.style.cssText = 'display:flex; flex-direction:column; gap:6px; margin-top:6px;';
                        editBox.innerHTML = `
                            <textarea class="kixuz-comment-textarea" rows="2">${esc(r.texto || '')}</textarea>
                            <div style="display:flex; justify-content:flex-end; gap:6px;">
                                <button type="button" class="kixuz-mini-action btn-cancel-edit">Cancelar</button>
                                <button type="button" class="kixuz-comment-send btn-save-edit" style="padding:5px 10px; font-size:11.5px;">Guardar</button>
                            </div>
                        `;
                        const editTa = editBox.querySelector('textarea');
                        autoGrow(editTa);
                        editTa.addEventListener('input', () => autoGrow(editTa));
                        editTa.addEventListener('keydown', ev => {
                            if (ev.key === 'Enter' && !ev.shiftKey) {
                                ev.preventDefault();
                                editBox.querySelector('.btn-save-edit').click();
                            }
                        });
                        editBox.querySelector('.btn-cancel-edit').addEventListener('click', () => editBox.remove());
                        editBox.querySelector('.btn-save-edit').addEventListener('click', async () => {
                            const updated = await window.KIXUZ_INTERACCIONES.editarComentario(postObj, r.id ?? idx, editTa.value);
                            if (updated) {
                                postObj.respuestas = updated;
                                if (typeof onCambio === 'function') onCambio(postObj);
                                else window.KIXUZ_INTERACCIONES.montarBloqueInteracciones(contenedor, postObj, onCambio);
                            }
                        });
                        textDiv.insertAdjacentElement('afterend', editBox);
                        editTa.focus();
                    });

                    delBtn.addEventListener('click', async () => {
                        const updated = await window.KIXUZ_INTERACCIONES.eliminarComentario(postObj, r.id ?? idx);
                        if (updated) {
                            postObj.respuestas = updated;
                            if (typeof onCambio === 'function') onCambio(postObj);
                            else window.KIXUZ_INTERACCIONES.montarBloqueInteracciones(contenedor, postObj, onCambio);
                        }
                    });
                }

                commentsWrap.appendChild(card);
            });

            const form = document.createElement('form');
            form.className = 'kixuz-comment-form';
            const switchCommentMode = crearSwitchOcIc('IC');
            form.appendChild(switchCommentMode);

            const ta = document.createElement('textarea');
            ta.className = 'kixuz-comment-textarea';
            ta.rows = 1;
            ta.placeholder = 'Comentar o etiquetar @usuario... (Shift + Enter: salto de línea)';

            const btnSend = document.createElement('button');
            btnSend.type = 'submit';
            btnSend.className = 'kixuz-comment-send';
            btnSend.textContent = 'Comentar';

            form.appendChild(ta);
            form.appendChild(btnSend);

            ta.addEventListener('input', () => autoGrow(ta));
            ta.addEventListener('keydown', ev => {
                if (ev.key === 'Enter' && ev.shiftKey) {
                    setTimeout(() => autoGrow(ta), 0);
                    return;
                }
                if (ev.key === 'Enter' && !ev.shiftKey) {
                    ev.preventDefault();
                    form.requestSubmit();
                }
            });

            form.addEventListener('submit', async ev => {
                ev.preventDefault();
                const res = await window.KIXUZ_INTERACCIONES.agregarComentario(postObj, ta.value, switchCommentMode.getMode());
                if (res) {
                    postObj.respuestas = res.respuestas;
                    ta.value = '';
                    ta.style.height = '38px';
                    if (typeof onCambio === 'function') onCambio(postObj);
                    else window.KIXUZ_INTERACCIONES.montarBloqueInteracciones(contenedor, postObj, onCambio);
                }
            });

            commentsWrap.appendChild(form);
            contenedor.appendChild(actionsRow);
            contenedor.appendChild(commentsWrap);
        }
    };
})();

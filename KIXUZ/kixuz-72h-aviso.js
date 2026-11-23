(() => {
    const PINNED_72H_MS = 72 * 60 * 60 * 1000;
    const APPROVED_KEY = "kixuz_universos_aprobados_ids_v1";

    const nlStyle = document.createElement("style");
    nlStyle.id = "kixuz-multiline-global-style";
    nlStyle.textContent = `
        .post-content, .post-body, .comment-text, .comentario-texto, .respuesta-texto, .reply-text, .post p, .comment p {
            white-space: pre-wrap;
            word-break: break-word;
        }
        textarea.kixuz-multiline-comment {
            resize: none;
            overflow-y: hidden;
            min-height: 38px;
            max-height: 140px;
            line-height: 1.4;
            font-family: inherit;
            box-sizing: border-box;
        }
    `;
    document.head.appendChild(nlStyle);

    function autoGrowTextarea(el) {
        if (!el || el.tagName !== "TEXTAREA") return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 150) + "px";
    }

    function habilitarMultilineaEnComentariosYPosts() {
        const candidatos = document.querySelectorAll(
            "input[type=\"text\"][placeholder*=\"coment\" i], " +
            "input[type=\"text\"][placeholder*=\"respon\" i], " +
            "input[type=\"text\"][placeholder*=\"escrib\" i], " +
            "input.comment-input, input.reply-input, input[data-comment-input]"
        );

        candidatos.forEach(inp => {
            if (inp.closest("header") || inp.id === "kixuzChatSearch" || inp.id === "kixuzUserLookupInput") return;
            if (inp.dataset.kixuzUpgraded === "1") return;

            const ta = document.createElement("textarea");
            ta.rows = 1;
            Array.from(inp.attributes).forEach(attr => {
                if (attr.name !== "type") {
                    ta.setAttribute(attr.name, attr.value);
                }
            });
            ta.value = inp.value;
            ta.classList.add("kixuz-multiline-comment");
            ta.dataset.kixuzUpgraded = "1";
            if (!ta.placeholder.includes("Shift")) {
                ta.placeholder = (ta.placeholder || "Escribe un comentario...") + " (Shift + Enter: salto de línea)";
            }

            ta.addEventListener("input", () => autoGrowTextarea(ta));
            ta.addEventListener("keydown", e => {
                if (e.key === "Enter" && e.shiftKey) {
                    setTimeout(() => autoGrowTextarea(ta), 0);
                    return;
                }
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const form = ta.closest("form");
                    if (form) {
                        form.requestSubmit();
                        return;
                    }
                    const sendBtn = ta.parentElement?.querySelector("button[type=\"submit\"], button");
                    if (sendBtn) sendBtn.click();
                }
            });

            inp.replaceWith(ta);
        });

        document.querySelectorAll("textarea").forEach(ta => {
            if (ta.dataset.kixuzShiftEnterBound === "1") return;
            ta.dataset.kixuzShiftEnterBound = "1";
            ta.addEventListener("input", () => autoGrowTextarea(ta));
            ta.addEventListener("keydown", e => {
                if (e.key === "Enter" && e.shiftKey) {
                    e.stopPropagation();
                    setTimeout(() => autoGrowTextarea(ta), 0);
                }
            });
        });
    }

    function leerAprobados() {
        try {
            const raw = JSON.parse(localStorage.getItem(APPROVED_KEY) || "[]");
            return new Set(Array.isArray(raw) ? raw.map(String) : []);
        } catch {
            return new Set();
        }
    }

    function marcarAprobado(id) {
        if (!id) return;
        try {
            const s = leerAprobados();
            s.add(String(id));
            localStorage.setItem(APPROVED_KEY, JSON.stringify(Array.from(s)));
        } catch {}
    }

    function limpiarPendientesAprobados() {
        const aprobados = leerAprobados();
        if (!aprobados.size) return;

        document.querySelectorAll("[data-solicitud-id], [data-id], .solicitud-universo-item, .pendiente-item").forEach(el => {
            const id = el.getAttribute("data-solicitud-id") || el.getAttribute("data-id") || "";
            if (id && aprobados.has(String(id))) {
                el.remove();
            }
        });
    }

    document.addEventListener("click", e => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const txt = (btn.textContent || "").trim().toLowerCase();
        if (txt.includes("aprobar") || txt.includes("aceptar")) {
            const card = btn.closest("[data-solicitud-id], [data-id], .solicitud-universo-item, .pendiente-item, .card, article, div");
            const solId = card?.getAttribute("data-solicitud-id") || card?.getAttribute("data-id") || "";
            if (solId) {
                marcarAprobado(solId);
                if (card && card !== document.body && card.parentElement && !card.contains(document.querySelector("#feedPosts"))) {
                    setTimeout(() => card.remove(), 60);
                }
            }
            setTimeout(limpiarPendientesAprobados, 120);
        }
    });

    function aplicarRegla72hEnMuro() {
        const esPerfil = /perfil\.html/i.test(window.location.pathname || "");
        const params = new URLSearchParams(window.location.search || "");
        const charParam = (params.get("char") || "").toLowerCase();
        const esPerfilKixuz = esPerfil && (charParam === "@kixuz" || charParam === "kixuz");

        const feed = document.getElementById("feedPosts") || document.getElementById("profileFeed");
        if (!feed) return;

        const ahora = Date.now();
        const cards = Array.from(feed.querySelectorAll(".post, .post-card, article"));
        const vigentes = [];

        cards.forEach(card => {
            const es72h = card.dataset.esAviso72h === "1" || card.dataset.pin72h === "1";
            if (!es72h) return;

            const inicioMs = Number(card.dataset.pinInicioMs || 0);
            const desfijado = card.dataset.desfijadoManual === "1";
            const vigente = !desfijado && inicioMs > 0 && (ahora - inicioMs) < PINNED_72H_MS;

            if (!vigente && !esPerfilKixuz) {
                card.style.display = "none";
            } else if (vigente && !esPerfilKixuz) {
                vigentes.push(card);
            }
        });

        vigentes.sort((a, b) => Number(b.dataset.pinInicioMs || 0) - Number(a.dataset.pinInicioMs || 0));
        vigentes.forEach(c => feed.prepend(c));
    }

    window.addEventListener("DOMContentLoaded", () => {
        habilitarMultilineaEnComentariosYPosts();
        limpiarPendientesAprobados();
        aplicarRegla72hEnMuro();

        const obs = new MutationObserver(() => {
            habilitarMultilineaEnComentariosYPosts();
        });
        obs.observe(document.body, { childList: true, subtree: true });
    });

    window.addEventListener("kixuz:universos-actualizados", limpiarPendientesAprobados);

    setInterval(() => {
        limpiarPendientesAprobados();
        aplicarRegla72hEnMuro();
    }, 5000);
})();

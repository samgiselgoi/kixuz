(() => {
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

    window.addEventListener("DOMContentLoaded", () => {
        habilitarMultilineaEnComentariosYPosts();
        const obs = new MutationObserver(() => habilitarMultilineaEnComentariosYPosts());
        obs.observe(document.body, { childList: true, subtree: true });
    });
})();

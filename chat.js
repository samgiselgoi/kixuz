(() => {
    document.querySelectorAll('.chat-trigger, .chat-sidebar, .kixuz-chat-trigger, .kixuz-chat-sidebar, .kixuz-chat-modal-backdrop').forEach(el => el.remove());

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
        .kixuz-chat-modal-actions { display: flex; justify-content

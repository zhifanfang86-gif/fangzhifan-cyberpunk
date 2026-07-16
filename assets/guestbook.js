(function() {
    'use strict';
    var STORAGE_KEY = 'fz_messages';
    var CLOUD_API = '/messages';
    var CONTACT_API = '/api/contact';

    function showToast(msg, type) {
        var t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.className = 'toast ' + (type === 'ok' ? 'ok' : 'err');
        requestAnimationFrame(function() { t.classList.add('show'); });
        setTimeout(function() { t.classList.remove('show'); }, 3000);
    }

    function escapeHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function renderMessages(list) {
        var c = document.getElementById('messages');
        if (!c) return;
        if (!list || !list.length) {
            c.innerHTML = '';
            return;
        }
        c.innerHTML = list.map(function(m) {
            return '<div class="message">' +
                '<div class="message-header">' +
                    '<span class="message-author">' + escapeHtml(m.name) + '</span>' +
                    '<span class="message-time">' + (m.time || '') + '</span>' +
                '</div>' +
                (m.email ? '<div class="message-email">' + escapeHtml(m.email) + '</div>' : '') +
                '<div class="message-body">' + escapeHtml(m.message) + '</div>' +
            '</div>';
        }).join('');
    }

    async function loadFromCloud() {
        try {
            var resp = await fetch(CLOUD_API, { method: 'GET' });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            var result = await resp.json();
            if (result.success && Array.isArray(result.data)) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
                renderMessages(result.data);
                return true;
            }
        } catch (e) {
            console.warn('[Guestbook] Cloud load failed, fallback to local:', e.message);
        }
        return false;
    }

    function loadFromLocal() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var list = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(list)) list = [];
            if (list.length === 0) {
                list = [{
                    name: '小山',
                    email: '',
                    message: '13057357652',
                    time: '2026-07-14 10:07:56',
                    timestamp: 1783994875884
                }];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            }
            renderMessages(list);
        } catch (e) {
            renderMessages([]);
        }
    }

    async function initLoad() {
        var cloudOk = await loadFromCloud();
        if (!cloudOk) {
            loadFromLocal();
        }
    }

    async function sendEmail(name, email, message) {
        try {
            var resp = await fetch(CONTACT_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, email: email || '', message: message })
            });
            var result = await resp.json().catch(function() { return {}; });
            if (resp.ok && result.success) {
                console.log('[Guestbook] Email notification sent:', result.id);
                return true;
            } else {
                console.warn('[Guestbook] Email notification failed:', result.error || resp.status);
                return false;
            }
        } catch (e) {
            console.warn('[Guestbook] Email notification error:', e.message);
            return false;
        }
    }

    async function saveMessage(name, message, email) {
        var entry = {
            name: name.substring(0, 50),
            email: email ? email.substring(0, 100) : '',
            message: message.substring(0, 500),
            time: new Date().toLocaleString('zh-CN'),
            timestamp: Date.now()
        };

        try {
            var resp = await fetch(CLOUD_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: entry.name, email: entry.email, message: entry.message })
            });
            if (resp.ok) {
                var result = await resp.json();
                if (result.success && Array.isArray(result.data)) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
                    renderMessages(result.data);
                    showToast('已投递云端', 'ok');
                    sendEmail(entry.name, entry.email, entry.message);
                    return;
                }
            }
        } catch (e) {
            console.warn('[Guestbook] Cloud save failed:', e.message);
        }

        try {
            var raw = localStorage.getItem(STORAGE_KEY) || '[]';
            var list = JSON.parse(raw);
            list.unshift(entry);
            var trimmed = list.slice(0, 50);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
            renderMessages(trimmed);
            showToast('已保存到本地（云端暂不可用）', 'ok');
            sendEmail(entry.name, entry.email, entry.message);
        } catch (e) {
            showToast('保存失败', 'err');
        }
    }

    function init() {
        var form = document.getElementById('guestbook-form');
        if (!form) return;

        initLoad();

        // 每10秒轮询刷新留言列表（实时更新）
        setInterval(function() {
            loadFromCloud().catch(function(e) {
                console.warn('[Guestbook] Polling refresh failed:', e.message);
            });
        }, 10000);

        // 页面可见时立即刷新
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                loadFromCloud().catch(function() {});
            }
        });

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var nameEl = document.getElementById('name');
            var emailEl = document.getElementById('email');
            var msgEl = document.getElementById('message');
            if (!nameEl || !msgEl) return;

            var name = nameEl.value.trim();
            var email = emailEl ? emailEl.value.trim() : '';
            var message = msgEl.value.trim();
            if (!name || !message) {
                showToast('请填写称呼和留言', 'err');
                return;
            }

            saveMessage(name, message, email);
            form.reset();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

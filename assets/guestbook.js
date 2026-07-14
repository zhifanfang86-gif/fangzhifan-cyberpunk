(function() {
    'use strict';
    var STORAGE_KEY = 'fz_messages';

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
                '<div class="message-body">' + escapeHtml(m.message) + '</div>' +
            '</div>';
        }).join('');
    }

    function loadMessages() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var list = raw ? JSON.parse(raw) : [];
            if (!list || list.length === 0) {
                list = [{
                    name: '小山',
                    message: '13057357652',
                    time: new Date().toLocaleString('zh-CN'),
                    timestamp: Date.now()
                }];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            }
            renderMessages(list);
        } catch (e) {
            renderMessages([]);
        }
    }

    function saveMessage(name, message) {
        var entry = {
            name: name.substring(0, 50),
            message: message.substring(0, 500),
            time: new Date().toLocaleString('zh-CN'),
            timestamp: Date.now()
        };
        try {
            var raw = localStorage.getItem(STORAGE_KEY) || '[]';
            var list = JSON.parse(raw);
            list.unshift(entry);
            var trimmed = list.slice(0, 50);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
            renderMessages(trimmed);
            showToast('已保存到本地', 'ok');
        } catch (e) {
            showToast('保存失败', 'err');
        }
    }

    function init() {
        var form = document.getElementById('guestbook-form');
        if (!form) return;

        loadMessages();

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var nameEl = document.getElementById('name');
            var msgEl = document.getElementById('message');
            if (!nameEl || !msgEl) return;

            var name = nameEl.value.trim();
            var message = msgEl.value.trim();
            if (!name || !message) {
                showToast('请填写称呼和留言', 'err');
                return;
            }

            saveMessage(name, message);
            form.reset();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
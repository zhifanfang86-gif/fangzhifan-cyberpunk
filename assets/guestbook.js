const API_URL = 'https://fangzhifan-guestbook.zhifanfang86.workers.dev';

function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + (type === 'ok' ? 'ok' : 'err');
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => t.classList.remove('show'), 3000);
}

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function renderMessages(list) {
    const c = document.getElementById('messages');
    if (!list.length) {
        c.innerHTML = '<div class="empty">暂无尺牍，虚位以待</div>';
        return;
    }
    c.innerHTML = list.map(m => `
        <div class="message">
            <div class="message-header">
                <span class="message-author">${escapeHtml(m.name)}</span>
                <span class="message-time">${m.time || ''}</span>
            </div>
            <div class="message-body">${escapeHtml(m.message)}</div>
        </div>
    `).join('');
}

async function loadMessages() {
    try {
        const r = await fetch(`${API_URL}/messages`, { cache: 'no-store' });
        if (r.ok) {
            const data = await r.json();
            renderMessages(data);
            return;
        }
    } catch (e) {}
    const local = JSON.parse(localStorage.getItem('fz_messages') || '[]');
    renderMessages(local);
}

document.getElementById('guestbook-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const message = document.getElementById('message').value.trim();
    if (!name || !message) return;

    const entry = { name, message, time: new Date().toLocaleString('zh-CN') };

    try {
        const r = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        if (r.ok) {
            showToast('已投递', 'ok');
            loadMessages();
        } else {
            throw new Error('API error');
        }
    } catch (e) {
        const local = JSON.parse(localStorage.getItem('fz_messages') || '[]');
        local.unshift(entry);
        localStorage.setItem('fz_messages', JSON.stringify(local.slice(0, 50)));
        showToast('已本地保存', 'ok');
        renderMessages(local);
    }
    e.target.reset();
});

loadMessages();

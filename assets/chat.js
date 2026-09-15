/* 对话页 /chat/ —— 前端逻辑：会话令牌、流式接收、停止/重试/复制、本机保留、限速倒计时 */
(() => {
  'use strict';

  const root = document.querySelector('[data-chat]');
  if (!root) return;

  const API = '/api/chat';
  const SESSION_API = '/api/chat/session';
  const STORE_KEY = 'evafang-chat-v1';
  const MAX_CHARS = 2000;
  const MAX_TURNS = 12;

  const $ = (sel) => root.querySelector(sel);
  const logEl = $('[data-log]');
  const emptyEl = $('[data-empty]');
  const suggestEl = $('[data-suggest]');
  const formEl = $('[data-form]');
  const inputEl = $('[data-input]');
  const hpEl = $('[data-hp]');
  const sendBtn = $('[data-send]');
  const stopBtn = $('[data-stop]');
  const clearBtn = $('[data-clear]');
  const errorEl = $('[data-error]');
  const countEl = $('[data-count]');
  const dotEl = $('[data-dot]');
  const statusTextEl = $('[data-status-text]');

  /** @type {{role:'user'|'assistant', content:string, failed?:boolean}[]} */
  let messages = [];
  let token = null;
  let mock = false;
  let busy = false;
  let controller = null;
  let cooldownTimer = null;
  let cooldownUntil = 0;
  let sessionTimer = null;

  // ---------- 状态与提示 ----------
  function setStatus(kind, text) {
    dotEl.className = 'chat-dot' + (kind ? ' is-' + kind : '');
    statusTextEl.textContent = text;
  }

  function showError(text, html) {
    if (!text && !html) { errorEl.hidden = true; errorEl.textContent = ''; return; }
    errorEl.hidden = false;
    if (html) errorEl.innerHTML = html; else errorEl.textContent = text;
  }

  function updateSendState() {
    const hasText = inputEl.value.trim().length > 0;
    const inCooldown = Date.now() < cooldownUntil;
    sendBtn.disabled = busy || !hasText || !token || inCooldown;
    stopBtn.hidden = !busy;
    clearBtn.hidden = messages.length === 0 || busy;
    inputEl.disabled = busy;
  }

  function updateCount() {
    const n = inputEl.value.length;
    countEl.textContent = n + ' / ' + MAX_CHARS;
    countEl.classList.toggle('is-near', n > MAX_CHARS * 0.9);
  }

  function autosize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 180) + 'px';
    inputEl.style.overflowY = inputEl.scrollHeight > 180 ? 'auto' : 'hidden';
  }

  function startCooldown(seconds) {
    cooldownUntil = Date.now() + seconds * 1000;
    clearInterval(cooldownTimer);
    const tick = () => {
      const left = Math.ceil((cooldownUntil - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(cooldownTimer);
        showError('');
        updateSendState();
        return;
      }
      showError(formatCooldown(left));
      updateSendState();
    };
    tick();
    cooldownTimer = setInterval(tick, 1000);
  }

  function formatCooldown(s) {
    if (s >= 3600) return '今天的额度已用完，请 ' + Math.ceil(s / 3600) + ' 小时后再试';
    if (s >= 60) return '提问过于频繁，请 ' + Math.ceil(s / 60) + ' 分钟后再试';
    return '提问过于频繁，' + s + ' 秒后可以继续';
  }

  // ---------- 本机保留（sessionStorage，关闭标签页即清除） ----------
  function persist() {
    try {
      const keep = messages.filter((m) => !m.failed).slice(-MAX_TURNS * 2);
      if (keep.length) sessionStorage.setItem(STORE_KEY, JSON.stringify(keep));
      else sessionStorage.removeItem(STORE_KEY);
    } catch (e) { /* 隐私模式等情况下忽略 */ }
  }

  function restore() {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        messages = parsed.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
      }
    } catch (e) { messages = []; }
  }

  // ---------- 极简且安全的 Markdown 渲染（先转义，再只产出白名单标签） ----------
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function inline(text) {
    return text
      .replace(/`([^`\n]+)`/g, (_, c) => '<code>' + c + '</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_, label, href) => {
        const external = /^https?:/i.test(href);
        return '<a href="' + href + '"' + (external ? ' target="_blank" rel="noopener noreferrer nofollow"' : '') + '>' + label + '</a>';
      });
  }

  function renderMarkdown(src) {
    const escaped = escapeHtml(src.replace(/\r\n?/g, '\n'));
    const parts = escaped.split(/```[^\n]*\n?/);
    let html = '';
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) { html += '<pre><code>' + parts[i].replace(/\n$/, '') + '</code></pre>'; continue; }
      const blocks = parts[i].split(/\n{2,}/);
      for (const block of blocks) {
        const lines = block.split('\n').filter((l) => l.trim() !== '');
        if (!lines.length) continue;
        if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
          html += '<ul>' + lines.map((l) => '<li>' + inline(l.replace(/^\s*[-*•]\s+/, '')) + '</li>').join('') + '</ul>';
        } else if (lines.every((l) => /^\s*\d+[.、)]\s+/.test(l))) {
          html += '<ol>' + lines.map((l) => '<li>' + inline(l.replace(/^\s*\d+[.、)]\s+/, '')) + '</li>').join('') + '</ol>';
        } else if (lines.length === 1 && /^#{1,3}\s+/.test(lines[0])) {
          const level = lines[0].match(/^(#{1,3})/)[1].length;
          html += '<h' + level + '>' + inline(lines[0].replace(/^#{1,3}\s+/, '')) + '</h' + level + '>';
        } else {
          html += '<p>' + lines.map(inline).join('<br>') + '</p>';
        }
      }
    }
    return html;
  }

  // ---------- 渲染 ----------
  function messageNode(m, index) {
    const el = document.createElement('div');
    el.className = 'chat-msg is-' + m.role + (m.failed ? ' is-failed' : '');
    el.dataset.index = String(index);
    const mark = document.createElement('span');
    mark.className = 'chat-msg-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = m.role === 'user' ? '你' : 'F';
    const body = document.createElement('div');
    body.className = 'chat-msg-body';
    if (m.role === 'user') body.textContent = m.content; else body.innerHTML = renderMarkdown(m.content);
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = m.role === 'user' ? '你说：' : '助手回复：';
    el.append(mark, body);
    body.prepend(sr);

    if (m.role === 'assistant' && !m.streaming) {
      const tools = document.createElement('div');
      tools.className = 'chat-msg-tools';
      if (m.failed) {
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = 'RETRY';
        retry.setAttribute('aria-label', '重试上一条提问');
        retry.addEventListener('click', () => retryFrom(index));
        tools.append(retry);
      } else if (m.content) {
        const copy = document.createElement('button');
        copy.type = 'button';
        copy.textContent = 'COPY';
        copy.setAttribute('aria-label', '复制这条回复');
        copy.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(m.content);
            copy.textContent = 'COPIED';
            setTimeout(() => { copy.textContent = 'COPY'; }, 1400);
          } catch (e) { copy.textContent = 'FAILED'; }
        });
        tools.append(copy);
      }
      body.append(tools);
    }
    return el;
  }

  function renderAll() {
    logEl.querySelectorAll('.chat-msg').forEach((n) => n.remove());
    emptyEl.hidden = messages.length > 0;
    messages.forEach((m, i) => logEl.append(messageNode(m, i)));
    scrollToEnd(true);
    updateSendState();
  }

  function scrollToEnd(force) {
    const nearBottom = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 80;
    if (force || nearBottom) logEl.scrollTop = logEl.scrollHeight;
  }

  // ---------- 会话令牌 ----------
  async function fetchSession(signal) {
    clearTimeout(sessionTimer);
    setStatus('', '正在连接…');
    try {
      const resp = await fetch(SESSION_API, { method: 'GET', cache: 'no-store', credentials: 'same-origin', signal });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.token) throw new Error(data.error || 'HTTP ' + resp.status);
      token = data.token;
      mock = !!data.mock;
      setStatus(mock ? 'mock' : 'online', mock ? '演示模式 · 尚未接入模型' : 'AI 助手 · 在线');
      showError('');
      // 令牌到期前自动续期
      const ttl = Math.max(60, Number(data.ttl) || 1800);
      sessionTimer = setTimeout(() => fetchSession(), Math.max(30, ttl - 60) * 1000);
      return true;
    } catch (e) {
      token = null;
      setStatus('error', 'OFFLINE');
      showError('', '对话服务暂时不可用。<a href="#" data-reconnect>重新连接</a>，或改用 <a href="/#guestbook">留言板</a>。');
      errorEl.querySelector('[data-reconnect]')?.addEventListener('click', (ev) => { ev.preventDefault(); fetchSession(); });
      return false;
    } finally {
      updateSendState();
    }
  }

  // ---------- 发送与流式接收 ----------
  async function send(text) {
    const content = text.trim();
    if (!content || busy || !token || Date.now() < cooldownUntil) return;
    if (content.length > MAX_CHARS) { showError('单条消息最多 ' + MAX_CHARS + ' 字'); return; }

    showError('');
    messages.push({ role: 'user', content });
    const reply = { role: 'assistant', content: '', streaming: true };
    messages.push(reply);
    renderAll();
    inputEl.value = '';
    autosize();
    updateCount();
    await stream(reply, false);
  }

  async function retryFrom(index) {
    if (busy || Date.now() < cooldownUntil) return;
    const failed = messages[index];
    if (!failed || failed.role !== 'assistant' || !failed.failed) return;
    messages = messages.slice(0, index + 1);
    failed.failed = false;
    failed.content = '';
    failed.streaming = true;
    renderAll();
    await stream(failed, true);
  }

  async function stream(reply, isRetry) {
    busy = true;
    controller = new AbortController();
    updateSendState();

    const history = messages
      .filter((m) => !m.streaming && !m.failed && m.content)
      .slice(-MAX_TURNS);

    const bodyEl = () => logEl.querySelector('.chat-msg[data-index="' + messages.indexOf(reply) + '"] .chat-msg-body');
    const paint = () => {
      const el = bodyEl();
      if (!el) return;
      el.innerHTML = renderMarkdown(reply.content) + (reply.streaming ? '<span class="chat-cursor" aria-hidden="true"></span>' : '');
      scrollToEnd(false);
    };
    paint();

    let ok = false;
    let userError = '';
    try {
      let resp;
      for (let attempt = 0; attempt < 2; attempt++) {
        resp = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Chat-Token': token },
        body: JSON.stringify({ messages: history, website: hpEl.value || '' }),
        signal: controller.signal,
        credentials: 'same-origin'
      });
        if (resp.status !== 401 || attempt === 1) break;
        await resp.body?.cancel();
        if (!(await fetchSession(controller.signal))) break;
        controller.signal.throwIfAborted();
      }

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          const wait = Number(data.retryAfter || resp.headers.get('Retry-After') || 30);
          startCooldown(wait);
        }
        userError = data.error || '请求失败（HTTP ' + resp.status + '）';
        throw new Error(userError);
      }

      if (!resp.body || !resp.headers.get('Content-Type')?.includes('text/event-stream')) throw new Error('Invalid stream');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;
      try { while (!done) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop();
        for (const ev of events) {
          const line = ev.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          let payload;
          try { payload = JSON.parse(line.slice(5).trim()); } catch (e) { continue; }
          if (payload.t) { reply.content += payload.t; paint(); }
          if (payload.error) { userError = payload.error; throw new Error(payload.error); }
          if (payload.done) { done = true; break; }
        }
      } } finally { await reader.cancel().catch(() => {}); }
      if (!done) throw new Error('Incomplete stream');
      ok = reply.content.trim().length > 0;
      if (!ok) userError = '模型没有返回内容，请重试';
    } catch (e) {
      if (e.name === 'AbortError') {
        ok = reply.content.trim().length > 0;
        if (!ok) userError = '已停止';
      } else if (!userError) {
        userError = '网络中断，请重试';
      }
    } finally {
      reply.streaming = false;
      if (!ok) {
        reply.failed = true;
        reply.content = userError || '出错了，请重试';
      }
      busy = false;
      controller = null;
      persist();
      renderAll();
      if (!ok && reply.content !== '已停止' && Date.now() >= cooldownUntil) showError(userError);
      if (!busy && !inputEl.disabled && window.matchMedia('(min-width: 851px)').matches) inputEl.focus();
    }
  }

  function stop() {
    if (controller) controller.abort();
  }

  function clearAll() {
    if (busy) return;
    messages = [];
    persist();
    renderAll();
    showError('');
    inputEl.focus();
  }

  // ---------- 事件 ----------
  formEl.addEventListener('submit', (ev) => {
    ev.preventDefault();
    send(inputEl.value);
  });
  inputEl.addEventListener('input', () => { autosize(); updateCount(); updateSendState(); });
  inputEl.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
      ev.preventDefault();
      if (!sendBtn.disabled) send(inputEl.value);
    }
  });
  stopBtn.addEventListener('click', stop);
  clearBtn.addEventListener('click', clearAll);
  suggestEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn || busy) return;
    if (!token) { inputEl.value = btn.textContent; autosize(); updateCount(); updateSendState(); return; }
    send(btn.textContent);
  });
  window.addEventListener('pagehide', () => { if (controller) controller.abort(); });

  // ---------- 启动 ----------
  restore();
  messages.forEach((m) => { m.streaming = false; });
  renderAll();
  updateCount();
  autosize();
  fetchSession();
})();

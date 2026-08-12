(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const menuButton = $('[data-menu-button]');
  const menu = $('[data-menu]');

  function closeMenu() {
    if (!menuButton || !menu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
  }
  menuButton?.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('open', !expanded);
  });
  $$('a[href^="#"]', menu).forEach(link => link.addEventListener('click', closeMenu));

  const backTop = $('[data-back-top]');
  addEventListener('scroll', () => backTop?.classList.toggle('visible', scrollY > 700), { passive: true });
  backTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .1, rootMargin: '0px 0px -24px' });
    revealItems.forEach(item => observer.observe(item));
  }

  $('[data-year]')?.append(String(new Date().getFullYear()));

  const topicSelect = $('select[name="topic"]');
  $$('[data-topic]').forEach(link => link.addEventListener('click', () => {
    if (topicSelect) topicSelect.value = link.dataset.topic;
    setTimeout(() => $('textarea[name="message"]')?.focus({ preventScroll: true }), 450);
  }));

  const dialog = $('[data-resource-dialog]');
  const resources = {
    brief: { kicker: 'PROJECT BRIEF / STARTER', title: '项目启动准备清单', body: '<p>一次有效的技术咨询，不需要完美需求文档；但越能说清以下事项，方案就越可靠。</p><ul><li>目标：希望改变什么，如何判断做成了？</li><li>现状：已有系统、数据、人员与依赖是什么？</li><li>边界：时间、预算、合规、部署环境有哪些限制？</li><li>优先级：最先必须解决的一个问题是什么？</li></ul><p>带着这些信息进入沟通，能显著减少无效的方案讨论。</p>' },
    ai: { kicker: 'LOCAL AI / DECISION FRAME', title: '本地 AI 的决策框架', body: '<p>是否本地化部署，不应只由模型大小决定。关键在于数据、使用方式和持续运行的成本。</p><ul><li>数据边界：哪些数据不应离开组织或个人控制范围？</li><li>任务形态：是问答检索、流程自动化，还是专业知识协作？</li><li>运行要求：并发、延迟、可用性与维护责任如何分配？</li><li>演进路径：模型、知识库与工作流未来怎样更新？</li></ul><p>先建立决策框架，再讨论模型和显卡，通常更节省成本。</p>' },
    security: { kicker: 'SECURITY / DELIVERY BASELINE', title: '安全与交付基础基线', body: '<p>安全和可靠性不是最后一周的检查项，而应当与功能一起进入交付范围。</p><ul><li>最小权限：身份、设备和服务只拥有完成任务所需权限。</li><li>可恢复：关键配置、数据和部署过程可以追溯与恢复。</li><li>可观测：失败能被发现，问题能被定位，责任能被交接。</li><li>可维护：文档、环境变量和运行手册随系统一起交付。</li></ul><p>这些基础能力能让系统在真实使用后继续保持可控。</p>' }
  };
  $$('.resource-open').forEach(button => button.addEventListener('click', () => {
    const resource = resources[button.dataset.resource];
    if (!dialog || !resource) return;
    $('[data-resource-kicker]', dialog).textContent = resource.kicker;
    $('[data-resource-title]', dialog).textContent = resource.title;
    $('[data-resource-body]', dialog).innerHTML = resource.body;
    dialog.showModal();
  }));
  $('[data-dialog-close]', dialog)?.addEventListener('click', () => dialog.close());
  $('[data-dialog-contact]', dialog)?.addEventListener('click', () => dialog.close());

  const form = $('[data-contact-form]');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const status = $('[data-form-status]', form);
    const submit = $('button[type="submit"]', form);
    const label = $('[data-submit-label]', form);
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const topic = String(data.get('topic') || '').trim();
    const message = String(data.get('message') || '').trim();
    const website = String(data.get('website') || '');
    const setStatus = (message, type = '') => { status.textContent = message; status.className = type; };
    if (!name || !message) { setStatus('请填写称呼和项目概述。', 'error'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus('请检查邮箱格式。', 'error'); return; }
    submit.disabled = true;
    label.textContent = '正在发送…';
    setStatus('');
    try {
      const response = await fetch('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, website, message: `【${topic}】\n${message}` })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || '提交失败，请稍后重试。');
      form.reset();
      setStatus('已发送。我会尽快阅读并回复。', 'success');
    } catch (error) {
      setStatus(error.message || '网络暂不可用，请通过邮箱联系。', 'error');
    } finally {
      submit.disabled = false;
      label.textContent = '发送咨询';
    }
  });
})();

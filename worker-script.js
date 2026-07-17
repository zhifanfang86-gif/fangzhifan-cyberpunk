addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const CONFIG = {
  FROM_EMAIL:    'onboarding@resend.dev',
  TO_EMAIL:      'zhifanfang86@gmail.com',
  KV_KEY:        'messages',
  MAX_MESSAGES:  100,
  ASSETS_ORIGIN: 'https://raw.githubusercontent.com/zhifanfang86-gif/fangzhifan-cyberpunk/main/assets/'
};

const IMAGE_MAP = {
  '/images/real/ai-robot.png':           'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1600&q=80',
  '/images/real/server-room.png':        'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=1600&q=80',
  '/images/real/datacenter-lights.png':  'https://images.unsplash.com/photo-1520869562399-e772f042f422?w=1600&q=80',
  '/images/real/coding.png':             'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1600&q=80',
  '/images/real/hero-chip.png':          'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80',
  '/images/real/fiber.png':              'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1600&q=80',
  '/images/real/security-lock.png':      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1600&q=80',
  '/images/real/cyber-shield.png':       'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&q=80',
  '/images/real/keyboard.png':           'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1600&q=80',
  '/images/real/datacenter-corridor.png':'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=1600&q=80',
  '/images/real/ai-server.png':          'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600&q=80',
  '/images/real/case-code-delivery.png': 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1600&q=80',
  '/images/real/case-ai-deploy.png':     'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1600&q=80',
  '/images/real/case-network.png':       'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80',
  '/images/real/case-ops.png':           'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1600&q=80',
  '/images/real/case-edge.png':          'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80',
  '/images/real/case-security.png':      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1600&q=80',
  '/images/real/case-zero-trust.png':    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1600&q=80',
  '/images/real/case-pipeline.png':      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1600&q=80',
  '/images/real/cyber-lock.png':         'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&q=80',
  '/images/real/local-ai-hero.jpg':      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1600&q=80',
  '/images/real/hero-main.png':          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=80',
  '/images/real/knowledge-library.png':  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&q=80',
  '/images/real/credential-meeting.png': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80',
  '/images/real/philosophy-dark.png':    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1600&q=80',
  '/images/real/recruit-team.png':       'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80',
  '/images/real/contact-letter.png':     'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1600&q=80',
  '/images/data-flow.mp4': 'https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4',
  '/images/globe-nodes.mp4': 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-futuristic-devices-9976-large.mp4'
};

function getContentType(path) {
  if (path.endsWith('.html') || path === '/') return 'text/html; charset=utf-8';
  if (path.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.mp4')) return 'video/mp4';
  if (path.endsWith('.webm')) return 'video/webm';
  // 已知图片路径，无扩展名也能识别
  if (path.includes('local-ai-hero') || path.includes('ai-robot') || path.includes('server-room') || path.includes('datacenter') || path.includes('coding') || path.includes('hero-chip') || path.includes('fiber') || path.includes('security') || path.includes('cyber') || path.includes('keyboard') || path.includes('ai-server')) return 'image/jpeg';
  return 'application/octet-stream';
}

function jsonResponse(data, status) {
  status = status || 200;
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function escapeHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
}

function sanitize(t, maxLen) {
  if (!t || typeof t !== 'string') return '';
  return t.trim().substring(0, maxLen);
}

async function sendEmail(data) {
  var name = data.name, email = data.email, message = data.message;
  var key = typeof RESEND_API_KEY !== 'undefined' ? RESEND_API_KEY : null;
  if (!key) return {ok: false, err: 'RESEND_API_KEY missing'};

  var htmlBody = '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e8e0d4;">' +
    '<h2 style="color:#c45c48;border-bottom:2px solid #e8e0d4;padding-bottom:12px;">📬 新联系请求</h2>' +
    '<table style="width:100%;border-collapse:collapse;margin-top:16px;">' +
    '<tr><td style="padding:8px 0;color:#666;width:80px;">称呼</td><td style="padding:8px 0;font-weight:600;">' + escapeHtml(name||'未填写') + '</td></tr>' +
    '<tr><td style="padding:8px 0;color:#666;">邮箱</td><td style="padding:8px 0;">' + escapeHtml(email||'未填写') + '</td></tr>' +
    '<tr><td style="padding:8px 0;color:#666;vertical-align:top;">留言</td><td style="padding:8px 0;white-space:pre-wrap;">' + escapeHtml(message||'空') + '</td></tr>' +
    '<tr><td style="padding:8px 0;color:#666;">时间</td><td style="padding:8px 0;color:#999;">' + new Date().toLocaleString('zh-CN') + '</td></tr>' +
    '</table>' +
    '<p style="margin-top:24px;color:#999;font-size:0.85rem;">此邮件由 evafang.com 自动发送</p>' +
    '</div>';

  try {
    var r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: CONFIG.FROM_EMAIL,
        to: CONFIG.TO_EMAIL,
        subject: '[evafang.com] 来自 ' + (name || '访客') + ' 的联系请求',
        html: htmlBody
      })
    });
    var respData = await r.json().catch(function() { return {}; });
    if (!r.ok) return {ok: false, err: respData.message || 'Resend HTTP ' + r.status};
    return {ok: true, id: respData.id};
  } catch (e) {
    return {ok: false, err: e.message};
  }
}

async function getMessages() {
  try {
    var raw = await GUESTBOOK_KV.get(CONFIG.KV_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

async function addMessage(name, email, message) {
  var list = await getMessages();
  var entry = {
    name: sanitize(name, 50) || '匿名',
    email: sanitize(email, 100) || '',
    message: sanitize(message, 500) || '',
    time: new Date().toLocaleString('zh-CN', {hour12: false}),
    timestamp: Date.now()
  };
  list.unshift(entry);
  var trimmed = list.slice(0, CONFIG.MAX_MESSAGES);
  await GUESTBOOK_KV.put(CONFIG.KV_KEY, JSON.stringify(trimmed));
  return trimmed;
}

async function proxyImage(path) {
  var redirectUrl = IMAGE_MAP[path];
  if (!redirectUrl) return null;
  
  try {
    var imgResp = await fetch(redirectUrl, {
      headers: {
        'Accept': path.endsWith('.mp4') ? 'video/mp4' : 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });
    if (!imgResp.ok) {
      return new Response('Upstream error: ' + imgResp.status, { status: 502 });
    }
    var contentType = imgResp.headers.get('Content-Type') || (path.endsWith('.mp4') ? 'video/mp4' : 'image/png');
    return new Response(imgResp.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response('Image fetch failed: ' + e.message, { status: 502 });
  }
}

async function proxyStatic(url) {
  if (IMAGE_MAP[url.pathname]) {
    var imgResp = await proxyImage(url.pathname);
    if (imgResp) return imgResp;
  }
  
  // 对根路径优先从 KV 读取 HTML
  if (url.pathname === '/') {
    try {
      var html = await GUESTBOOK_KV.get('index_html');
      if (html) {
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=0, no-cache',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } catch (e) {
      // KV 读取失败，继续回退到 fetch
    }
  }
  
  var target;
  if (url.pathname === '/') {
    target = 'https://raw.githubusercontent.com/zhifanfang86-gif/fangzhifan-cyberpunk/main/index.html?nocache=' + Date.now();
  } else if (url.pathname.startsWith('/assets/')) {
    target = CONFIG.ASSETS_ORIGIN + url.pathname.slice(8);
  } else {
    target = CONFIG.ASSETS_ORIGIN + url.pathname.slice(1);
  }

  try {
    var r = await fetch(target, {
      headers: { 'User-Agent': 'Cloudflare-Worker' },
      cf: { cacheTtl: 0 }
    });
    if (!r.ok) return new Response('Not found: ' + target, {status: 404});

    var contentType = getContentType(url.pathname);

    if (url.pathname === '/' || url.pathname.endsWith('.js')) {
      var text = await r.text();
      if (url.pathname.indexOf('index-4r6Lbbs8.js') !== -1) {
        var rw = [
          ['img:"/images/real/keyboard.png",title:"企业级代码交付"','img:"/images/real/case-code-delivery.png",title:"企业级代码交付"'],
          ['img:"/images/real/hero-chip.png",title:"AI大模型私有化部署"','img:"/images/real/case-ai-deploy.png",title:"AI大模型私有化部署"'],
          ['img:"/images/real/fiber.png",title:"全球线路加速网络"','img:"/images/real/case-network.png",title:"全球线路加速网络"'],
          ['img:"/images/real/server-room.png",title:"深夜数据中心巡检"','img:"/images/real/case-ops.png",title:"深夜数据中心巡检"'],
          ['img:"/images/real/datacenter-lights.png",title:"城市大脑边缘节点"','img:"/images/real/case-edge.png",title:"城市大脑边缘节点"'],
          ['img:"/images/real/cyber-shield.png",title:"企业安全防御体系"','img:"/images/real/case-security.png",title:"企业安全防御体系"'],
          ['img:"/images/real/security-lock.png",title:"零信任架构落地"','img:"/images/real/case-zero-trust.png",title:"零信任架构落地"'],
          ['img:"/images/real/coding.png",title:"自动化交付流水线"','img:"/images/real/case-pipeline.png",title:"自动化交付流水线"'],
          ['https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80','/images/real/cyber-lock.png'],
          ['background:"linear-gradient(to bottom, rgba(17,17,17,0.75) 0%, rgba(17,17,17,0.5) 50%, rgba(17,17,17,0.85) 100%)"','background:"linear-gradient(to bottom, rgba(17,17,17,0.45) 0%, rgba(17,17,17,0.3) 50%, rgba(17,17,17,0.65) 100%)"'],
          ['background:"linear-gradient(to bottom, rgba(17,17,17,0.45) 0%, rgba(17,17,17,0.3) 50%, rgba(17,17,17,0.65) 100%)"','background:"linear-gradient(to bottom, rgba(17,17,17,0.45) 0%, rgba(17,17,17,0.3) 50%, rgba(17,17,17,0.65) 100%),url(/images/real/hero-main.png) center/cover no-repeat"'],
          ['x.jsx("p",{"code-path":"src/sections/KnowledgeSection.tsx:73:11"','x.jsx("img",{src:"/images/real/knowledge-library.png",loading:"lazy",style:{display:"block",width:"100%",maxWidth:"880px",aspectRatio:"21/9",objectFit:"cover",borderRadius:"12px",margin:"0 auto 48px",border:"1px solid rgba(255,255,255,0.08)"}}),x.jsx("p",{"code-path":"src/sections/KnowledgeSection.tsx:73:11"'],
          ['x.jsx("p",{"code-path":"src/sections/CredentialSection.tsx:41:11"','x.jsx("img",{src:"/images/real/credential-meeting.png",loading:"lazy",style:{display:"block",width:"100%",maxWidth:"880px",aspectRatio:"21/9",objectFit:"cover",borderRadius:"12px",margin:"0 auto 48px",border:"1px solid rgba(255,255,255,0.08)"}}),x.jsx("p",{"code-path":"src/sections/CredentialSection.tsx:41:11"'],
          ['x.jsxs("div",{"code-path":"src/sections/PhilosophySection.tsx:43:9"','x.jsx("img",{src:"/images/real/philosophy-dark.png",loading:"lazy",style:{display:"block",width:"100%",maxWidth:"880px",aspectRatio:"21/9",objectFit:"cover",borderRadius:"12px",margin:"0 auto 48px",border:"1px solid rgba(255,255,255,0.08)"}}),x.jsxs("div",{"code-path":"src/sections/PhilosophySection.tsx:43:9"'],
          ['x.jsxs("div",{"code-path":"src/sections/RecruitSection.tsx:40:9"','x.jsx("img",{src:"/images/real/recruit-team.png",loading:"lazy",style:{display:"block",width:"100%",maxWidth:"880px",aspectRatio:"21/9",objectFit:"cover",borderRadius:"12px",margin:"0 auto 48px",border:"1px solid rgba(255,255,255,0.08)"}}),x.jsxs("div",{"code-path":"src/sections/RecruitSection.tsx:40:9"'],
          ['x.jsx("p",{"code-path":"src/sections/ContactSection.tsx:44:13"','x.jsx("img",{src:"/images/real/contact-letter.png",loading:"lazy",style:{display:"block",width:"100%",maxWidth:"880px",aspectRatio:"21/9",objectFit:"cover",borderRadius:"12px",margin:"0 auto 32px",border:"1px solid rgba(255,255,255,0.08)"}}),x.jsx("p",{"code-path":"src/sections/ContactSection.tsx:44:13"']
        ];
        for (var k = 0; k < rw.length; k++) { text = text.split(rw[k][0]).join(rw[k][1]); }
      }
      text = text.replace(new RegExp('src:"/images/data-flow\\.mp4"', 'g'), 'src:""');
      return new Response(text, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=0, no-cache',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    var body = await r.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=0, no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response('Proxy error: ' + e.message, {status: 502});
  }
}

async function handleRequest(request) {
  var url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (url.pathname === '/messages') {
    if (request.method === 'GET') {
      try {
        var data = await getMessages();
        return jsonResponse({success: true, data: data});
      } catch (e) {
        return jsonResponse({success: false, error: e.message}, 500);
      }
    }
    if (request.method === 'POST') {
      try {
        var body = await request.json().catch(function() { return {}; });
        var name = sanitize(body.name, 50);
        var email = sanitize(body.email, 100);
        var message = sanitize(body.message, 500);
        if (!name || !message) {
          return jsonResponse({success: false, error: '称呼和留言不能为空'}, 400);
        }
        var data = await addMessage(name, email, message);
        return jsonResponse({success: true, data: data});
      } catch (e) {
        return jsonResponse({success: false, error: e.message}, 500);
      }
    }
    return jsonResponse({success: false, error: 'Method not allowed'}, 405);
  }

  if (url.pathname === '/api/contact' && request.method === 'POST') {
    try {
      var body = await request.json().catch(function() { return {}; });
      var name = sanitize(body.name, 50);
      var email = sanitize(body.email, 100);
      var message = sanitize(body.message, 2000);
      if (!name || !message) {
        return jsonResponse({success: false, error: '称呼和留言不能为空'}, 400);
      }
      var result = await sendEmail({name: name, email: email, message: message});
      if (!result.ok) {
        return jsonResponse({success: false, error: result.err}, 502);
      }
      return jsonResponse({success: true, message: '邮件已发送', id: result.id});
    } catch (e) {
      return jsonResponse({success: false, error: e.message}, 500);
    }
  }

  if (url.pathname === '/api/health' || url.pathname === '/health') {
    return jsonResponse({success: true, status: 'online', version: '3.4', ts: Date.now()});
  }

  return proxyStatic(url);
}
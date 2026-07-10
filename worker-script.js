addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const IMAGE_MAP = {
  '/images/real/ai-robot.png': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80&auto=format&fit=crop',
  '/images/real/server-room.png': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80&auto=format&fit=crop',
  '/images/real/datacenter-lights.png': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80&auto=format&fit=crop',
  '/images/real/coding.png': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80&auto=format&fit=crop',
  '/images/real/hero-chip.png': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80&auto=format&fit=crop',
  '/images/real/fiber.png': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&q=80&auto=format&fit=crop',
  '/images/real/security-lock.png': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80&auto=format&fit=crop',
  '/images/real/cyber-shield.png': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80&auto=format&fit=crop',
  '/images/real/keyboard.png': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80&auto=format&fit=crop',
  '/images/real/datacenter-corridor.png': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80&auto=format&fit=crop',
  '/images/real/ai-server.png': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80&auto=format&fit=crop',
  '/images/data-flow.mp4': 'https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4',
  '/images/globe-nodes.mp4': 'https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4'
};

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const hostname = url.hostname;
  
  if (hostname === 'www.evafang.com') {
    return new Response(null, {
      status: 301,
      headers: {
        'Location': 'https://evafang.com' + path + url.search,
        'Cache-Control': 'public, max-age=86400'
      }
    });
  }
  
  if (url.protocol === 'http:') {
    return new Response(null, {
      status: 301,
      headers: {
        'Location': 'https://evafang.com' + path + url.search,
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      }
    });
  }
  
  const redirectUrl = IMAGE_MAP[path];
  if (redirectUrl) {
    try {
      const imgResp = await fetch(redirectUrl, {
        headers: {
          'Accept': path.endsWith('.mp4') ? 'video/mp4' : 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
        }
      });
      if (!imgResp.ok) {
        return new Response('Upstream error: ' + imgResp.status, { status: 502 });
      }
      const contentType = imgResp.headers.get('Content-Type') || 
        (path.endsWith('.mp4') ? 'video/mp4' : 'image/png');
      return new Response(imgResp.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (e) {
      return new Response('Image fetch failed: ' + e.message, { status: 502 });
    }
  }
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (path === '/' || path === '/index.html') {
      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <title>方志凡 — 微微赛博</title>
    <meta name="description" content="方志凡 — 微微赛博的个人数字居所"/>
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"/>
    <link rel="canonical" href="https://evafang.com/"/>
    <link rel="preconnect" href="https://fonts.loli.net"/>
    <link rel="preconnect" href="https://gstatic.loli.net" crossorigin=""/>
    <link href="https://fonts.loli.net/css2?family=Noto+Sans+SC:wght@400;600;700;800&amp;family=JetBrains+Mono:wght@400&amp;display=swap" rel="stylesheet"/>
    <link href="https://fonts.loli.net/css2?family=Noto+Serif+SC:wght@300;400;600;700&amp;display=swap" rel="stylesheet"/>
    <script type="module" crossorigin="" src="https://cdn.jsdelivr.net/gh/zhifanfang86-gif/fangzhifan-cyberpunk@main/assets/index-4r6Lbbs8.js"><\/script>
    <link rel="stylesheet" crossorigin="" href="https://cdn.jsdelivr.net/gh/zhifanfang86-gif/fangzhifan-cyberpunk@main/assets/index-BYiqeDJS.css"/>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/zhifanfang86-gif/fangzhifan-cyberpunk@main/assets/guestbook.css"/>
    <script>
    (function(){
        function fixBrokenImages(){
            document.querySelectorAll('img').forEach(function(img){
                if(!img.complete || img.naturalWidth === 0){
                    var sep = img.src.indexOf('?') === -1 ? '?' : '&';
                    img.src = img.src + sep + '_cb=' + Date.now();
                }
            });
        }
        if(document.readyState === 'complete'){ fixBrokenImages(); }
        else { window.addEventListener('load', fixBrokenImages); }
        setTimeout(fixBrokenImages, 4000);
    })();
    <\/script>
    <style>
        *,*::before,*::after{box-sizing:border-box}
        html{font-size:16px;-webkit-text-size-adjust:100%}
        body{overflow-x:hidden;margin:0;padding:0}
        img,video{max-width:100%;height:auto;display:block}
        .card,.service-card,.portfolio-item,.project-card{max-width:100%}
        .card img,.service-card img,.portfolio-item img,.project-card img{width:100%;height:200px;object-fit:cover;border-radius:4px}
        .poem-line {
            font-family: 'Noto Serif SC', 'Songti SC', 'SimSun', serif;
            font-size: 0.85rem;
            color: #c4a882;
            text-align: center;
            margin: 20px auto 12px;
            letter-spacing: 0.15em;
            opacity: 0.85;
            font-weight: 300;
            line-height: 1.8;
            display: table;
        }
        .guestbook-inner .empty { display: none !important; }
        @media(max-width:768px){
            .hero-title{font-size:2rem!important}
            .hero-subtitle{font-size:1rem!important}
            .section-title{font-size:1.5rem!important}
            .card-grid,.services-grid,.portfolio-grid{grid-template-columns:1fr!important;gap:1rem!important;padding:0 1rem!important}
            .nav-links{display:none!important}
            .mobile-nav{display:flex!important}
            .container{padding:0 1rem!important}
            .guestbook-inner{padding:0 16px!important}
            .guestbook-title{font-size:1.2rem!important}
            .submit-btn{width:100%!important;text-align:center}
            .video-scroll-container video{opacity:0.08!important}
            .poem-line{
                font-size:0.75rem!important;
                margin:16px auto 8px!important;
                letter-spacing:0.12em;
                display:table!important;
            }
        }
        @media(min-width:769px) and (max-width:1024px){
            .card-grid,.services-grid,.portfolio-grid{grid-template-columns:repeat(2,1fr)!important}
        }
        #root{width:100%;max-width:100vw;overflow-x:hidden}
    </style>
</head>
<body>
    <div class="video-scroll-container" id="video-container">
        <video id="scroll-video" muted playsinline preload="auto" loop>
            <source src="https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4" type="video/mp4">
            <source src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-futuristic-devices-9976-large.mp4" type="video/mp4">
        </video>
        <div class="video-overlay"></div>
        <div class="video-fallback" id="video-fallback"></div>
    </div>
    <div id="root"></div>
    <section class="guestbook-section" id="guestbook">
        <div class="guestbook-inner">
            <h2 class="guestbook-title">
                <span class="guestbook-mark">尺</span>
                <span>尺牍</span>
                <span class="guestbook-line"></span>
            </h2>
            <form class="guestbook-form" id="guestbook-form">
                <div class="form-field">
                    <label>称呼</label>
                    <input type="text" id="name" placeholder="阁下尊姓大名" required>
                </div>
                <div class="form-field">
                    <label>留言</label>
                    <textarea id="message" placeholder="在此落笔..." required></textarea>
                </div>
                <button type="submit" class="submit-btn">投递</button>
            </form>
            <div class="poem-line">原来路遥马急，一生只够爱一人</div>
            <div id="messages" class="messages"></div>
        </div>
    </section>
    <div id="toast" class="toast"></div>
    <script src="https://cdn.jsdelivr.net/gh/zhifanfang86-gif/fangzhifan-cyberpunk@main/assets/guestbook.js"><\/script>
    <script src="https://cdn.jsdelivr.net/gh/zhifanfang86-gif/fangzhifan-cyberpunk@main/assets/video-scroll.js"><\/script>
</body>
</html>`;
      const securityHeaders = {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      };
      return new Response(html, { headers: securityHeaders });
    }
    
    if (path === '/messages' && request.method === 'GET') {
      const messages = await GUESTBOOK_KV.get('messages');
      const data = messages ? JSON.parse(messages) : [];
      return new Response(JSON.stringify(data), { headers: corsHeaders });
    }
    
    if (path === '/messages' && request.method === 'POST') {
      const body = await request.json();
      if (!body.name || !body.message) {
        return new Response(JSON.stringify({ error: 'Name and message are required' }), { status: 400, headers: corsHeaders });
      }
      const newMessage = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: body.name.substring(0, 50),
        message: body.message.substring(0, 500),
        time: body.time || new Date().toLocaleString('zh-CN'),
        timestamp: Date.now()
      };
      const existing = await GUESTBOOK_KV.get('messages');
      const messages = existing ? JSON.parse(existing) : [];
      messages.unshift(newMessage);
      const trimmed = messages.slice(0, 100);
      await GUESTBOOK_KV.put('messages', JSON.stringify(trimmed));
      return new Response(JSON.stringify({ success: true, message: newMessage }), { headers: corsHeaders });
    }
    
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'online', node: 'FZ-001' }), { headers: corsHeaders });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

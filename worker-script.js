addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const SVG_IMAGES = {
  'ai-robot': `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#1a1a2e"/><circle cx="200" cy="120" r="50" fill="none" stroke="#c4a882" stroke-width="2"/><circle cx="185" cy="110" r="5" fill="#c4a882"/><circle cx="215" cy="110" r="5" fill="#c4a882"/><path d="M170 150 Q200 170 230 150" stroke="#c4a882" stroke-width="2" fill="none"/><text x="200" y="220" text-anchor="middle" fill="#c4a882" font-family="serif" font-size="14">AI 智能机器人</text></svg>`,
  'ai-server': `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#1a1a2e"/><rect x="120" y="80" width="160" height="140" rx="5" fill="none" stroke="#c4a882" stroke-width="2"/><line x1="120" y1="110" x2="280" y2="110" stroke="#c4a882" stroke-width="1"/><line x1="120" y1="140" x2="280" y2="140" stroke="#c4a882" stroke-width="1"/><line x1="120" y1="170" x2="280" y2="170" stroke="#c4a882" stroke-width="1"/><circle cx="140" cy="125" r="3" fill="#c4a882"/><circle cx="140" cy="155" r="3" fill="#c4a882"/><circle cx="140" cy="185" r="3" fill="#c4a882"/><text x="200" y="250" text-anchor="middle" fill="#c4a882" font-family="serif" font-size="14">AI 服务器集群</text></svg>`,
  'local-ai-hero': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="260" viewBox="0 0 800 260"><rect width="800" height="260" fill="#1a1a2e"/><rect x="250" y="60" width="300" height="140" rx="8" fill="none" stroke="#c4a882" stroke-width="2"/><line x1="250" y1="100" x2="550" y2="100" stroke="#c4a882" stroke-width="1"/><line x1="250" y1="130" x2="550" y2="130" stroke="#c4a882" stroke-width="1"/><line x1="250" y1="160" x2="550" y2="160" stroke="#c4a882" stroke-width="1"/><circle cx="280" cy="80" r="4" fill="#c4a882"/><text x="400" y="220" text-anchor="middle" fill="#c4a882" font-family="serif" font-size="16">本地 AI 全栈基础设施</text></svg>`
};

const IMAGE_MAP = {
  '/images/real/ai-robot.png': '__embedded:svg:ai-robot',
  '/images/real/server-room.png': 'https://images.weserv.nl/?url=images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
  '/images/real/datacenter-lights.png': 'https://images.weserv.nl/?url=images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80',
  '/images/real/coding.png': 'https://images.weserv.nl/?url=images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80',
  '/images/real/hero-chip.png': 'https://images.weserv.nl/?url=images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
  '/images/real/fiber.png': 'https://images.weserv.nl/?url=images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&q=80',
  '/images/real/security-lock.png': 'https://images.weserv.nl/?url=images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80',
  '/images/real/cyber-shield.png': 'https://images.weserv.nl/?url=images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80',
  '/images/real/keyboard.png': 'https://images.weserv.nl/?url=images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
  '/images/real/datacenter-corridor.png': 'https://images.weserv.nl/?url=images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80',
  '/images/real/ai-server.png': '__embedded:svg:ai-server',
  '/images/data-flow.mp4': 'https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4',
  '/images/globe-nodes.mp4': 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-futuristic-devices-9976-large.mp4',
  '/images/real/local-ai-hero': '__embedded:svg:local-ai-hero'
};

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const hostname = url.hostname;
  if (hostname === 'www.evafang.com') {
    return new Response(null, { status: 301, headers: { 'Location': 'https://evafang.com' + path + url.search, 'Cache-Control': 'public, max-age:86400' }});
  }
  if (url.protocol === 'http:') {
    return new Response(null, { status: 301, headers: { 'Location': 'https://evafang.com' + path + url.search, 'Strict-Transport-Security': 'max-age:31536000; includeSubDomains; preload' }});
  }
  const redirectUrl = IMAGE_MAP[path];
  if (redirectUrl) {
    if (redirectUrl.startsWith('__embedded:svg:')) {
      const svgKey = redirectUrl.replace('__embedded:svg:', '');
      const svgData = SVG_IMAGES[svgKey];
      if (svgData) {
        return new Response(svgData, { status: 200, headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age:86400' }});
      }
    }
    try {
      const imgResp = await fetch(redirectUrl, { headers: { 'Accept': path.endsWith('.mp4') ? 'video/mp4' : 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' }});
      if (!imgResp.ok) return new Response('Upstream error: ' + imgResp.status, { status: 502 });
      const contentType = imgResp.headers.get('Content-Type') || (path.endsWith('.mp4') ? 'video/mp4' : 'image/png');
      return new Response(imgResp.body, { status: 200, headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' }});
    } catch (e) { return new Response('Image fetch failed: ' + e.message, { status: 502 }); }
  }
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {

    if (path.startsWith('/assets/')) {
      const assetPath = path.replace('/assets/', '');
      const assetUrl = 'https://raw.githubusercontent.com/zhifanfang86-gif/fangzhifan-cyberpunk/main/assets/' + assetPath;
      try {
        const raw = await fetch(assetUrl);
        if (!raw.ok) return new Response('Asset not found: ' + assetPath, { status: 404 });
        const body = await raw.text();
        const contentType = assetPath.endsWith('.css') ? 'text/css' : 
                          assetPath.endsWith('.js') ? 'application/javascript' : 
                          raw.headers.get('Content-Type') || 'text/plain';
        return new Response(body, {
          headers: {
            'Content-Type': contentType + '; charset=utf-8',
            'Cache-Control': 'public, max-age:300',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        return new Response('Asset fetch failed: ' + e.message, { status: 502 });
      }
    }

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
<link href="https://fonts.loli.net/css2?family=Noto+Sans+SC:wght@400;600;700;800&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet"/>
<link href="https://fonts.loli.net/css2?family=Noto+Serif+SC:wght@300;400;600;700&display=swap" rel="stylesheet"/>
<script type="module" crossorigin="" src="/assets/index-4r6Lbbs8.js"></script>
<link rel="stylesheet" crossorigin="" href="/assets/index-BYiqeDJS.css"/>
<link rel="stylesheet" href="/assets/guestbook.css"/>
<script>const a=[{from:"资历背书",to:"本地AI服务"},{from:"权威认证",to:"行业知识"},{from:"50+",to:"10+"},{from:"从业年限",to:"从业时间"},{from:"硅谷科技认知体系",to:"硅谷科技体系"},{from:"个人照片/视频存储",to:"节省5位数开支项目"},{from:"文档同步与备份",to:"个人逐步开放"},{from:"家庭影音中心",to:"主要面向企业以及公司"},{from:"智能家居中枢",to:"入门配置推荐"},{from:"8条认证",to:"知识衔接拓扑"},{from:"每个人的数据，都应该属于自己的家",to:"每个人的数据，都应该有自己的家"}];function r(){const e=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,!1);let t;while(t=e.nextNode()){for(const n of a)if(t.textContent.includes(n.from)){t.textContent=t.textContent.replace(new RegExp(n.from,"g"),n.to);break}}}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",r)}else{r()}const o=new MutationObserver(function(){r()});o.observe(document.body,{childList:!0,subtree:!0});(function(){function m(){var ai=document.querySelector('.ai-server-section');var root=document.getElementById('root');if(!ai||!root)return false;var sections=root.querySelectorAll('section');if(sections.length===0)return false;var hero=sections[0];hero.parentNode.insertBefore(ai,hero.nextSibling);return true}function w(){var sections=document.querySelectorAll('section[id],section.ai-server-section');for(var i=0;i<sections.length;i++){var s=sections[i];s.style.width='100%';s.style.maxWidth='100vw';s.style.overflowX='hidden';s.style.boxSizing='border-box';s.style.paddingLeft='0';s.style.paddingRight='0';s.style.marginLeft='0';s.style.marginRight='0'}}setTimeout(function(){if(m())w()},1500);setTimeout(function(){if(m())w()},3000);setTimeout(function(){if(m())w()},5000);var rootEl=document.getElementById('root');if(rootEl){var obs=new MutationObserver(function(){if(m()){w();obs.disconnect()}});obs.observe(rootEl,{childList:true,subtree:true})}})();</script>
<script>(function(){function f(){document.querySelectorAll('img').forEach(function(i){if(!i.complete||i.naturalWidth===0){var s=i.src.indexOf('?')===-1?'?':'&';i.src=i.src+s+'_cb='+Date.now();}});}if(document.readyState==='complete'){f();}else{window.addEventListener('load',f);}setTimeout(f,4000);})();</script>
<style>*,*::before,*::after{box-sizing:border-box}html{font-size:16px;-webkit-text-size-adjust:100%}body{overflow-x:hidden;margin:0;padding:0}img,video{max-width:100%;height:auto;display:block}
.poem-line{font-family:'Noto Serif SC','Songti SC',serif;font-size:0.85rem;color:#c75b67!important;text-align:center!important;margin:20px auto 12px!important;letter-spacing:0.15em;opacity:0.9;font-weight:300;line-height:1.8;display:table!important}
.guestbook-inner .empty{display:none!important}
#messages:empty,.messages:empty{display:none!important}
.guestbook-section{width:100%!important;max-width:100vw!important;overflow-x:hidden!important;padding:60px 0!important;background:linear-gradient(180deg,#ffffff 0%,#f8f5f0 50%,#f0ebe0 100%)!important;border-top:1px solid #e8e0d4;border-bottom:1px solid #e8e0d4;box-sizing:border-box!important}
.guestbook-inner{width:100%!important;max-width:640px;margin:0 auto!important;padding:0 24px;box-sizing:border-box!important;overflow-x:hidden!important}
.guestbook-title,.guestbook-title span{color:#3a3228!important;max-width:100%!important}
.guestbook-title .guestbook-mark{color:#c4a882!important}
.guestbook-form{width:100%!important;max-width:100%!important}
.form-field{width:100%!important;max-width:100%!important}
.guestbook-form label{color:#5a4e3e!important}
.guestbook-form input,.guestbook-form textarea{width:100%!important;max-width:100%!important;background:#fffdfb!important;border:1px solid #ddd5c8!important;color:#3a3228!important;box-sizing:border-box!important;padding:12px 16px!important}
.guestbook-form input::placeholder,.guestbook-form textarea::placeholder{color:#b0a898!important}
.submit-btn{background:linear-gradient(135deg,#c4a882 0%,#a88b5e 100%)!important;color:#fff!important;border:none!important;box-sizing:border-box!important}
.grid-hs-features,.grid-hs-compare,.hs-features{display:none!important}
@media(max-width:768px){
.ai-server-section{padding-left:48px!important}
.hero-title{font-size:2rem!important}.hero-subtitle{font-size:1rem!important}.section-title{font-size:1.5rem!important}
.card-grid,.services-grid,.portfolio-grid{grid-template-columns:1fr!important;gap:1rem!important;padding:0 1rem!important}
.nav-links{display:none!important}.mobile-nav{display:flex!important}.container{padding:0 1rem!important}
.side-nav{display:flex!important;width:48px!important}body{padding-left:0!important;margin-left:0!important}
#guestbook{margin-left:0!important;width:100%!important}
.guestbook-section{width:100%!important;max-width:100%!important;overflow-x:hidden!important;padding:40px 0!important;box-sizing:border-box!important;margin-left:0!important}
.guestbook-inner{width:100%!important;max-width:100%!important;margin:0 auto!important;padding:0 12px!important;box-sizing:border-box!important;overflow-x:hidden!important}
.guestbook-title{font-size:1.2rem!important;gap:8px!important;margin-bottom:24px!important;width:100%!important;max-width:100%!important}
.guestbook-mark{width:28px!important;height:28px!important;font-size:0.85rem!important;flex-shrink:0!important}
.guestbook-line{display:none!important}.guestbook-form{gap:16px!important;margin-bottom:24px!important;width:100%!important}
.form-field{width:100%!important;max-width:100%!important}
.form-field input,.form-field textarea{font-size:16px!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;padding:12px 16px!important}
.submit-btn{width:100%!important;text-align:center;box-sizing:border-box!important}
.video-scroll-container video{opacity:0.08!important}
.poem-line{font-size:0.75rem!important;color:#c75b67!important;margin:16px auto 8px!important;letter-spacing:0.12em;display:table!important;text-align:center!important}
}
@media(min-width:769px) and (max-width:1024px){
.card-grid,.services-grid,.portfolio-grid{grid-template-columns:repeat(2,1fr)!important}
}
#root{width:100%;max-width:100vw;overflow-x:hidden}
.video-scroll-container{position:fixed;top:0;left:0;width:100%;height:100vh;z-index:-1;overflow:hidden;background:#0a0a0f}.video-scroll-container video{position:absolute;top:50%;left:50%;min-width:100%;min-height:100%;width:auto;height:auto;transform:translate(-50%,-50%);object-fit:cover;opacity:.6}.video-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(10,10,15,.6) 0%,rgba(10,10,15,.3) 50%,rgba(10,10,15,.8) 100%);pointer-events:none}.video-fallback{display:none;position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#0a0a0f 0%,#1a1a2e 50%,#0d0d14 100%)}.video-fallback.active{display:block}</style>
</head>
<body>
<div class="video-scroll-container" id="video-container">
<video id="scroll-video" muted playsinline preload="auto">
<source src="https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4" type="video/mp4">
<source src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-futuristic-devices-9976-large.mp4" type="video/mp4">
</video>
<div class="video-overlay"></div>
<div class="video-fallback" id="video-fallback"></div>
</div>

<div id="root"></div>

<section class="ai-server-section" style="width:100%;background:linear-gradient(180deg,#0a0a0f 0%,#0d0d14 50%,#0a0a0f 100%);padding:30px 16px 40px;position:relative">
<div style="max-width:1100px;margin:0 auto;position:relative;z-index:1">
<div style="text-align:center;margin-bottom:30px">
<div style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#c4a882;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:16px;opacity:0.8">独立构建 · 长期验证</div>
<h2 style="font-family:'Noto Serif SC',serif;font-size:2.2rem;font-weight:600;color:#e8d5b5;margin:0 0 16px;letter-spacing:0.05em">本地 AI 全栈微服务器系统</h2>
<p style="font-size:1rem;color:#9a9488;line-height:1.8;max-width:640px;margin:0 auto">从硬件选型到软件架构、运维闭环，全部由我独立完成构建与长期验证</p>
</div>
<div style="width:100%;height:260px;border-radius:8px;overflow:hidden;margin-bottom:30px;position:relative;border:1px solid rgba(196,168,130,0.15)">
<img src="/images/real/local-ai-hero" style="width:100%;height:100%;object-fit:cover;opacity:0.7" alt="本地AI基础设施">
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,15,0.3) 0%,rgba(10,10,15,0.8) 100%)"></div>
</div>
<div style="font-family:'Noto Serif SC',serif;font-size:1.3rem;color:#c4a882;margin:40px 0 24px;text-align:center;letter-spacing:0.1em">核心能力</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:16px">
<h3 style="font-family:'Noto Serif SC',serif;font-size:1rem;color:#e8d5b5;margin:0 0 8px;font-weight:500">稳定部署</h3>
<p style="font-size:0.85rem;color:#9a9488;line-height:1.7;margin:0">本地大模型稳定运行，支持多场景自动化工作流</p>
</div>
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:16px">
<h3 style="font-family:'Noto Serif SC',serif;font-size:1rem;color:#e8d5b5;margin:0 0 8px;font-weight:500">安全远程</h3>
<p style="font-size:0.85rem;color:#9a9488;line-height:1.7;margin:0">完整远程安全访问、自动监控修复、自启动能力，装好即用</p>
</div>
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:16px">
<h3 style="font-family:'Noto Serif SC',serif;font-size:1rem;color:#e8d5b5;margin:0 0 8px;font-weight:500">纯本地闭环</h3>
<p style="font-size:0.85rem;color:#9a9488;line-height:1.7;margin:0">所有数据与服务均在本地运行，无任何云端依赖</p>
</div>
</div>
<div style="font-family:'Noto Serif SC',serif;font-size:1.3rem;color:#c4a882;margin:40px 0 24px;text-align:center;letter-spacing:0.1em">使用场景</div>
<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px 24px;max-width:560px;margin:0 auto 24px">
<div style="display:flex;align-items:center;gap:10px;font-size:0.9rem;color:#b8b0a0"><span style="width:6px;height:6px;border-radius:50%;background:#c4a882;flex-shrink:0"></span><span>节省5位数开支项目</span></div>
<div style="display:flex;align-items:center;gap:10px;font-size:0.9rem;color:#b8b0a0"><span style="width:6px;height:6px;border-radius:50%;background:#c4a882;flex-shrink:0"></span><span>个人构建（医疗、金融、信息隐私）</span></div>
<div style="display:flex;align-items:center;gap:10px;font-size:0.9rem;color:#b8b0a0"><span style="width:6px;height:6px;border-radius:50%;background:#c4a882;flex-shrink:0"></span><span>数据不出域</span></div>
<div style="display:flex;align-items:center;gap:10px;font-size:0.9rem;color:#b8b0a0"><span style="width:6px;height:6px;border-radius:50%;background:#c4a882;flex-shrink:0"></span><span>个人逐步开放</span></div>
<div style="display:flex;align-items:center;gap:10px;font-size:0.9rem;color:#b8b0a0"><span style="width:6px;height:6px;border-radius:50%;background:#c4a882;flex-shrink:0"></span><span>主要面向企业以及公司</span></div>
<div style="display:flex;align-items:center;gap:10px;font-size:0.9rem;color:#b8b0a0"><span style="width:6px;height:6px;border-radius:50%;background:#c4a882;flex-shrink:0"></span><span>入门配置推荐（5万起步）</span></div>
</div>
<div style="font-family:'Noto Serif SC',serif;font-size:1.3rem;color:#c4a882;margin:40px 0 24px;text-align:center;letter-spacing:0.1em">商业价值</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
<div style="text-align:center;padding:16px">
<div style="font-family:'JetBrains Mono',monospace;font-size:1.6rem;color:rgba(196,168,130,0.4);margin-bottom:8px;font-weight:300">01</div>
<h4 style="font-family:'Noto Serif SC',serif;font-size:0.95rem;color:#e8d5b5;margin:0 0 8px;font-weight:500">成本优势显著</h4>
<p style="font-size:0.82rem;color:#9a9488;line-height:1.7;margin:0">仅需一台高性能主机，整体拥有成本远低于云端同等算力</p>
</div>
<div style="text-align:center;padding:16px">
<div style="font-family:'JetBrains Mono',monospace;font-size:1.6rem;color:rgba(196,168,130,0.4);margin-bottom:8px;font-weight:300">02</div>
<h4 style="font-family:'Noto Serif SC',serif;font-size:0.95rem;color:#e8d5b5;margin:0 0 8px;font-weight:500">数据安全与合规</h4>
<p style="font-size:0.82rem;color:#9a9488;line-height:1.7;margin:0">全部本地构建，数据永不外传，天然满足高隐私要求</p>
</div>
<div style="text-align:center;padding:16px">
<div style="font-family:'JetBrains Mono',monospace;font-size:1.6rem;color:rgba(196,168,130,0.4);margin-bottom:8px;font-weight:300">03</div>
<h4 style="font-family:'Noto Serif SC',serif;font-size:0.95rem;color:#e8d5b5;margin:0 0 8px;font-weight:500">效率与灵活性</h4>
<p style="font-size:0.82rem;color:#9a9488;line-height:1.7;margin:0">一次构建即可快速复制部署；支持按需定制</p>
</div>
</div>
<div style="text-align:center;max-width:700px;margin:0 auto 24px;padding:24px;background:rgba(196,168,130,0.05);border:1px solid rgba(196,168,130,0.1);border-radius:8px">
<p style="font-size:0.88rem;color:#b8b0a0;line-height:1.9;margin:0;text-align:left">本地构建能力：从零到生产级全栈，已形成完整工程化交付体系（结构树、验收标准、运维脚本包），可直接输出给需要"自有AI服务器"的客户。</p>
</div>
<div style="text-align:center;max-width:640px;margin:0 auto;padding:24px 16px;border-top:1px solid rgba(196,168,130,0.15)">
<p style="font-size:0.9rem;color:#b8b0a0;line-height:1.9;margin:0 0 8px">如果你正在寻找一套<strong>真正属于自己的、可掌控的本地AI基础设施</strong>，我可以提供从硬件推荐、系统构建、到完整交付与培训的全流程服务。</p>
<p style="font-size:0.82rem!important;color:#9a9488!important;margin:0">欢迎通过下方<span style="color:#c4a882;font-weight:500">尺牍</span>留言或投递，我会给出针对性方案。</p>
</div>
</div>
</section>

<section class="guestbook-section" id="guestbook">
<div class="guestbook-inner">
<h2 class="guestbook-title"><span class="guestbook-mark">尺</span><span>尺牍</span><span class="guestbook-line"></span></h2>
<form class="guestbook-form" id="guestbook-form">
<div class="form-field"><label>称呼</label><input type="text" id="name" placeholder="阁下尊姓大名" required></div>
<div class="form-field"><label>留言</label><textarea id="message" placeholder="在此落笔..." required></textarea></div>
<button type="submit" class="submit-btn">投递</button>
</form>
<div class="poem-line">原来路遥马急，一生只够爱一人</div>
<div id="messages" class="messages"></div>
</div>
</section>
<div id="toast" class="toast"></div>
<script src="/assets/guestbook.js"></script>
<script>
(function(){
function r(){
var m=document.getElementById('messages');
if(m){
var c=m.children;
for(var i=c.length-1;i>=0;i--){
if(c[i].textContent&&(c[i].textContent.indexOf('暂无')>=0||c[i].textContent.indexOf('待位')>=0)){
c[i].style.display='none';c[i].parentNode.removeChild(c[i]);
}
}
if(m.textContent&&(m.textContent.indexOf('暂无')>=0||m.textContent.indexOf('待位')>=0)){m.innerHTML='';}
}
document.querySelectorAll('.empty,.no-messages,.placeholder,[data-placeholder]').forEach(function(e){e.style.display='none !important';});
}
if(document.readyState==='complete'){r();}else{window.addEventListener('load',r);}
setTimeout(r,1500);setTimeout(r,3000);setTimeout(r,5000);
})();
</script>
<script src="/assets/video-scroll.js"></script>
</body>
</html>`;
      const securityHeaders = {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
        'Strict-Transport-Security': 'max-age:31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      };
      return new Response(html, { headers: securityHeaders });
    }
    // 尺牍留言：纯本地模式，不读写 KV
    if (path === '/messages' && request.method === 'GET') {
      return new Response('[]', { headers: corsHeaders });
    }
    if (path === '/messages' && request.method === 'POST') {
      return new Response(JSON.stringify({ success: true, local: true }), { headers: corsHeaders });
    }
    if (path === '/debug-kv') {
      return new Response(JSON.stringify({ status: 'kv-bound-but-not-used' }), { headers: corsHeaders });
    }
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'online', node: 'FZ-001' }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
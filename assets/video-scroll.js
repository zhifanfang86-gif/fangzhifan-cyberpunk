// 视频滚动播放控制 - 修复版
(function() {
    'use strict';
    
    const video = document.getElementById('scroll-video');
    const container = document.getElementById('video-container');
    const fallback = document.getElementById('video-fallback');
    
    if (!video || !container) {
        console.warn('[VideoScroll] Video element or container not found');
        if (fallback) fallback.classList.add('active');
        return;
    }

    // 禁用 loop，由滚动完全控制播放进度（loop 会与 currentTime 控制冲突）
    video.removeAttribute('loop');
    
    // 状态跟踪
    let isVideoLoaded = false;
    let hasError = false;
    let sourceIndex = 0;
    const sources = Array.from(video.querySelectorAll('source'));

    function activateFallback(reason) {
        if (hasError) return;
        hasError = true;
        console.warn('[VideoScroll] Activating fallback, reason:', reason);
        if (fallback) fallback.classList.add('active');
        video.style.display = 'none';
        container.style.background = 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0d0d14 100%)';
    }

    function tryNextSource() {
        if (hasError) return;
        sourceIndex++;
        console.log('[VideoScroll] Trying source index:', sourceIndex);
        if (sourceIndex < sources.length) {
            video.src = sources[sourceIndex].src;
            video.load();
            var pp = video.play();
            if (pp !== undefined) {
                pp.then(function() { video.pause(); }).catch(function() {});
            }
        } else {
            activateFallback('all sources failed');
        }
    }

    video.addEventListener('error', function(e) {
        console.warn('[VideoScroll] Video error:', e);
        tryNextSource();
    });

    video.addEventListener('stalled', function() {
        if (hasError || isVideoLoaded) return;
        setTimeout(function() {
            if (!isVideoLoaded && !hasError && video.readyState < 2) {
                console.warn('[VideoScroll] Video stalled');
                tryNextSource();
            }
        }, 5000);
    });

    video.addEventListener('loadedmetadata', function() {
        console.log('[VideoScroll] Metadata loaded, duration:', video.duration);
        isVideoLoaded = true;
        updateVideoProgress();
    });

    video.addEventListener('canplay', function() {
        isVideoLoaded = true;
    });

    function initVideo() {
        if (!video.src && sources.length > 0) {
            video.src = sources[0].src;
        }
        video.load();
        var pp = video.play();
        if (pp !== undefined) {
            pp.then(function() {
                video.pause();
                updateVideoProgress();
            }).catch(function(err) {
                console.log('[VideoScroll] Initial play prevented:', err.message);
            });
        }
    }

    let ticking = false;
    let lastScrollTime = 0;
    const scrollThrottle = 16;

    function updateVideoProgress() {
        if (!isVideoLoaded || !video.duration || isNaN(video.duration)) return;

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        let progress = 0;
        if (docHeight > 0) {
            progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);
        }

        const targetTime = progress * video.duration;
        const diff = Math.abs(video.currentTime - targetTime);
        
        if (diff > 0.5) {
            video.currentTime = targetTime;
        } else {
            video.currentTime += (targetTime - video.currentTime) * 0.3;
        }

        if (progress >= 0.998) {
            if (!video.paused) video.pause();
        } else {
            if (video.paused && !document.hidden) {
                video.play().catch(function() {});
            }
        }
    }

    function onScroll() {
        const now = Date.now();
        if (now - lastScrollTime < scrollThrottle) return;
        lastScrollTime = now;
        if (!ticking) {
            requestAnimationFrame(function() {
                updateVideoProgress();
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            video.pause();
        } else if (isVideoLoaded) {
            onScroll();
        }
    });

    var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
        video.playbackRate = 0.5;
    }

    if (video.readyState >= 1 && video.duration) {
        isVideoLoaded = true;
        updateVideoProgress();
    } else {
        initVideo();
    }

    setTimeout(function() {
        if (!isVideoLoaded && !hasError) {
            activateFallback('timeout');
        }
    }, 8000);

    console.log('[VideoScroll] Initialized');
})();

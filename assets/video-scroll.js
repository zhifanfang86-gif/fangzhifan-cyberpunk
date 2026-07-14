// 视频滚动播放控制 - 纯滚动驱动，不自动播放
(function() {
    const video = document.getElementById('scroll-video');
    if (!video) return;

    // 视频加载失败时的 fallback
    const fallback = document.getElementById('video-fallback');
    let sourceIndex = 0;
    const sources = video.querySelectorAll('source');

    function activateFallback() {
        if (fallback) fallback.classList.add('active');
        video.style.display = 'none';
    }

    function tryNextSource() {
        sourceIndex++;
        if (sourceIndex < sources.length) {
            video.src = sources[sourceIndex].src;
            video.load();
        } else {
            activateFallback();
        }
    }

    video.addEventListener('error', tryNextSource);
    video.addEventListener('stalled', () => {
        setTimeout(() => {
            if (video.readyState < 2) tryNextSource();
        }, 3000);
    });

    // 确保视频暂停，由滚动控制时间
    video.pause();
    video.removeAttribute('loop');

    let ticking = false;
    let lastScrollTime = 0;
    const scrollThrottle = 50; // ms

    function updateVideoProgress() {
        const now = Date.now();
        if (now - lastScrollTime < scrollThrottle) return;
        lastScrollTime = now;

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return;

        // 计算滚动进度 (0 ~ 1)
        const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);

        // 根据滚动进度设置视频播放时间
        if (video.duration && !isNaN(video.duration)) {
            video.currentTime = progress * video.duration;
        }
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateVideoProgress();
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    video.addEventListener('loadedmetadata', updateVideoProgress);
    if (video.readyState >= 1) updateVideoProgress();

    // 页面可见性控制：隐藏时暂停以节省资源
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            video.pause();
        }
    });
})();

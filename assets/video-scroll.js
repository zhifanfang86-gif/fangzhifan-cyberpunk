// 视频滚动播放控制
(function() {
    const video = document.getElementById('scroll-video');
    if (!video) return;

    // 确保视频可以播放
    video.play().catch(() => {});
    video.pause();

    let isScrollLocked = false;
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
            const targetTime = progress * video.duration;
            
            // 如果差异较大，直接设置；否则平滑过渡
            const diff = Math.abs(video.currentTime - targetTime);
            if (diff > 0.5) {
                video.currentTime = targetTime;
            } else {
                video.currentTime += (targetTime - video.currentTime) * 0.3;
            }
        }

        // 根据滚动速度控制播放/暂停
        if (!video.paused && progress >= 0.99) {
            video.pause();
        } else if (video.paused && progress < 0.99) {
            video.play().catch(() => {});
        }
    }

    // 使用 requestAnimationFrame 优化滚动性能
    let ticking = false;
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateVideoProgress();
                ticking = false;
            });
            ticking = true;
        }
    }

    // 监听滚动
    window.addEventListener('scroll', onScroll, { passive: true });

    // 视频加载完成后初始化
    video.addEventListener('loadedmetadata', () => {
        updateVideoProgress();
    });

    // 如果视频已经加载完成
    if (video.readyState >= 1) {
        updateVideoProgress();
    }

    // 触摸设备优化：降低视频帧率
    const isTouchDevice = 'ontouchstart' in window;
    if (isTouchDevice) {
        video.playbackRate = 0.5;
    }

    // 页面可见性控制
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            video.pause();
        } else {
            onScroll();
        }
    });
})();

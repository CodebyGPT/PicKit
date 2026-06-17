// 模块 17: 烟花粒子特效 (Festival Particle Effects)

// 春节/圣诞 彩蛋逻辑判断
function getFestivalType() {
    const now = new Date();
    // 1. 尝试检测农历 (Chinese Lunar)
    try {
        const formatter = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", { month: "numeric", day: "numeric" });
        if (formatter.resolvedOptions().calendar === 'chinese') {
            const parts = formatter.formatToParts(now);
            const monthPart = parts.find(p => p.type === 'month').value;
            const dayPart = parts.find(p => p.type === 'day').value;

            const isLunarJan = monthPart.includes('正') || monthPart.replace(/[^\d]/g, '') === '1';
            const day = parseInt(dayPart.replace(/[^\d]/g, ''));

            if (isLunarJan && day === 1) return 'CNY';
            return 'NONE';
        }
    } catch (e) {}

    // 2. 回退逻辑：公历 12月25日 圣诞
    if (now.getMonth() === 11 && now.getDate() === 25) {
        return 'XMAS';
    }

    return 'NONE';
}

// 触发烟花特效
function triggerSpringFestivalEffect(x, y, shadowRoot) {
    const festival = getFestivalType();
    if (festival === 'NONE') return;

    let colors = [];
    if (festival === 'CNY') {
        colors = ['#FF0000', '#FFD700', '#FF4500', '#DC143C', '#FFFF00'];
    } else if (festival === 'XMAS') {
        colors = ['#FF0000', '#228B22', '#FFD700', '#FFFFFF', '#006400'];
    }

    const activeColors = [];
    for (let i = 0; i < 3; i++) {
        activeColors.push(colors[Math.floor(Math.random() * colors.length)]);
    }

    const particleCount = 20 + Math.floor(Math.random() * 21);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        const size = 4 + Math.random() * 3;
        const color = activeColors[Math.floor(Math.random() * activeColors.length)];

        p.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 2147483647;
            box-shadow: 0 0 6px ${color};
            will-change: transform, opacity;
        `;

        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        let opacity = 1.0;
        const gravity = 0.2 + Math.random() * 0.1;
        const friction = 0.96;
        const decay = 0.01 + Math.random() * 0.02;

        let posX = x;
        let posY = y;

        const animate = () => {
            if (opacity <= 0) {
                p.remove();
                return;
            }
            vx *= friction;
            vy *= friction;
            vy += gravity;
            posX += vx;
            posY += vy;
            opacity -= decay;

            p.style.transform = `translate(${posX - x}px, ${posY - y}px)`;
            p.style.opacity = opacity;
            requestAnimationFrame(animate);
        };

        fragment.appendChild(p);
        requestAnimationFrame(animate);
    }
    shadowRoot.appendChild(fragment);
}

// 获取 Toast 提示文案
function getSpringFestivalToastText() {
    const festival = getFestivalType();
    if (festival === 'CNY') {
        return t('festival_cny');
    } else if (festival === 'XMAS') {
        return t('festival_xmas');
    }
    return t('toast_copied');
}

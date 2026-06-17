// 模块 12: 背景亮度检测与主题选择 (Background Brightness & Theme)

// 智能获取网页背景亮度，返回 'light' 或 'dark' 以决定 UI 主题
// 逻辑：网页背景深 -> 返回 'light' (浅色UI)；网页背景浅 -> 返回 'dark' (深色UI)
function getBestContrastTheme() {
    const getBgColor = (el) => {
        if (!el) return null;
        const style = window.getComputedStyle(el);
        return style.backgroundColor;
    };

    const getBrightness = (colorStr) => {
        if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') return null;
        const match = colorStr.match(/(\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return null;
        const [r, g, b] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        // 计算亮度 (YIQ公式)，结果 0~255，越小越暗
        return (r * 299 + g * 587 + b * 114) / 1000;
    };

    // 1. 优先检测 body 背景
    let brightness = getBrightness(getBgColor(document.body));

    // 2. 如果 body 透明，检测 html (documentElement) 背景
    if (brightness === null) {
        brightness = getBrightness(getBgColor(document.documentElement));
    }

    // 3. 如果 html 也透明，回退到系统深色模式偏好
    if (brightness === null) {
        const sysIsDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return sysIsDark ? 'theme-light-ui' : 'theme-dark-ui';
    }

    // 4. 亮度 < 128 (深色背景) -> 用 'theme-light-ui' (浅色按钮)
    return brightness < 128 ? 'theme-light-ui' : 'theme-dark-ui';
}

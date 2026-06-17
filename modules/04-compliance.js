// 模块 04: 编辑模式与合规声明 (Edit Mode & Compliance Banner)

// 编辑模式状态
let isEditMode = false;
let hasEditSessionStarted = false; // 标记本次会话是否启用过编辑模式
let complianceObserver = null;
let currentBannerId = null;

// 生成随机ID (防拦截)
const generateRandomId = () => 'tm-sc-' + Math.random().toString(36).slice(2, 9);

// 创建/重建合规声明
function ensureComplianceBanner() {
    if (!hasEditSessionStarted) return; // 如果从未启动过编辑模式，不生成

    // 1. 检查是否已存在
    const existing = currentBannerId ? document.getElementById(currentBannerId) : null;
    if (existing && existing.offsetParent !== null) return;// 如果存在且看起来正常（display不是none），则跳过
    if (existing) existing.remove();// 如果存在但被隐藏了，或者不存在，则继续重建逻辑

    // 2. 如果之前有Observer，先断开，避免重新插入时死循环
    if (complianceObserver) {
        complianceObserver.disconnect();
    }

    // 3. 创建元素
    const scriptName = GM_info.script.name;
    const banner = document.createElement('div');
    currentBannerId = generateRandomId();
    banner.id = currentBannerId;

    banner.setAttribute('data-tm-policy', 'protected'); // [关键] 添加特殊策略标记，用于 CSS 排除
    banner.setAttribute('contenteditable', 'false');

    // 样式：高层级、半透明白底、浅灰字、底部居中、禁止选中、穿透点击(防Picker)
    banner.style.cssText = `
        position: fixed !important;
        bottom: 50px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 2147483647 !important;
        background: rgba(255, 255, 255, 0.85) !important;
        padding: 6px 14px !important;
        border-radius: 6px !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08) !important;
        pointer-events: none !important; /* 让鼠标穿透，既不影响浏览，也防止被拾取器选中 */
        user-select: none !important;
        -webkit-user-select: none !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        visibility: visible !important;
        opacity: 1 !important;
        width: auto !important;
        height: auto !important;
        border: 1px solid rgba(0,0,0,0.05) !important;
    `;

    // SVG 图标 (Info)
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = 'display:flex;align-items:center;color:#888;pointer-events:none;';
    iconContainer.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    banner.appendChild(iconContainer);

    // 2. 文本 (使用 Canvas 绘制，防篡改)
    const textStr = t('disclaimer_text').replace('<SCRIPT_NAME>', scriptName);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 12;
    const fontFamily = 'sans-serif';

    // 测量文本宽度
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(textStr);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(fontSize * 1.2); // 留一点行高

    // 设置 Canvas 尺寸 (考虑高分屏清晰度，使用 2x 缩放)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = textWidth * dpr;
    canvas.height = textHeight * dpr;
    canvas.style.width = `${textWidth}px`;
    canvas.style.height = `${textHeight}px`;
    canvas.style.pointerEvents = 'none';

    // 绘制
    ctx.scale(dpr, dpr);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#999';
    ctx.textBaseline = 'middle';
    ctx.fillText(textStr, 0, textHeight / 2 + 1); // +1 微调垂直居中

    banner.appendChild(canvas);
    document.body.appendChild(banner);

    // 4. 启动被动监视 (MutationObserver)
    complianceObserver = new MutationObserver((mutations) => {
        let needsRebuild = false;
        mutations.forEach(m => {
            // 如果节点被移除
            if (m.removedNodes.length) {
                m.removedNodes.forEach(node => {
                    if (node.id === currentBannerId) needsRebuild = true;
                });
            }
            // 如果属性被篡改 (如 style set to none)
            if (m.target.id === currentBannerId) {
                needsRebuild = true;
            }
            // 子节点变化 (例如 Canvas 被删除了)
            if (m.target.id === currentBannerId && m.type === 'childList') needsRebuild = true;
        });

        if (needsRebuild) { // 异步重建防止死锁
            // 只要检测到针对Banner的任何改动，立即销毁旧的并重建
            setTimeout(() => { // 使用 setTimeout 避免在Observer回调中同步操作DOM
                const old = document.getElementById(currentBannerId); // 销毁旧的引用（如果还在DOM里但被改了）
                if (old) old.remove();
                // 立即重建
                ensureComplianceBanner();
            }, 0);
        }
    });

    complianceObserver.observe(document.body, { childList: true, subtree: false }); // 监控 body 子节点删除
    // 监视 banner 自身的属性变化 (防止通过 style="display:none" 隐藏)
    setTimeout(() => { // 注意：这里需要再次获取最新的 banner 引用
        const b = document.getElementById(currentBannerId);
        if (b && complianceObserver) {
            complianceObserver.observe(b, { attributes: true, attributeFilter: ['style', 'class', 'hidden', 'id', 'data-tm-policy', 'contenteditable'], childList: true, subtree: true });
        }
    }, 0);
}

// 切换编辑模式
function toggleEditMode(enable) {
    if (isEditMode === enable) return;
    isEditMode = enable;

    if (isEditMode) {
        hasEditSessionStarted = true; // 标记会话已开始，此后 Banner 即使退出编辑模式也会常驻
        document.designMode = 'on';
        ensureComplianceBanner();
        showToast(t('menu_edit') + ': ' + t('val_on'));
    } else {
        document.designMode = 'off';
        showToast(t('menu_exit_edit'));
        hideUI(); // 隐藏可能残留的按钮

        ensureComplianceBanner();  // 确保 Banner 依然存在 (防止在切换瞬间被误删)
    }
}

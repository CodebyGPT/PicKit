// 模块 10: 超级取词模式 (Unlock Mode / Super Selection)

let isUnlockMode = false;
let unlockStyleEl = null;
let startPos = { x: 0, y: 0 };
const modifiedElements = new Set(); //追踪受影响元素的集合

// 动态CSS：强制文本可选，屏蔽拖拽，屏蔽指针事件限制等
function getUnlockCSS() {
    return `
        /* --- 1. 全局强制可选 (分离 cursor 设置) --- */
        html, body, *:not([data-tm-policy="protected"]), [unselectable] {
            user-select: text !important;
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
        }

        /* 修复：html/body 保持 default cursor，防止全局污染 */
        html, body {
            cursor: default !important;
        }

        /* 修复：仅为实际文本元素设置 text cursor */
        p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, pre, code,
        blockquote, article, section, main, aside, header, footer,
        nav, figcaption, label, time, mark, em, strong, i, b, u,
        s, small, cite, dfn, abbr, data, q, sub, sup, kbd, samp,
        var, output, details, summary, address, dl, dt, dd,
        fieldset, legend, caption, tbody, thead, tfoot, tr,
        button:not([disabled]),
        a:not([data-tm-policy="protected"]) {
            cursor: text !important;
        }

        /* 强制高亮颜色 */
        ::selection {background-color: #3390FF !important;color: #ffffff !important;text-shadow: none !important;}
        ::-moz-selection {background-color: #3390FF !important;color: #ffffff !important;text-shadow: none !important;}

        /* 让链接看起来像普通文本，且禁止图片/链接被拖拽（干扰划词） */
        a:not([data-tm-policy="protected"]),
        a *:not([data-tm-policy="protected"]),
        img:not([data-tm-policy="protected"]){
            pointer-events: auto !important;
            user-drag: none !important;
            -webkit-user-drag: none !important;
            text-decoration: none !important;
        }

        /* 禁用常见的透明遮罩层交互，让鼠标穿透到下方文字 */
        div[style*="z-index"][style*="fixed"]:not([data-tm-policy="protected"]),
        div[style*="z-index"][style*="absolute"]:not([data-tm-policy="protected"]) {
            pointer-events: none !important;
        }

        /* 修复：增强 pointer-events 恢复逻辑，覆盖更多容器类型 */
        div:not([data-tm-policy="protected"]),
        article:not([data-tm-policy="protected"]),
        main:not([data-tm-policy="protected"]),
        section:not([data-tm-policy="protected"]),
        aside:not([data-tm-policy="protected"]),
        header:not([data-tm-policy="protected"]),
        footer:not([data-tm-policy="protected"]),
        nav:not([data-tm-policy="protected"]),
        figure:not([data-tm-policy="protected"]),
        figcaption:not([data-tm-policy="protected"]),
        details:not([data-tm-policy="protected"]),
        summary:not([data-tm-policy="protected"]),
        fieldset:not([data-tm-policy="protected"]),
        dialog:not([data-tm-policy="protected"]),
        p:not([data-tm-policy="protected"]),
        span:not([data-tm-policy="protected"]),
        h1:not([data-tm-policy="protected"]), h2:not([data-tm-policy="protected"]),
        h3:not([data-tm-policy="protected"]), h4:not([data-tm-policy="protected"]),
        h5:not([data-tm-policy="protected"]), h6:not([data-tm-policy="protected"]),
        em:not([data-tm-policy="protected"]), strong:not([data-tm-policy="protected"]),
        i:not([data-tm-policy="protected"]), b:not([data-tm-policy="protected"]),
        td:not([data-tm-policy="protected"]), li:not([data-tm-policy="protected"]),
        code:not([data-tm-policy="protected"]), pre:not([data-tm-policy="protected"]) {
            pointer-events: auto !important;
        }

        /* 针对被截断文本展开后的样式：隐藏滚动条但保留滚动功能 */
        .tm-sc-expanded {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
        }
        .tm-sc-expanded::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
        }

        a.absolute, a[style*="position: absolute"] { pointer-events: none !important; }

        /* 保护标记优先级最高 */
        [data-tm-policy="protected"][data-tm-policy="protected"][data-tm-policy="protected"],
        [data-tm-policy="protected"][data-tm-policy="protected"][data-tm-policy="protected"] * {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            pointer-events: none !important;
            cursor: default !important;
            z-index: 2147483647 !important;
        }
    `;
}

// 检查是否为受保护元素
function isProtectedElement(target) {
    return target && target.closest && target.closest('[data-tm-policy="protected"]');
}

function handleCaptureSelectStart(e) {
    if (!isUnlockMode) return;
    if (isProtectedElement(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
    }
    e.stopPropagation();
    e.stopImmediatePropagation();
}

// 拦截点击事件：如果是拖拽操作或点击链接，则阻止
function handleCaptureClick(e) {
    if (!isUnlockMode) return;
    if (isProtectedElement(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
    }
    const dx = Math.abs(e.clientX - startPos.x);
    const dy = Math.abs(e.clientY - startPos.y);
    const isDrag = dx > 3 || dy > 3;

    let target = e.target;
    let isLink = false;
    while (target && target !== document) {
        if (target.tagName === 'A') {
            isLink = true;
            break;
        }
        target = target.parentNode;
    }
    if (isDrag || isLink) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
}

// 鼠标按下时按需处理当前元素
function handleCaptureMouseDown(e) {
    if (!isUnlockMode) return;
    if (isProtectedElement(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
    }
    const el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        try {
            if (el.type === 'password') {
                el.dataset.scOriginalType = 'password';
                el.type = 'text';
                modifiedElements.add(el);
            }
            if (el.disabled) {
                el.disabled = false;
                el.dataset.scWasDisabled = 'true';
                modifiedElements.add(el);
            }
            if (el.readOnly) {
                el.readOnly = false;
                el.dataset.scWasReadOnly = 'true';
                modifiedElements.add(el);
            }
        } catch (err) {}
    }
    startPos = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
    e.stopImmediatePropagation();
}

function handleCaptureDragStart(e) {
    if (!isUnlockMode) return;
    e.preventDefault();
    e.stopPropagation();
}

function handleCaptureCopy(e) {
    if (!isUnlockMode) return;
    e.stopImmediatePropagation();
}

function handleCaptureSelectionChange(e) {
    if (!isUnlockMode) return;
    e.stopPropagation();
    e.stopImmediatePropagation();
}

function cleanInlineEvents() {
    const targets = [document.documentElement, document.body];
    const events = ['onselectstart', 'onmousedown', 'oncontextmenu', 'oncopy'];
    targets.forEach(el => {
        if (!el) return;
        events.forEach(evt => {
            if (el.hasAttribute(evt)) {
                el.removeAttribute(evt);
            }
            if (el[evt]) {
                el[evt] = null;
            }
        });
    });
}

// 鼠标悬停时智能展开截断文本
function handleExpandHover(e) {
    if (!isUnlockMode) return;
    let target = e.target;
    if (target.nodeType !== 1 || target.classList.contains('tm-sc-expanded')) return;

    const style = window.getComputedStyle(target);
    const isEllipsis = style.textOverflow === 'ellipsis';
    const isLineClamp = style.webkitLineClamp && style.webkitLineClamp !== 'none';

    if (isEllipsis || isLineClamp) {
        const rect = target.getBoundingClientRect();
        target.style.setProperty('height', rect.height + 'px', 'important');
        target.style.setProperty('width', rect.width + 'px', 'important');
        target.classList.add('tm-sc-expanded');

        if (isLineClamp) {
            target.style.setProperty('-webkit-line-clamp', 'none', 'important');
            target.style.setProperty('overflow-y', 'auto', 'important');
        } else {
            target.style.setProperty('text-overflow', 'clip', 'important');
            target.style.setProperty('overflow-x', 'auto', 'important');
            target.style.setProperty('white-space', 'nowrap', 'important');
        }
    }
}

// 退出模式时清理所有展开的元素
function cleanupExpandedElements() {
    const elements = document.querySelectorAll('.tm-sc-expanded');
    elements.forEach(el => {
        el.scrollTop = 0;
        el.scrollLeft = 0;
        el.classList.remove('tm-sc-expanded');
        el.style.removeProperty('height');
        el.style.removeProperty('width');
        el.style.removeProperty('-webkit-line-clamp');
        el.style.removeProperty('overflow-y');
        el.style.removeProperty('overflow-x');
        el.style.removeProperty('text-overflow');
        el.style.removeProperty('white-space');
    });
}

// 开启/关闭模式
function toggleUnlockMode(active) {
    if (active === isUnlockMode) return;
    isUnlockMode = active;

    if (active) {
        if (!unlockStyleEl) {
            unlockStyleEl = document.createElement('style');
            unlockStyleEl.textContent = getUnlockCSS();
            unlockStyleEl.id = 'tm-smart-copy-unlock-style';
        }
        (document.documentElement || document.body).appendChild(unlockStyleEl);
        cleanInlineEvents();

        window.addEventListener('selectstart', handleCaptureSelectStart, true);
        window.addEventListener('click', handleCaptureClick, true);
        window.addEventListener('mousedown', handleCaptureMouseDown, true);
        window.addEventListener('dragstart', handleCaptureDragStart, true);
        window.addEventListener('copy', handleCaptureCopy, true);
        window.addEventListener('contextmenu', handleCaptureCopy, true);
        document.addEventListener('selectionchange', handleCaptureSelectionChange, true);
        document.addEventListener('mouseover', handleExpandHover, true);

        showToast(t('toast_unlock'));
    } else {
        if (unlockStyleEl && unlockStyleEl.parentNode) {
            unlockStyleEl.parentNode.removeChild(unlockStyleEl);
        }

        modifiedElements.forEach(el => {
            try {
                if (el.dataset.scOriginalType === 'password') {
                    el.type = 'password';
                    delete el.dataset.scOriginalType;
                }
                if (el.dataset.scWasDisabled === 'true') { el.disabled = true; delete el.dataset.scWasDisabled; }
                if (el.dataset.scWasReadOnly === 'true') { el.readOnly = true; delete el.dataset.scWasReadOnly; }
            } catch (e) {}
        });
        modifiedElements.clear();

        window.removeEventListener('selectstart', handleCaptureSelectStart, true);
        window.removeEventListener('mousedown', handleCaptureMouseDown, true);
        window.removeEventListener('click', handleCaptureClick, true);
        window.removeEventListener('dragstart', handleCaptureDragStart, true);
        window.removeEventListener('copy', handleCaptureCopy, true);
        window.removeEventListener('contextmenu', handleCaptureCopy, true);
        document.removeEventListener('selectionchange', handleCaptureSelectionChange, true);
        document.removeEventListener('mouseover', handleExpandHover, true);
        cleanupExpandedElements();

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            sel.removeAllRanges();
        }
        const toast = shadowRoot && shadowRoot.querySelector('.sc-toast');
        if (toast) toast.classList.remove('show');
    }
}

// 键盘监听
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isEditMode) {
        toggleEditMode(false);
        return;
    }
    const hotkey = getConfig('unlockHotkey');
    if (!hotkey) return;
    if (e.code === hotkey || e.key === hotkey) {
        if (!isUnlockMode) toggleUnlockMode(true);
    }
});

document.addEventListener('keyup', (e) => {
    const hotkey = getConfig('unlockHotkey');
    if (!hotkey) return;
    if (e.code === hotkey || e.key === hotkey) {
        if (isUnlockMode) toggleUnlockMode(false);
    }
});

window.addEventListener('blur', () => {
    if (isUnlockMode) toggleUnlockMode(false);
});

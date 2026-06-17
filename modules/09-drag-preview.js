// 模块 09: 拖拽链接预览子系统 (Drag Preview Subsystem)

let dragStartData = null; // 临时存储拖拽起点数据
const PREVIEW_WIN_NAME = 'PicKitPreviewWindow';

// 1. 处理拖拽开始
function handleLinkDragStart(e) {
    if (!getConfig('enableDragPreview')) return;

    // 精确判断：必须是左键拖拽，且目标是超链接（或在超链接内部）
    const link = e.target.closest('a[href]');

    // 排除无效链接（如 javascript:void(0) 或锚点）
    if (!link || !link.href || link.href.startsWith('javascript:') || link.href.startsWith('#')) {
        dragStartData = null;
        return;
    }

    dragStartData = {
        url: link.href,
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
    };
}

// 2. 处理拖拽结束
function handleLinkDragEnd(e) {
    if (!dragStartData) return;

    const { x: startX, y: startY, url } = dragStartData;
    const endX = e.clientX;
    const endY = e.clientY;

    /* ---------- 1. 视口外松开直接放弃 ---------- */
    if (
        endX < 0 || endY < 0 ||
        endX > window.innerWidth || endY > window.innerHeight
    ) {
        dragStartData = null;
        return;
    }

    /* ---------- 2. 输入区 / 富文本 / 拖放容器 过滤 ---------- */
    const target = document.elementFromPoint(endX, endY);
    if (target) {
        // 2-1 输入框
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            dragStartData = null;
            return;
        }
        // 2-2 富文本编辑
        if (target.closest('[contenteditable="true"]')) {
            dragStartData = null;
            return;
        }
        // 2-3 具有 dragover / drop 事件的容器
        const dropZone = target.closest('[ondragover],[ondrop]');
        if (dropZone) {
            dragStartData = null;
            return;
        }
    }

    /* ---------- 3. 距离阈值判断 ---------- */
    const dist = Math.hypot(endX - startX, endY - startY);
    if (dist > 30) openPreviewWindow(url); // 距离阈值：30px
    // 清理数据
    dragStartData = null;
}

// 3. 打开预览窗口
async function openPreviewWindow(url) {
    const screen = window.screen;
    const screenW = screen.availWidth;
    const screenH = screen.availHeight;
    const screenLeft = screen.availLeft || 0;
    const screenTop = screen.availTop || 0;

    // 黄金分割比
    const GOLDEN_RATIO = 0.618;

    const width = Math.round(screenW * GOLDEN_RATIO);
    const height = Math.round(screenH * GOLDEN_RATIO);

    const left = screenLeft + (screenW - width) / 2;
    const top = screenTop + (screenH - height) / 2;

    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`;
    window.open(url, PREVIEW_WIN_NAME, features);
}

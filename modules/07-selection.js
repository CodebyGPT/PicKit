// 模块 07: 选区定位计算器 (Selection Geometry Calculator)
// 三级降级策略：智能Rect -> 整体包围盒 -> 鼠标位置

function getSmartSelectionState(selection, mouseEvent) {
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    // 1. 尝试获取精细的矩形列表 (可能为空，特别是在 Input/Textarea 或 框架更新DOM时)
    let rects = range.getClientRects();

    let targetRect = null;
    let isBackward = false;
    let isVertical = false;

    // --- 阶段 A: 智能精确定位 (Smart Directional) ---
    if (rects.length > 0) {
        const anchor = selection.anchorNode;
        const focus = selection.focusNode;

        // 判定选区方向
        if (anchor === focus) {
            isBackward = selection.anchorOffset > selection.focusOffset;
        } else {
            // 使用位掩码判定节点位置
            const pos = anchor.compareDocumentPosition(focus);
            if (pos & Node.DOCUMENT_POSITION_PRECEDING) isBackward = true;
        }

        // 判定垂直排版 (仅检查 focusNode)
        let focusEl = focus.nodeType === 1 ? focus : focus.parentElement;
        if (focusEl) {
            const style = window.getComputedStyle(focusEl);
            const writingMode = style.writingMode || 'horizontal-tb';
            isVertical = writingMode.startsWith('vertical');
        }

        // 根据方向获取头或尾的 Rect
        targetRect = isBackward ? rects[0] : rects[rects.length - 1];
    }

    // 辅助函数：检测 Rect 是否无效 (0x0 且位于 0,0 通常意味着节点已脱离文档流)
    const isInvalidRect = (r) => {
        return !r || (r.width === 0 && r.height === 0 && r.top === 0 && r.left === 0);
    };

    // --- 阶段 B: 经典包围盒兜底 (Classic Bounding Box) ---
    if (isInvalidRect(targetRect)) {
        const bounding = range.getBoundingClientRect();
        // 只有当 bounding 也是有效的时候才使用
        if (!isInvalidRect(bounding)) {
            targetRect = bounding;
            isBackward = false;
            isVertical = false;
        }
    }

    // --- 阶段 C: 鼠标坐标兜底 (Mouse Position Fallback) ---
    if (isInvalidRect(targetRect) && mouseEvent) {
        const size = 20; // 模拟一个光标高度
        targetRect = {
            top: mouseEvent.clientY - size,
            bottom: mouseEvent.clientY,
            left: mouseEvent.clientX,
            right: mouseEvent.clientX,
            width: 0,
            height: size,
            x: mouseEvent.clientX,
            y: mouseEvent.clientY - size
        };
        isBackward = false;
        isVertical = false;
    }

    // 如果所有尝试都失败（极罕见），返回 null
    if (isInvalidRect(targetRect)) return null;

    return {
        rect: targetRect,
        isBackward: isBackward,
        isVertical: isVertical
    };
}

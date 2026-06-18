// 模块 19: 启动引导 (Bootstrap)

// 闪电粘贴条件式 visibilitychange 清理 (动态注册/注销)
// 复制/剪切写入缓存时注销监听，粘贴重置时间戳时注册监听
// 页面隐藏时写入过期缓存覆盖 (严禁主动删除，只允许单向覆盖)
// 注意：这两个函数必须定义在全局作用域，因为 renderButton 中的 onclick 回调需要访问它们
let _visibilityChangeHandler = null;

function registerVisibilityCleanup() {
    if (_visibilityChangeHandler) return;
    _visibilityChangeHandler = async () => {
        if (document.visibilityState === 'hidden') {
            if (getConfig('enablePaste')) {
                await safeSetValue('smart_paste_cache', { text: '', timestamp: 0 });
            }
            unregisterVisibilityCleanup();
        }
    };
    document.addEventListener('visibilitychange', _visibilityChangeHandler, false);
}

function unregisterVisibilityCleanup() {
    if (_visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', _visibilityChangeHandler, false);
        _visibilityChangeHandler = null;
    }
}

(function () {
    'use strict';

    (async function main() {
        try {
            // 1. 等待配置加载
            await initConfiguration();

            // 首次运行时根据读取到的时区设置默认搜索引擎
            await initDefaultSearchEngine();

            // 2. 配置加载完后，再注册菜单 (这样菜单里的 getConfig 才能读到正确的值)
            registerMenus();

            // 3. 应用屏蔽规则
            applySavedBlockingRules();

            // 4. unlock mode 下，智能拦截 Ctrl+滚轮
            const handleWheelZoom = (e) => {
                if (!e.ctrlKey || !isUnlockMode) return;

                const hotkey = getConfig('unlockHotkey') || '';
                const isCtrlConfigured = hotkey.includes('Control') || hotkey.toLowerCase() === 'ctrl';

                if (isCtrlConfigured) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.scrollBy({
                        top: e.deltaY,
                        behavior: 'auto'
                    });
                }
            };
            window.addEventListener('wheel', handleWheelZoom, { passive: false, capture: true });

            // 5. 统一注册所有事件监听器
            document.addEventListener('mouseup', handleSelectionMouseUp, false);
            document.addEventListener('mouseup', handleInputPasteMouseUp, true);
            document.addEventListener('mousedown', handleGlobalMouseDown, false);
            document.addEventListener('contextmenu', handleContextMenu, true);
            window.addEventListener('scroll', handleResizeOrScroll, { passive: true });
            window.addEventListener('resize', handleResizeOrScroll, { passive: true });
            document.addEventListener('keydown', handleKeydownHideUI, true);

            // 6. 拖拽预览事件监听 (仅在主窗口生效)
            if (window.name !== PREVIEW_WIN_NAME) {
                document.addEventListener('dragstart', handleLinkDragStart, false);
                document.addEventListener('dragend', handleLinkDragEnd, false);
            }

        } catch (e) {
            //console.error('Smart Copy 启动失败:', e);
        }
    })();
})();

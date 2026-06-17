// 模块 19: 启动引导 (Bootstrap)

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

            // 7. 页面隐藏时清理闪电粘贴缓存
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    if (getConfig('enablePaste')) {
                        safeSetValue('smart_paste_cache', null);
                        sessionPanCode = null;
                        safeSetValue('pan_paste_handover', null);
                    }
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange, false);

            // 8. 启动码字防丢监听
            document.addEventListener('input', handleInputSave, true);
            document.addEventListener('submit', handleFormSubmit, true);

            if (document.readyState === 'complete') {
                setTimeout(restoreInputData, 500);
            } else {
                window.addEventListener('load', () => setTimeout(restoreInputData, 500));
            }

            // 9. 检查是否有来自网盘链接的密码交接
            const checkPanHandover = async () => {
                if (!getConfig('enablePaste')) return;

                const handover = await safeGetValue('pan_paste_handover', null);
                if (handover && handover.code) {
                    if (Date.now() - handover.timestamp < 15000) {
                        try {
                            const currentUrl = window.location.href;
                            const targetUrlObj = new URL(handover.url);

                            if (currentUrl.includes(targetUrlObj.host)) {
                                sessionPanCode = handover.code;
                                safeSetValue('pan_paste_handover', null);
                                showToast(`${t('btn_paste') || 'Paste'} Code: ${sessionPanCode}`);
                            }
                        } catch (e) {}
                    }
                }
            };
            setTimeout(checkPanHandover, 300);

        } catch (e) {
            //console.error('Smart Copy 启动失败:', e);
        }
    })();
})();

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

            // 7. 页面隐藏时清理闪电粘贴缓存 (网盘密码缓存不清理，无过期限制)
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    if (getConfig('enablePaste')) {
                        safeSetValue('smart_paste_cache', null);
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
            // 9. 检查网盘密码映射 (按URL前缀匹配消费；过期清理由cleanExpiredPanEntries在读写时顺带完成)
            const checkPanCodeMap = async () => {
                if (!getConfig('enablePaste')) return;

                const map = cleanExpiredPanEntries(await safeGetValue('pan_code_map', {}));
                if (Object.keys(map).length === 0) return;

                const currentUrl = window.location.href;
                let consumed = false;

                for (const storedUrl of Object.keys(map)) {
                    if (currentUrl.includes(storedUrl.replace(/^https?:\/\//, '').split('/')[0])) {
                        sessionPanCode = map[storedUrl].code;
                        delete map[storedUrl];
                        consumed = true;
                        if (getConfig('enableToast')) {
                            showToast(`${t('btn_paste') || 'Paste'} Code: ${sessionPanCode}`);
                        }
                        break;
                    }
                }

                if (consumed) {
                    await safeSetValue('pan_code_map', map);
                }
            };
            setTimeout(checkPanCodeMap, 300);

        } catch (e) {
            //console.error('Smart Copy 启动失败:', e);
        }
    })();
})();

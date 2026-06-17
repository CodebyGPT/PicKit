// 模块 13: 按钮渲染引擎 (Button Renderer)

// 渲染按钮 (支持 Copy/Search 模式 和 Paste 模式)
function renderButton(rect, mouseX, mouseY, text, html, mode = 'default', targetInput = null, isEditable = false) {
    // 清理旧的
    const oldBtn = shadowRoot.querySelector('.sc-container');
    if (oldBtn) oldBtn.remove();

    const container = document.createElement('div');
    container.className = 'sc-container';

    // 智能背景色检测与主题应用
    const forceWB = getConfig('forceWhiteBlack');
    if (forceWB) {
        container.classList.add('theme-light-ui');
    } else {
        const contrastTheme = getBestContrastTheme();
        container.classList.add(contrastTheme);
    }

    const isCol = getConfig('buttonStyle') === 'col';

    // 模式: 编辑模式 (Edit Mode)
    if (isEditMode) {
        // 1. 删除按钮
        const delBtn = document.createElement('div');
        delBtn.className = 'sc-btn';
        delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
        delBtn.title = t('btn_delete');
        delBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
        delBtn.onclick = (e) => {
            e.stopPropagation();
            document.execCommand('delete');
            hideUI();
        };
        container.appendChild(delBtn);

        const div1 = document.createElement('div');
        div1.className = isCol ? 'divider divider-h' : 'divider divider-v';
        container.appendChild(div1);

        // 2. 加粗按钮
        const boldBtn = document.createElement('div');
        boldBtn.className = 'sc-btn';
        boldBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>`;
        boldBtn.title = t('btn_bold');
        boldBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
        boldBtn.onclick = (e) => {
            e.stopPropagation();
            document.execCommand('bold');
        };
        container.appendChild(boldBtn);

        const div2 = document.createElement('div');
        div2.className = isCol ? 'divider divider-h' : 'divider divider-v';
        container.appendChild(div2);

        // 3. 标记按钮
        const highlightBtn = document.createElement('div');
        highlightBtn.className = 'sc-btn';
        highlightBtn.innerHTML = `<?xml version="1.0" encoding="UTF-8"?><svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 44L6 25H12V17H36V25H42V44H6Z" fill="none" stroke="#000000" stroke-width="4" stroke-linejoin="bevel"/><path d="M17 17V8L31 4V17" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="bevel"/></svg>`;
        highlightBtn.title = t('btn_highlight');
        highlightBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
        highlightBtn.onclick = (e) => {
            e.stopPropagation();
            if (!document.execCommand('hiliteColor', false, 'yellow')) {
                document.execCommand('backColor', false, 'yellow');
            }
            hideUI();
        };
        container.appendChild(highlightBtn);
    }
    // 模式 A: 默认模式
    else if (mode === 'default' || mode === PASTE_MODE_THREE_BTNS) {
        // 1. 复制按钮
        const copyBtn = document.createElement('div');
        copyBtn.className = 'sc-btn';
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        copyBtn.title = t('btn_copy');
        copyBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
        copyBtn.onclick = async (e) => {
            e.stopPropagation();
            triggerSpringFestivalEffect(e.clientX, e.clientY, shadowRoot);
            const contentToCopy = getConfig('enableCache') ? (cachedSelection.text || text) : text;
            const htmlToCopy = getConfig('enableCache') ? (cachedSelection.html || html) : html;
            await copyToClipboard(contentToCopy, htmlToCopy);
            if (getConfig('enablePaste')) {
                await safeSetValue('smart_paste_cache', {
                    text: contentToCopy,
                    timestamp: Date.now()
                });
            }
            showToast(getSpringFestivalToastText());
            setTimeout(hideUI, 50);
        };
        container.appendChild(copyBtn);

        const isInInput = targetInput !== null;

        // 2. 剪切按钮 (仅在编辑区显示)
        if (isInInput && !isEditMode) {
            const div = document.createElement('div');
            div.className = isCol ? 'divider divider-h' : 'divider divider-v';
            container.appendChild(div);

            const cutBtn = document.createElement('div');
            cutBtn.className = 'sc-btn';
            cutBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>`;
            cutBtn.title = t('btn_cut');
            cutBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
            cutBtn.onclick = async (e) => {
                e.stopPropagation();
                triggerSpringFestivalEffect(e.clientX, e.clientY, shadowRoot);
                const contentToCopy = getConfig('enableCache') ? (cachedSelection.text || text) : text;
                const htmlToCopy = getConfig('enableCache') ? (cachedSelection.html || html) : html;
                try {
                    const success = document.execCommand('cut');
                    if (!success) throw new Error('execCommand failed');
                } catch (err) {
                    await copyToClipboard(contentToCopy, htmlToCopy);
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        selection.getRangeAt(0).deleteContents();
                    }
                }
                if (getConfig('enablePaste')) {
                    await safeSetValue('smart_paste_cache', {
                        text: contentToCopy,
                        timestamp: Date.now()
                    });
                }
                setTimeout(hideUI, 35);
            };
            container.appendChild(cutBtn);
        }

        // 删除按钮 (输入区中)
        if (getConfig('enableDeleteBtn') && isInInput) {
            const div2 = document.createElement('div');
            div2.className = isCol ? 'divider divider-h' : 'divider divider-v';
            container.appendChild(div2);

            const delBtn = document.createElement('div');
            delBtn.className = 'sc-btn';
            delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
            delBtn.title = t('btn_delete');
            delBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
            delBtn.onclick = (e) => {
                e.stopPropagation();
                document.execCommand('delete');
                hideUI();
            };
            container.appendChild(delBtn);
        }
        // 搜索按钮 (仅在非编辑区且字数较少时显示)
        else if (!isInInput && !isEditMode && text.trim().length <= 32) {
            const div = document.createElement('div');
            div.className = isCol ? 'divider divider-h' : 'divider divider-v';
            container.appendChild(div);

            const searchBtn = document.createElement('div');
            searchBtn.className = 'sc-btn';
            searchBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
            searchBtn.title = t('btn_search');
            searchBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
            searchBtn.onclick = (e) => {
                e.stopPropagation();
                const query = getConfig('enableCache') ? (cachedSelection.text || text) : text;
                const rawText = getConfig('enableCache') ? (cachedSelection.text || text) : text;
                let engine;
                if (getConfig('smartEngine') && !/[\u4e00-\u9fa5]/.test(rawText)) {
                    engine = getConfig('fallbackEngine');
                } else {
                    engine = getConfig('searchEngine');
                }
                let url = SEARCH_ENGINES[engine] ? SEARCH_ENGINES[engine].url : (engine.includes('%s') ? engine : SEARCH_ENGINES['google'].url);
                safeOpenTab(url.replace('%s', encodeURIComponent(query.trim())), { active: true });
                setTimeout(hideUI, 50);
            };
            container.appendChild(searchBtn);
        }

        // 锁链按钮逻辑
        const activeEl = document.activeElement;
        const isUserEditing = activeEl && (
            (['INPUT', 'TEXTAREA'].includes(activeEl.tagName) && !activeEl.readOnly) ||
            activeEl.isContentEditable ||
            document.designMode === 'on'
        );
        if (!isUserEditing && !targetInput && mode !== PASTE_MODE_THREE_BTNS) {
            const linkData = extractLinkFromText(text);
            if (linkData) {
                const div = document.createElement('div');
                div.className = isCol ? 'divider divider-h' : 'divider divider-v';
                container.appendChild(div);

                const chainBtn = document.createElement('div');
                chainBtn.className = 'sc-btn';
                chainBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
                chainBtn.title = t('btn_open_link');
                chainBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
                chainBtn.onclick = async (e) => {
                    e.stopPropagation();
                    let panPassword = null;
                    if (getConfig('enablePaste')) {
                        const isPan = PAN_DOMAINS.some(d => linkData.host.includes(d));
                        if (isPan) {
                            panPassword = extractPanCode(text);
                        }
                    }
                    if (panPassword) {
                        await safeSetValue('pan_paste_handover', {
                            url: linkData.url,
                            code: panPassword,
                            timestamp: Date.now()
                        });
                        showToast(`Password: ${panPassword}`);
                    }
                    safeOpenTab(linkData.url, { active: true });
                    hideUI();
                };
                container.appendChild(chainBtn);
            }
        }

        // 检测是否需要显示"校正"按钮
        const curLang = getConfig('language');
        const isChineseEnv = curLang === 'zh-CN' || (curLang === 'auto' && navigator.language.startsWith('zh'));
        if (isChineseEnv && targetInput) {
            const isInputType = targetInput.tagName === 'INPUT';
            if (smartCorrectText(text, isInputType) !== null) {
                const div = document.createElement('div');
                div.className = isCol ? 'divider divider-h' : 'divider divider-v';
                container.appendChild(div);

                const correctBtn = document.createElement('div');
                correctBtn.className = 'sc-btn';
                correctBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15l2 2 4-4"></path></svg>`;
                correctBtn.title = "校正";
                correctBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
                correctBtn.onclick = (e) => {
                    e.stopPropagation();
                    handleTextCorrection(targetInput, text);
                };
                container.appendChild(correctBtn);
            }
        }

        // 3. 闪电粘贴三按钮模式追加粘贴按钮
        if (mode === PASTE_MODE_THREE_BTNS) {
            const div = document.createElement('div');
            div.className = isCol ? 'divider divider-h' : 'divider divider-v';
            container.appendChild(div);
            const pasteBtn = document.createElement('div');
            pasteBtn.className = 'sc-btn';
            pasteBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
            pasteBtn.title = t('btn_paste');
            pasteBtn.onmousedown = e => { e.preventDefault(); e.stopPropagation(); };
            pasteBtn.onclick = async (e) => {
                e.stopPropagation();
                const cache = await safeGetValue('smart_paste_cache', null);
                if (cache && cache.text) {
                    performPaste(document.activeElement, cache.text);
                    // 粘贴后重置时间戳，允许同页面反复使用闪电粘贴
                    await safeSetValue('smart_paste_cache', {
                        text: cache.text,
                        timestamp: Date.now()
                    });
                }
                hideUI();
            };
            container.appendChild(pasteBtn);
        }
    }
    // 模式 B: 粘贴模式 (闪电粘贴)
    else if (mode === 'paste') {
        const pasteBtn = document.createElement('div');
        pasteBtn.className = 'sc-btn';
        pasteBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
        pasteBtn.title = t('btn_paste');
        pasteBtn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
        pasteBtn.onclick = async (e) => {
            e.stopPropagation();
            if (typeof sessionPanCode !== 'undefined' && sessionPanCode) {
                performPaste(targetInput || document.activeElement, sessionPanCode);
                showToast(t('toast_password_pasted'));
                sessionPanCode = null;
                hideUI();
                return;
            }
            performPaste(targetInput, text);
            // 粘贴后重置时间戳，允许同页面反复使用闪电粘贴
            // 注意：这里缓存的是目标输入框内容而非剪贴板内容，仅在直接粘贴模式下重置
            const existingCache = await safeGetValue('smart_paste_cache', null);
            if (existingCache && existingCache.text) {
                await safeSetValue('smart_paste_cache', {
                    text: existingCache.text,
                    timestamp: Date.now()
                });
            }
            hideUI();
        };
        container.appendChild(pasteBtn);
    }

    const btnCount = container.children.length;
    container.setAttribute('data-btn-count', btnCount);

    shadowRoot.appendChild(container);

    // 计算位置 (通用逻辑)
    container.style.left = '-9999px';

    requestAnimationFrame(() => {
        const btnRect = container.getBoundingClientRect();
        const btnW = btnRect.width;
        const btnH = btnRect.height;
        const offset = getConfig('offset');
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        let targetX, targetY;

        if (rect) {
            const isBackward = rect.isBackward || false;
            const isVertical = rect.isVertical || false;
            if (isVertical) {
                if (isBackward) {
                    targetX = rect.right + offset;
                    targetY = rect.top;
                } else {
                    targetX = rect.left - btnW - offset;
                    targetY = rect.bottom - btnH;
                }
            } else {
                if (isBackward) {
                    targetX = rect.left - (btnW / 2);
                    targetY = rect.top - btnH - offset;
                } else {
                    targetX = rect.right - (btnW / 2);
                    const spaceBelow = viewportH - rect.bottom;
                    if (spaceBelow < (btnH + offset + 20)) {
                        targetY = rect.top - btnH - offset;
                    } else {
                        targetY = rect.bottom + offset;
                    }
                }
            }
        } else {
            if (mouseY > viewportH / 2) {
                targetY = mouseY - btnH - offset;
            } else {
                targetY = mouseY + offset;
            }
            if (mouseX > viewportW / 2) {
                targetX = mouseX - btnW - offset;
            } else {
                targetX = mouseX + offset;
            }
        }

        // 边缘检测
        const margin = 10;
        targetX = Math.max(margin, Math.min(targetX, viewportW - btnW - margin));
        targetY = Math.max(margin, Math.min(targetY, viewportH - btnH - margin));

        container.style.left = `${targetX}px`;
        container.style.top = `${targetY}px`;
        container.classList.add('visible');

        const timeout = getConfig('timeout');
        if (timeout > 0) {
            if (uiTimer) clearTimeout(uiTimer);
            uiTimer = setTimeout(hideUI, timeout);
        }
    });
}

function hideUI() {
    const btn = shadowRoot && shadowRoot.querySelector('.sc-container');
    if (btn) {
        btn.classList.remove('visible');
        setTimeout(() => {
            if (btn && btn.parentNode) btn.remove();
        }, 200);
    }
    cachedSelection = { text: '', html: '' };
}

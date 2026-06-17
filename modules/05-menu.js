// 模块 05: GM 菜单系统 (GM Menu System)

// 启动时一次性加载所有配置
async function initConfiguration() {
    configCache['scrollRepaintMode'] = await safeGetValue('scrollRepaintMode', 'always');
    const keys = Object.keys(DEFAULT_CONFIG);
    // 并行读取所有配置，提高速度
    const values = await Promise.all(
        keys.map(key => safeGetValue(key, DEFAULT_CONFIG[key]))
    );

    // 将读取到的值写入缓存
    keys.forEach((key, index) => {
        configCache[key] = values[index];
    });

    // 额外加载屏蔽规则 (blocked_elements)
    const blockedRules = await safeGetValue('blocked_elements', {});
    configCache['blocked_elements'] = blockedRules;

    // 加载自定义TLD并合并到扩展集合
    const customTLDs = configCache['customTLDs'] || [];
    if (customTLDs.length > 0) {
        customTLDs.forEach(t => TLD_SET_EXTENDED.add(t.toLowerCase().replace(/^\./, '')));
    }
}

// 首次运行时根据时区自动设置搜索引擎
async function initDefaultSearchEngine() {
    const hasInitialized = await safeGetValue('engine_initialized', false);
    if (!hasInitialized) {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const chinaTimeZones = ['Asia/Shanghai', 'Asia/Urumqi'];
        const defaultEngine = chinaTimeZones.includes(timeZone) ? 'baidu' : 'google';

        configCache['searchEngine'] = defaultEngine;
        await safeSetValue('searchEngine', defaultEngine);
        await safeSetValue('engine_initialized', true);
    }
}

function registerMenus() {
    // 1. 语言设置 (Language)
    const curLang = getConfig('language');
    const langLabel = curLang === 'auto' ? 'Auto' : (I18N[curLang] ? I18N[curLang].lang_name : curLang);
    GM_registerMenuCommand(`${t('menu_lang')}: ${langLabel}`, () => {
        const nextMap = { 'auto': 'zh-CN', 'zh-CN': 'en', 'en': 'ru', 'ru': 'auto' };
        setConfig('language', nextMap[curLang] || 'auto');
        location.reload();
    });

    // 2.1 定位模式
    const posMode = getConfig('positionMode');
    GM_registerMenuCommand(`${t('menu_pos')}: ${posMode === 'endchar' ? t('val_endchar') : t('val_mouse')}`, () => {
        setConfig('positionMode', posMode === 'endchar' ? 'mouse' : 'endchar');
        location.reload();
    });

    // 2.2 偏移量
    GM_registerMenuCommand(`${t('menu_offset')}: ${getConfig('offset')}px`, () => {
        const val = prompt(t('prompt_offset'), getConfig('offset'));
        if (val !== null && !isNaN(val)) {
            setConfig('offset', parseInt(val, 10));
            location.reload();
        }
    });

    // 按钮重绘策略
    const scrollMode = getConfig('scrollRepaintMode');
    const modeText = {
        always: t('scroll_always'),
        viewport: t('scroll_viewport'),
        hide: t('scroll_hide')
    };
    GM_registerMenuCommand(`${t('scroll_repaint')}: ${modeText[scrollMode]}`, () => {
        const nextMap = { always: 'viewport', viewport: 'hide', hide: 'always' };
        setConfig('scrollRepaintMode', nextMap[scrollMode] || 'always');
        location.reload();
    });

    // 2.3 停留时长
    const timeout = getConfig('timeout');
    GM_registerMenuCommand(`${t('menu_timeout')}: ${timeout === 0 ? t('val_infinite') : timeout + 'ms'}`, () => {
        const val = prompt(t('prompt_timeout'), timeout);
        if (val !== null && !isNaN(val)) {
            setConfig('timeout', parseInt(val, 10));
            location.reload();
        }
    });

    // 2.4 按钮样式
    const btnStyle = getConfig('buttonStyle');
    GM_registerMenuCommand(`${t('menu_style')}: ${btnStyle === 'row' ? t('val_row') : t('val_col')}`, () => {
        setConfig('buttonStyle', btnStyle === 'row' ? 'col' : 'row');
        location.reload();
    });

    // 2.5 配色方案
    const forceWB = getConfig('forceWhiteBlack');
    GM_registerMenuCommand(`${t('menu_theme')}: ${forceWB ? t('val_light') : t('val_auto')}`, () => {
        setConfig('forceWhiteBlack', !forceWB);
        location.reload();
    });

    // 删除按钮开关
    const showDelete = getConfig('enableDeleteBtn');
    GM_registerMenuCommand(`${t('menu_delete_btn')}: ${showDelete ? t('val_show') : t('val_hide')}`, () => {
        setConfig('enableDeleteBtn', !showDelete);
        location.reload();
    });

    // 2.6 搜索引擎
    const currentEngineKey = getConfig('searchEngine');
    const engineName = SEARCH_ENGINES[currentEngineKey] ? SEARCH_ENGINES[currentEngineKey].name : 'Custom';
    GM_registerMenuCommand(`${t('menu_search')}: ${engineName}`, () => {
        const choice = prompt(t('prompt_search'), currentEngineKey);
        if (choice) {
            if (SEARCH_ENGINES[choice] || choice.includes('%s')) {
                setConfig('searchEngine', choice);
                location.reload();
            } else {
                alert(t('err_search'));
            }
        }
    });

    // 智能分配开关
    const smartOn = getConfig('smartEngine');
    GM_registerMenuCommand(`${t('menu_smart_engine')}: ${smartOn ? t('val_smart_on') : t('val_smart_off')}`, () => {
        setConfig('smartEngine', !smartOn);
        location.reload();
    });

    // 备用引擎选择（仅当开启时才显示）
    if (smartOn) {
        const fbKey = getConfig('fallbackEngine');
        const fbName = SEARCH_ENGINES[fbKey] ? SEARCH_ENGINES[fbKey].name : 'Custom';
        GM_registerMenuCommand(`${t('menu_fallback_engine')}: ${fbName}`, () => {
            const choice = prompt(t('prompt_search'), fbKey);
            if (choice) {
                if (SEARCH_ENGINES[choice] || choice.includes('%s')) {
                    setConfig('fallbackEngine', choice);
                    location.reload();
                } else {
                    alert(t('err_search'));
                }
            }
        });
    }

    // 2.7 缓存功能
    GM_registerMenuCommand(`${t('menu_cache')}: ${getConfig('enableCache') ? t('val_on') : t('val_off')}`, () => {
        setConfig('enableCache', !getConfig('enableCache'));
        location.reload();
    });

    // 2.8 Toast通知
    GM_registerMenuCommand(`${t('menu_toast')}: ${getConfig('enableToast') ? t('val_on') : t('val_off')}`, () => {
        setConfig('enableToast', !getConfig('enableToast'));
        location.reload();
    });

    // 2.9 超级划词模式快捷键
    const currentKey = getConfig('unlockHotkey');
    GM_registerMenuCommand(`${t('menu_hotkey')}: ${currentKey || t('val_disabled')}`, () => {
        const val = prompt(t('prompt_hotkey'));
        if (val === null) return;

        let finalKey = val.trim();
        if (finalKey.toLowerCase() === 'ctrl') finalKey = 'ControlLeft';
        if (finalKey.toLowerCase() === 'alt') finalKey = 'AltLeft';
        if (finalKey.toLowerCase() === 'shift') finalKey = 'ShiftLeft';
        if (finalKey === '' || finalKey.toUpperCase() === 'NONE') finalKey = '';

        setConfig('unlockHotkey', finalKey);
        location.reload();
    });

    // 2.10 闪电粘贴
    GM_registerMenuCommand(`${t('menu_paste')}: ${getConfig('enablePaste') ? t('val_on') : t('val_off')}`, () => {
        setConfig('enablePaste', !getConfig('enablePaste'));
        location.reload();
    });

    // [新增] 拖拽预览开关
    GM_registerMenuCommand(`${t('menu_drag_preview')}: ${getConfig('enableDragPreview') ? t('val_on') : t('val_off')}`, () => {
        setConfig('enableDragPreview', !getConfig('enableDragPreview'));
        location.reload();
    });

    // 2.12 屏蔽元素工具
    GM_registerMenuCommand(t('menu_block'), () => {
        activateElementPicker();
    });

    GM_registerMenuCommand(t('menu_clear'), async () => {
        const domain = location.hostname;
        if (confirm(t('confirm_clear', domain))) {
            const rules = await safeGetValue('blocked_elements', {});
            if (rules[domain]) {
                delete rules[domain];
                await safeSetValue('blocked_elements', rules);
                if (typeof configCache !== 'undefined') { configCache['blocked_elements'] = rules; }
                alert(t('alert_cleared'));
                location.reload();
            } else {
                alert(t('alert_no_rules'));
            }
        }
    });

    // 新增：添加自定义顶级域名
    GM_registerMenuCommand(t('menu_tld_add'), () => {
        const val = prompt(t('prompt_tld_add'));
        if (!val) return;
        let tld = val.trim().toLowerCase().replace(/^\./, ''); // 移除前导点
        // 验证：只允许字母
        if (!/^[a-z]{2,}$/.test(tld)) {
            alert(t('err_tld_invalid'));
            return;
        }
        const current = getConfig('customTLDs') || [];
        if (current.includes(tld)) {
            showToast('TLD already exists: ' + tld);
            return;
        }
        current.push(tld);
        setConfig('customTLDs', current);
        TLD_SET_EXTENDED.add(tld);
        showToast(t('toast_tld_added', tld));
    });

    // 新增：编辑网页
    GM_registerMenuCommand(t('menu_edit'), () => {
        toggleEditMode(!isEditMode);
    });

    // 2.13 重置
    GM_registerMenuCommand(t('menu_reset'), async () => {
        if (confirm(t('confirm_reset'))) {
            const keys = Object.keys(DEFAULT_CONFIG);
            await Promise.all(keys.map(k => setConfig(k, DEFAULT_CONFIG[k])));
            location.reload();
        }
    });
}

// 模块 01: 异步兼容层 (Async Compatibility Layer)
// 优先使用 GM.getValue (标准异步)，降级使用 GM_getValue (Tampermonkey同步)

const safeGetValue = (key, def) => {
    if (typeof GM !== 'undefined' && GM.getValue) {
        return GM.getValue(key, def);
    } else {
        return Promise.resolve(GM_getValue(key, def));
    }
};

const safeSetValue = (key, val) => {
    if (typeof GM !== 'undefined' && GM.setValue) {
        return GM.setValue(key, val);
    } else {
        return Promise.resolve(GM_setValue(key, val));
    }
};

const safeOpenTab = (url, options) => {
    if (typeof GM !== 'undefined' && GM.openInTab) {
        // 现代异步标准 (GM.openInTab)
        GM.openInTab(url, options);
    } else {
        // 旧版同步标准 (GM_openInTab)
        GM_openInTab(url, options);
    }
};

// 模块 06: 链接与密码提取器 (Link & Password Extractors)

// 获取合并后的完整TLD集合 (内置 + 用户自定义)
function getEffectiveTLDs() {
    const custom = getConfig('customTLDs') || [];
    if (custom.length === 0) return TLD_SET_EXTENDED;
    const merged = new Set(TLD_SET_EXTENDED);
    custom.forEach(t => merged.add(t.toLowerCase().replace(/^\./, '')));
    return merged;
}

// [重写] 智能链接与密码提取器 (统一入口)
function extractLinkAndCode(rawText) {
    if (!rawText) return null;

    // ---- 阶段1: 提取密码/提取码 ----
    let password = null;
    // 匹配: (提取码|密码|访问码|分享码|口令|code|pwd|key|pw)[:：\s]*([a-zA-Z0-9]{4,8})
    // 允许关键字和密码之间有中文或符号干扰
    const codePatterns = [
        /(?:提取码|提取密碼|密码|訪問碼|访问码|分享码|口令|code|pwd|key|pw|pass)\s*[:：]?\s*([a-zA-Z0-9]{4,8})(?![a-zA-Z0-9])/i,
        /\([:：]?\s*([a-zA-Z0-9]{4,8})\s*\)/,  // 括号中的纯码: (:cpn0) 或 (cpn0)
    ];
    for (const pat of codePatterns) {
        const m = rawText.match(pat);
        if (m) { password = m[1]; break; }
    }

    // ---- 阶段2: 提取URL ----
    // 移除中文字符和常见干扰词，保留URL结构
    let cleanText = rawText
        .replace(/[\u4e00-\u9fa5]+/g, '')         // 移除所有中文
        .replace(/\s+/g, '');                      // 移除空白

    if (!cleanText) return password ? { password } : null;

    // URL正则：协议(可选) + 域名 + 路径/参数
    const urlPattern = /((?:https?:\/\/)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:\/[^\s\u4e00-\u9fa5\]】）)]*)?)/gi;
    const matches = cleanText.match(urlPattern);

    if (!matches || matches.length === 0) return password ? { password } : null;

    // 取最后一个有效URL (通常是最完整的)
    let bestUrl = null;
    const effectiveTLDs = getEffectiveTLDs();

    for (const candidate of matches) {
        let url = candidate.replace(/[.,;:!?，。；：！？、)]+$/, ''); // trim trailing punctuation
        let host = url.replace(/^https?:\/\//, '').split('/')[0];

        // 排除内网IP
        if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.)/.test(host)) continue;
        if (!host.includes('.')) continue;

        // TLD验证
        const tld = host.split('.').pop().toLowerCase();
        if (!effectiveTLDs.has(tld)) continue;

        // 补全协议
        let fullUrl = url.startsWith('http') ? url : 'http://' + url;
        bestUrl = { display: url, url: fullUrl, host: host };
    }

    if (!bestUrl) return password ? { password } : null;

    return {
        display: bestUrl.display,
        url: bestUrl.url,
        host: bestUrl.host,
        password: password
    };
}

// [新增] 邮箱地址提取器
function extractEmailFromText(rawText) {
    if (!rawText || !rawText.includes('@')) return null;
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const m = rawText.match(emailPattern);
    return m ? m[1] : null;
}

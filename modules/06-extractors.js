// 模块 06: 链接与密码提取器 (Link & Password Extractors)

// [新增] 智能链接提取器
function extractLinkFromText(rawText) {
    // 1. 快速预筛选 (性能优化)
    if (!rawText || (!rawText.includes('.') && !rawText.includes('://'))) return null;

    // 2. 清洗中文混淆 (处理 "pa删n.baid中u.co文m" 这种情况)
    // 仅移除中文字符，保留其他所有字符以便正则匹配
    const cleanText = rawText.replace(/[\u4e00-\u9fa5]/g, '');

    // 3. 正则提取
    // 匹配协议头(可选) + 域名/IP + 路径/参数
    // 排除末尾的标点符号： ) ] 】 ） 以及常见的句号逗号
    const urlPattern = /((?:https?:\/\/)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:\/[^\s\u4e00-\u9fa5)\]】）]*)?)/gi;

    const matches = cleanText.match(urlPattern);

    // 4. 必须有且仅有一个完整的链接
    if (!matches || matches.length !== 1) return null;

    let url = matches[0];

    // 5. 特殊清洗：如果URL末尾包含了非URL字符（如被正则误吸入的符号），做Trim
    url = url.replace(/[.,;:]+$/, '');

    // 6. 域名/IP 规则校验
    let host = url.replace(/^https?:\/\//, '').split('/')[0];

    // 6.1 排除以纯IP 10. 或 172. 开头的
    if (/^10\./.test(host) || /^172\./.test(host)) return null;

    // 6.2 必须包含顶级域名分隔符 '.'
    if (!host.includes('.')) return null;

    // 7. 补全协议 (用于 safeOpenTab)
    let fullUrl = url;
    if (!url.startsWith('http')) {
        fullUrl = 'http://' + url;
    }

    return { display: url, url: fullUrl, host: host };
}

// [新增] 网盘密码提取器
function extractPanCode(text) {
    if (!getConfig('enablePaste')) return null;
    const match = text.match(PAN_CODE_REGEX);
    return match ? match[1] : null;
}

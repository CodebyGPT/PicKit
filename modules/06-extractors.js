// 模块 06: 链接与密码提取器 (Link & Password Extractors)

// 获取合并后的完整TLD集合 (内置 + 用户自定义)
function getEffectiveTLDs() {
    const custom = getConfig('customTLDs') || [];
    if (custom.length === 0) return TLD_SET_EXTENDED;
    const merged = new Set(TLD_SET_EXTENDED);
    custom.forEach(t => merged.add(t.toLowerCase().replace(/^\./, '')));
    return merged;
}

// RFC 3986 URL安全字符检测 (unreserved + reserved)
const isUrlSafeChar = (ch) => {
    const code = ch.charCodeAt(0);
    return code < 128 && /^[a-zA-Z0-9._~:/?#\[\]@!$&'()*+,;=%\-]$/.test(ch);
};

const isChineseChar = (ch) => /[\u4e00-\u9fa5]/.test(ch);

// 清理URL末尾的非URL字符
function trimUrlTail(url) {
    url = url.replace(/[,.。;:!?！？、]+$/, '');
    const openParens = (url.match(/\(/g) || []).length;
    const closeParens = (url.match(/\)/g) || []).length;
    if (closeParens > openParens) {
        const excess = closeParens - openParens;
        for (let i = 0; i < excess; i++) {
            url = url.replace(/\)+$/, (m) => m.slice(1));
        }
    }
    if (openParens > closeParens && url.endsWith('(')) {
        url = url.slice(0, -1);
    }
    url = url.replace(/[,.。;:!?！？、]+$/, '');
    return url;
}

// 在文本中从startPos开始扫描URL路径，返回路径结束位置
// 关键规则：遇到中文后停止扫描，且中文前的(需要回退
function scanUrlPath(text, startPos) {
    let urlEnd = startPos;
    let sawChinese = false;

    for (let i = startPos; i < text.length; i++) {
        const ch = text[i];

        if (isChineseChar(ch)) {
            sawChinese = true;
            const collected = text.substring(startPos, urlEnd);
            if (collected.endsWith('(:') || collected.endsWith('(')) {
                while (urlEnd > startPos && text[urlEnd - 1] !== '(') {
                    urlEnd--;
                }
                urlEnd--;
            }
            continue;
        }

        if (sawChinese) break;

        if (isUrlSafeChar(ch)) {
            urlEnd = i + 1;
        } else {
            break;
        }
    }

    return urlEnd;
}

// 查找锚点的正则: 协议 + 域名
const ANCHOR_PATTERN = /https?:\/\/[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}/gi;

// [重写] 智能链接与密码提取器 (双重策略)
function extractLinkAndCode(rawText) {
    if (!rawText) return null;

    // ---- 阶段1: 提取密码/提取码 ----
    let password = null;
    const codePatterns = [
        /(?:提取码|提取密碼|密码|訪問碼|访问码|分享码|口令|code|pwd|key|pw|pass)\s*[:：\s]+\s*([a-zA-Z0-9]{4,8})(?![a-zA-Z0-9])/i,
        /(?:提取码|提取密碼|密码|訪問碼|访问码|分享码|口令|code|pwd|key|pw|pass)[:：]([a-zA-Z0-9]{4,8})(?![a-zA-Z0-9])/i,
        /\([:：\s]*([a-zA-Z0-9]{4,8})\s*\)/,
    ];
    for (const pat of codePatterns) {
        const m = rawText.match(pat);
        if (m) { password = m[1]; break; }
    }

    // ---- 阶段2: 查找锚点 + 扫描路径 ----
    const effectiveTLDs = getEffectiveTLDs();

    // 策略A: 在原始文本中搜索 (适用中文注释在URL后方)
    const getUrlFromText = (text) => {
        const anchors = [];
        let m;
        const regex = new RegExp(ANCHOR_PATTERN.source, 'gi');
        while ((m = regex.exec(text)) !== null) {
            anchors.push({ start: m.index, end: m.index + m[0].length, hostAndProto: m[0] });
        }
        if (anchors.length === 0) return null;

        let bestResult = null;

        for (const anchor of anchors) {
            const host = anchor.hostAndProto.replace(/^https?:\/\//, '').split('/')[0];
            const tld = host.split('.').pop().toLowerCase();
            if (!effectiveTLDs.has(tld)) continue;
            if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.)/.test(host)) continue;

            const pathEnd = scanUrlPath(text, anchor.end);
            let url = text.substring(anchor.start, pathEnd);
            url = url.replace(/[\u4e00-\u9fa5]+/g, '');
            url = trimUrlTail(url);

            const finalHost = url.replace(/^https?:\/\//, '').split('/')[0];
            const finalTld = finalHost.split('.').pop().toLowerCase();
            if (!effectiveTLDs.has(finalTld)) continue;

            const fullUrl = url.startsWith('http') ? url : 'http://' + url;
            bestResult = { display: url, url: fullUrl, host: finalHost };
        }

        return bestResult;
    };

    // 先尝试原文提取 (应对"中文注释"场景)
    let bestResult = getUrlFromText(rawText);

    // 如果原文找不到锚点，尝试清洗后提取 (应对"中文嵌入URL"场景)
    if (!bestResult) {
        const cleanText = rawText
            .replace(/[\u4e00-\u9fa5]+/g, '')
            .replace(/\s+/g, '');
        bestResult = getUrlFromText(cleanText);
    }

    if (!bestResult && !password) return null;
    if (!bestResult) return { password };
    return {
        display: bestResult.display,
        url: bestResult.url,
        host: bestResult.host,
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

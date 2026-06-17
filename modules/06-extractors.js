// 模块 06: 链接与密码提取器 (Link & Password Extractors)

// 从网盘链接中提取唯一标识符，用于跨标签页精确匹配
// 返回 null 表示无法提取（不影响普通链接的正常使用）
function extractPanUrlId(url) {
    try {
        const u = new URL(url);
        const host = u.hostname;
        const path = u.pathname;

        // pan.baidu.com: /s/XXXXX 或 surl=XXXXX
        if (host.includes('baidu.com')) {
            const sMatch = path.match(/\/s\/([a-zA-Z0-9_-]+)/);
            if (sMatch) return sMatch[1];
            const surl = u.searchParams.get('surl');
            if (surl) return surl;
        }

        // cloud.189.cn: /t/XXXXX 或 code=XXXXX
        if (host === 'cloud.189.cn') {
            const tMatch = path.match(/\/t\/([a-zA-Z0-9]+)/);
            if (tMatch) return tMatch[1];
            const code = u.searchParams.get('code');
            if (code) return code;
        }

        // aliyundrive.com / alipan.com: /s/XXXXX
        if (host.includes('aliyundrive.com') || host.includes('alipan.com')) {
            const sMatch = path.match(/\/s\/([a-zA-Z0-9]+)/);
            if (sMatch) return sMatch[1];
        }

        // 123pan.com: /s/XXXXX
        if (host.includes('123pan.com')) {
            const sMatch = path.match(/\/s\/([a-zA-Z0-9]+)/);
            if (sMatch) return sMatch[1];
        }

        // pan.quark.cn: /s/XXXXX
        if (host.includes('quark.cn')) {
            const sMatch = path.match(/\/s\/([a-zA-Z0-9]+)/);
            if (sMatch) return sMatch[1];
        }

        // lanzou*: 最后路径段
        if (host.includes('lanzou')) {
            const segments = path.split('/').filter(Boolean);
            if (segments.length > 0) return segments[segments.length - 1];
        }

        // 通用回退: hostname + 末段路径
        const segments = path.split('/').filter(Boolean);
        const last = segments.length > 0 ? segments[segments.length - 1] : '';
        if (last && last.length >= 2) return host + '/' + last;

        return null;
    } catch (_) {
        return null;
    }
}

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

// 协议锚点正则
const PROTO_ANCHOR_PATTERN = /https?:\/\/[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}/gi;

// 无协议域名锚点正则 (用于 cloud.189.cn/t/xxx 这种格式)
const DOMAIN_ANCHOR_PATTERN = /(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/gi;

// 从文本中提取所有URL
function extractUrlsFromText(text) {
    const effectiveTLDs = getEffectiveTLDs();
    const results = [];

    // 收集所有锚点 (协议 + 无协议)
    const allAnchors = [];

    // 协议锚点
    let m;
    const protoRegex = new RegExp(PROTO_ANCHOR_PATTERN.source, 'gi');
    while ((m = protoRegex.exec(text)) !== null) {
        allAnchors.push({
            start: m.index,
            end: m.index + m[0].length,
            hostAndProto: m[0],
            hasProto: true
        });
    }

    // 无协议域名锚点 (仅当协议锚点未覆盖时)
    const domainRegex = new RegExp(DOMAIN_ANCHOR_PATTERN.source, 'gi');
    while ((m = domainRegex.exec(text)) !== null) {
        // 检查这个域名是否已被协议锚点覆盖
        const isOverlapped = allAnchors.some(a =>
            m.index >= a.start && m.index < a.end
        );
        if (!isOverlapped) {
            allAnchors.push({
                start: m.index,
                end: m.index + m[0].length,
                hostAndProto: m[0],
                hasProto: false
            });
        }
    }

    // 按位置排序
    allAnchors.sort((a, b) => a.start - b.start);

    // 去重：移除被前一个锚点URL范围覆盖的锚点（使用锚点自身结束位置做初步过滤）
    const deduped = [];
    for (const anchor of allAnchors) {
        if (deduped.length === 0 || anchor.start >= deduped[deduped.length - 1].end) {
            deduped.push(anchor);
        }
    }

    // 扫描每个锚点的路径，记录实际URL结束位置用于后续去重
    let lastUrlEnd = 0;
    for (const anchor of deduped) {
        // 跳过已被前一个完整URL覆盖的锚点
        if (anchor.start < lastUrlEnd) continue;
        const host = anchor.hostAndProto.replace(/^https?:\/\//, '').split('/')[0];
        const tld = host.split('.').pop().toLowerCase();
        if (!effectiveTLDs.has(tld)) continue;
        if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.)/.test(host)) continue;

        const pathEnd = scanUrlPath(text, anchor.end);
        let url = text.substring(anchor.start, pathEnd);
        url = url.replace(/[\u4e00-\u9fa5]+/g, '');
        url = trimUrlTail(url);

        // 验证：URL至少要有域名之后的路径部分
        if (!anchor.hasProto) {
            const urlHost = url.split('/')[0];
            // 协议后的URL至少包含一个/路径，或?参数
            if (url === urlHost || url.length <= urlHost.length) {
                // 没有路径，检查是否有?参数
                const questionIdx = text.indexOf('?', anchor.end);
                if (questionIdx !== -1 && questionIdx < anchor.end + 50) {
                    // 可能后面有参数，但扫描没抓到。保守跳过。
                }
                // 纯域名不做为链接 (如 "cloud.189.cn" alone)
                if (!/[\/?#]/.test(url)) continue;
            }
        }

        const finalHost = url.replace(/^https?:\/\//, '').split('/')[0];
        const finalTld = finalHost.split('.').pop().toLowerCase();
        if (!effectiveTLDs.has(finalTld)) continue;

        const fullUrl = url.startsWith('http') ? url : 'http://' + url;
        const displayUrl = anchor.hasProto ? url : url; // display shows with http:// added

        results.push({
            display: fullUrl.replace(/^https?:\/\//, '') === url.replace(/^https?:\/\//, '')
                ? url : fullUrl,
            url: fullUrl,
            host: finalHost,
            anchorStart: anchor.start  // 保留锚点在原文中的位置，用于密码分配
        });

        // 标记已覆盖范围，用于后续锚点去重
        lastUrlEnd = pathEnd;
    }

    return results;
}

// 提取所有密码及其在原文中的位置
function extractAllCodesWithPositions(rawText) {
    const results = [];
    const codePatterns = [
        /(?:提取码|提取密碼|密码|訪問碼|访问码|分享码|口令|code|pwd|key|pw|pass)\s*[:：\s]+\s*([a-zA-Z0-9]{3,8})(?![a-zA-Z0-9])/gi,
        /(?:提取码|提取密碼|密码|訪問碼|访问码|分享码|口令|code|pwd|key|pw|pass)[:：]([a-zA-Z0-9]{3,8})(?![a-zA-Z0-9])/gi,
        /码\s*[:：\s]*([a-zA-Z0-9]{3,8})(?![a-zA-Z0-9])/gi,
        /\([:：\s]*([a-zA-Z0-9]{3,8})\s*\)/gi,
    ];
    const seen = new Set(); // 去重：同一位置同一code只记一次
    for (const pat of codePatterns) {
        let m;
        while ((m = pat.exec(rawText)) !== null) {
            const key = m.index + '|' + m[1];
            if (!seen.has(key)) {
                seen.add(key);
                results.push({ code: m[1], index: m.index });
            }
        }
    }
    results.sort((a, b) => a.index - b.index);
    return results;
}

// [重写] 智能链接与密码提取器 (支持多链接 + 每URL独立密码)
function extractLinkAndCode(rawText) {
    if (!rawText) return null;

    // ---- 阶段1: 提取所有密码及其位置 ----
    const allCodes = extractAllCodesWithPositions(rawText);
    const password = allCodes.length > 0 ? allCodes[0].code : null;

    // ---- 阶段2: 提取URL (双重策略) ----
    let urls = extractUrlsFromText(rawText);

    if (urls.length === 0) {
        const cleanText = rawText
            .replace(/[\u4e00-\u9fa5]+/g, '')
            .replace(/\s+/g, '');
        urls = extractUrlsFromText(cleanText);
    }

    if (urls.length === 0 && !password) return null;

    // ---- 阶段3: 为每个URL分配最近的密码（直接用锚点位置，不重搜 host）----
    for (let i = 0; i < urls.length; i++) {
        const urlStart = urls[i].anchorStart;
        if (urlStart === undefined) continue;
        // 该URL在原文中的范围：[urlStart, nextUrlStart)
        const nextUrlStart = (i + 1 < urls.length && urls[i + 1].anchorStart !== undefined)
            ? urls[i + 1].anchorStart
            : rawText.length;
        const matched = allCodes.filter(c => c.index >= urlStart && c.index < nextUrlStart);
        if (matched.length > 0) {
            urls[i].code = matched[0].code;
        }
    }

    return {
        urls: urls,
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

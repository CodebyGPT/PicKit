// 模块 02: 配置与状态管理 (Configuration & State)

const DEFAULT_CONFIG = {
    language: 'auto', // 'auto'（默认） | 'zh-CN' | 'en' | 'ru'
    positionMode: 'endchar', // 'endchar' | 'mouse'
    offset: 12, // px
    timeout: 2400, // ms, 0 = infinite
    buttonStyle: 'row', // 'row' (capsule) | 'col' (rounded rect)
    forceWhiteBlack: true, // true = force white bg/black text
    searchEngine: 'baidu', // key or custom url
    enableToast: true,
    enableCache: true,
    unlockHotkey: 'ControlLeft',
    enablePaste: true,

    enableDragPreview: false,
    scrollRepaintMode: 'always',
    smartEngine: false,        // 是否启用智能分配
    fallbackEngine: 'bing',   // 不含中文时的备用引擎
    enableDeleteBtn: true, // 是否显示删除按钮
    customTLDs: [], // 用户自定义的顶级域名列表
};

const SCROLL_REPAINT_MODE = {
    ALWAYS: 'always',      // 1. 始终重绘（默认）
    VIEWPORT: 'viewport',  // 2. 锚点在视口内才重绘
    HIDE: 'hide'           // 3. 滚动即隐藏，不重绘
};

const PASTE_MODE_THREE_BTNS = 'copy-search-paste';   // 闪电粘贴三按钮模式标记

const SEARCH_ENGINES = {
    google: { name: 'Google', url: 'https://www.google.com/search?q=%s' },
    baidu: { name: 'Baidu', url: 'https://www.baidu.com/s?wd=%s' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
    brave: { name: 'Brave', url: 'https://search.brave.com/search?q=%s' },
};

// [新增] 顶级域名白名单 (Top 100 TLDs)
const TLD_SET = new Set([
    'com', 'cn', 'de', 'tk', 'uk', 'net', 'org', 'top', 'ru',
    'info', 'br', 'xyz', 'ga', 'nl', 'it', 'ws', 'ml', 'shop',
    'cf', 'fr', 'co', 'eu', 'in', 'online', 'au', 'gq', 'ph',
    'us', 'ca', 'vip', 'club', 'pl', 'cc', 'biz', 'store', 'za',
    'site', 'ch', 'se', 'es', 'tw', 'loan', 'jp', 'me', 'be',
    'live', 'buzz', 'at', 'ir', 'work', 'app', 'sbs', 'cz', 'pro',
    'click', 'id', 'dk', 'io', 'mx', 'bond', 'kr', 'wang', 'lol',
    'no', 'tr', 'cfd', 'nu', 'hu', 'life', 'ai', 'asia', 'my',
    'cl', 'ua', 'ro', 'icu', 'cloud', 'win', 'link', 'ar', 'nz',
    'vn', 'ltd', 'world', 'dev', 'fun', 'mobi', 'space', 'tv',
    'cyou', 'fi', 'tech', 'sk', 'today', 'gr', 'one', 'digital',
    'gov', 'edu'
]);
const TLD_SET_EXTENDED = new Set(TLD_SET); // 可扩展副本，用于合并自定义TLD

// [新增] 网盘域名匹配规则 (用于闪电粘贴密码提取)
const PAN_DOMAINS = [
    'pan.baidu.com', 'lanzou', 'weiyun.com', 'cloud.189.cn',
    'aliyundrive.com', 'alipan.com', '123pan.com', 'pan.quark.cn',
    'pan.xunlei.com', '115.com', 'drive.uc.cn', 'fast.uc.cn', 'ctfile.com'
];

// [新增] 仅在当前Tab有效的网盘密码缓存（用于新标签页接收）
let sessionPanCode = null;

// 网盘密码映射过期清理 (事件驱动：在读写pan_code_map时顺带调用)
const PAN_CODE_MAX_AGE = 3600000; // 1小时
function cleanExpiredPanEntries(map) {
    const now = Date.now();
    for (const key of Object.keys(map)) {
        if (now - map[key].ts > PAN_CODE_MAX_AGE) {
            delete map[key];
        }
    }
    return map;
}

// 运行时状态
let cachedSelection = { text: '', html: '' };
let uiTimer = null;
let toastTimer = null;
let isScrolling = false;
let scrollTimeout = null;
let shadowRoot = null;
let hostElement = null;

// 配置缓存对象 (初始化为默认值)
let configCache = { ...DEFAULT_CONFIG };

// 新的同步读取 (直接读内存，速度最快，不阻塞UI)
const getConfig = (key) => {
    return configCache[key];
};

// 新的异步写入 (更新内存 + 保存到存储)
const setConfig = async (key, val) => {
    configCache[key] = val; // 立即更新内存，保证交互响应
    await safeSetValue(key, val); // 异步写入持久化存储
};

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
    inputRecoveryMode: 'off', // 'off' | 'loose' (default, ignore tracking params) | 'strict'
    enableDragPreview: false,
    scrollRepaintMode: 'always',
    smartEngine: false,        // 是否启用智能分配
    fallbackEngine: 'bing',   // 不含中文时的备用引擎
    enableDeleteBtn: true, // 是否显示删除按钮
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

// [新增] 网盘域名匹配规则 (用于闪电粘贴密码提取)
const PAN_DOMAINS = [
    'pan.baidu.com', 'lanzou', 'weiyun.com', 'cloud.189.cn',
    'aliyundrive.com', 'alipan.com', '123pan.com', 'pan.quark.cn',
    'pan.xunlei.com', '115.com', 'drive.uc.cn', 'fast.uc.cn', 'ctfile.com'
];
// [新增] 网盘密码提取正则
const PAN_CODE_REGEX = /(?:提取码|密码|访问码|分享码|口令)\s*[:：]?\s*([a-zA-Z0-9]{4})(?![a-zA-Z0-9])/;

// [新增] 仅在当前Tab有效的网盘密码缓存（用于新标签页接收）
let sessionPanCode = null;

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

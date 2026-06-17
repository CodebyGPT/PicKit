const globals = require("globals");

// 模块间通过全局变量共享的标识符
const crossModuleGlobals = {
  // 01-compat.js
  safeGetValue: "readonly",
  safeSetValue: "readonly",
  safeOpenTab: "readonly",
  // 02-config.js
  DEFAULT_CONFIG: "readonly",
  SCROLL_REPAINT_MODE: "readonly",
  PASTE_MODE_THREE_BTNS: "readonly",
  SEARCH_ENGINES: "readonly",
  PAN_DOMAINS: "readonly",
  TLD_SET: "readonly",
  TLD_SET_EXTENDED: "readonly",
  sessionPanCode: "writable",
  PAN_CODE_MAX_AGE: "readonly",
  cleanExpiredPanEntries: "readonly",
  cachedSelection: "writable",
  uiTimer: "writable",
  toastTimer: "writable",
  isScrolling: "writable",
  scrollTimeout: "writable",
  shadowRoot: "writable",
  hostElement: "writable",
  configCache: "writable",
  getConfig: "readonly",
  setConfig: "readonly",
  // 03-i18n.js
  I18N: "readonly",
  t: "readonly",
  // 04-compliance.js
  isEditMode: "writable",
  isInEditable: "readonly",
  setComplianceBanner: "readonly",
  toggleEditMode: "readonly",
  // 05-menu.js
  initConfiguration: "readonly",
  initDefaultSearchEngine: "readonly",
  registerMenus: "readonly",
  // 06-extractors.js
  extractLinkAndCode: "readonly",
  extractEmailFromText: "readonly",
  getEffectiveTLDs: "readonly",
  // 07-selection.js
  getAnchorPosition: "readonly",
  getSelectionCoords: "readonly",
  getSmartSelectionState: "readonly",
  // 08-shadow-dom.js
  initContainer: "readonly",
  // 09-drag-preview.js
  PREVIEW_WIN_NAME: "readonly",
  handleLinkDragStart: "readonly",
  handleLinkDragEnd: "readonly",
  // 10-unlock-mode.js
  isUnlockMode: "readonly",
  // 11-clipboard.js
  copyToClipboard: "readonly",
  cutToClipboard: "readonly",
  pasteFromCache: "readonly",
  showToast: "readonly",
  performPaste: "readonly",
  // 12-theme.js
  detectBackgroundBrightness: "readonly",
  getTheme: "readonly",
  getBestContrastTheme: "readonly",
  // 13-renderer.js
  renderButton: "readonly",
  renderButtons: "readonly",
  hideUI: "readonly",
  // 14-events.js
  handleSelectionMouseUp: "readonly",
  handleInputPasteMouseUp: "readonly",
  handleGlobalMouseDown: "readonly",
  handleContextMenu: "readonly",
  handleResizeOrScroll: "readonly",
  handleKeydownHideUI: "readonly",
  handleInputSave: "readonly",
  handleFormSubmit: "readonly",
  // 15-text-correct.js
  smartCorrectText: "readonly",
  handleTextCorrection: "readonly",
  // 16-blocker.js
  activateElementPicker: "readonly",
  applySavedBlockingRules: "readonly",
  // 17-festival.js
  getSpringFestivalToastText: "readonly",
  triggerSpringFestivalEffect: "readonly",
  // 18-input-recovery.js
  restoreInputData: "readonly"
};

module.exports = [
  // UserScript 模块 (00-19)
  {
    files: ["modules/0*.js", "modules/1*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.greasemonkey,
        GM: "readonly",
        GM_getValue: "readonly",
        GM_setValue: "readonly",
        GM_openInTab: "readonly",
        GM_registerMenuCommand: "readonly",
        GM_unregisterMenuCommand: "readonly",
        GM_getTab: "readonly",
        GM_addStyle: "readonly",
        GM_notification: "readonly",
        GM_setClipboard: "readonly",
        GM_xmlhttpRequest: "readonly",
        unsafeWindow: "readonly",
        ...crossModuleGlobals
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-cond-assign": "error",
      "no-const-assign": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty": "warn",
      "no-extra-semi": "warn",
      "no-irregular-whitespace": "error",
      "no-unreachable": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "no-var": "off",
      "prefer-const": "warn",
      "eqeqeq": ["warn", "smart"]
    }
  },
  // Node.js 构建脚本 (build.js)
  {
    files: ["modules/build.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.node
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "no-empty": "warn",
      "prefer-const": "warn"
    }
  },
  // 忽略构建产物
  {
    ignores: [
      "main.user.js",
      "main.min.user.js",
      "main.meta.js",
      "node_modules/**",
      "PoC/**",
      "docs/**"
    ]
  }
];

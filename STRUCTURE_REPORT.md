# main.user.js 项目结构分析报告

## 概述

- **文件名**: `main.user.js`
- **总行数**: 3246 行
- **脚本名称**: Text_Selection_Toolbar（划词工具栏）
- **版本**: 2026.03.05
- **许可**: GPL-3.0
- **运行时机**: `document-start`
- **注入方式**: `content`（直接注入页面）

## 功能模块划分

### 1. 元数据与许可声明 (行 1-47)
- UserScript header（名称、版本、描述、权限、匹配规则等）
- 多语言非原创内容声明

### 2. 异步兼容层 (行 49-76)
- `safeGetValue` / `safeSetValue`: 兼容 GM.getValue（异步标准）和 GM_getValue（Tampermonkey 同步）
- `safeOpenTab`: 兼容 GM.openInTab 和 GM_openInTab

### 3. 配置与状态管理 (行 78-152)
- `DEFAULT_CONFIG`: 默认配置（语言、定位、偏移量、超时、按钮样式、配色、搜索引擎等 17 项）
- `SCROLL_REPAINT_MODE`: 滚动重绘模式枚举
- `SEARCH_ENGINES`: 搜索引擎注册表（Google, Baidu, Bing, Brave）
- `PAN_DOMAINS` / `PAN_CODE_REGEX`: 网盘域名和密码提取规则
- 运行时状态变量（缓存选区、UI定时器、ShadowDOM等）
- `configCache` 内存配置缓存 + `getConfig`/`setConfig` 同步读/异步写

### 4. 多语言支持系统 I18N (行 154-385)
- 三种语言：`zh-CN`、`en`、`ru`
- 包含菜单项、按钮、提示词、节日文案等全部 UI 文本
- `t(key, ...args)`: 翻译函数，支持 auto 语言自动检测

### 5. 编辑模式与合规声明 (行 387-536)
- `isEditMode` / `hasEditSessionStarted` 状态
- `ensureComplianceBanner()`: 使用 Canvas 防篡改文本 + MutationObserver 自修复
- `toggleEditMode(enable)`: 切换 `document.designMode`

### 6. 菜单系统 (行 538-768)
- `initConfiguration()`: 并行加载所有配置项
- `initDefaultSearchEngine()`: 时区检测自动设置默认搜索引擎
- `registerMenus()`: 注册约 18 个 GM_registerMenuCommand（语言、位置、偏移、超时、样式、配色、搜索引擎、智能搜索引擎、备用引擎、缓存、Toast、快捷键、闪电粘贴、拖拽预览、删除按钮、屏蔽元素、编辑模式、重置）

### 7. 链接与密码提取 (行 774-823)
- `extractLinkFromText()`: 智能 URL 提取（清洗中文混淆、正则匹配、域名校验、私有 IP 过滤）
- `extractPanCode()`: 网盘提取码正则提取

### 8. 选区定位计算器 (行 826-909)
- `getSmartSelectionState()`: 三级降级策略
  - Level A: 智能 Rect（基于 selection 方向和垂直排版判定）
  - Level B: 经典包围盒（getBoundingClientRect）
  - Level C: 鼠标坐标兜底（构造虚拟 Rect）

### 9. Shadow DOM 容器与样式 (行 910-1193)
- `initContainer()`: 创建/重建 Shadow DOM 主机（挂载到 `<html>` 而非 `<body>`，防 SPA 销毁）
- `getStyles()`: 动态生成样式表（横排/竖排、浅色/深色、液态玻璃效果、分割线、Toast 样式）

### 10. 拖拽链接预览 (行 1196-1294)
- `handleLinkDragStart()` / `handleLinkDragEnd()`: 拖拽距离 > 30px 时打开预览窗口
- `openPreviewWindow()`: 黄金比例窗口尺寸（屏幕 61.8%）

### 11. 超级取词模式 (行 1296-1721)
- `getUnlockCSS()`: 强制 text-selectable + 禁止拖拽 + 穿透遮罩层
- `cleanInlineEvents()`: 清除内联事件（onselectstart, oncopy 等）
- `toggleUnlockMode()`: 注入/移除 CSS 和事件拦截器
- `handleExpandHover()`: 鼠标悬停自动展开截断文本（单行 ellipsis / 多行 line-clamp）
- 键盘监听（keydown 开启，keyup 关闭）
- `modifiedElements` 集合：追踪并恢复被修改的 input 属性

### 12. 剪贴板与 Toast (行 1724-1769)
- `copyToClipboard()`: 三级降级（ClipboardItem → writeText → GM_setClipboard）
- `showToast()`: Shadow DOM 内 Toast 提示

### 13. 背景亮度检测 (行 1770-1813)
- `getBestContrastTheme()`: YIQ 公式计算背景亮度，返回 'theme-light-ui' 或 'theme-dark-ui'

### 14. 按钮渲染引擎 (行 1815-2246)
- `renderButton()`: 核心 UI 渲染函数，支持三种模式：
  - **编辑模式**: 删除、加粗、高亮按钮
  - **默认模式**: 复制 + 剪切(输入区) + 删除(输入区) + 搜索(短文本) + 锁链(链接) + 校正(中文输入区) + 粘贴(三按钮模式)
  - **粘贴模式**: 单按钮粘贴（网盘密码优先）
- 位置计算逻辑：正向/反向选区、垂直排版、边缘检测

### 15. 事件处理系统 (行 2259-2690)
- `handleSelectionMouseUp()`: 选区事件主入口（延迟 10ms 执行）
- `handleGlobalMouseDown()`: 点击外部隐藏
- `handleResizeOrScroll()`: 滚动/调整大小重绘（always/viewport/hide 三种策略）
- `handleContextMenu()`: 右键清除缓存
- `handleKeydownHideUI()`: 按键隐藏（超级取词模式除外）
- `handleInputPasteMouseUp()`: 输入框粘贴入口（延迟 20ms）

### 16. 智能文本校正 (行 2389-2548)
- `smartCorrectText()`: 9 条中文排版规范
  - 规范 1: 中英之间加空格
  - 规范 2: 中文与数字加空格（数学语境感知）
  - 规范 3: 去标点前空格
  - 规范 4: 数字+单位处理
  - 规范 5: 中文句号去重
  - 规范 6: 纯中文环境英文标点转中文
  - 规范 7: 数字间中文冒号转英文
  - 规范 8: 双引号配对修正
  - 规范 9: 换行/删空判定
- `handleTextCorrection()`: 执行校正（execCommand insertText 或降级粘贴）
- `performPaste()`: 通用粘贴逻辑（execCommand → contentEditable/text 操作 → 原生 value setter）

### 17. 元素屏蔽器 (行 2692-2848)
- `activateElementPicker()`: 红色高亮覆盖 + 点击选中屏蔽
- `disablePicker()`: 退出拾取模式
- `generateCssSelector()`: 生成最短唯一选择器
- `saveBlockRule()` / `applySavedBlockingRules()`: 规则持久化

### 18. 烟花粒子特效 (行 2850-2971)
- `getFestivalType()`: 农历/公历节日检测（春节/圣诞）
- `triggerSpringFestivalEffect()`: Canvas-free 粒子动画（20-40 个粒子、重力+摩擦力）
- `getSpringFestivalToastText()`: 节日 Toast 文案

### 19. 码字防丢子系统 (行 2972-3138)
- `getRecoveryUrlKey()`: URL 规范化（off/loose/strict）
- `getRecoverySelector()`: 元素唯一标识符生成
- `handleInputSave()`: 500ms 防抖保存输入内容
- `handleFormSubmit()`: 表单提交时清除缓存
- `restoreInputData()`: 页面加载时恢复数据（原生 setter + 事件触发）

### 20. 启动引导 (行 3140-3258)
- `main()`: 异步启动流程
  1. 加载配置
  2. 初始化默认搜索引擎
  3. 注册菜单
  4. 应用屏蔽规则
  5. 注册 Ctrl+滚轮拦截
  6. 注册所有事件监听器
  7. 注册拖拽预览事件
  8. 注册页面隐藏清理闪电粘贴缓存（visibilitychange）
  9. 启动码字防丢
  10. 检查网盘密码交接
- `handleVisibilityChange()`: 页面隐藏（visibilityState === 'hidden'）时销毁 smart_paste_cache、sessionPanCode 和 pan_paste_handover

## 技术特点

| 特性 | 实现方式 |
|------|----------|
| UI 隔离 | Shadow DOM（挂载到 documentElement） |
| 样式注入 | 动态生成 CSS 字符串（液态玻璃效果） |
| 配置存储 | GM_setValue/GM_getValue + 内存缓存 |
| 选区定位 | 三级降级：智能Rect → 包围盒 → 鼠标坐标 |
| 剪贴板 | 三级降级：ClipboardItem → writeText → GM_setClipboard |
| 兼容性 | 异步/同步 GM API 兼容层 |
| SPA 防护 | 容器重建 + 挂载到 `<html>` 防销毁 |
| 合规声明 | Canvas 防篡改文本 + MutationObserver 自修复 |

## 模块依赖关系

```
main()
 ├── initConfiguration() → safeGetValue × N
 ├── initDefaultSearchEngine() → safeGetValue / safeSetValue
 ├── registerMenus() → GM_registerMenuCommand × N
 ├── applySavedBlockingRules() → configCache
 ├── [事件监听]
 │    ├── handleSelectionMouseUp → getSmartSelectionState / initContainer / renderButton
 │    ├── handleInputPasteMouseUp → renderButton
 │    ├── handleResizeOrScroll → renderButton
 │    ├── handleContextMenu → hideUI / safeSetValue
 │    ├── handleVisibilityChange → safeSetValue (页面隐藏时清理闪电粘贴缓存)
 │    ├── keydown/keyup → toggleUnlockMode / toggleEditMode
 │    └── wheel → Ctrl+滚轮拦截
 ├── [拖拽预览] → handleLinkDragStart/handleLinkDragEnd → openPreviewWindow
 ├── [码字防丢] → handleInputSave / handleFormSubmit / restoreInputData
 └── [网盘交接] → checkPanHandover
```

## 建议模块拆分方案

| 模块文件 | 内容 | 行数估计 |
|----------|------|----------|
| `header.js` | UserScript 元数据 + 许可声明 | ~50 |
| `compat.js` | GM API 兼容层 | ~30 |
| `config.js` | 配置管理 + 状态 + 常量 | ~80 |
| `i18n.js` | 多语言系统 | ~230 |
| `compliance.js` | 编辑模式 + 合规声明 | ~150 |
| `menu.js` | GM 菜单系统 | ~230 |
| `extractors.js` | 链接提取 + 网盘密码提取 | ~50 |
| `selection.js` | 选区定位计算器 | ~85 |
| `shadow-dom.js` | Shadow DOM 容器 + 样式 | ~285 |
| `drag-preview.js` | 拖拽链接预览 | ~100 |
| `unlock-mode.js` | 超级取词模式 | ~425 |
| `clipboard.js` | 剪贴板操作 + Toast | ~50 |
| `theme.js` | 背景亮度检测 | ~45 |
| `renderer.js` | 按钮渲染引擎 | ~430 |
| `events.js` | 事件处理系统 | ~70 |
| `text-correct.js` | 智能文本校正 | ~160 |
| `blocker.js` | 元素屏蔽器 | ~155 |
| `festival.js` | 烟花粒子特效 | ~120 |
| `input-recovery.js` | 码字防丢子系统 | ~165 |
| `bootstrap.js` | 启动引导 | ~105 |
| `build.js` | 构建脚本（合并模块） | ~30 |

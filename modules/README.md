# Text Selection Toolbar - 模块化开发

## 目录结构

```
modules/
├── 00-header.js          # UserScript 元数据 + 多语言声明
├── 01-compat.js          # GM API 异步兼容层
├── 02-config.js          # 配置常量 + 状态管理
├── 03-i18n.js            # 三语言 I18N 系统 (zh-CN/en/ru)
├── 04-compliance.js      # 编辑模式 + Canvas 防篡改声明
├── 05-menu.js            # GM 菜单注册系统
├── 06-extractors.js      # URL 提取 + 网盘密码提取
├── 07-selection.js       # 三级降级选区定位
├── 08-shadow-dom.js      # Shadow DOM + 液态玻璃样式
├── 09-drag-preview.js    # 链接拖拽预览窗口
├── 10-unlock-mode.js     # 超级取词模式
├── 11-clipboard.js       # 剪贴板 + Toast
├── 12-theme.js           # 背景亮度自适应主题
├── 13-renderer.js        # 按钮渲染引擎 (默认/编辑/粘贴三模式)
├── 14-events.js          # 鼠标/键盘/滚动事件处理
├── 15-text-correct.js    # 9 条中文排版规范校正
├── 16-blocker.js         # 元素拾取 + 屏蔽
├── 17-festival.js        # 春节/圣诞粒子特效
├── 18-input-recovery.js  # 码字防丢缓存恢复
├── 19-bootstrap.js       # 启动引导 (IIFE 入口)
└── build.js              # 构建脚本 (合并模块)
```

## 模块依赖关系

```
01-compat.js (无依赖，最底层)
    ↓
02-config.js (依赖 compat 的 safeGetValue/safeSetValue)
    ↓
03-i18n.js  (依赖 config 的 getConfig)
    ↓
04-19*.js   (平行依赖 config + i18n + compat)
    ↓
19-bootstrap.js (依赖以上全部，IIFE 入口)
```

## 构建

```bash
node modules/build.js
```

构建脚本按依赖顺序拼接所有模块，生成根目录下的 `main.user.js`。

## 开发约定

1. 每个模块顶部的注释标明模块编号和功能
2. 模块间通过全局变量通信（保持与原脚本兼容）
3. 修改单个模块后运行构建脚本验证
4. 新增模块需添加到 `build.js` 的模块列表中

# Changelog

## 2026.06.17 - 划词功能重大改进

### 新增功能
- **TLD域名白名单验证**：嵌入Top 100顶级域名列表，只有匹配白名单中的域名才识别为网址链接，避免误识别
- **邮箱地址检测与@按钮**：选中包含`@`的文本时，显示@按钮，点击复制完整邮箱地址到剪贴板
- **自定义TLD菜单选项**：通过脚本管理器菜单可添加自定义顶级域名，支持i18n多语言（中/英/俄）

### 改进
- **完全重写网盘访问码提取逻辑**：新的`extractLinkAndCode()`函数统一处理URL和密码提取
  - 支持中文干扰词（如"删、去、这几个字"等）混合在URL中的情况
  - 扩展密码检测关键词：提取码、密码、访问码、分享码、口令、code、pwd、key、pw、pass
  - 支持括号格式提取：`(访问码:cpn0)` 和 `(:cpn0)` 和 `(cpn0)`
  - 密码长度扩展至4-8位
  - 增强URL末尾符号清洗
  - 排除内网IP地址（10.x, 172.16-31.x, 192.168.x, 127.x, 0.x）

### 技术细节
- 新增`TLD_SET`集合包含100个顶级域名
- 新增`getEffectiveTLDs()`合并内置和用户自定义TLD
- 废弃旧的`extractLinkFromText()`和`extractPanCode()`及`PAN_CODE_REGEX`
- @按钮使用来自at-sign.txt的SVG图标
- 邮箱检测优先于链接检测（同时有@和URL时优先显示@按钮）

## 2026.06.18 - 网盘URL提取精确修复

### 修复
- **修复URL路径过度吸收问题**：采用双重策略提取URL
  - 策略A：在原文中逐字符扫描，遇中文立即设置边界，中文后的内容不再属于URL
  - 策略B：若原文无锚点，则在清洗中文后的文本中搜索（处理中文嵌入URL内部的极端场景）
  - 解决 `(访问码:cpn0)` 被误吸入URL的问题 — 检测中文前的`(`作为注释边界回退
- **RFC 3986严格字符过滤**：仅允许URL安全字符（`a-zA-Z0-9._~:/?#[]@!$&'()*+,;=%\-`）进入路径
- **非ASCII字符一律拒绝**：中文、emoji、全角符号等不会混入URL

### 测试验证
- Case 1: `【天翼云盘：https://cloud.189.cn/t/3yqYreieuUFv(访问码:cpn0) 】` → URL正确提取为 `https://cloud.189.cn/t/3yqYreieuUFv`，密码 `cpn0`
- Case 2: `5日iPhone 历代壁纸https://www.aliyundrive.com/s/rxUp6HNpwP8点击链接...` → URL正确提取为 `https://www.aliyundrive.com/s/rxUp6HNpwP8`
- Case 3: `htt删p:/去/pan这.bai几du.co个m/s/hff字H57gb?...（提取码:5u8m）` → URL提取为 `http://pan.baidu.com/s/hffH57gb?=yhgfdxcc54`，密码 `5u8m`

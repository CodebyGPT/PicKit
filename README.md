
# PickKit（拾字工具箱）- 提升鼠标在网页浏览器中的操作效率

【AICG 警告】

脚本大部分代码参考或直接使用了 Gemini 3 Pro Preview、ChatGPT、Kimi K2、Qwen3-Max 等 LLM 的输出结果。

【非原创内容声明】

1. Icon 来自 allsvgicons.com 提供的 material-symbols:touch-triple。
2. 脚本大部分代码参考或直接使用了 Gemini 3 Pro Preview、ChatGPT、Kimi K2、Qwen3-Max 等 LLM 的输出结果。
3. 快速粘贴网盘提取码功能参考了 greasyfork.org/zh-CN/scripts/445489-网盘链接识别、greasyfork.org/zh-CN/scripts/439266-网盘有效性检查、github.com/Magiclyan/panAI（forked from syhyz1990/panAI）等脚本。
4. 中文文本校正功能的部分语法规则参考了 github.com/sparanoid/chinese-copywriting-guidelines 中的内容。

【社区贡献（主动帮助修复、改进、推广、翻译本项目）】

（暂无)

---

## 这是什么？

一个油猴脚本（UserScript）。最初是希望在 Chrome 等浏览器上复刻 Microsoft Edge、360 安全浏览器等内置的快捷划词栏功能（因为我不想每次复制都低头看一眼键盘或者多点一次鼠标右键），于是借助 AI 写了一个简单的划词复制和搜索脚本，后来想法越来越多，干脆当起了产品经理兼 QA，最终拼凑出了这个面向鼠标操作的效率类小工具。

## 如何安装

推荐前往 **Greasy Fork** 安装，已设置源代码同步，支持自动更新🔄️：[https://greasyfork.org/zh-CN/scripts/558720-pickit](https://greasyfork.org/zh-CN/scripts/558720-pickit)

用户脚本管理器推荐：Chromium 138+：[ScriptCat](https://docs.scriptcat.org/)；旧版 Chromium、Firefox：[Violentmonkey](https://violentmonkey.github.io/)、[ScriptCat v0.16.x](https://github.com/scriptscat/scriptcat/releases/tag/v0.16.11)。

## 基本特性

* UI 模仿 Apple Liquid Glass 风格
* 适配多语言（本项目目前支持简体中文、英语、俄语，欢迎贡献其他语言。This project currently supports Simplified Chinese, English, and Russian. We welcome contributions in other languages. Этот проект в настоящее время поддерживает упрощенный китайский, английский, русский языки и приветствует вклад других языков.）
* 注重低内存占用
* 事件驱动，避免轮询等 CPU 密集型代码
* 100% 离线运行
* 无混淆代码，无商业或恶意行为

## 已实现功能

|功能名称|具体内容|更新日志|
| :--------  | :-----  | :----:  |
|🖱️ 网页划词|弹出快捷复制、搜索栏。如果文本含超链接则弹出打开（新建标签页）按钮，如果是常见的网盘链接同时附带访问密码+用户开启了“闪电粘贴”，则跳转到新标签页后点击输入框可以快速粘贴密码。|2025.12.12（初始版本）功能上线|
|⌨️ 输入框划词|弹出快捷复制、剪贴按钮。在中文环境下若匹配到内置规则时（例如中英文字符之间没有空格且没有被引号框住）弹出校对按钮。|2025.12.12（初始版本）功能上线|
|⚡ 闪电粘贴|复制后，在任意标签页的输入框中点击直接弹出粘贴按钮。|2025.12.12（初始版本）功能上线|
|🔓 超级取词|按住热键，可以临时移除网页通过 JS 或 CSS 对选中、复制、Ctrl+C 等操作的干扰，使被鼠标点击的密码暂时变成明文，可完整选取被折叠的文本，松开热键一切复原。|2025.12.12（初始版本）功能上线|
|🔗 拖拽预览|拖拽任意超链接可打开小窗快速预览。|2025.12.12（初始版本）功能上线|
|🚫 屏蔽网页自带划词条|干掉讨厌的网页自带的划词条。|2025.12.12（初始版本）功能上线|

### To Do

|类型|事项|详情|优先级|
| :--------  | :--------  | :-----  | :----:  |
|💡 Other|为项目创建 GitHub Page|（同左）|待定|
|🧩 Feature|修复并启用“缓存已输入文本” 功能|可以进一步考虑是否可以升级为表单填充助手功能|中|
|👾 Bug|修复超级取词-完整选取被折叠的文本功能|该功能会造成某些文本显示位置发生错位，例如百度搜索结果页右侧栏中的“弹幕互动”|中|
|🧩 Feature|优化 UI 的Liquid Glass 效果|目前的 UI 是普通毛玻璃在左上角和右下角贴了一层伪反光模仿Liquid Glass，实际不是Liquid Glass|低|
|🧩 Feature|拖拽预览增加点击父窗口自动关闭子窗口（预览弹窗）功能|1、需要实现跨标签页和跨域通信，且避免轮询；2、需要适配有前置跳转页面的网页，打开这类网页时如果不做处理会使子窗口断开与父窗口的关联，导致点击父窗口无法关闭子窗口|中|
|🧩 Feature|优化网页划词-提取超链接识别规则|现有的识别规则太过宽泛（例如会把“abcd.efg”也识别成超链接），计划内置一个常见的顶级域名列表来解决|高|
|🧩 Feature|实现文本中转框功能|默认显示为一个贴边悬浮缩略图，用户划词后可拖动丢进中转框内，中转框内有记录时默认展开显示，并且在所有标签页中都可见，用户可以将单条记录拖出来，也可以多选记录后按选择顺序进行换行拼接后复制或首尾拼接后复制，以此实现多条文本跨 Tab 流转体验|中|
|🧩 Feature|实现大爆炸功能|通过热键（默认 Tab 键）进入，在大爆炸模式下用户可以直接在页面中多选文本，同时创建一个独立的文本中转框用于实时记录|需等待文本中转框功能实现|
|🧩 Feature|实现划词翻译功能|借助 Google Chrome 在138+ 开始提供的 Translator and Language Detector APIs 实现划词后纯离线零延迟翻译体验。细节：代码和被英文双引号框住的文本不进行翻译|低|
|🧩 Feature|实现一致性检测功能|默认开启。1、监听到复制事件时将用户当前选中的文本与剪贴板中的数据进行比较，若不一致则通过GM_notification警告用户；2、检测到用户选中的文本包含隐藏的或屏幕外的元素时警告用户；3、在非原创内容声明中增加：参考自github.com/roedesh/copyguard，演示地址：https://codingcheats.io/copy/、https://ruud.je/always-double-check-what-you-copy-from-websites|中|
|🧩 Feature|光标移至pre:has(code)代码块内时，显示复制全部按钮|默认关闭|中|
|🧩 Feature|光标移至textarea/input/富文本编辑器内时，显示清空按钮|默认关闭|中|
|👾 Bug|更换输入框划词-高亮按钮的 SVG 图标|需要更换成“荧光笔笔头”或者“画笔刷“的图案|高|
|👾 Bug|优化剪切按钮的逻辑|剪切逻辑在某些网页中无法正常删除选中的文字，例如markdown.lovejade.cn|中|
|🧩 Feature|让 Unlock Mode 能够应对 Shadow-root|以 msn.cn 为例，用户按住超级取词键时可以选中位于 #shadow-root (open) 容器内的文本|低|
|👾 Bug|解决反向选区按钮位置在页面 scroll/resize 后跳回正向选区按钮位置的问题|（同左）|中|
|🧩 Feature|丰富输入框划词-校对功能的规则库|（同左）|低|
|🧩 Feature|输入框划词-新增换行按钮 | 当用户点击输入框中任意一行的末尾时，追加显示换行按钮，点击即可在此处换行|待定|
|🧩 Feature|支持放大查看图片|仿淘宝京东商品图片放大预览|待定|
|🧩 Feature|引入三方库以实现识别图片二维码能力|（同左）|待定|
|💡 Other|优化代码逻辑、结构和可读性|（同左）|低|

---

本脚本起初只是为了方便我自己工作，所以业余时间利用 AI 拼拼凑凑写出来的，然而随着 tokens 不断增加导致大模型输出的代码质量越来越不稳定，加上我自己不懂编程，所以感觉维护起来越来越困难，欢迎感兴趣的大佬参与贡献、接手开发，或重新实现成 Manifest V3 扩展程序。❤️

---

最新更新于 2025.12.19

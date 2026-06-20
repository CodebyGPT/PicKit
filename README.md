# <img src="https://api.iconify.design/material-symbols:touch-triple.svg" width="32"> Text Selection Toolbar - 划词工具栏
![GitHub License](https://img.shields.io/github/license/CodebyGPT/Text_Selection_Toolbar)
![GitHub Repo stars](https://img.shields.io/github/stars/CodebyGPT/Text_Selection_Toolbar)
![Greasy Fork Downloads](https://img.shields.io/greasyfork/dt/558720)
![Greasy Fork Rating](https://img.shields.io/greasyfork/rating-count/558720)

![demo](https://github.com/user-attachments/assets/f119f59d-fca7-4364-b2e0-c556f2501c7f)

## What is this?

https://github.com/user-attachments/assets/fb64dc93-37e7-421f-bc5d-89a8ef43b7c8

A UserScript for mouse and trackpad users, aiming to replicate Microsoft Edge's built-in text selection toolbar. It enables quick copy, search, and other operations on selected text without repeatedly opening the right-click context menu.

## How to Install?

It is recommended to install from [👉**Greasy Fork**👈](https://greasyfork.org/zh-CN/scripts/558720) for automatic updates. Alternatively, download from [**GitHub Releases**](https://github.com/CodebyGPT/word_selection_toolbar/releases) and import manually into your script manager.

> If this is your first time installing a UserScript, you must first install a script manager in your browser: Chromium 138+ recommended: [ScriptCat](https://docs.scriptcat.org/); older Chromium and Firefox browsers recommended: [Violentmonkey](https://violentmonkey.github.io/), [Legacy ScriptCat (v0.16.x)](https://github.com/scriptscat/scriptcat/releases/tag/v0.16.11).

## Basic Features

* Toolbar UI inspired by Apple Inc.'s Liquid Glass style (future plans: hover highlights, click-bounce effects cross-browser, lens refraction via CSS and SVG filters for Chromium-based browsers)
* Multi-language support (machine-translated)
* Low memory footprint
* 100% event-driven
* Runs in an isolated context, makes no modifications to the webpage by default — does not affect normal page operation
* 100% offline (script auto-updates are handled by the script manager reading metadata)
* No obfuscated code
* Built according to the latest [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web) for maximum compatibility

## Implemented Features

| Feature | Details | Changelog |
| :------ | :------ | :-------: |
| 🖱️ Text Selection | Shows quick copy and search toolbar on text selection. If the text contains hyperlinks, shows an Open Link (new tab) button. For common cloud drive links with access passwords and "Lightning Paste" enabled, the password can be quickly pasted when clicking an input field on the target page. | 2025.12.12 - Launched; 2026.1.5 - Added UI repaint settings; 2026.1.19 - Added smart search engine allocation |
| ⌨️ Inline Selection | Shows quick copy and cut buttons in input fields. In Chinese environments, if built-in rules match (e.g., missing spaces between CJK and Latin characters not enclosed in quotes), shows a correction button. | 2025.12.12 - Launched |
| ⚡ Lightning Paste | After copying, clicking any input field on any tab shows a paste button directly. | 2025.12.12 - Launched |
| 🔓 Unlock Mode | Hold the hotkey (default: Left Ctrl) to temporarily remove JS/CSS restrictions on selection, copying, Ctrl+C, etc. Reveals masked passwords in plain text, enables selection of truncated text. Releasing the hotkey restores everything. Test pages: https://www.wlgooo.com/19458.html , https://rehtt.com/ , https://www.cnblogs.com/ppqppl/articles/17461611.html , https://www.baidu.com/s?wd=0 | 2025.12.12 - Launched |
| 🔗 Drag Preview | Drag any hyperlink to open a small preview window. | 2025.12.12 - Launched |
| 🚫 Block Native Toolbar | Block annoying built-in text selection toolbars on websites. | 2025.12.12 - Launched |

## To Do

| Type | Item | Details | Priority |
| :--- | :--- | :----- | :------: |
| 👾 Bug | Unlock mode not working on some sites | 1. Some sites (e.g., Zhihu专栏) use custom fonts causing garbled copied text. Some sites render text on canvas, making text selection impossible. General solution: OCR. 2. shadow-root related: on some sites (e.g., msn.cn), text cannot be selected even with unlock mode because the target text is inside shadow-root where user-select: none cannot be overridden externally. | Ongoing |
| 👾 Bug | Cloud drive URL detection optimization | E.g., text `【天翼云盘：https://cloud.189.cn/t/3yqYreieuUFv(访问码:cpn0)】` misidentified as `https://cloud.189.cn/t/3yqYreieuUFv(:cpn0`; `5日iPhone 历代壁纸https://www.aliyundrive.com/s/rxUp6HNpwP8点击链接保存,或者复制本段内容,打开「阿里云盘」APP ,无` misidentified as `https://www.aliyundrive.com/s/rxUp6HNpwP8,,「」APP` | High |
| 👾 Bug | Cut button behavior in input fields | On some sites (e.g., markdown.lovejade.cn), clicking cut after selecting text in input fields does not delete the selected text. | Medium |
| 👾 Bug | Lightning paste cannot trigger paste event | In places like Baidu Translate (fanyi.baidu.com), pasting via lightning paste does not trigger translation. | Medium |
| 👾 Bug | "Allow scrolling truncated text" may break page layout | Can cause alignment issues, e.g., the "弹幕互动" element in Baidu search sidebar. | Medium |
| 👾 Bug | Backward selection position reverts to forward after scroll/resize | The toolbar position for backward selections returns to forward selection logic after page scroll/resize. | Medium |
| 👾 Bug | UI repaint not triggered in some input scenarios | E.g., when editing README.md on GitHub, scrolling the input field does not trigger UI repaint. | Medium |
| 👾 Bug | UI repaint reverts to text selection mode from input mode | E.g., resizing the window while UI is visible on GitHub's README editor causes the UI to revert to copy+search style. | Medium |
| 👾 Bug | No UI repaint and backward selection issues in specific pages | E.g., selecting text in Bilibili video comments — UI disappears on scroll/resize and always appears below anchor on backward selection. Works normally on video title selection. Suspected coordinate drift. | Medium |
| 👾 Bug | Mouse position fallback too close to cursor | Even with UI offset configured, fallback position is sometimes too close to cursor, obstructing user operations. | Medium |
| 👾 Bug | Cursor disappears after releasing Left Ctrl hotkey | Pressing Ctrl+V in an input field triggers unlock mode; releasing exits unlock mode but cursor disappears. User must click the input field again. Proposed solutions: 1. Skip unlock when activeElement is an input field. 2. Remember cursor position before unlock and restore after exit. | Low |
| 🧩 Feature | Lightning paste — improve auto-cache clearing | Change from "clear on paste" to "clear on tab blur", allowing repeated paste within the same page. | High |
| 🧩 Feature | Lightning paste — show cached text on toolbar | Display cached text next to the paste icon, truncated with ellipsis for overflow. Add setting to toggle visibility. | High |
| 🧩 Feature | Lightning paste — support copying without toolbar | Listen for copy events; implement paste via simulated Ctrl+V. Single paste icon only (no text preview) due to clipboard read limitations. | High |
| 🧩 Feature | URL detection optimization — built-in TLD list | Current detection is too broad (e.g., "abcd.efg" detected as a link). Plan to use a common TLD whitelist. | High |
| 🧩 Feature | Text selection / input field — translation | Plan to support two methods: 1. Local translation via [STranslate](https://github.com/STranslate/STranslate); 2. Google Chrome 138+ Translator API (en→zh initially). Exclude code, URLs, and English-quoted text. Webpage translation results shown as white translucent floating panel; input field results add a "replace original" option. Full-page translation not planned. | High |
| 🧩 Feature | Input field — smart selection adjustment | 1. Auto-extend to cover adjacent whitespace characters. 2. Auto-trim leading/trailing whitespace. 3. Change current whitespace-only hideUI behavior to show delete button. | High |
| 🧩 Feature | Lightning paste — system clipboard monitoring | Native OS-level app tracks clipboard write timestamps; userscript polls via GM_xmlhttpRequest. Paste via simulated Ctrl+V without reading clipboard content. | High |
| 🧩 Feature | Text selection — temporary search engine switch | Long-press search button to show engine selector. Option to temporarily set as default until browser close. Consider removing current "smart engine" feature. | Medium |
| 🧩 Feature | Rewrite "Cache Selection" as "Input History" | Auto-backup drafts for form inputs. Create unique identifiers per input field; cache latest input on each keystroke (excluding clear input actions). Event-driven, no polling. | Medium |
| 🧩 Feature | Text selection — share | Generate share cards (plain text / markdown / image) on click. Card content: selected text, page URL, favicon (optional), page title (optional), timestamp (optional), context (optional). Link with text flow feature for multi-text sharing. | Medium |
| 🧩 Feature | Text selection — text flow | Collapsed by default (floating bubble at top-right). Drag selected text onto the bubble. Click to expand list (synced across all tabs). Items displayed as capsule text boxes, draggable to any input field. Multi-select for concatenation (line break or sequential). Config option to persist across browser sessions. | Medium |
| 🧩 Feature | Text selection — multi-select | Secondary feature of Unlock Mode. After activating unlock mode, selections show Copy and Pin buttons. Pinned text stays highlighted. On hotkey release, offers options: "Join with newline", "Concatenate", "Join with comma", "Send to text flow". Supports deselection. Also: double-click + drag to draw rectangular selection box (light blue translucent). | High (text flow dependent) |
| 🧩 Feature | Unlock mode — overlay piercing | Change pointer-events from "all" to "none" on overlay elements blocking text. | Medium |
| 🧩 Feature | Unlock mode — Canvas text extraction | Hook Canvas fillText calls to retrieve actual text parameters and copy to clipboard. Proof-of-concept script "Canvas fillText Text Extractor.js" uploaded to this repo. | Medium |
| 🧩 Feature | pre:has(code) — copy all code button | Show "Copy All Code" button when cursor hovers over code blocks. | Medium |
| 🧩 Feature | Drag preview — auto-close child tabs | When parent tab regains focus and user clicks anywhere, close all preview child tabs. Use GM_getTab to link parent/child tab IDs. If parent tab is closed, child tabs are not retained. | Medium |
| 🧩 Feature | Enhanced Liquid Glass UI | Current effect is background blur + edge highlight. True liquid glass requires background distortion. Reference: https://kube.io/blog/liquid-glass-css-svg/ | Low |
| 🧩 Feature | Text correction — enhanced rules | 1. Detect mismatched quotes, mixed Chinese/English quotes. 2. Chinese period vs English period (avoid file extensions). 3. Disable CJK/Latin space insertion by default. 4. Per-rule toggle in submenu. 5. Future: local model integration. | Low |
| 🧩 Feature | Input — Chinese ID card parsing | Conditions: Chinese locale, 18-digit or 17+digit+X, area code 11-65. Toast: "♂/♀ Valid ID card, Male/Female, XX years old, XX Province/City/District" or "Invalid ID card number". | Low |
| 🧩 Feature | Input — bank card number validation | Luhn algorithm validation. Toast: "Valid bank card number — verify before transaction" or "Invalid card number". https://github.com/whinc/whinc.github.io/issues/6 | Low |
| 🧩 Feature | Copy protection — hidden text warning | Detect off-screen or invisible text embedded in visible content (malicious websites use this to inject hidden content into copied text). Demo: https://thejh.net/misc/website-terminal-copy-paste . Check for font-size:0, off-screen positioning, transform:scale(0), etc. | Low |
| 🧩 Feature | Copy protection — Unicode homoglyph attack warning | Detect visually identical Unicode characters replacing ASCII letters (e.g., Cyrillic `а` (U+0430) vs Latin `a` (U+0061)) in URLs. | Low |
| 🧩 Feature | Copy protection — zero-width character detection | Detect hidden zero-width characters (U+200B, U+200C, U+200D, U+FEFF) used for tracking. | Low |
| 🧩 Feature | Delete button visibility — add "whole line only" mode | Add a third state: "visible only when entire line is selected", determined by checking if selectionStart/selectionEnd surrounds \n characters. | Low |
| 🧩 Feature | Input — double-click to select all + show toolbar | Three options: disabled (default), select all without toolbar, select all with toolbar. Single-line: select all. Multi-line: select current line. | Low |
| 🧩 Feature | Text selection — magnifying glass near cursor | iOS-style magnifier on text selection. Appears on mousedown, fades on release. | Low |
| 🧩 Feature | Scroll to top/bottom button | Floating button at bottom-right, disabled by default. | Low |
| 🧩 Feature | Enhanced holiday easter eggs | 1. Extend beyond CNY/Christmas to common holidays with themed emoji. 2. April Fools / 618 / Singles' Day: fake "subscribe for deals" that actually prompt users to star/contribute. 3. Config to disable all easter eggs. Festivals: Feb 14 💕, Mar 8 🎀, Mar 17 🍀, May 1 💼, May 17 🌈, Jun 1 🧸, Oct 31 🎃, Nov 1-2 ⚰️, Dec 25 🎄, Lunar Jan 1 🧧, Lunar Jan 15 🥣, Lunar May 5 🐉, Lunar Aug 15 🌕. | Low |
| 🧩 Feature | Page editor — more buttons | Undo, redo, italic, underline, strikethrough, increase/decrease font size, align, indent, format painter, etc. | Low |
| 🧩 Feature | Intercept silent clipboard writes | Warn when a webpage writes to clipboard without user interaction (no click, copy event). Allow default-denying clipboard write permissions per site. Low priority due to rarity of abuse. | TBD |
| 🧩 Feature | Input — insert line break in multi-line fields | Show a "line break" button when the cursor is at the end of any line in a multi-line input field. | TBD |
| 🧩 Feature | Input — delete empty line in multi-line fields | Trigger detection: forward selection has no trailing chars, or backward selection has no leading chars. Check if cursor is on an empty line with a preceding line. Show delete line button; click removes the empty line. If cursor position changes, immediately hideUI. | TBD |
| 🧩 Feature | Image magnifier preview | Replicate Taobao/JD image zoom preview. On hover, show magnifier button in corner. Consider separating into standalone script due to scope. | TBD |
| 💡 Other | Create GitHub Page for project introduction | (description) | Low |
| 💡 Other | Modularize the project | (description) | In Progress |
| ~~👾 Bug~~ | ~~Copying table text prepends unwanted tabs/newlines~~ | ~~Copying across cell boundaries inserts \t (U+0009) and \n to preserve table structure~~ | Won't fix (browser standard behavior) |

---

## Notes

1. Some icons used in this project are sourced from allsvgicons.com, iconpark.bytedance.com, and other platforms.
2. (Vibe Coding Notice) This script was written with assistance from multiple LLMs.
3. This project references the following projects: greasyfork.org/zh-CN/scripts/445489, greasyfork.org/zh-CN/scripts/439266, github.com/Magiclyan/panAI (forked from syhyz1990/panAI), github.com/sparanoid/chinese-copywriting-guidelines.
4. Any modification, redistribution, or republishing of this project does not require the author's permission.
5. My browser is [Chromium](https://github.com/Hibbiki/chromium-win64). Chromium is an actively developed project. Once Chromium adds native text selection toolbar support, this project will be discontinued.

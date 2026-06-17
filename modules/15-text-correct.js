// 模块 15: 智能文本校正 (Smart Text Correction)

// 9条中文排版规范的核心校正算法
function smartCorrectText(text, isInputType) {
    // 0. 基础判定
    const hasHanzi = /[\u4e00-\u9fa5]/.test(text);
    const hasCNPunct = /[，。：；？！""''（）【】《》]/.test(text);
    const hasNum = /\d/.test(text);

    let activeRules = {
        basic: hasHanzi,
        punct: hasHanzi || hasCNPunct,
        unit: hasHanzi || hasCNPunct || hasNum,
        pureCN: hasHanzi && !/[a-zA-Z]/.test(text.replace(/[a-zA-Z]+(?=[%℃$])/, ''))
    };

    if (!activeRules.basic && !activeRules.punct && !activeRules.unit) return null;

    const applyRule = (txt, regex, replacement) => {
        const parts = txt.split(/(".*?"|".*?")/g);
        return parts.map((part, i) => {
            if (i % 2 === 1) return part;
            return part.replace(regex, replacement);
        }).join('');
    };

    let result = text;

    // --- 规范 9: 换行/删空判定 (优先级最高) ---
    if (activeRules.basic) {
        const rule9Regex = /([\u4e00-\u9fa5。])(\s{2,})(?=[\u4e00-\u9fa5]|\d{1,3}(?:[、.]|\s))/g;
        result = applyRule(result, rule9Regex, (match, p1, p2) => {
            return p1 + (isInputType ? '' : '\n');
        });
    }

    // --- 规范 6: 纯中文环境下的英文标点转中文 ---
    if (activeRules.pureCN) {
        const parts = result.split(/(".*?"|".*?")/g);
        result = parts.map((part, i) => {
            if (i % 2 === 1) return part;
            let p = part;
            p = p.replace(/\.{3,}/g, '……');
            p = p.replace(/\.{2}/g, '。');
            p = p.replace(/(?<!\d)\.(?!\d)|(?<=\d)\.(?!\d)|(?<!\d)\.(?=\d)/g, '。');
            const map = {',':'，', '?':'？', '!':'！', ':':'：', ';':'；', '(':'（', ')':'）'};
            p = p.replace(/[,?!:;()]/g, m => map[m]);
            return p;
        }).join('');
    }

    // --- 规范 1: 中英之间加空格 ---
    if (activeRules.basic) {
        result = applyRule(result, /([\u4e00-\u9fa5])([a-zA-Z])/g, '$1 $2');
        result = applyRule(result, /([a-zA-Z])([\u4e00-\u9fa5])/g, '$1 $2');
    }

    // --- 规范 2: 中文与数字(含运算)加空格 ---
    if (activeRules.basic) {
        const isMathContext = /[+*/=]|等于/.test(text);
        const charSet = isMathContext ? '[\\d+\\-*/=]' : '[\\d]';
        const regex1 = new RegExp(`([\\u4e00-\\u9fa5])(?=${charSet})`, 'g');
        const regex2 = new RegExp(`(${charSet})(?=[\\u4e00-\\u9fa5])`, 'g');
        result = applyRule(result, regex1, '$1 ');
        result = applyRule(result, regex2, '$1 ');
    }

    // --- 规范 3: 字符/数字与后方标点去空格 ---
    if (activeRules.punct) {
        result = applyRule(result, /([a-zA-Z0-9\u4e00-\u9fa5])\s+([,.:;?!，。：；？！、\])}（）】【《》[({""''"'])/g, '$1$2');
    }

    // --- 规范 4: 数字/字符与单位 (%, ℃, $) ---
    if (activeRules.unit) {
        result = applyRule(result, /(\d)\s+([%℃$])/g, '$1$2');
        result = applyRule(result, /([^\s\d])([%℃$])/g, '$1 $2');
    }

    // --- 规范 5: 中文句号去重 ---
    if (activeRules.basic) {
        const parts = result.split(/(".*?"|".*?")/g);
        result = parts.map((part, i) => {
            if (i % 2 === 1) return part;
            part = part.replace(/。{3,8}/g, '……');
            part = part.replace(/。{2}/g, '。');
            return part;
        }).join('');
    }

    // --- 规范 7: 数字间中文冒号转英文 ---
    if (activeRules.unit) {
        result = applyRule(result, /(\d)\s*：\s*(\d)/g, '$1:$2');
    }

    // --- 规范 8: 双引号修正 (仅当只有一对时) ---
    if (activeRules.punct) {
        const quoteCount = (result.match(/[""]/g) || []).length;
        if (quoteCount === 2) {
            let qIndex = 0;
            result = result.replace(/[""]/g, () => {
                qIndex++;
                return qIndex === 1 ? '\u201C' : '\u201D';
            });
        }
    }

    return result === text ? null : result;
}

// 执行校正操作
async function handleTextCorrection(target, originalText) {
    const isInput = target.tagName === 'INPUT';
    const newText = smartCorrectText(originalText, isInput);

    if (!newText) {
        showToast('无需校正');
        return;
    }

    if (document.execCommand && typeof document.execCommand === 'function') {
        try {
            target.focus();
            document.execCommand('insertText', false, newText);
        } catch (e) {
            performPaste(target, newText);
        }
    } else {
        performPaste(target, newText);
    }

    showToast('文本已校正');
    hideUI();
}

// 执行粘贴的核心逻辑 (三级降级策略)
function performPaste(target, text) {
    if (!target) return;
    target.focus();

    // 策略 1: document.execCommand (保留撤销能力，最稳妥)
    try {
        const success = document.execCommand('insertText', false, text);
        if (success) {
            showToast(t('toast_pasted'));
            return;
        }
    } catch (e) {}

    // 策略 2: 直接赋值 + 触发事件 (兼容 Vue/React)
    try {
        if (target.isContentEditable) {
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
                range.collapse(false);
            } else {
                target.innerText += text;
            }
        } else {
            const start = target.selectionStart || 0;
            const end = target.selectionEnd || 0;
            const oldVal = target.value;
            const newVal = oldVal.slice(0, start) + text + oldVal.slice(end);

            let proto = window.HTMLInputElement.prototype;
            if (target.tagName === 'TEXTAREA') {
                proto = window.HTMLTextAreaElement.prototype;
            }

            const nativeValueSetter = Object.getOwnPropertyDescriptor(proto, "value").set;
            if (nativeValueSetter && nativeValueSetter.call) {
                nativeValueSetter.call(target, newVal);
            } else {
                target.value = newVal;
            }

            target.dispatchEvent(new Event('input', { bubbles: true }));
            target.dispatchEvent(new Event('change', { bubbles: true }));

            const newCursorPos = start + text.length;
            target.setSelectionRange(newCursorPos, newCursorPos);
        }
        showToast(t('toast_paste_compat'));
    } catch (e) {
        showToast(t('toast_paste_fail'));
    }
}

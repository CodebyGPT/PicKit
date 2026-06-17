// 模块 18: 码字防丢子系统 (Input Recovery Subsystem)

let inputDebounceTimer = null;

// 获取用于缓存的 URL Key
function getRecoveryUrlKey() {
    const mode = getConfig('inputRecoveryMode');
    if (mode === 'off') return null;
    if (mode === 'strict') return location.href;
    const raw = location.href;
    const qMark = raw.indexOf('?');
    return qMark === -1 ? raw : raw.slice(0, qMark);
}

// 生成元素的唯一标识符
function getRecoverySelector(el) {
    if (el.id) return '#' + CSS.escape(el.id);
    if (el.name) return el.tagName.toLowerCase() + `[name="${CSS.escape(el.name)}"]`;

    let path = [];
    let curr = el;
    while (curr && curr !== document.body && curr !== document.documentElement) {
        let tag = curr.tagName.toLowerCase();
        let index = 1;
        let sibling = curr.previousElementSibling;
        while (sibling) {
            if (sibling.tagName === curr.tagName) index++;
            sibling = sibling.previousElementSibling;
        }
        path.unshift(`${tag}:nth-of-type(${index})`);
        curr = curr.parentElement;
    }
    return path.join(' > ');
}

// 执行保存逻辑
async function handleInputSave(e) {
    const target = e.target;
    if (target.dataset.tmScRestoring === 'true') return;
    const mode = getConfig('inputRecoveryMode');
    if (mode === 'off') return;

    if (!['TEXTAREA', 'INPUT'].includes(target.tagName)) return;
    if (target.tagName === 'INPUT' && !['text', 'search', 'email', 'url', 'tel', 'number'].includes(target.type)) return;

    const val = target.value;
    const selector = getRecoverySelector(target);
    const urlKey = getRecoveryUrlKey();

    if (!urlKey) return;

    if (inputDebounceTimer) clearTimeout(inputDebounceTimer);

    inputDebounceTimer = setTimeout(async () => {
        const cache = await safeGetValue('tm_input_recovery_cache', {});

        if (!cache[urlKey]) cache[urlKey] = {};

        if (!val || val.trim() === '') {
            delete cache[urlKey][selector];
            if (Object.keys(cache[urlKey]).length === 0) delete cache[urlKey];
        } else {
            cache[urlKey][selector] = {
                text: val,
                ts: Date.now()
            };
        }

        await safeSetValue('tm_input_recovery_cache', cache);
    }, 500);
}

// 表单提交时主动清除缓存
async function handleFormSubmit(e) {
    const mode = getConfig('inputRecoveryMode');
    if (mode === 'off') return;

    const form = e.target;
    if (!form || form.tagName !== 'FORM') return;

    const inputs = form.querySelectorAll('input, textarea');
    if (inputs.length === 0) return;

    const cache = await safeGetValue('tm_input_recovery_cache', {});
    const urlKey = getRecoveryUrlKey();

    if (!cache[urlKey]) return;

    let modified = false;
    inputs.forEach(el => {
        const sel = getRecoverySelector(el);
        if (cache[urlKey][sel]) {
            delete cache[urlKey][sel];
            modified = true;
        }
    });

    if (modified) {
        if (Object.keys(cache[urlKey]).length === 0) delete cache[urlKey];
        await safeSetValue('tm_input_recovery_cache', cache);
    }
}

// 恢复文本逻辑
async function restoreInputData() {
    const mode = getConfig('inputRecoveryMode');
    if (mode === 'off') return;

    const urlKey = getRecoveryUrlKey();
    const cache = await safeGetValue('tm_input_recovery_cache', {});
    const pageData = cache[urlKey];

    if (!pageData) return;

    Object.keys(pageData).forEach(selector => {
        const entry = pageData[selector];
        if (Date.now() - entry.ts > 24 * 60 * 60 * 1000) return;

        const el = document.querySelector(selector);
        if (el && (!el.value || el.value.trim() === '')) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value"
            ).set;
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                "value"
            ).set;

            const setter = el.tagName === 'INPUT' ? nativeInputValueSetter : nativeTextAreaValueSetter;

            if (setter && setter.call) {
                setter.call(el, entry.text);
            } else {
                el.value = entry.text;
            }

            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));

            const originalBg = el.style.backgroundColor;
            el.style.transition = 'background-color 0.5s';
            el.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            setTimeout(() => {
                el.style.backgroundColor = originalBg;
            }, 1000);
        }
    });
}

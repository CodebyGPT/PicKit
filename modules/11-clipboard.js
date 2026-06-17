// 模块 11: 剪贴板操作与 Toast 通知 (Clipboard & Toast)

// 三级降级复制策略
async function copyToClipboard(text, html) {
    try {
        // 优先尝试构建 ClipboardItem 以保留样式 (如果不是纯文本)
        if (html && typeof ClipboardItem !== 'undefined') {
            const htmlBlob = new Blob([html], { type: 'text/html' });
            const textBlob = new Blob([text], { type: 'text/plain' });
            const data = [new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })];
            await navigator.clipboard.write(data);
        } else {
            // 回退到纯文本
            await navigator.clipboard.writeText(text);
        }
    } catch (e) {
        // 降级使用 GM 特权 API_GM_setClipboard
        if (typeof GM_setClipboard === 'function') {
            if (text) {
                GM_setClipboard(text, 'text');
            } else {
                GM_setClipboard(html, 'html');
            }
        }
    }
}

// 显示 Toast (在 Shadow DOM 内)
function showToast(msg) {
    if (!getConfig('enableToast')) return;

    let toast = shadowRoot.querySelector('.sc-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'sc-toast';
        shadowRoot.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 1200);
}

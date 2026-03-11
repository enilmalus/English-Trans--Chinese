// 创建并注入悬停提示框的 DOM 元素
const tooltip = document.createElement('div');
tooltip.id = 'youdao-hover-translator-tooltip';
document.body.appendChild(tooltip);

let hoverTimeout;
let lastWord = '';

// 获取鼠标坐标所在位置的单词
function getWordAtPoint(x, y) {
    let range;
    // 兼容不同的浏览器内核方法
    if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(x, y);
    } else if (document.caretPositionFromPoint) {
        let pos = document.caretPositionFromPoint(x, y);
        if (pos) {
            range = document.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
        }
    }

    if (!range || !range.startContainer) return null;
    
    let node = range.startContainer;
    // 确保我们只处理文本节点
    if (node.nodeType !== Node.TEXT_NODE) return null;

    let text = node.nodeValue;
    let start = range.startOffset;
    let end = range.startOffset;

    // 向左扩展以找到单词的开头
    while (start > 0 && /^[a-zA-Z]$/.test(text[start - 1])) {
        start--;
    }
    // 向右扩展以找到单词的结尾
    while (end < text.length && /^[a-zA-Z]$/.test(text[end])) {
        end++;
    }

    let word = text.slice(start, end);
    return word.length > 0 ? word : null;
}

// 显示提示框并防止溢出屏幕
function showTooltip(x, y, text) {
    tooltip.innerText = text;
    tooltip.classList.add('show');
    
    // 计算位置，默认在鼠标右下方
    let left = x + 15;
    let top = y + 20;
    
    // 防止超出右侧屏幕
    if (left + tooltip.offsetWidth > window.innerWidth) {
        left = window.innerWidth - tooltip.offsetWidth - 10;
    }
    // 防止超出底部屏幕
    if (top + tooltip.offsetHeight > window.innerHeight) {
        top = y - tooltip.offsetHeight - 10;
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

// 隐藏提示框
function hideTooltip() {
    tooltip.classList.remove('show');
    lastWord = '';
}

// 监听鼠标移动事件
document.addEventListener('mousemove', (e) => {
    clearTimeout(hoverTimeout);
    
    // 如果鼠标移动，先隐藏提示框
    if (tooltip.classList.contains('show')) {
         // 可选：如果要保留提示框直到离开单词，可屏蔽这一行。这里为了灵敏度选择移动即隐藏
         hideTooltip();
    }

    // 设置防抖：鼠标停止移动 400 毫秒后触发翻译
    hoverTimeout = setTimeout(() => {
        let word = getWordAtPoint(e.clientX, e.clientY);
        
        // 检查是否为有效且纯英文字母的单词
        if (word && /^[a-zA-Z]{2,}$/.test(word)) { // 至少2个字母
            if (word !== lastWord) {
                lastWord = word;
                // 向 background.js 发送翻译请求
                chrome.runtime.sendMessage({ action: 'translate', word: word }, (response) => {
                    // 如果翻译结果存在且不等于原词（说明不是未翻译的无意义乱码）
                    if (response && response.translation && response.translation.toLowerCase() !== word.toLowerCase()) {
                        showTooltip(e.clientX, e.clientY, `${word} : ${response.translation}`);
                    }
                });
            }
        } else {
            hideTooltip();
        }
    }, 400); 
});

// 监听页面滚动，滚动时隐藏
document.addEventListener('scroll', hideTooltip);
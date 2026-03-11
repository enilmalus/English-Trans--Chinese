// 监听来自 content.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translate') {
        console.log("后台收到翻译请求，单词是:", request.word);
        
        // 改用非常稳定且免费的 Google 翻译公开 API
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(request.word)}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log("API返回的数据:", data); // 在后台打印返回结果
                let translation = '';
                
                // 解析 Google 翻译 API 的嵌套数组返回格式
                if (data && data[0] && data[0][0] && data[0][0][0]) {
                    translation = data[0][0][0];
                } else {
                    translation = "未找到该词释义"; 
                }
                sendResponse({ translation: translation });
            })
            .catch(error => {
                console.error("API请求出错:", error);
                sendResponse({ translation: "网络请求失败，请检查连接" });
            });
            
        // 返回 true 表示将异步发送响应
        return true; 
    }
});
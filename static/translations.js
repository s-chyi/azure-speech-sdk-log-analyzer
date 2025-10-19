// 多語言翻譯配置
const translations = {
    'zh-TW': {
        // 標題和描述
        'title': 'SDK日誌分析器',
        'subtitle': '上傳Azure Speech SDK日誌文件，進行基本分析',
        
        // 上傳區域
        'uploadTitle': '拖放日誌文件到此處',
        'uploadOr': '或',
        'uploadClick': '點擊選擇文件',
        'uploadHint': '支援 .txt 和 .log 格式',
        'uploading': '正在上傳和解析檔案...',
        
        // 會話列表
        'sessionsTitle': '檢測到的會話',
        'sessionsFile': '文件',
        'sessionView': '查看詳情',
        'backButton': '返回',
        
        // 會話詳情
        'sessionDetailTitle': '會話詳細分析',
        'downloadLog': '下載日誌',
        'backToSessions': '返回會話列表',
        
        // 基本資訊
        'basicInfo': '基本資訊',
        'sessionId': '會話 ID',
        'totalLines': '總行數',
        'duration': '持續時間',
        'startTime': '開始時間',
        
        // 效能指標
        'performanceMetrics': '效能指標',
        'websocketMessages': 'WebSocket 訊息',
        'audioChunks': '音頻塊',
        'avgUploadRate': '平均上傳速率 (KB/s)',
        'avgLatency': '平均識別延遲 (ms)',
        
        // 線程分析
        'threadAnalysis': '線程分析',
        'noThreads': '未找到線程資訊',
        'threadId': '線程 ID',
        'threadName': '名稱',
        'threadType': '類型',
        'threadDesc': '描述',
        
        // 線程類型
        'mainThread': '主線程',
        'kickoffThread': '啟動線程',
        'backgroundThread': '後台線程',
        'userThread': '使用者線程',
        'audioThread': '音頻線程',
        'gstreamerThread': 'GStreamer 線程',
        'mainThreadDesc': '應用程式主執行緒',
        'kickoffThreadDesc': '會話啟動執行緒',
        'backgroundThreadDesc': '後台處理執行緒',
        'userThreadDesc': '事件分發執行緒',
        'audioThreadDesc': '音頻處理執行緒',
        'gstreamerThreadDesc': '串流處理執行緒',
        
        // 識別結果
        'recognitionResults': '語音識別結果',
        'noText': '無文字',
        'confidence': '信心度',
        'status': '狀態',
        'line': '行',
        'moreResults': '還有',
        'results': '筆結果',
        
        // 錯誤分析
        'errorAnalysis': '錯誤分析',
        'moreErrors': '還有',
        'errors': '筆錯誤',
        
        // 時間軸
        'timeline': '事件時間軸',
        'unknownTime': '未知時間',
        'moreEvents': '還有',
        'events': '筆事件',
        
        // 事件類型
        'sessionStart': '會話開始',
        'websocketOpen': 'WebSocket 連接',
        'speechStart': '語音開始',
        'speechEnd': '語音結束',
        'turnStart': '輪次開始',
        'turnEnd': '輪次結束',
        'websocketClose': 'WebSocket 關閉',
        
        // 錯誤訊息
        'errorOccurred': '發生錯誤',
        'noFile': '沒有可用的檔案',
        'loadingDetails': '正在載入會話詳細資訊...',
        'loadingThreads': '正在載入線程列表...',
        'noThreadsAvailable': '未找到可用的線程日誌',
        'networkError': '載入會話詳情時發生網路錯誤',
        
        // 下載相關
        'selectThreadLog': '選擇要下載的線程日誌',
        'session': '會話',
        'download': '下載',
        'cancel': '取消',
        'downloadFullLog': '下載完整會話日誌',
        'lines': '行',
        
        // 通用
        'ms': 'ms',
        'session': '會話'
    },
    
    'zh-CN': {
        // 标题和描述
        'title': 'SDK日志分析器',
        'subtitle': '上传Azure Speech SDK日志文件，进行基本分析',
        
        // 上传区域
        'uploadTitle': '拖放日志文件到此处',
        'uploadOr': '或',
        'uploadClick': '点击选择文件',
        'uploadHint': '支持 .txt 和 .log 格式',
        'uploading': '正在上传和解析文件...',
        
        // 会话列表
        'sessionsTitle': '检测到的会话',
        'sessionsFile': '文件',
        'sessionView': '查看详情',
        'backButton': '返回',
        
        // 会话详情
        'sessionDetailTitle': '会话详细分析',
        'downloadLog': '下载日志',
        'backToSessions': '返回会话列表',
        
        // 基本信息
        'basicInfo': '基本信息',
        'sessionId': '会话 ID',
        'totalLines': '总行数',
        'duration': '持续时间',
        'startTime': '开始时间',
        
        // 性能指标
        'performanceMetrics': '性能指标',
        'websocketMessages': 'WebSocket 消息',
        'audioChunks': '音频块',
        'avgUploadRate': '平均上传速率 (KB/s)',
        'avgLatency': '平均识别延迟 (ms)',
        
        // 线程分析
        'threadAnalysis': '线程分析',
        'noThreads': '未找到线程信息',
        'threadId': '线程 ID',
        'threadName': '名称',
        'threadType': '类型',
        'threadDesc': '描述',
        
        // 线程类型
        'mainThread': '主线程',
        'kickoffThread': '启动线程',
        'backgroundThread': '后台线程',
        'userThread': '用户线程',
        'audioThread': '音频线程',
        'gstreamerThread': 'GStreamer 线程',
        'mainThreadDesc': '应用程序主执行线程',
        'kickoffThreadDesc': '会话启动执行线程',
        'backgroundThreadDesc': '后台处理执行线程',
        'userThreadDesc': '事件分发执行线程',
        'audioThreadDesc': '音频处理执行线程',
        'gstreamerThreadDesc': '流处理执行线程',
        
        // 识别结果
        'recognitionResults': '语音识别结果',
        'noText': '无文字',
        'confidence': '置信度',
        'status': '状态',
        'line': '行',
        'moreResults': '还有',
        'results': '笔结果',
        
        // 错误分析
        'errorAnalysis': '错误分析',
        'moreErrors': '还有',
        'errors': '笔错误',
        
        // 时间轴
        'timeline': '事件时间轴',
        'unknownTime': '未知时间',
        'moreEvents': '还有',
        'events': '笔事件',
        
        // 事件类型
        'sessionStart': '会话开始',
        'websocketOpen': 'WebSocket 连接',
        'speechStart': '语音开始',
        'speechEnd': '语音结束',
        'turnStart': '轮次开始',
        'turnEnd': '轮次结束',
        'websocketClose': 'WebSocket 关闭',
        
        // 错误消息
        'errorOccurred': '发生错误',
        'noFile': '没有可用的文件',
        'loadingDetails': '正在加载会话详细信息...',
        'loadingThreads': '正在加载线程列表...',
        'noThreadsAvailable': '未找到可用的线程日志',
        'networkError': '加载会话详情时发生网络错误',
        
        // 下载相关
        'selectThreadLog': '选择要下载的线程日志',
        'session': '会话',
        'download': '下载',
        'cancel': '取消',
        'downloadFullLog': '下载完整会话日志',
        'lines': '行',
        
        // 通用
        'ms': 'ms',
        'session': '会话'
    },
    
    'en': {
        // Title and Description
        'title': 'SDK Log Analyzer',
        'subtitle': 'Upload Azure Speech SDK log files for analysis',
        
        // Upload Area
        'uploadTitle': 'Drag and drop log file here',
        'uploadOr': 'or',
        'uploadClick': 'Click to select file',
        'uploadHint': 'Supports .txt and .log formats',
        'uploading': 'Uploading and parsing file...',
        
        // Session List
        'sessionsTitle': 'Detected Sessions',
        'sessionsFile': 'File',
        'sessionView': 'View Details',
        'backButton': 'Back',
        
        // Session Details
        'sessionDetailTitle': 'Session Detailed Analysis',
        'downloadLog': 'Download Log',
        'backToSessions': 'Back to Sessions',
        
        // Basic Info
        'basicInfo': 'Basic Information',
        'sessionId': 'Session ID',
        'totalLines': 'Total Lines',
        'duration': 'Duration',
        'startTime': 'Start Time',
        
        // Performance Metrics
        'performanceMetrics': 'Performance Metrics',
        'websocketMessages': 'WebSocket Messages',
        'audioChunks': 'Audio Chunks',
        'avgUploadRate': 'Avg Upload Rate (KB/s)',
        'avgLatency': 'Avg Recognition Latency (ms)',
        
        // Thread Analysis
        'threadAnalysis': 'Thread Analysis',
        'noThreads': 'No thread information found',
        'threadId': 'Thread ID',
        'threadName': 'Name',
        'threadType': 'Type',
        'threadDesc': 'Description',
        
        // Thread Types
        'mainThread': 'Main Thread',
        'kickoffThread': 'Kickoff Thread',
        'backgroundThread': 'Background Thread',
        'userThread': 'User Thread',
        'audioThread': 'Audio Thread',
        'gstreamerThread': 'GStreamer Thread',
        'mainThreadDesc': 'Application main thread',
        'kickoffThreadDesc': 'Session kickoff thread',
        'backgroundThreadDesc': 'Background processing thread',
        'userThreadDesc': 'Event dispatch thread',
        'audioThreadDesc': 'Audio processing thread',
        'gstreamerThreadDesc': 'Stream processing thread',
        
        // Recognition Results
        'recognitionResults': 'Speech Recognition Results',
        'noText': 'No text',
        'confidence': 'Confidence',
        'status': 'Status',
        'line': 'Line',
        'moreResults': '',
        'results': 'more results',
        
        // Error Analysis
        'errorAnalysis': 'Error Analysis',
        'moreErrors': '',
        'errors': 'more errors',
        
        // Timeline
        'timeline': 'Event Timeline',
        'unknownTime': 'Unknown time',
        'moreEvents': '',
        'events': 'more events',
        
        // Event Types
        'sessionStart': 'Session Start',
        'websocketOpen': 'WebSocket Open',
        'speechStart': 'Speech Start',
        'speechEnd': 'Speech End',
        'turnStart': 'Turn Start',
        'turnEnd': 'Turn End',
        'websocketClose': 'WebSocket Close',
        
        // Error Messages
        'errorOccurred': 'Error Occurred',
        'noFile': 'No file available',
        'loadingDetails': 'Loading session details...',
        'loadingThreads': 'Loading thread list...',
        'noThreadsAvailable': 'No thread logs available',
        'networkError': 'Network error loading session details',
        
        // Download Related
        'selectThreadLog': 'Select Thread Log to Download',
        'session': 'Session',
        'download': 'Download',
        'cancel': 'Cancel',
        'downloadFullLog': 'Download Full Session Log',
        'lines': 'lines',
        
        // Common
        'ms': 'ms',
        'session': 'Session'
    }
};

// 获取翻译文本
function t(key, lang = null) {
    const currentLang = lang || getCurrentLanguage();
    return translations[currentLang]?.[key] || translations['en'][key] || key;
}

// 获取当前语言
function getCurrentLanguage() {
    return localStorage.getItem('language') || 'en';
}

// 设置语言
function setLanguage(lang) {
    localStorage.setItem('language', lang);
    updatePageLanguage();
}

// 更新页面语言
function updatePageLanguage() {
    const lang = getCurrentLanguage();
    
    // 更新 HTML lang 属性
    document.documentElement.lang = lang;
    
    // 更新页面标题
    document.title = t('title');
    
    // 更新所有带 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });
    
    // 更新所有带 data-i18n-placeholder 属性的元素
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
    
    // 更新语言选择器的激活状态
    document.querySelectorAll('.lang-option').forEach(option => {
        if (option.getAttribute('data-lang') === lang) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // 如果存在详情页面，重新渲染
    const detailSection = document.getElementById('sessionDetailSection');
    if (detailSection && detailSection.style.display !== 'none') {
        // 触发重新渲染详情页面
        if (window.currentSessionData) {
            displaySessionDetails(
                window.currentSessionData.sessionId,
                window.currentSessionData.sessionDetails,
                window.currentSessionData.threadAnalysis
            );
        }
    }
}

// 初始化语言
function initLanguage() {
    updatePageLanguage();
}

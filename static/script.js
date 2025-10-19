// SDK 日誌分析器 - 前端 JavaScript

let currentFileId = null;
let currentSessions = [];

// 阻止預設行為
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// 處理檔案選擇
function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        uploadFile(files[0]);
    }
}

// 處理拖放檔案
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        uploadFile(files[0]);
    }
}

// 上傳檔案
async function uploadFile(file) {
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadArea = document.getElementById('uploadArea');
    const progressText = document.getElementById('progressText');

    // 檢查檔案類型
    const allowedExtensions = ['.txt', '.log'];
    const fileName = file.name.toLowerCase();
    if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
        showError('Only .txt and .log file formats are supported');
        return;
    }

    // 檢查檔案大小 (100MB)
    if (file.size > 100 * 1024 * 1024) {
        showError('File size cannot exceed 100MB');
        return;
    }

    uploadArea.style.display = 'none';
    uploadProgress.style.display = 'block';
    progressText.textContent = 'Uploading and parsing file...';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        uploadProgress.style.display = 'none';
        uploadArea.style.display = 'block';

        if (data.success) {
            currentFileId = data.file_id;
            currentSessions = data.sessions;
            renderSessions(data.filename);
            showSessionsList();
        } else {
            showError(data.error || 'Upload failed');
        }
    } catch (error) {
        uploadProgress.style.display = 'none';
        uploadArea.style.display = 'block';
        showError('Network error or no response from server');
        console.error('Upload error:', error);
    }
}

// 顯示會話列表
function showSessionsList() {
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('sessionsSection').style.display = 'block';
    // 隱藏其他區域
    const detailSection = document.getElementById('sessionDetailSection');
    if (detailSection) {
        detailSection.style.display = 'none';
    }
}

// 渲染會話列表
function renderSessions(filename) {
    document.getElementById('sessionsFilename').textContent = filename;
    
    const sessionsGrid = document.getElementById('sessionsGrid');
    if (!currentSessions || currentSessions.length === 0) {
        sessionsGrid.innerHTML = '<div class="no-sessions"><p>No sessions found.</p></div>';
        return;
    }
    
    sessionsGrid.innerHTML = currentSessions.map(session => createSessionCard(session)).join('');
}

// 創建會話卡片
function createSessionCard(session) {
    return `
        <div class="session-card" data-session-id="${session.session_id}">
            <div class="session-header">
                <h3>${t('session')} #${session.session_id.substring(0, 8)}...</h3>
                <div class="session-duration">${t('line')} ${session.start_line}</div>
            </div>
            <div class="session-metrics">
                <p><i class="fas fa-fingerprint"></i> ID: ${session.session_id}</p>
                <p><i class="fas fa-list-ol"></i> ${t('line')}: ${session.start_line}</p>
                ${session.has_detailed_analysis ? `<p><i class="fas fa-check-circle" style="color: #28a745;"></i> ${t('sessionView')}</p>` : ''}
            </div>
            <div class="session-actions">
                <button class="btn-primary" onclick="viewSessionDetails('${session.session_id}')">
                    <i class="fas fa-eye"></i> ${t('sessionView')}
                </button>
                <button class="btn-download-small" onclick="downloadSessionLog('${session.session_id}')" title="${t('downloadFullLog')}">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        </div>
    `;
}

// 檢視會話詳情
async function viewSessionDetails(sessionId) {
    if (!currentFileId) {
        showError(t('noFile'));
        return;
    }

    showLoading(t('loadingDetails'));

    try {
        // 並行獲取會話詳情和線程分析
        const [detailsResponse, threadsResponse] = await Promise.all([
            fetch(`/session/${encodeURIComponent(currentFileId)}/${encodeURIComponent(sessionId)}`),
            fetch(`/session/${encodeURIComponent(currentFileId)}/${encodeURIComponent(sessionId)}/threads`)
        ]);

        const detailsData = await detailsResponse.json();
        const threadsData = await threadsResponse.json();

        hideLoading();

        if (detailsData.success && threadsData.success) {
            displaySessionDetails(sessionId, detailsData.session_details, threadsData.thread_analysis);
        } else {
            showError(detailsData.error || threadsData.error || 'Unable to load session details');
        }
    } catch (error) {
        hideLoading();
        showError('Network error occurred while loading session details');
        console.error('Session details error:', error);
    }
}

// 顯示會話詳情
function displaySessionDetails(sessionId, sessionDetails, threadAnalysis) {
    // 保存當前會話數據以便語言切換時重新渲染
    window.currentSessionData = {
        sessionId: sessionId,
        sessionDetails: sessionDetails,
        threadAnalysis: threadAnalysis
    };
    
    // 隱藏會話列表，顯示詳情頁面
    document.getElementById('sessionsSection').style.display = 'none';
    
    // 創建或顯示詳情區域
    let detailSection = document.getElementById('sessionDetailSection');
    if (!detailSection) {
        detailSection = document.createElement('div');
        detailSection.id = 'sessionDetailSection';
        detailSection.className = 'session-detail-section';
        document.querySelector('.main-content').appendChild(detailSection);
    }
    
    detailSection.innerHTML = generateSessionDetailHTML(sessionId, sessionDetails, threadAnalysis);
    detailSection.style.display = 'block';
}

// 生成會話詳情 HTML
function generateSessionDetailHTML(sessionId, sessionDetails, threadAnalysis) {
    const basicInfo = sessionDetails.basic_info || {};
    const metrics = sessionDetails.performance_metrics || {};
    const threads = threadAnalysis.thread_summary || {};
    const timeline = sessionDetails.timeline || [];
    const errors = sessionDetails.error_analysis || [];
    const recognitionResults = sessionDetails.recognition_results || [];

    return `
        <div class="section-header">
            <h2><i class="fas fa-microscope"></i> ${t('sessionDetailTitle')}</h2>
            <div class="header-actions">
                <button class="btn-download" onclick="showThreadDownloadOptions('${sessionId}')">
                    <i class="fas fa-download"></i> ${t('downloadLog')}
                </button>
                <button class="btn-secondary" onclick="backToSessions()">
                    <i class="fas fa-arrow-left"></i> ${t('backToSessions')}
                </button>
            </div>
        </div>
        
        <div class="detail-content">
            <div class="detail-grid">
                <!-- Base Information -->
                <div class="detail-card">
                    <h3><i class="fas fa-info-circle"></i> ${t('basicInfo')}</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>${t('sessionId')}:</label>
                            <span class="session-id-full">${sessionId}</span>
                        </div>
                        <div class="info-item">
                            <label>${t('totalLines')}:</label>
                            <span>${basicInfo.total_lines || 0}</span>
                        </div>
                        ${basicInfo.duration ? `
                        <div class="info-item">
                            <label>${t('duration')}:</label>
                            <span>${basicInfo.duration} ${t('ms')}</span>
                        </div>
                        ` : ''}
                        ${basicInfo.start_time ? `
                        <div class="info-item">
                            <label>${t('startTime')}:</label>
                            <span>${basicInfo.start_time} ${t('ms')}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Performance Metrics -->
                <div class="detail-card">
                    <h3><i class="fas fa-tachometer-alt"></i> ${t('performanceMetrics')}</h3>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <span class="metric-value">${metrics.websocket_messages || 0}</span>
                            <span class="metric-label">${t('websocketMessages')}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">${metrics.audio_chunks || 0}</span>
                            <span class="metric-label">${t('audioChunks')}</span>
                        </div>
                        ${metrics.avg_upload_rate ? `
                        <div class="metric-item">
                            <span class="metric-value">${metrics.avg_upload_rate.toFixed(2)}</span>
                            <span class="metric-label">${t('avgUploadRate')}</span>
                        </div>
                        ` : ''}
                        ${metrics.avg_recognition_latency ? `
                        <div class="metric-item">
                            <span class="metric-value">${metrics.avg_recognition_latency.toFixed(0)}</span>
                            <span class="metric-label">${t('avgLatency')}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Thread Analysis -->
                <div class="detail-card full-width">
                    <h3><i class="fas fa-sitemap"></i> ${t('threadAnalysis')}</h3>
                    ${generateThreadsTable(threads)}
                </div>

                <!-- Recognition Results -->
                ${recognitionResults.length > 0 ? `
                <div class="detail-card full-width">
                    <h3><i class="fas fa-microphone"></i> ${t('recognitionResults')} (${recognitionResults.length})</h3>
                    <div class="recognition-results">
                        ${recognitionResults.slice(0, 5).map(result => `
                            <div class="recognition-item">
                                <div class="recognition-text">${result.text || t('noText')}</div>
                                <div class="recognition-meta">
                                    ${result.confidence ? `${t('confidence')}: ${(result.confidence * 100).toFixed(1)}% | ` : ''}
                                    ${result.status ? `${t('status')}: ${result.status} | ` : ''}
                                    ${t('line')} ${result.line_number}
                                </div>
                            </div>
                        `).join('')}
                        ${recognitionResults.length > 5 ? `<p class="more-results">... ${t('moreResults')} ${recognitionResults.length - 5} ${t('results')}</p>` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Error Analysis -->
                ${errors.length > 0 ? `
                <div class="detail-card full-width">
                    <h3><i class="fas fa-exclamation-triangle"></i> ${t('errorAnalysis')} (${errors.length})</h3>
                    <div class="error-list">
                        ${errors.slice(0, 3).map(error => `
                            <div class="error-item">
                                <div class="error-line">${t('line')} ${error.line_number}</div>
                                <div class="error-message">${error.message}</div>
                            </div>
                        `).join('')}
                        ${errors.length > 3 ? `<p class="more-errors">... ${t('moreErrors')} ${errors.length - 3} ${t('errors')}</p>` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Timeline -->
                ${timeline.length > 0 ? `
                <div class="detail-card full-width">
                    <h3><i class="fas fa-clock"></i> ${t('timeline')}</h3>
                    <div class="timeline">
                        ${timeline.slice(0, 10).map(event => `
                            <div class="timeline-item">
                                <div class="timeline-time">${event.timestamp ? event.timestamp + ' ' + t('ms') : t('unknownTime')}</div>
                                <div class="timeline-event">${t(event.event_type) || event.event_type}</div>
                                <div class="timeline-line">${t('line')} ${event.line_number}</div>
                            </div>
                        `).join('')}
                        ${timeline.length > 10 ? `<p class="more-timeline">... ${t('moreEvents')} ${timeline.length - 10} ${t('events')}</p>` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

// 生成線程表格
function generateThreadsTable(threads) {
    if (!threads || Object.keys(threads).length <= 3) {
        return `<p class="no-threads">${t('noThreads')}</p>`;
    }

    const threadTypes = [
        { key: 'main_thread', nameKey: 'mainThread', type: 'main', descKey: 'mainThreadDesc' },
        { key: 'kickoff_thread', nameKey: 'kickoffThread', type: 'kickoff', descKey: 'kickoffThreadDesc' },
        { key: 'background_thread', nameKey: 'backgroundThread', type: 'background', descKey: 'backgroundThreadDesc' },
        { key: 'user_thread', nameKey: 'userThread', type: 'user', descKey: 'userThreadDesc' },
        { key: 'audio_thread', nameKey: 'audioThread', type: 'audio', descKey: 'audioThreadDesc' },
        { key: 'gstreamer_thread', nameKey: 'gstreamerThread', type: 'gstreamer', descKey: 'gstreamerThreadDesc' }
    ];

    let tableHTML = `
        <div class="threads-table-container">
            <table class="threads-table">
                <thead>
                    <tr>
                        <th>${t('threadId')}</th>
                        <th>${t('threadName')}</th>
                        <th>${t('threadType')}</th>
                        <th>${t('threadDesc')}</th>
                    </tr>
                </thead>
                <tbody>
    `;

    threadTypes.forEach(threadType => {
        if (threads[threadType.key]) {
            tableHTML += `
                <tr class="thread-row">
                    <td><span class="thread-id">${threads[threadType.key]}</span></td>
                    <td><span class="thread-name">${t(threadType.nameKey)}</span></td>
                    <td><span class="type-badge type-${threadType.type}">${threadType.type}</span></td>
                    <td><span class="thread-description">${t(threadType.descKey)}</span></td>
                </tr>
            `;
        }
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    return tableHTML;
}

// 獲取事件顯示名稱 (現在使用翻譯系統)
function getEventDisplayName(eventType) {
    // 直接使用翻譯系統，如果沒有翻譯則返回原始類型
    return t(eventType) || eventType;
}

// 下載完整會話日誌
async function downloadSessionLog(sessionId) {
    if (!currentFileId) {
        showError('No file available');
        return;
    }

    try {
        const response = await fetch(`/download/session/${encodeURIComponent(currentFileId)}/${encodeURIComponent(sessionId)}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // 從 response headers 獲取檔名，或使用預設檔名
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `session_${sessionId.substring(0, 8)}.log`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const errorData = await response.json();
            showError(errorData.error || 'Failed to download session log');
        }
    } catch (error) {
        showError('Network error occurred while downloading session log');
        console.error('Download session log error:', error);
    }
}

// 下載線程日誌
async function downloadThreadLog(sessionId, threadId) {
    if (!currentFileId) {
        showError('No file available');
        return;
    }

    try {
        const response = await fetch(`/download/thread/${encodeURIComponent(currentFileId)}/${encodeURIComponent(sessionId)}/${encodeURIComponent(threadId)}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // 從 response headers 獲取檔名
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `thread_${threadId}.log`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const errorData = await response.json();
            showError(errorData.error || 'Failed to download thread log');
        }
    } catch (error) {
        showError('Network error occurred while downloading thread log');
        console.error('Download thread log error:', error);
    }
}

// 顯示線程下載選項
async function showThreadDownloadOptions(sessionId) {
    if (!currentFileId) {
        showError(t('noFile'));
        return;
    }

    showLoading(t('loadingThreads'));

    try {
        const response = await fetch(`/session/${encodeURIComponent(currentFileId)}/${encodeURIComponent(sessionId)}/threads/list`);
        const data = await response.json();
        
        hideLoading();

        if (data.success && data.threads && data.threads.length > 0) {
            showThreadDownloadModal(sessionId, data.threads);
        } else {
            showError(t('noThreadsAvailable'));
        }
    } catch (error) {
        hideLoading();
        showError(t('networkError'));
        console.error('Thread list error:', error);
    }
}

// 轉換線程名稱為翻譯key
function getThreadNameTranslation(threadName) {
    const nameMapping = {
        '主線程': 'mainThread',
        '启动线程': 'kickoffThread',
        '啟動線程': 'kickoffThread',
        '后台线程': 'backgroundThread',
        '後台線程': 'backgroundThread',
        '用户线程': 'userThread',
        '使用者線程': 'userThread',
        '音频线程': 'audioThread',
        '音頻線程': 'audioThread',
        'GStreamer 线程': 'gstreamerThread',
        'GStreamer 線程': 'gstreamerThread'
    };
    
    const key = nameMapping[threadName];
    return key ? t(key) : threadName;
}

// 顯示線程下載彈出視窗
function showThreadDownloadModal(sessionId, threads) {
    // 移除現有的 modal
    const existingModal = document.getElementById('threadDownloadModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'threadDownloadModal';
    modal.className = 'download-modal-overlay';
    
    modal.innerHTML = `
        <div class="download-modal">
            <div class="download-modal-header">
                <h3><i class="fas fa-download"></i> ${t('selectThreadLog')}</h3>
                <button class="modal-close-btn" onclick="closeThreadDownloadModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="download-modal-content">
                <p>${t('session')}: <strong>${sessionId.substring(0, 8)}...</strong></p>
                <div class="thread-download-list">
                    ${threads.map(thread => `
                        <div class="thread-download-item">
                            <div class="thread-info">
                                <strong>${getThreadNameTranslation(thread.thread_name)}</strong>
                                <span class="thread-id">ID: ${thread.thread_id}</span>
                                <span class="thread-lines">${thread.line_count} ${t('lines')}</span>
                            </div>
                            <button class="btn-download-small" onclick="downloadThreadLog('${sessionId}', '${thread.thread_id}'); closeThreadDownloadModal();">
                                <i class="fas fa-download"></i> ${t('download')}
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="download-modal-actions">
                    <button class="btn-secondary" onclick="closeThreadDownloadModal()">
                        <i class="fas fa-times"></i> ${t('cancel')}
                    </button>
                    <button class="btn-download" onclick="downloadSessionLog('${sessionId}'); closeThreadDownloadModal();">
                        <i class="fas fa-download"></i> ${t('downloadFullLog')}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // 點擊背景關閉 modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeThreadDownloadModal();
        }
    });
}

// 關閉線程下載彈出視窗
function closeThreadDownloadModal() {
    const modal = document.getElementById('threadDownloadModal');
    if (modal) {
        modal.remove();
    }
}

// 返回會話列表
function backToSessions() {
    const detailSection = document.getElementById('sessionDetailSection');
    if (detailSection) {
        detailSection.style.display = 'none';
    }
    document.getElementById('sessionsSection').style.display = 'block';
}

// 返回上傳頁面
function backToUpload() {
    document.getElementById('sessionsSection').style.display = 'none';
    const detailSection = document.getElementById('sessionDetailSection');
    if (detailSection) {
        detailSection.style.display = 'none';
    }
    document.getElementById('uploadSection').style.display = 'block';
    currentFileId = null;
    currentSessions = [];
    
    // 重置檔案輸入
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
}

// 顯示載入遮罩
function showLoading(message = 'Loading...') {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>${message}</p>
        </div>
    `;
    overlay.style.display = 'flex';
}

// 隱藏載入遮罩
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// 錯誤解決方案映射
const ERROR_SOLUTIONS = {
    'Connection refused': {
        title: 'Unable to connect to service',
        solution: 'Please ensure app.py is running. Suggested: Restart start.bat'
    },
    'File too large': {
        title: 'File too large',
        solution: 'File exceeds 100MB limit. Suggested: Split log file and upload again'
    },
    'Invalid format': {
        title: 'Invalid file format',
        solution: 'Please ensure this is an Azure Speech SDK log file'
    },
    'Network error': {
        title: 'Network error',
        solution: 'Please check your network connection or firewall settings'
    },
    'Session not found': {
        title: 'Session not found',
        solution: 'File may have been cleaned up. Suggested: Re-upload log file'
    },
    'File not found or expired': {
        title: 'File expired',
        solution: 'Cache has been cleared. Suggested: Re-upload log file'
    },
    'Connection failed': {
        title: 'Connection failed',
        solution: 'Please ensure the service is running, or restart start.bat'
    },
    'Network error': {
        title: 'Network error',
        solution: 'Please check your network connection or try again later'
    }
};

// 顯示錯誤提示（改進版）
function showError(message) {
    const errorToast = document.getElementById('errorToast');
    const errorMessage = document.getElementById('errorMessage');
    
    // 檢查是否有匹配的解決方案
    let displayMessage = message;
    let foundSolution = false;
    
    for (const [keyword, info] of Object.entries(ERROR_SOLUTIONS)) {
        if (message.includes(keyword)) {
            displayMessage = `
                <strong style="color: #ff6b6b;">${info.title}</strong><br>
                <span style="color: #e0e0e0;">${message}</span><br>
                <small style="color: #ffc107; margin-top: 8px; display: block;">
                    💡 <strong>Solution:</strong>${info.solution}
                </small>
            `;
            foundSolution = true;
            break;
        }
    }
    
    // 如果沒有找到特定解決方案，使用預設格式
    if (!foundSolution) {
        displayMessage = `
            <strong style="color: #ff6b6b;">Error</strong><br>
            <span style="color: #e0e0e0;">${message}</span>
        `;
    }
    
    errorMessage.innerHTML = displayMessage;
    errorToast.style.display = 'flex';
    
    // 自動關閉（較長時間以便閱讀解決方案）
    setTimeout(() => {
        errorToast.style.display = 'none';
    }, foundSolution ? 8000 : 5000);
}

// 文件載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (uploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.add('highlight'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('highlight'), false);
        });

        uploadArea.addEventListener('drop', handleDrop, false);
    }
});

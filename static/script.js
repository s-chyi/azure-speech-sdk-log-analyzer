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
    
    // 渲染延遲圖表（如果有數據）
    const metrics = sessionDetails.performance_metrics || {};
    if (metrics.latency_timeline && metrics.latency_timeline.length > 0) {
        // 延遲渲染圖表，確保 canvas 元素已存在
        setTimeout(() => renderLatencyChart(metrics.latency_timeline), 100);
    }
}

// 渲染延遲時間圖表
function renderLatencyChart(latencyTimeline) {
    const canvas = document.getElementById('latencyChart');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // 準備數據
    const labels = latencyTimeline.map(item => `#${item.index + 1}`);
    const data = latencyTimeline.map(item => item.latency);
    
    // 根據閾值標記顏色
    const backgroundColors = data.map(value => {
        if (value > 5000) return 'rgba(220, 53, 69, 0.6)';      // 紅色：異常
        if (value > 2000) return 'rgba(255, 193, 7, 0.6)';      // 黃色：警告
        return 'rgba(40, 167, 69, 0.6)';                         // 綠色：正常
    });
    
    const borderColors = data.map(value => {
        if (value > 5000) return 'rgb(220, 53, 69)';
        if (value > 2000) return 'rgb(255, 193, 7)';
        return 'rgb(40, 167, 69)';
    });
    
    // 創建圖表
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: t('recognitionLatency'),
                data: data,
                backgroundColor: backgroundColors,
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: backgroundColors,
                pointBorderColor: borderColors,
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const item = latencyTimeline[context.dataIndex];
                            return [
                                `延遲: ${context.parsed.y} ms`,
                                `時間戳: ${item.timestamp} ms`,
                                `狀態: ${context.parsed.y > 5000 ? '異常' : context.parsed.y > 2000 ? '警告' : '正常'}`
                            ];
                        }
                    }
                },
                annotation: {
                    annotations: {
                        warning: {
                            type: 'line',
                            yMin: 2000,
                            yMax: 2000,
                            borderColor: 'rgba(255, 193, 7, 0.5)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: '警告閾值 (2000ms)',
                                enabled: true,
                                position: 'end'
                            }
                        },
                        critical: {
                            type: 'line',
                            yMin: 5000,
                            yMax: 5000,
                            borderColor: 'rgba(220, 53, 69, 0.5)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: '異常閾值 (5000ms)',
                                enabled: true,
                                position: 'end'
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '延遲時間 (ms)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + ' ms';
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '識別順序'
                    }
                }
            }
        }
    });
}

// 生成會話詳情 HTML
function generateSessionDetailHTML(sessionId, sessionDetails, threadAnalysis) {
    const basicInfo = sessionDetails.basic_info || {};
    const config = sessionDetails.recognition_config || {};  // 新增：配置信息
    const metrics = sessionDetails.performance_metrics || {};
    const threads = threadAnalysis.thread_summary || {};
    const timeline = sessionDetails.timeline || [];
    const errors = sessionDetails.error_analysis || {};
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
                <!-- Base Information - 只顯示會話ID -->
                <div class="detail-card">
                    <h3><i class="fas fa-info-circle"></i> ${t('basicInfo')}</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>${t('sessionId')}:</label>
                            <span class="session-id-full">${sessionId}</span>
                        </div>
                    </div>
                </div>

                <!-- Recognition Configuration - 新增配置信息卡片 -->
                <div class="detail-card full-width">
                    <h3><i class="fas fa-cogs"></i> ${t('recognitionConfig')}</h3>
                    ${generateRecognitionConfigHTML(config)}
                </div>

                <!-- Enhanced Performance Metrics -->
                <div class="detail-card full-width">
                    <h3><i class="fas fa-tachometer-alt"></i> ${t('performanceMetrics')}</h3>
                    ${generateEnhancedMetrics(metrics)}
                </div>

                <!-- Thread Analysis -->
                <div class="detail-card full-width">
                    <h3><i class="fas fa-sitemap"></i> ${t('threadAnalysis')}</h3>
                    ${generateThreadsTable(threads)}
                </div>

                <!-- Latency Chart -->
                ${metrics.latency_timeline && metrics.latency_timeline.length > 0 ? `
                <div class="detail-card full-width">
                    <h3><i class="fas fa-chart-line"></i> <span data-i18n="latencyChart">${t('latencyChart')}</span></h3>
                    <canvas id="latencyChart" height="80"></canvas>
                </div>
                ` : ''}

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

// 生成識別配置 HTML
function generateRecognitionConfigHTML(config) {
    if (!config || (!config.audio && !config.recognition && !config.system)) {
        return `<p class="no-config">${t('noConfigAvailable')}</p>`;
    }

    const audio = config.audio || {};
    const recognition = config.recognition || {};
    const system = config.system || {};

    return `
        <div class="config-grid">
            <!-- 音頻設置 -->
            <div class="config-section">
                <h4><i class="fas fa-headphones"></i> ${t('audioSettings')}</h4>
                <div class="config-items">
                    ${audio.sample_rate ? `
                        <div class="config-item">
                            <span class="config-label">${t('sampleRate')}:</span>
                            <span class="config-value">${audio.sample_rate} Hz</span>
                        </div>
                    ` : ''}
                    ${audio.bits_per_sample ? `
                        <div class="config-item">
                            <span class="config-label">${t('bitsPerSample')}:</span>
                            <span class="config-value">${audio.bits_per_sample} bit</span>
                        </div>
                    ` : ''}
                    ${audio.channels ? `
                        <div class="config-item">
                            <span class="config-label">${t('channels')}:</span>
                            <span class="config-value">${audio.channels}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- 識別設置 -->
            <div class="config-section">
                <h4><i class="fas fa-microphone-alt"></i> ${t('recognitionSettings')}</h4>
                <div class="config-items">
                    ${recognition.mode ? `
                        <div class="config-item">
                            <span class="config-label">${t('recognitionMode')}:</span>
                            <span class="config-value">${recognition.mode}</span>
                        </div>
                    ` : ''}
                    ${recognition.language ? `
                        <div class="config-item">
                            <span class="config-label">${t('language')}:</span>
                            <span class="config-value">${recognition.language}</span>
                        </div>
                    ` : ''}
                    ${recognition.auto_detect_languages ? `
                        <div class="config-item">
                            <span class="config-label">${t('autoDetectLanguages')}:</span>
                            <span class="config-value">${recognition.auto_detect_languages}</span>
                        </div>
                    ` : ''}
                    ${recognition.language_id_mode ? `
                        <div class="config-item">
                            <span class="config-label">${t('languageIdMode')}:</span>
                            <span class="config-value">${recognition.language_id_mode}</span>
                        </div>
                    ` : ''}
                    ${recognition.segmentation_timeout ? `
                        <div class="config-item">
                            <span class="config-label">${t('segmentationTimeout')}:</span>
                            <span class="config-value">${recognition.segmentation_timeout} ms</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- 系統設置 -->
            <div class="config-section">
                <h4><i class="fas fa-server"></i> ${t('systemSettings')}</h4>
                <div class="config-items">
                    ${system.region ? `
                        <div class="config-item">
                            <span class="config-label">${t('region')}:</span>
                            <span class="config-value">${system.region}</span>
                        </div>
                    ` : ''}
                    ${system.buffer_size ? `
                        <div class="config-item">
                            <span class="config-label">${t('bufferSize')}:</span>
                            <span class="config-value">${system.buffer_size} ms</span>
                        </div>
                    ` : ''}
                    ${system.connection_url ? `
                        <div class="config-item">
                            <span class="config-label">${t('connectionUrl')}:</span>
                            <span class="config-value config-url">${system.connection_url}</span>
                        </div>
                    ` : ''}
                    ${system.user_agent ? `
                        <div class="config-item">
                            <span class="config-label">${t('userAgent')}:</span>
                            <span class="config-value config-user-agent">${system.user_agent}</span>
                        </div>
                    ` : ''}
                </div>
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

// 生成增強的效能指標顯示（優化為 2x2 佈局）
function generateEnhancedMetrics(metrics) {
    console.log('[DEBUG] Generating metrics with data:', metrics);
    
    return `
        <div class="metrics-grid-2x2">
            <!-- 左上：連接與通訊 -->
            <div class="metric-category">
                <h4><i class="fas fa-plug"></i> ${t('connectionMetrics')}</h4>
                <div class="metric-list">
                    ${createMetricWithTooltip(
                        'websocketConnectionTime',
                        metrics.websocket_connection_time,
                        'ms',
                        'websocketConnectionTimeTooltip',
                        {warning: 500, critical: 1000}
                    )}
                    ${createMetricWithTooltip(
                        'turnStartLatency',
                        metrics.turn_start_latency,
                        'ms',
                        'turnStartLatencyTooltip',
                        {warning: 1000, critical: 3000}
                    )}
                    ${createMetricWithTooltip(
                        'avgUploadRateMetric',
                        metrics.avg_upload_rate,
                        'KB/s',
                        'avgUploadRateTooltip',
                        null
                    )}
                    ${createSimpleMetric('websocketMessages', metrics.websocket_messages || 0, '')}
                </div>
            </div>
            
            <!-- 右上：識別效能 -->
            <div class="metric-category">
                <h4><i class="fas fa-brain"></i> ${t('recognitionMetrics')}</h4>
                <div class="metric-list">
                    ${createMetricWithTooltip(
                        'firstHypothesisLatency',
                        metrics.first_hypothesis_latency,
                        'ms',
                        'firstHypothesisLatencyTooltip',
                        {warning: 2000, critical: 5000}
                    )}
                    ${createMetricWithTooltip(
                        'firstRecognitionServiceLatency',
                        metrics.first_recognition_service_latency,
                        'ms',
                        'firstRecognitionServiceLatencyTooltip',
                        {warning: 1000, critical: 2000}
                    )}
                    ${createMetricWithTooltip(
                        'avgRecognitionLatency',
                        metrics.avg_recognition_latency,
                        'ms',
                        'avgRecognitionLatencyTooltip',
                        {warning: 2000, critical: 5000}
                    )}
                    ${metrics.min_recognition_latency && metrics.max_recognition_latency ? 
                        createSimpleMetric('latencyRange', `${metrics.min_recognition_latency}-${metrics.max_recognition_latency}`, 'ms')
                    : ''}
                </div>
            </div>
            
            <!-- 左下：音頻處理 -->
            <div class="metric-category">
                <h4><i class="fas fa-volume-up"></i> ${t('audioMetrics')}</h4>
                <div class="metric-list">
                    ${createSimpleMetric('audioChunks', metrics.audio_chunks || 0, '')}
                    ${createMetricWithTooltip(
                        'avgFrameDuration',
                        metrics.avg_frame_duration,
                        'ms',
                        'avgFrameDurationTooltip',
                        null
                    )}
                    ${metrics.min_frame_duration && metrics.max_frame_duration ? 
                        createSimpleMetric('frameRange', `${metrics.min_frame_duration}-${metrics.max_frame_duration}`, 'ms')
                    : ''}
                </div>
            </div>
            
            <!-- 右下：潛在問題指標 -->
            <div class="metric-category metric-category-warning">
                <h4><i class="fas fa-exclamation-triangle"></i> ⚠️ 關鍵診斷指標</h4>
                <div class="metric-list">
                    ${createMetricWithTooltip(
                        'maxUnacknowledgedAudio',
                        metrics.max_unacknowledged_audio,
                        'ms',
                        'maxUnacknowledgedAudioTooltip',
                        {warning: 5000, critical: 10000}
                    )}
                    ${createMetricWithTooltip(
                        'maxQueueTime',
                        metrics.max_queue_time,
                        'ms',
                        'maxQueueTimeTooltip',
                        {warning: 100, critical: 500}
                    )}
                </div>
            </div>
        </div>
    `;
}

// 創建簡單指標（無 tooltip）
function createSimpleMetric(labelKey, value, unit) {
    return `
        <div class="metric-item metric-normal">
            <div class="metric-header">
                <span class="metric-label">${t(labelKey)}</span>
            </div>
            <div class="metric-value-container">
                <span class="metric-value">${value}</span>
                ${unit ? `<span class="metric-unit">${unit}</span>` : ''}
            </div>
        </div>
    `;
}

// 創建帶 Tooltip 的指標項
function createMetricWithTooltip(labelKey, value, unit, tooltipKey, thresholds) {
    // 如果沒有值，顯示 N/A
    if (value === null || value === undefined) {
        return `
            <div class="metric-item metric-na">
                <div class="metric-header">
                    <span class="metric-label">${t(labelKey)}</span>
                    <i class="fas fa-info-circle metric-tooltip" title="${t(tooltipKey)}"></i>
                </div>
                <div class="metric-value-container">
                    <span class="metric-value">${t('notAvailable')}</span>
                </div>
            </div>
        `;
    }
    
    // 判斷狀態
    const status = getMetricStatus(value, thresholds);
    const statusClass = `metric-${status}`;
    
    return `
        <div class="metric-item ${statusClass}">
            <div class="metric-header">
                <span class="metric-label">${t(labelKey)}</span>
                <i class="fas fa-info-circle metric-tooltip" title="${t(tooltipKey)}"></i>
            </div>
            <div class="metric-value-container">
                <span class="metric-value">${typeof value === 'number' ? value.toFixed(value < 10 ? 2 : 0) : value}</span>
                ${unit ? `<span class="metric-unit">${unit}</span>` : ''}
            </div>
        </div>
    `;
}

// 根據閾值判斷指標狀態
function getMetricStatus(value, thresholds) {
    if (!thresholds || value === null || value === undefined) {
        return 'normal';
    }
    
    if (value > thresholds.critical) {
        return 'critical';
    }
    
    if (value > thresholds.warning) {
        return 'warning';
    }
    
    return 'normal';
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

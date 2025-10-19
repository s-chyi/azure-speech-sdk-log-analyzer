// 補丁：添加到 script.js 末尾的圖表渲染代碼

// 渲染延遲時間圖表
function renderLatencyChart(latencyTimeline) {
    const canvas = document.getElementById('latencyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const labels = latencyTimeline.map(item => `#${item.index + 1}`);
    const data = latencyTimeline.map(item => item.latency);
    
    // 根據閾值標記顏色
    const pointColors = data.map(value => {
        if (value > 5000) return 'rgba(220, 53, 69, 0.8)';
        if (value > 2000) return 'rgba(255, 193, 7, 0.8)';
        return 'rgba(40, 167, 69, 0.8)';
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: t('recognitionLatency') || 'Recognition Latency (ms)',
                data: data,
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: pointColors,
                pointBorderColor: pointColors,
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const item = latencyTimeline[context.dataIndex];
                            const status = context.parsed.y > 5000 ? t('statusCritical') : context.parsed.y > 2000 ? t('statusWarning') : t('statusNormal');
                            return [
                                `${t('avgLatency') || 'Latency'}: ${context.parsed.y} ms`,
                                `${t('startTime') || 'Timestamp'}: ${item.timestamp} ms`,
                                `${t('status') || 'Status'}: ${status}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: t('avgLatency') || 'Latency (ms)' }
                },
                x: {
                    title: { display: true, text: t('recognitionResults') || 'Recognition Sequence' }
                }
            }
        }
    });
}

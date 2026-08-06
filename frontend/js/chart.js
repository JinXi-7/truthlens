/**
 * 雷达图绘制 - Chart.js Radar
 */

function drawRadarChart(data) {
    const ctx = document.getElementById('radar-chart').getContext('2d');

    // 销毁旧图
    if (radarChart) {
        radarChart.destroy();
    }

    const labels = ['阿谀奉承', '情感操控', '顺从风险', '真相扭曲'];
    const values = [
        data.sycophancy_score,
        data.manipulation_score,
        data.compliance_risk,
        data.truth_distortion,
    ];

    // 根据整体等级选色
    const levelColors = {
        green: { fill: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.8)' },
        yellow: { fill: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.8)' },
        orange: { fill: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.8)' },
        red: { fill: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.8)' },
    };

    const colors = levelColors[data.level] || levelColors.green;

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '捧杀维度',
                data: values,
                backgroundColor: colors.fill,
                borderColor: colors.border,
                borderWidth: 2,
                pointBackgroundColor: colors.border,
                pointBorderColor: '#0a0a0f',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 25,
                        display: false,
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.06)',
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.06)',
                    },
                    pointLabels: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        font: {
                            size: 12,
                            family: '-apple-system, BlinkMacSystemFont, sans-serif',
                        }
                    },
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10, 10, 15, 0.9)',
                    titleColor: 'rgba(255, 255, 255, 0.8)',
                    bodyColor: 'rgba(255, 255, 255, 0.6)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => `${ctx.raw}/100`,
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeOutCubic',
            }
        }
    });
}

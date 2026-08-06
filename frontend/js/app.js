/**
 * TruthLens 前端主逻辑
 */

// API地址 - 生产环境用Railway后端，开发环境用localhost
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://truthlens-production-ab83.up.railway.app';

// DOM
const inputView = document.getElementById('input-view');
const loadingView = document.getElementById('loading-view');
const resultView = document.getElementById('result-view');
const dialogueInput = document.getElementById('dialogue-input');
const charCount = document.getElementById('char-count');
const analyzeBtn = document.getElementById('analyze-btn');
const testCountEl = document.getElementById('test-count');
const shareBtn = document.getElementById('share-btn');
const retryBtn = document.getElementById('retry-btn');
const shareOverlay = document.getElementById('share-overlay');
const closeShare = document.getElementById('close-share');
const downloadBtn = document.getElementById('download-btn');

// 等级配置
const LEVEL_CONFIG = {
    green: { label: '安全', color: 'text-green-400', dot: 'bg-green-400', bg: 'bg-green-400', hex: '#22c55e', glow: 'glow-green' },
    yellow: { label: '轻微', color: 'text-yellow-400', dot: 'bg-yellow-400', bg: 'bg-yellow-400', hex: '#eab308', glow: 'glow-yellow' },
    orange: { label: '中等', color: 'text-orange-400', dot: 'bg-orange-400', bg: 'bg-orange-400', hex: '#f97316', glow: 'glow-orange' },
    red: { label: '严重', color: 'text-red-400', dot: 'bg-red-400', bg: 'bg-red-400', hex: '#ef4444', glow: 'glow-red' },
};

// 维度中文标签
const DIMENSION_LABELS = {
    sycophancy_score: { name: '阿谀奉承', icon: '🎤' },
    manipulation_score: { name: '情感操控', icon: '🎭' },
    compliance_risk: { name: '顺从风险', icon: '⚠️' },
    truth_distortion: { name: '真相扭曲', icon: '🔍' },
};

let currentResult = null;
let radarChart = null;

// === 初始化 ===
init();

function init() {
    // 字符计数
    dialogueInput.addEventListener('input', () => {
        charCount.textContent = dialogueInput.value.length;
    });

    // 检测按钮
    analyzeBtn.addEventListener('click', handleAnalyze);
    retryBtn.addEventListener('click', handleRetry);
    shareBtn.addEventListener('click', handleShare);
    closeShare.addEventListener('click', () => shareOverlay.classList.add('hidden'));
    downloadBtn.addEventListener('click', handleDownload);

    // 加载使用次数
    loadTestCount();

    // Ctrl+Enter 快捷检测
    dialogueInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleAnalyze();
        }
    });

    // 示例对话按钮
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.text.replace(/\\n/g, '\n');
            dialogueInput.value = text;
            charCount.textContent = text.length;
            // 自动滚动到顶部
            dialogueInput.scrollTop = 0;
        });
    });
}

// === 加载使用次数 ===
async function loadTestCount() {
    try {
        const res = await fetch(`${API_BASE}/api/count`);
        const data = await res.json();
        testCountEl.textContent = formatNumber(data.count);
    } catch {
        // 静默失败
    }
}

function formatNumber(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return n.toLocaleString();
    return String(n);
}

// === 分析流程 ===
async function handleAnalyze() {
    const text = dialogueInput.value.trim();

    if (text.length < 10) {
        showToast('对话太短啦，至少输入10个字符');
        return;
    }

    if (text.length > 5000) {
        showToast('对话不能超过5000字');
        return;
    }

    // 切换到加载页
    showView('loading');

    try {
        const res = await fetch(`${API_BASE}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            if (res.status === 429) {
                showToast('请求太频繁了，请1小时后再试');
            } else {
                showToast(err.detail || '分析失败，请稍后重试');
            }
            showView('input');
            return;
        }

        const data = await res.json();
        currentResult = data;
        renderResult(data);
        showView('result');

        // 更新计数
        if (data.test_count) {
            testCountEl.textContent = formatNumber(data.test_count);
        }

    } catch (err) {
        showToast('网络错误，请检查连接');
        showView('input');
    }
}

function handleRetry() {
    dialogueInput.value = '';
    charCount.textContent = '0';
    showView('input');
}

// === 渲染结果 ===
function renderResult(data) {
    const cfg = LEVEL_CONFIG[data.level] || LEVEL_CONFIG.green;

    // 数字动画
    animateScore(data.overall_score);

    // 等级标签
    const levelDot = document.getElementById('level-dot');
    const levelText = document.getElementById('level-text');
    const levelBadge = document.getElementById('level-badge');

    levelDot.className = `w-2 h-2 rounded-full ${cfg.bg}`;
    levelText.textContent = cfg.label;
    levelText.className = cfg.color;

    // AI人设标签
    document.getElementById('ai-label').textContent = data.ai_label || '未知型AI';
    document.getElementById('ai-label-desc').textContent = data.ai_label_description || '';

    // 维度详情
    const dimContainer = document.getElementById('dimension-details');
    dimContainer.innerHTML = '';
    ['sycophancy_score', 'manipulation_score', 'compliance_risk', 'truth_distortion'].forEach(key => {
        const score = data[key];
        const dim = DIMENSION_LABELS[key];
        const dimColor = score > 60 ? 'text-red-400' : score > 40 ? 'text-orange-400' : score > 20 ? 'text-yellow-400' : 'text-green-400';
        const barColor = score > 60 ? 'bg-red-400' : score > 40 ? 'bg-orange-400' : score > 20 ? 'bg-yellow-400' : 'bg-green-400';
        dimContainer.innerHTML += `
            <div class="glass rounded-xl p-3">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs text-white/50">${dim.icon} ${dim.name}</span>
                    <span class="text-sm font-bold ${dimColor}">${score}</span>
                </div>
                <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full ${barColor} rounded-full transition-all duration-700" style="width: ${score}%"></div>
                </div>
            </div>
        `;
    });

    // 引用样本
    const quotesList = document.getElementById('quotes-list');
    if (data.quote_samples && data.quote_samples.length > 0) {
        quotesList.innerHTML = data.quote_samples.map(q => `
            <div class="border-l-2 border-indigo-400/40 pl-3 py-1">
                <p class="text-sm text-white/70 leading-relaxed">"${escapeHtml(q)}"</p>
            </div>
        `).join('');
    } else {
        quotesList.innerHTML = '<p class="text-sm text-white/30">未检测到明显捧杀语句</p>';
    }

    // 分析总结
    document.getElementById('brief-analysis').textContent = data.brief_analysis || '分析结果暂不可用';

    // 建议
    const solutionsList = document.getElementById('solutions-list');
    if (data.solutions && data.solutions.length > 0) {
        const categoryIcons = {
            '即时应对': '⚡',
            '对话技巧': '💬',
            '工具设置': '🔧',
            '认知提醒': '🧠',
            '长期习惯': '🌱',
            '建议': '💡',
        };
        solutionsList.innerHTML = data.solutions.map(sol => {
            const icon = categoryIcons[sol.category] || '💡';
            return `
                <div class="flex gap-3 items-start">
                    <span class="text-lg mt-0.5">${icon}</span>
                    <div class="flex-1">
                        <p class="text-xs text-indigo-400/70 font-medium mb-0.5">${escapeHtml(sol.category)}</p>
                        <p class="text-sm text-white/60 leading-relaxed">${escapeHtml(sol.tip)}</p>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        solutionsList.innerHTML = '<p class="text-sm text-white/30">暂无建议</p>';
    }

    // 绘制雷达图
    drawRadarChart(data);
}

// === 数字动画 ===
function animateScore(target) {
    const el = document.getElementById('score-number');
    const duration = 800;
    const start = performance.now();

    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// === 视图切换 ===
function showView(name) {
    inputView.classList.add('hidden');
    loadingView.classList.add('hidden');
    resultView.classList.add('hidden');

    if (name === 'input') inputView.classList.remove('hidden');
    else if (name === 'loading') loadingView.classList.remove('hidden');
    else if (name === 'result') {
        resultView.classList.remove('hidden');
        // 触发淡入动画
        resultView.querySelectorAll('.fade-in').forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight; // reflow
            el.style.animation = '';
        });
    }
}

// === Toast ===
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-50 glass px-4 py-2 rounded-xl text-sm text-white/80';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.style.opacity = '0', 2000);
    setTimeout(() => toast.remove(), 2500);
}

// === 安全转义 ===
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// === 雷达图（在chart.js中实现） ===

// === 分享卡片（在sharecard.js中实现） ===

// === 分享相关 ===
function handleShare() {
    if (!currentResult) return;
    shareOverlay.classList.remove('hidden');
    drawShareCard(currentResult);
}

function handleDownload() {
    const canvas = document.getElementById('share-canvas');
    const link = document.createElement('a');
    link.download = `truthlens-${currentResult.overall_score}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

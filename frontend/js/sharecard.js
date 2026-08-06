/**
 * 分享卡片 - Canvas API 生成 PNG
 */

function drawShareCard(data) {
    const canvas = document.getElementById('share-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const levelStyles = {
        green: { hex: '#22c55e', dark: '#0a1f0a', label: '安全' },
        yellow: { hex: '#eab308', dark: '#1a1a0a', label: '轻微' },
        orange: { hex: '#f97316', dark: '#1a0f0a', label: '中等' },
        red: { hex: '#ef4444', dark: '#1a0a0a', label: '严重' },
    };

    const style = levelStyles[data.level] || levelStyles.green;
    const score = data.overall_score;

    // 背景
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#0a0a0f');
    bgGrad.addColorStop(0.5, style.dark);
    bgGrad.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 顶部光晕
    const glowGrad = ctx.createRadialGradient(W / 2, 80, 0, W / 2, 80, 200);
    glowGrad.addColorStop(0, style.hex + '22');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, 200);

    // Logo文字
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('TruthLens · AI捧杀检测器', W / 2, 25);

    // 标题
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px -apple-system, sans-serif';
    ctx.fillText('你的AI捧杀指数', W / 2, 60);

    // 大数字
    ctx.fillStyle = style.hex;
    ctx.font = 'bold 80px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(score), W / 2, 130);

    // /100
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '20px -apple-system, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('/100', W / 2, 170);

    // 等级胶囊
    const labelText = style.label;
    ctx.font = 'bold 15px -apple-system, sans-serif';
    const labelW = ctx.measureText(labelText).width + 30;
    ctx.fillStyle = style.hex + '22';
    roundRect(ctx, W / 2 - labelW / 2, 200, labelW, 28, 14);
    ctx.fill();
    ctx.fillStyle = style.hex;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, W / 2, 214);

    // AI人设标签
    if (data.ai_label) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 20px -apple-system, "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(data.ai_label, W / 2, 250);
    }

    // 四维分数条
    const dims = [
        { name: '阿谀奉承', score: data.sycophancy_score },
        { name: '情感操控', score: data.manipulation_score },
        { name: '顺从风险', score: data.compliance_risk },
        { name: '真相扭曲', score: data.truth_distortion },
    ];

    const barW = 280;
    const barX = (W - barW) / 2;
    const barH = 6;
    const rowGap = 42;
    const startY = 285;

    dims.forEach((dim, i) => {
        const y = startY + i * rowGap;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(dim.name, barX, y);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(String(dim.score), barX + barW, y);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        roundRect(ctx, barX, y + 4, barW, barH, 3);
        ctx.fill();

        const fillW = (dim.score / 100) * barW;
        const c = dim.score > 60 ? '#ef4444' : dim.score > 40 ? '#f97316' : dim.score > 20 ? '#eab308' : '#22c55e';
        ctx.fillStyle = c;
        roundRect(ctx, barX, y + 4, Math.max(fillW, 6), barH, 3);
        ctx.fill();
    });

    // 分割线
    const dvY = startY + 4 * rowGap + 10;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, dvY);
    ctx.lineTo(W - 40, dvY);
    ctx.stroke();

    // 一句话总结
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const summary = (data.brief_analysis || '').slice(0, 50);
    ctx.fillText(summary, W / 2, dvY + 15);

    // AI人设描述
    if (data.ai_label_description) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.font = '11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const desc = data.ai_label_description.slice(0, 60);
        ctx.fillText(desc, W / 2, dvY + 35);
    }

    // 底部水印
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('truthlens.app · 你的AI有多"舔"？', W / 2, H - 20);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

const diary = require('../../utils/diary');
const nav = require('../../utils/nav');
const COLORS = ['#3B765B', '#82AA8E', '#B6CFB5', '#E5BE91', '#D88672', '#7D9EB1', '#A99BB5'];

Page({
  data: { count: 0, totalText: '00:00', favoriteCount: 0, categories: [], daily: [] },
  onReady() { this.drawCharts(); },
  onShow() {
    const records = diary.all();
    const counts = {};
    records.forEach(item => { counts[item.category || '其他'] = (counts[item.category || '其他'] || 0) + 1; });
    const categories = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map((name, index) => ({ name, count: counts[name], color: COLORS[index % COLORS.length], percent: records.length ? Math.round(counts[name] / records.length * 100) : 0 }));
    const daily = [];
    for (let offset = 6; offset >= 0; offset--) {
      const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - offset);
      const date = diary.formatDate(day.getTime());
      daily.push({ date, label: `${day.getMonth() + 1}/${day.getDate()}`, count: records.filter(item => (item.date || diary.formatDate(item.createdAt)) === date).length });
    }
    this.setData({ count: records.length, totalText: diary.formatDuration(records.reduce((sum, item) => sum + (Number(item.durationMs) || 0), 0)), favoriteCount: records.filter(item => item.favorite).length, categories, daily }, () => this.drawCharts());
  },
  navigate: nav.go,
  drawCharts() { this.drawDonut(); this.drawDaily(); },
  drawDonut() {
    const ctx = wx.createCanvasContext('donut', this);
    const { categories, count } = this.data;
    const cx = 116, cy = 116, radius = 82;
    if (!count) {
      ctx.beginPath(); ctx.setStrokeStyle('#E7EEE8'); ctx.setLineWidth(28); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    } else {
      let angle = -Math.PI / 2;
      categories.forEach(item => {
        const next = angle + item.count / count * Math.PI * 2;
        ctx.beginPath(); ctx.setStrokeStyle(item.color); ctx.setLineWidth(28); ctx.arc(cx, cy, radius, angle, next); ctx.stroke(); angle = next;
      });
    }
    ctx.setFillStyle('#255D4A'); ctx.setFontSize(34); ctx.setTextAlign('center'); ctx.fillText(String(count), cx, cy + 3);
    ctx.setFillStyle('#91A096'); ctx.setFontSize(12); ctx.fillText('总记录', cx, cy + 26);
    ctx.draw();
  },
  drawDaily() {
    const ctx = wx.createCanvasContext('daily', this);
    const daily = this.data.daily;
    const max = Math.max(1, ...daily.map(item => item.count));
    const base = 150, chartHeight = 115;
    ctx.setStrokeStyle('#E4EAE3'); ctx.setLineWidth(1); ctx.beginPath(); ctx.moveTo(20, base); ctx.lineTo(310, base); ctx.stroke();
    daily.forEach((item, index) => {
      const x = 24 + index * 42;
      const height = item.count ? Math.max(9, item.count / max * chartHeight) : 4;
      ctx.setFillStyle(item.count ? '#83AD8F' : '#E6ECE6');
      ctx.fillRect(x, base - height, 24, height);
      ctx.setFillStyle('#87998B'); ctx.setFontSize(11); ctx.setTextAlign('center'); ctx.fillText(item.label, x + 12, 171);
      if (item.count) { ctx.setFillStyle('#3B6950'); ctx.fillText(String(item.count), x + 12, base - height - 9); }
    });
    ctx.draw();
  }
});

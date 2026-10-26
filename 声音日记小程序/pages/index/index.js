const diary = require('../../utils/diary');
const nav = require('../../utils/nav');

Page({
  data: { count: 0, totalText: '00:00', latest: [], quote: '留住这一刻的声音。' },
  onShow() {
    const records = diary.all().sort((a, b) => b.createdAt - a.createdAt);
    const total = records.reduce((sum, item) => sum + (Number(item.durationMs) || 0), 0);
    this.setData({ count: records.length, totalText: diary.formatDuration(total), latest: records.slice(0, 3).map(item => ({ ...item, dateText: diary.formatDate(item.createdAt), durationText: diary.formatDuration(item.durationMs) })) });
  },
  navigate: nav.go,
  openRecord() { wx.navigateTo({ url: '/pages/record/record' }); },
  openDetail(event) { wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` }); }
});

const diary = require('../../utils/diary');
const nav = require('../../utils/nav');

Page({
  data: { records: [], visible: [], selectedCategory: '全部', categories: ['全部'], selectedDate: '', favoritesOnly: false, count: 0 },
  onShow() {
    const records = diary.all().sort((a, b) => b.createdAt - a.createdAt).map(item => ({ ...item, dateText: diary.formatDate(item.createdAt), durationText: diary.formatDuration(item.durationMs) }));
    const categories = ['全部'].concat([...new Set(records.map(item => item.category))]);
    this.setData({ records, categories, count: records.length });
    this.filter();
  },
  navigate: nav.go,
  selectCategory(event) { this.setData({ selectedCategory: event.currentTarget.dataset.category }); this.filter(); },
  selectDate(event) { this.setData({ selectedDate: event.detail.value }); this.filter(); },
  clearDate() { this.setData({ selectedDate: '' }); this.filter(); },
  toggleFavorites() { this.setData({ favoritesOnly: !this.data.favoritesOnly }); this.filter(); },
  filter() {
    const { records, selectedCategory, selectedDate, favoritesOnly } = this.data;
    this.setData({ visible: records.filter(item =>
      (selectedCategory === '全部' || item.category === selectedCategory) &&
      (!selectedDate || item.date === selectedDate) &&
      (!favoritesOnly || item.favorite)
    ) });
  },
  openDetail(event) { wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` }); },
  openRecord() { wx.navigateTo({ url: '/pages/record/record' }); }
});

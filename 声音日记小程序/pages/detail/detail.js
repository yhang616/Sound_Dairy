const diary = require('../../utils/diary');

Page({
  data: { record: null, dateText: '', durationText: '00:00', currentText: '00:00', progress: 0, playing: false, audioMissing: false },
  onLoad(options) {
    this.id = options.id;
    this.audio = wx.createInnerAudioContext();
    this.audio.onPlay(() => this.setData({ playing: true }));
    this.audio.onPause(() => this.setData({ playing: false }));
    this.audio.onStop(() => this.setData({ playing: false }));
    this.audio.onEnded(() => this.setData({ playing: false, progress: 0, currentText: '00:00' }));
    this.audio.onTimeUpdate(() => {
      const current = this.audio.currentTime || 0;
      const total = this.audio.duration || (this.data.record && this.data.record.durationMs / 1000) || 0;
      this.setData({ currentText: diary.formatDuration(current * 1000), progress: total ? Math.min(100, current / total * 100) : 0 });
    });
    this.audio.onError(error => { console.error('播放失败', error); this.setData({ playing: false, audioMissing: true }); wx.showToast({ title: '录音文件无法播放', icon: 'none' }); });
  },
  onShow() {
    const record = diary.find(this.id);
    if (!record) { wx.showToast({ title: '日记不存在', icon: 'none' }); setTimeout(() => wx.redirectTo({ url: '/pages/history/history' }), 600); return; }
    this.setData({ record, dateText: record.date || diary.formatDate(record.createdAt), durationText: diary.formatDuration(record.durationMs) });
    this.audio.src = record.filePath;
    wx.getFileSystemManager().access({ path: record.filePath, fail: () => this.setData({ audioMissing: true }) });
  },
  onUnload() { if (this.audio) this.audio.destroy(); },
  togglePlay() { if (this.data.audioMissing) { wx.showToast({ title: '录音文件已丢失', icon: 'none' }); return; } if (this.data.playing) this.audio.pause(); else this.audio.play(); },
  replay() { if (this.data.audioMissing) return; this.audio.stop(); this.audio.seek(0); this.audio.play(); },
  seek(event) { const total = this.audio.duration || this.data.record.durationMs / 1000; if (total) this.audio.seek(total * event.detail.value / 100); },
  toggleFavorite() {
    const favorite = !this.data.record.favorite;
    try { diary.update(this.id, { favorite }); this.setData({ 'record.favorite': favorite }); }
    catch (error) { console.error('收藏失败', error); wx.showToast({ title: '操作失败', icon: 'none' }); }
  },
  deleteRecord() {
    wx.showModal({ title: '删除这篇声音日记？', content: '日记和录音文件将被永久删除。', confirmColor: '#C85E50', success: result => {
      if (!result.confirm) return;
      this.audio.stop();
      try { diary.remove(this.id); wx.showToast({ title: '已删除', icon: 'success' }); setTimeout(() => wx.redirectTo({ url: '/pages/history/history' }), 500); }
      catch (error) { console.error('删除失败', error); wx.showToast({ title: '删除失败', icon: 'none' }); }
    } });
  }
});

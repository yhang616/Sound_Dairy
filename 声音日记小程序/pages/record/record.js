const diary = require('../../utils/diary');
const nav = require('../../utils/nav');
const CATEGORIES = ['生活', '校园', '学习', '旅行', '雨声', '自然', '其他'];
const MOODS = ['平静', '开心', '感动', '怀念', '放松', '其他'];

Page({
  data: {
    state: 'idle', stateText: '准备好，按下按钮开始录音', durationText: '00:00', durationMs: 0,
    title: '', description: '', date: '', categories: CATEGORIES, moods: MOODS,
    categoryIndex: 0, moodIndex: 0, tempFilePath: '', previewPlaying: false,
    previewPosition: 0, previewDurationText: '00:00', previewCurrentText: '00:00',
    canSave: false, saving: false
  },
  onLoad() {
    this.recorder = wx.getRecorderManager();
    this.audio = wx.createInnerAudioContext();
    this.startedAt = 0;
    this.elapsedBeforePause = 0;
    this.recordTimer = null;
    this.waveTimer = null;
    this.saving = false;
    this.disposed = false;
    this.setData({ date: diary.formatDate(Date.now()) });
    this.bindRecorder();
    this.bindAudio();
  },
  onReady() { this.startWave(); },
  onUnload() {
    this.disposed = true;
    this.clearTimers();
    if (this.data.state === 'recording' || this.data.state === 'paused') this.recorder.stop();
    if (this.audio) this.audio.destroy();
  },
  navigate: nav.go,
  bindRecorder() {
    this.recorder.onStart(() => {
      if (this.disposed) return;
      this.startedAt = Date.now();
      this.elapsedBeforePause = 0;
      this.setData({ state: 'recording', stateText: '正在录音', durationMs: 0, durationText: '00:00' });
      this.recordTimer = setInterval(() => this.updateElapsed(), 250);
    });
    this.recorder.onPause(() => {
      if (this.disposed) return;
      this.elapsedBeforePause += Date.now() - this.startedAt;
      clearInterval(this.recordTimer);
      this.setData({ state: 'paused', stateText: '录音已暂停' });
      this.updateElapsed();
    });
    this.recorder.onResume(() => {
      if (this.disposed) return;
      this.startedAt = Date.now();
      this.setData({ state: 'recording', stateText: '正在录音' });
      this.recordTimer = setInterval(() => this.updateElapsed(), 250);
    });
    this.recorder.onStop(result => {
      clearInterval(this.recordTimer);
      if (this.disposed) return;
      const durationMs = Math.max(result.duration || 0, this.data.durationMs);
      if (!result.tempFilePath || durationMs < 1000) {
        this.setData({ state: 'idle', stateText: '录音太短，请重试', tempFilePath: '', canSave: false });
        return;
      }
      this.setData({ state: 'ready', stateText: '录音完成，试听后填写日记', tempFilePath: result.tempFilePath, durationMs, durationText: diary.formatDuration(durationMs), previewDurationText: diary.formatDuration(durationMs), canSave: true });
      this.audio.src = result.tempFilePath;
    });
    this.recorder.onError(error => {
      clearInterval(this.recordTimer);
      if (this.disposed) return;
      console.error('录音失败', error);
      this.setData({ state: 'idle', stateText: '录音失败，请检查麦克风权限后重试' });
      wx.showToast({ title: '录音失败', icon: 'none' });
    });
  },
  bindAudio() {
    this.audio.onPlay(() => this.setData({ previewPlaying: true }));
    this.audio.onPause(() => this.setData({ previewPlaying: false }));
    this.audio.onStop(() => this.setData({ previewPlaying: false }));
    this.audio.onEnded(() => this.setData({ previewPlaying: false, previewPosition: 0, previewCurrentText: '00:00' }));
    this.audio.onTimeUpdate(() => {
      const current = this.audio.currentTime || 0;
      const total = this.audio.duration || this.data.durationMs / 1000;
      this.setData({ previewPosition: total ? Math.min(100, current / total * 100) : 0, previewCurrentText: diary.formatDuration(current * 1000) });
    });
    this.audio.onError(error => { console.error('试听失败', error); this.setData({ previewPlaying: false }); wx.showToast({ title: '音频播放失败', icon: 'none' }); });
  },
  updateElapsed() {
    const ms = this.elapsedBeforePause + (this.data.state === 'recording' ? Date.now() - this.startedAt : 0);
    this.setData({ durationMs: ms, durationText: diary.formatDuration(ms) });
  },
  requestStart() {
    if (this.data.state === 'ready') {
      wx.showModal({ title: '重新录音', content: '当前未保存的录音会被替换，确定继续吗？', success: res => { if (res.confirm) this.authorizeAndStart(); } });
    } else this.authorizeAndStart();
  },
  authorizeAndStart() {
    this.audio.stop();
    wx.authorize({ scope: 'scope.record', success: () => this.startRecording(), fail: () => {
      wx.showModal({ title: '需要麦克风权限', content: '请在设置中允许使用麦克风，然后返回重试。', confirmText: '打开设置', success: res => { if (res.confirm) wx.openSetting(); } });
    } });
  },
  startRecording() {
    this.setData({ state: 'starting', stateText: '正在开启麦克风', tempFilePath: '', canSave: false, previewPlaying: false, previewPosition: 0 });
    this.recorder.start({ duration: 600000, sampleRate: 16000, numberOfChannels: 1, encodeBitRate: 48000, format: 'mp3' });
  },
  pauseOrResume() {
    if (this.data.state === 'recording') this.recorder.pause();
    else if (this.data.state === 'paused') this.recorder.resume();
  },
  stopRecording() {
    if (this.data.state === 'recording' || this.data.state === 'paused') {
      this.updateElapsed();
      this.setData({ state: 'stopping', stateText: '正在整理录音' });
      this.recorder.stop();
    }
  },
  togglePreview() {
    if (!this.data.tempFilePath) return;
    if (this.data.previewPlaying) this.audio.pause(); else this.audio.play();
  },
  replayPreview() { if (!this.data.tempFilePath) return; this.audio.stop(); this.audio.seek(0); this.audio.play(); },
  seekPreview(event) {
    const total = this.audio.duration || this.data.durationMs / 1000;
    if (total) this.audio.seek(total * event.detail.value / 100);
  },
  onTitle(event) { this.setData({ title: event.detail.value }); },
  onDescription(event) { this.setData({ description: event.detail.value }); },
  onDate(event) { this.setData({ date: event.detail.value }); },
  onCategory(event) { this.setData({ categoryIndex: Number(event.detail.value) }); },
  onMood(event) { this.setData({ moodIndex: Number(event.detail.value) }); },
  save() {
    if (this.saving || !this.data.tempFilePath) return;
    const title = this.data.title.trim();
    if (!title) { wx.showToast({ title: '请填写日记标题', icon: 'none' }); return; }
    this.saving = true;
    this.setData({ saving: true });
    this.audio.stop();
    wx.saveFile({ tempFilePath: this.data.tempFilePath, success: result => {
      const record = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title, description: this.data.description.trim(), date: this.data.date,
        category: CATEGORIES[this.data.categoryIndex], mood: MOODS[this.data.moodIndex],
        durationMs: this.data.durationMs, createdAt: Date.now(), filePath: result.savedFilePath, favorite: false
      };
      try {
        diary.add(record);
        this.setData({ tempFilePath: '', canSave: false });
        wx.showToast({ title: '日记已保存', icon: 'success' });
        setTimeout(() => wx.redirectTo({ url: `/pages/detail/detail?id=${record.id}` }), 550);
      } catch (error) {
        console.error('保存日记信息失败', error);
        wx.removeSavedFile({ filePath: result.savedFilePath, fail: () => {} });
        wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' });
        this.saving = false; this.setData({ saving: false });
      }
    }, fail: error => {
      console.error('保存录音文件失败', error);
      wx.showToast({ title: '保存录音失败', icon: 'none' });
      this.saving = false; this.setData({ saving: false });
    } });
  },
  startWave() {
    const draw = () => {
      if (this.disposed) return;
      const ctx = wx.createCanvasContext('wave', this);
      const active = this.data.state === 'recording';
      const bars = 35;
      const width = 305 / bars;
      const time = Date.now() / 260;
      ctx.setFillStyle('#70A78A');
      for (let i = 0; i < bars; i++) {
        const envelope = Math.sin(Math.PI * (i + 1) / (bars + 1));
        const motion = active ? (0.35 + 0.65 * Math.abs(Math.sin(time + i * 0.66) * Math.cos(time * 0.53 + i * 0.21))) : 0.22;
        const height = Math.max(4, 44 * envelope * motion);
        ctx.fillRect(i * width + 1, 32 - height / 2, Math.max(3, width - 3), height);
      }
      ctx.draw();
    };
    draw();
    this.waveTimer = setInterval(draw, 130);
  },
  clearTimers() { clearInterval(this.recordTimer); clearInterval(this.waveTimer); }
});

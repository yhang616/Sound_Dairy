App({
  onLaunch() {
    try {
      const records = wx.getStorageSync('voiceDiary.records.v1');
      if (!Array.isArray(records)) wx.setStorageSync('voiceDiary.records.v1', []);
    } catch (error) {
      console.error('初始化本地日记失败', error);
    }
  }
});

const KEY = 'voiceDiary.records.v1';

function all() {
  try {
    const value = wx.getStorageSync(KEY);
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error('读取日记失败', error);
    return [];
  }
}

function persist(records) {
  wx.setStorageSync(KEY, records);
  return records;
}

function add(record) {
  return persist([record].concat(all()));
}

function find(id) {
  return all().find(item => item.id === id);
}

function update(id, patch) {
  return persist(all().map(item => item.id === id ? Object.assign({}, item, patch) : item));
}

function remove(id) {
  const item = find(id);
  persist(all().filter(entry => entry.id !== id));
  if (item && item.filePath) {
    wx.removeSavedFile({ filePath: item.filePath, fail: () => {} });
  }
}

function formatDuration(ms) {
  const seconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = { all, add, find, update, remove, formatDuration, formatDate };

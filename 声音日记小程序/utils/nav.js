function go(event) {
  const path = event.currentTarget.dataset.path;
  if (!path) return;
  const pages = getCurrentPages();
  const current = pages.length ? pages[pages.length - 1].route : '';
  if (current === path) return;
  wx.redirectTo({ url: `/${path}` });
}
module.exports = { go };

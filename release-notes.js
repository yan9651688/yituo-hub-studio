/* YI TUO HUB STUDIO 更新通知：数据 + 铃铛入口 + 首访自动弹窗。
 * 每次发布改进后在 RELEASES 顶部追加一条；用户首次访问自动弹出一次，
 * 关闭后记录 localStorage，之后可点右上角铃铛随时回看。
 */
(function (global) {
  'use strict';

  var RELEASES = [
    {
      id: '2026-09-21-pine-soot',
      date: '2026-09-21',
      title: '高级排版上新 · 松烟刊读',
      items: [
        '新增第 16 套高级排版「松烟刊读」——黑金刊读姊妹篇，松烟墨绿 × 宣纸白的人文长文风',
        '附带 4 套定制配色：黛蓝 / 柿红 / 紫藤 / 玄墨，L2–L6 等级与动静态回退全部可用',
        '高级排版现共 16 套主题 × 5 档等级，81 种分级组合'
      ]
    }
  ];

  var SEEN_KEY = 'yituo-hub.release-seen';

  function latest() { return RELEASES[0]; }

  function hasSeen() {
    try { return global.localStorage.getItem(SEEN_KEY) === latest().id; } catch (error) { return true; }
  }

  function markSeen() {
    try { global.localStorage.setItem(SEEN_KEY, latest().id); } catch (error) { /* 隐私模式下静默 */ }
  }

  function esc(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function modalHtml() {
    var html = '<div class="release-head"><div><p class="release-kicker">WHAT\'S NEW · 更新通知</p>'
      + '<h2>' + esc(latest().title) + '</h2></div>'
      + '<span class="release-date">' + esc(latest().date) + '</span></div>'
      + '<ul class="release-list">';
    latest().items.forEach(function (item) {
      html += '<li>' + esc(item) + '</li>';
    });
    html += '</ul><div class="release-foot">'
      + '<p>点击右上角铃铛可随时回看更新通知。</p>'
      + '<button type="button" class="btn primary release-ok">知道了</button></div>';
    return html;
  }

  function init() {
    var anchor = document.getElementById('btnCopy');
    if (!anchor) return; /* 仅排版工坊页启用 */
    var actions = document.querySelector('.topbar .actions');
    if (!actions) return;

    var bell = document.createElement('button');
    bell.type = 'button';
    bell.className = 'btn icon-round release-bell';
    bell.setAttribute('aria-label', '更新通知');
    bell.title = '更新通知';
    bell.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>'
      + '<span class="release-dot" aria-hidden="true"></span>';
    actions.insertBefore(bell, actions.firstChild);

    var modal = document.createElement('div');
    modal.className = 'release-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', '更新通知');
    modal.innerHTML = '<div class="release-panel">' + modalHtml() + '</div>';
    document.body.appendChild(modal);

    function syncDot() { bell.classList.toggle('unseen', !hasSeen()); }

    function open() { modal.hidden = false; }
    function close() {
      modal.hidden = true;
      markSeen();
      syncDot();
    }

    bell.addEventListener('click', open);
    modal.addEventListener('click', function (event) { if (event.target === modal) close(); });
    modal.querySelector('.release-ok').addEventListener('click', close);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) close();
    });

    syncDot();
    if (!hasSeen()) setTimeout(open, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.Md2GZHReleaseNotes = { RELEASES: RELEASES, SEEN_KEY: SEEN_KEY };
})(typeof window !== 'undefined' ? window : globalThis);

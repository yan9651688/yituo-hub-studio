/* Md2GZH 跨模块共享工具：themes.js / original-visuals.js / app.js / create.js 共用，
 * 消除此前各自复制的 esc / toast / placeholderRatio / escapeRegExp / 红绿灯色值。
 * 加载顺序要求：本文件必须在 themes.js 之前引入（见 studio.html）。
 */
(function (global, factory) {
  var api = factory();
  global.Md2GZHShared = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* 创作和润色共用 API 根地址，调用时再拼接 /v1/models 或 /v1/chat/completions。 */
  function normalizeApiBase(value) {
    var base = String(value || '').trim().replace(/\/+$/, '').replace(/\/v1$/i, '');
    if (!base || base.toLowerCase() === 'https://api.yituohub.com') return 'https://www.yituohub.si';
    return base;
  }

  /* 占位图协议：placeholder://16-9 | 4-5 | 2.35-1 → 比例元数据 */
  function placeholderRatio(src) {
    var match = String(src || '').toLowerCase().match(/^placeholder:\/\/(16-9|4-5|2\.35-1)$/);
    if (!match) return null;
    if (match[1] === '4-5') return { key: '4-5', label: '4:5', css: '4 / 5', width: '72%' };
    if (match[1] === '2.35-1') return { key: '2.35-1', label: '2.35:1', css: '2.35 / 1', width: '100%' };
    return { key: '16-9', label: '16:9', css: '16 / 9', width: '100%' };
  }

  /* macOS 终端红绿灯（themes.js 与 original-visuals.js 的代码块共用） */
  var TRAFFIC_LIGHTS = [
    { color: '#FF5F57', size: 10 },
    { color: '#FEBC2E', size: 10 },
    { color: '#28C840', size: 10 }
  ];

  function trafficLightsHtml(size, gap, radius) {
    var html = '';
    for (var i = 0; i < TRAFFIC_LIGHTS.length; i++) {
      var light = TRAFFIC_LIGHTS[i];
      html += '<section style="width:' + size + 'px;height:' + size + 'px;border-radius:' + radius + ';'
        + (i ? 'margin-left:' + gap + 'px;' : '') + 'background:' + light.color + ';"></section>';
    }
    return html;
  }

  /* 轻提示：同一元素重复调用自动复位计时器 */
  function toast(element, message, duration) {
    if (!element) return;
    element.textContent = message;
    element.hidden = false;
    clearTimeout(element._toastTimer);
    element._toastTimer = setTimeout(function () { element.hidden = true; }, duration || 2400);
  }

  /* 同类告警只记一次，避免隐私模式等场景下每个按键都刷控制台 */
  var warnedOnce = {};
  function warnOnce(key, error) {
    if (warnedOnce[key]) return;
    warnedOnce[key] = true;
    console.warn('[yituo-studio] ' + key + ':', error && error.message ? error.message : error);
  }

  var CHEVRON_SVG = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  /* ---------- WCAG 对比度（配色表单与测试共用） ---------- */

  function colorLuminance(hex) {
    var channels = [1, 3, 5].map(function (offset) {
      var value = parseInt(String(hex).slice(offset, offset + 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function colorContrast(a, b) {
    var pair = [colorLuminance(a), colorLuminance(b)].sort(function (x, y) { return y - x; });
    return (pair[0] + 0.05) / (pair[1] + 0.05);
  }

  return {
    esc: esc,
    escapeRegExp: escapeRegExp,
    normalizeApiBase: normalizeApiBase,
    placeholderRatio: placeholderRatio,
    TRAFFIC_LIGHTS: TRAFFIC_LIGHTS,
    trafficLightsHtml: trafficLightsHtml,
    toast: toast,
    warnOnce: warnOnce,
    CHEVRON_SVG: CHEVRON_SVG,
    colorLuminance: colorLuminance,
    colorContrast: colorContrast
  };
});

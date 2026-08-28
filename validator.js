/* Md2GZH 合规校验器：对齐 gzh-design-skill 的公众号平台红线
 * ERROR = 粘贴后大概率掉样式/被编辑器丢弃；WARNING = 排版质量问题
 */
(function (global, factory) {
  var api = factory();
  global.Md2GZHValidator = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function validate(html) {
    var errors = [];
    var warnings = [];
    var frozenAdvancedTemplate = /data-original-system=["']production-template-v6["']/i.test(html)
      && /data-original-template-release=["']v24-static-final["']/i.test(html);

    function err(msg) { errors.push(msg); }
    function warn(msg) { warnings.push(msg); }

    if (/<\s*(style|script|div)\b/i.test(html)) err('包含禁用标签 style/script/div');
    if (/\s(class|id)\s*=\s*["']?(?!["']?\s*leaf)/i.test(html.replace(/leaf="/g, ''))) err('包含禁用的 class/id 属性');
    if (/position\s*:\s*(fixed|absolute|sticky)/i.test(html)) err('包含禁用的 position:fixed/absolute/sticky');
    if (/\bfloat\s*:/i.test(html)) err('包含禁用的 float');
    if (/@media|@keyframes/i.test(html)) err('包含禁用的 @media/@keyframes');
    /* 蓝梦冻结终稿用 grid 将透明 HTML 文案精确叠在 SVG content_anchor 上。 */
    if (/display\s*:\s*grid/i.test(html) && !frozenAdvancedTemplate) err('包含禁用的 display:grid');
    if (/var\s*\(--/.test(html)) err('包含禁用的 CSS 变量');
    if (/url\s*\(\s*['"]?https?:/i.test(html.replace(/<img[^>]*>/gi, ''))) err('包含外部字体/CSS 引用');
    if (/<!DOCTYPE|<html|<head|<body/i.test(html)) err('产物必须是 <section> 正文片段，不能带文档外壳');

    /* 文字必须全部包在 <span leaf> 内：移除所有 leaf span 后，剩余可见文字应为空 */
    var stripped = html.replace(/<span[^>]*leaf=""[^>]*>[\s\S]*?<\/span>/g, '');
    stripped = stripped.replace(/<[^>]+>/g, '');
    if (stripped.replace(/\s|\u00A0/g, '').length > 0) err('存在未被 <span leaf> 包裹的文字节点');

    /* leaf span 必须成对闭合（粗暴配对计数，够用） */
    var openLeaves = (html.match(/<span[^>]*leaf=""/g) || []).length;
    var closeSpans = (html.match(/<\/span>/g) || []).length;
    if (openLeaves > closeSpans) err('存在未闭合的 <span leaf> 标签');

    /* 半角标点（只查 leaf 内文字；中英文相邻语境才计） */
    var leafTexts = html.match(/<span[^>]*leaf=""[^>]*>[\s\S]*?<\/span>/g) || [];
    var halfCount = 0;
    var halfSamples = [];
    for (var i = 0; i < leafTexts.length; i++) {
      var t = leafTexts[i].replace(/<[^>]+>/g, '');
      var hits = t.match(/[\u4e00-\u9fff][,.!?:;]|[,.!?:;][\u4e00-\u9fff]/g) || [];
      if (hits.length) {
        halfCount += hits.length;
        if (halfSamples.length < 3) halfSamples.push(hits[0]);
      }
    }
    if (halfCount > 0) warn('发现 ' + halfCount + ' 处中英文混排半角标点（如 ' + halfSamples.join('、') + '）');

    /* 代码块禁 white-space:pre（会渲染出大缩进空行） */
    if (/white-space\s*:\s*pre\b/i.test(html)) warn('代码块使用了 white-space:pre，粘贴后可能出现大缩进');

    return { errors: errors, warnings: warnings, ok: errors.length === 0 };
  }

  return { validate: validate };
});

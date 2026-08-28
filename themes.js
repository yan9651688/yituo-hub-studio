/* Md2GZH 主题引擎 —— 参数化组件工厂（编辑部风格 v2）
 * 设计基准（对齐原版 gzh-design-skill 的品味）：
 * - 封面 = 杂志卡片：刊头小字 / 双色大标题 / 关键词行 / 彩色底栏
 * - 章节 = 大编号 + PART 小字 + 英文副标的编辑部网格
 * - 用色克制：90% 黑字白底 + 发丝线，颜色只出现在编号/细线/关键词上
 * 产物遵守平台红线：全内联样式、文字一律 <span leaf>、只用 section/p/span/strong/em/img 等
 */
(function (global, factory) {
  var api = factory();
  global.Md2GZHThemes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function leaf(text, style) {
    return '<span' + (style ? ' style="' + style + '"' : '') + ' leaf="">' + text + '</span>';
  }

  var EN_DICT = [
    ['实战', 'PRACTICE'], ['实践', 'PRACTICE'], ['教程', 'TUTORIAL'], ['上手', 'GET STARTED'],
    ['入门', 'START'], ['指南', 'GUIDE'], ['总结', 'SUMMARY'], ['小结', 'SUMMARY'],
    ['思考', 'THOUGHTS'], ['观点', 'OPINION'], ['心得', 'INSIGHTS'], ['浅见', 'INSIGHTS'],
    ['测评', 'REVIEW'], ['评测', 'REVIEW'], ['复盘', 'REVIEW'], ['对比', 'COMPARE'],
    ['工具', 'TOOLKIT'], ['清单', 'LIST'], ['方法', 'METHOD'], ['方法论', 'METHODOLOGY'],
    ['案例', 'CASE STUDY'], ['分析', 'ANALYSIS'], ['原理', 'THEORY'], ['架构', 'ARCHITECTURE'],
    ['避坑', 'PITFALLS'], ['踩坑', 'PITFALLS'], ['技巧', 'TIPS'], ['建议', 'ADVICE'],
    ['效率', 'EFFICIENCY'], ['编码', 'CODING'], ['调试', 'DEBUG'], ['部署', 'DEPLOY'],
    ['工作流', 'WORKFLOW'], ['全流程', 'WORKFLOW'], ['手册', 'HANDBOOK'], ['随笔', 'ESSAY'],
    ['记录', 'NOTES'], ['观察', 'OBSERVATION'], ['趋势', 'TRENDS'], ['未来', 'FUTURE'],
    ['团队', 'TEAM'], ['管理', 'MANAGEMENT'], ['安全', 'SECURITY'], ['性能', 'PERFORMANCE'],
    ['数据', 'DATA'], ['报告', 'REPORT'], ['规划', 'PLANNING'], ['选型', 'SELECTION']
  ];

  function autoEn(title) {
    for (var i = 0; i < EN_DICT.length; i++) {
      if (title.indexOf(EN_DICT[i][0]) !== -1) return EN_DICT[i][1];
    }
    if (/AI|Agent|LLM|GPT/i.test(title)) return 'AI FRONTIER';
    return null;
  }

  /* ---------- 中文标点全角化（仅正文，代码不经过此处） ---------- */

  var CJK = '[\\u4e00-\\u9fff]';

  function zhPunct(s) {
    var map = { ',': '，', '.': '。', '!': '！', '?': '？', ':': '：', ';': '；' };
    return String(s)
      .replace(new RegExp('(' + CJK + ')\\s*([,.!?:;])', 'g'), function (m, a, b) { return a + map[b]; })
      .replace(new RegExp('([,.!?:;])\\s*(' + CJK + ')', 'g'), function (m, b, a) { return map[b] + a; })
      .replace(new RegExp('\\(([^()]*' + CJK + '[^()]*)\\)', 'g'), '（$1）')
      .replace(/"([^"\n]*)"/g, '“$1”')
      .replace(/'([^'\n]*)'/g, '‘$1’');
  }

  function txt(s) { return esc(zhPunct(s)); }

  /* ---------- 行内渲染：把 marked 的行内 HTML 重写为带主题样式的 <span leaf> 结构 ---------- */

  function inline(rawHtml, spec, state) {
    var doc = new DOMParser().parseFromString('<section>' + (rawHtml || '') + '</section>', 'text/html');
    return walkInline(doc.body.firstChild.childNodes, spec, state);
  }

  function restyleFirstLeaf(html, style) {
    return html.replace(/<span([^>]*?)\s?leaf=""([^>]*)>/, '<span$1 leaf="" style="' + style + '">');
  }

  function walkInline(nodes, spec, state) {
    var html = '';
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.nodeType === 3) {
        if (!n.nodeValue) continue;
        html += leaf(esc(zhPunct(n.nodeValue)));
        continue;
      }
      if (n.nodeType !== 1) continue;
      var tag = n.tagName;
      if (tag === 'STRONG' || tag === 'B') {
        var inner = walkInline(n.childNodes, spec, state);
        var kw = state.allowKeyword && !state.firstStrongDone;
        if (kw) {
          state.firstStrongDone = true;
          inner = restyleFirstLeaf(inner, spec.underline + 'color:' + spec.c.deep + ';');
        }
        html += '<strong style="color:' + spec.c.deep + ';font-weight:700;">' + inner + '</strong>';
        continue;
      }
      if (tag === 'EM' || tag === 'I') {
        html += '<em style="font-style:italic;color:' + spec.c.sub + ';">' + walkInline(n.childNodes, spec, state) + '</em>';
        continue;
      }
      if (tag === 'MARK') {
        html += restyleFirstLeaf(walkInline(n.childNodes, spec, state),
          'background:linear-gradient(transparent 60%,' + spec.c.light + ' 60%);font-weight:600;');
        continue;
      }
      if (tag === 'U') {
        html += restyleFirstLeaf(walkInline(n.childNodes, spec, state), spec.underline);
        continue;
      }
      if (tag === 'DEL' || tag === 'S') {
        html += '<span style="text-decoration:line-through;color:' + spec.c.sub + ';">' + walkInline(n.childNodes, spec, state) + '</span>';
        continue;
      }
      if (tag === 'CODE') {
        html += '<span style="background:' + spec.c.tint + ';color:' + spec.c.deep + ';border:1px solid ' + spec.c.border + ';padding:1px 6px;border-radius:5px;font-size:12.5px;font-family:Menlo,Consolas,monospace;" leaf="">'
          + esc((n.textContent || '').replace(/\s+/g, ' ')) + '</span>';
        continue;
      }
      if (tag === 'A') {
        /* 公众号正文不支持外链，链接文字以主题色加粗呈现 */
        html += '<strong style="color:' + spec.c.primary + ';font-weight:600;">' + walkInline(n.childNodes, spec, state) + '</strong>';
        continue;
      }
      if (tag === 'BR') { html += '<br/>'; continue; }
      if (tag === 'IMG') { continue; }
      html += walkInline(n.childNodes, spec, state);
    }
    return html;
  }

  /* ---------------- 组件构建器（编辑部风格） ---------------- */

  /* 封面 = 杂志卡片：刊头行 / 双色标题 / 关键词行 / 彩色底栏 */
  function buildCover(spec, t) {
    if (spec.cover === 'minimal') {
      var h = '<section style="margin:8px 0 28px;">'
        + '<section style="display:flex;align-items:center;justify-content:space-between;">'
        + '<p style="margin:0;font-size:10px;letter-spacing:3px;color:' + spec.c.primary + ';font-weight:700;">' + leaf(spec.en) + '</p>'
        + '<p style="margin:0;font-size:10px;letter-spacing:2px;color:' + spec.c.sub + ';">' + leaf(spec.kickerZh) + '</p>'
        + '</section>'
        + '<p style="margin:18px 0 0;font-size:23px;font-weight:800;color:' + spec.c.ink + ';line-height:1.45;">' + leaf(txt(t.title)) + '</p>'
        + (t.sub ? '<p style="margin:8px 0 0;font-size:16px;font-weight:700;color:' + spec.c.primary + ';line-height:1.5;">' + leaf(txt(t.sub)) + '</p>' : '')
        + '<section style="width:52px;height:3px;background:' + spec.c.accent + ';border-radius:2px;margin:18px 0 0;"></section>'
        + (t.keywords.length ? '<p style="margin:16px 0 0;font-size:11px;color:' + spec.c.sub + ';letter-spacing:.5px;">' + leaf(txt(t.keywords.join(' · '))) + '</p>' : '')
        + '</section>';
      return h;
    }
    var barLeft = t.author ? leaf(txt('文 / ' + t.author)) : leaf('WECHAT · LONG READ');
    return '<section style="background:#FFFFFF;border:1px solid ' + spec.c.border + ';border-radius:14px;margin:8px 0 26px;">'
      + '<section style="padding:22px 20px 18px;">'
      + '<section style="display:flex;align-items:center;justify-content:space-between;">'
      + '<p style="margin:0;font-size:10px;letter-spacing:3px;color:' + spec.c.primary + ';font-weight:700;">' + leaf(spec.en) + '</p>'
      + '<p style="margin:0;font-size:10px;letter-spacing:2px;color:' + spec.c.sub + ';">' + leaf(spec.kickerZh) + '</p>'
      + '</section>'
      + '<p style="margin:16px 0 0;font-size:21px;font-weight:800;color:' + spec.c.ink + ';line-height:1.45;">' + leaf(txt(t.title)) + '</p>'
      + (t.sub ? '<p style="margin:8px 0 0;font-size:15.5px;font-weight:700;color:' + spec.c.primary + ';line-height:1.5;">' + leaf(txt(t.sub)) + '</p>' : '')
      + (t.keywords.length ? '<p style="margin:14px 0 0;font-size:11px;color:' + spec.c.sub + ';letter-spacing:.5px;">' + leaf(txt(t.keywords.join(' · '))) + '</p>' : '')
      + '</section>'
      + '<section style="display:flex;align-items:center;justify-content:space-between;background:linear-gradient(90deg,' + spec.c.primary + ',' + spec.c.deep + ');border-radius:0 0 13px 13px;padding:10px 16px;">'
      + '<p style="margin:0;font-size:12.5px;font-weight:600;color:#FFFFFF;">' + barLeft + '</p>'
      + '<p style="margin:0;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,.85);">' + leaf(t.parts > 0 ? (t.parts + ' PARTS') : spec.en) + '</p>'
      + '</section>'
      + '</section>';
  }

  /* 章节 = 大编号 + PART 小字 + 标题 + 英文副标（编辑部网格） */
  function buildSectionTitle(spec, t) {
    var en = t.en || ('CHAPTER ' + t.num);
    if (spec.sectionTitle === 'pill') {
      return '<section style="margin:44px 0 22px;">'
        + '<section style="display:flex;align-items:flex-start;">'
        + '<section style="background:' + spec.c.primary + ';border-radius:6px;padding:4px 10px;flex-shrink:0;">'
        + '<span style="color:#FFFFFF;font-size:15px;font-weight:800;letter-spacing:1px;" leaf="">' + t.num + '</span></section>'
        + '<section style="margin-left:13px;flex:1;">'
        + '<p style="margin:0;font-size:9px;letter-spacing:3px;color:' + spec.c.primary + ';font-weight:700;">' + leaf(en) + '</p>'
        + '<p style="margin:3px 0 0;font-size:18px;font-weight:700;color:' + spec.c.ink + ';line-height:1.4;">' + leaf(txt(t.title)) + '</p>'
        + '</section></section>'
        + '<section style="height:2px;background:' + spec.c.primary + ';opacity:.9;margin-top:14px;"></section>'
        + '</section>';
    }
    if (spec.sectionTitle === 'line') {
      return '<section style="margin:44px 0 22px;">'
        + '<section style="display:flex;align-items:baseline;justify-content:center;">'
        + '<section style="font-size:26px;font-weight:800;color:' + spec.c.primary + ';line-height:1;margin-right:10px;">' + leaf(t.num) + '</section>'
        + '<section style="font-size:18px;font-weight:700;color:' + spec.c.ink + ';line-height:1.4;">' + leaf(txt(t.title)) + '</section>'
        + '</section>'
        + '<p style="margin:7px 0 0;text-align:center;font-size:9px;letter-spacing:4px;color:' + spec.c.sub + ';">' + leaf(en) + '</p>'
        + '<section style="width:36px;height:2px;background:' + spec.c.primary + ';margin:12px auto 0;"></section>'
        + '</section>';
    }
    if (spec.sectionTitle === 'chip') {
      var numStyle = spec.chipDark
        ? 'background:' + spec.c.ink + ';'
        : 'background:' + spec.c.primary + ';';
      var numColor = spec.chipDark ? spec.c.accent : '#FFFFFF';
      return '<section style="margin:44px 0 20px;">'
        + '<section style="display:flex;align-items:center;">'
        + '<section style="' + numStyle + 'border-radius:6px;padding:5px 11px;flex-shrink:0;">'
        + '<span style="color:' + numColor + ';font-size:13px;font-weight:800;letter-spacing:1px;" leaf="">' + t.num + '</span></section>'
        + '<section style="margin-left:13px;">'
        + '<p style="margin:0;font-size:18px;font-weight:700;color:' + spec.c.ink + ';line-height:1.4;">' + leaf(txt(t.title)) + '</p>'
        + '<p style="margin:3px 0 0;font-size:9px;letter-spacing:3px;color:' + spec.c.sub + ';">' + leaf(en) + '</p>'
        + '</section></section>'
        + '<section style="height:1px;background:' + spec.c.border + ';margin-top:16px;"></section>'
        + '</section>';
    }
    /* bar：大编号 + PART 竖排网格（摸鱼绿式） */
    return '<section style="margin:44px 0 22px;">'
      + '<section style="display:flex;align-items:center;">'
      + '<section style="flex-shrink:0;">'
      + '<p style="margin:0;font-size:30px;font-weight:800;color:' + spec.c.primary + ';line-height:1;">' + leaf(t.num) + '</p>'
      + '<p style="margin:5px 0 0;font-size:9px;letter-spacing:2.5px;color:' + spec.c.sub + ';">' + leaf('PART') + '</p>'
      + '</section>'
      + '<section style="width:1px;height:36px;background:' + spec.c.border + ';margin:0 15px;"></section>'
      + '<section style="flex:1;">'
      + '<p style="margin:0;font-size:18px;font-weight:700;color:' + spec.c.ink + ';line-height:1.4;">' + leaf(txt(t.title)) + '</p>'
      + '<p style="margin:4px 0 0;font-size:9px;letter-spacing:3px;color:' + spec.c.sub + ';">' + leaf(en) + '</p>'
      + '</section></section>'
      + '</section>';
  }

  function buildSubsection(spec, t) {
    return '<section style="margin:26px 0 12px;display:flex;align-items:center;">'
      + '<section style="width:4px;height:15px;background:' + spec.c.primary + ';border-radius:2px;margin-right:10px;"></section>'
      + '<section style="font-size:16px;font-weight:700;color:' + spec.c.ink + ';"><span leaf="">' + txt(t.text) + '</span></section>'
      + '</section>';
  }

  /* 引言 = 白卡 + 大引号（红白风式）/ 左竖条 / 浅底 / 虚线框（摸鱼绿式） */
  function buildQuote(spec, t) {
    var author = t.author ? ('—— ' + t.author) : '';
    if (spec.quote === 'dashed') {
      return '<section style="background:#FFFFFF;border:1px dashed ' + spec.c.primary + ';border-radius:10px;padding:16px 18px;margin:24px 0;">'
        + '<p style="margin:0;font-size:15px;line-height:1.9;color:' + spec.c.ink + ';">' + leaf(txt(t.text)) + '</p>'
        + (author ? '<p style="text-align:right;font-size:12px;color:' + spec.c.sub + ';margin:8px 0 0;">' + leaf(txt(author)) + '</p>' : '')
        + '</section>';
    }
    if (spec.quote === 'leftbar') {
      var barColor = spec.darkBars ? spec.c.ink : spec.c.primary;
      return '<section style="background:#FFFFFF;border:1px solid ' + spec.c.border + ';border-left:3px solid ' + barColor + ';border-radius:0 10px 10px 0;padding:16px 18px;margin:24px 0;">'
        + '<p style="margin:0;font-size:15px;line-height:1.9;color:' + spec.c.ink + ';font-weight:500;">' + leaf(txt(t.text)) + '</p>'
        + (author ? '<p style="text-align:right;font-size:12px;color:' + spec.c.sub + ';margin:8px 0 0;">' + leaf(txt(author)) + '</p>' : '')
        + '</section>';
    }
    if (spec.quote === 'tint') {
      return '<section style="background:' + spec.c.tint + ';border:1px solid ' + spec.c.border + ';border-radius:12px;padding:18px 20px;margin:24px 0;">'
        + '<p style="margin:0;font-size:26px;font-weight:800;color:' + spec.c.primary + ';line-height:.6;">' + leaf('&ldquo;') + '</p>'
        + '<p style="margin:6px 0 0;font-size:15px;line-height:1.9;color:' + spec.c.deep + ';font-weight:600;">' + leaf(txt(t.text)) + '</p>'
        + (author ? '<p style="text-align:right;font-size:12px;color:' + spec.c.sub + ';margin:8px 0 0;">' + leaf(txt(author)) + '</p>' : '')
        + '</section>';
    }
    return '<section style="background:#FFFFFF;border:1px solid ' + spec.c.border + ';border-radius:12px;padding:18px 20px 14px;margin:24px 0;">'
      + '<p style="margin:0;font-size:30px;font-weight:800;color:' + spec.c.primary + ';line-height:.7;">' + leaf('&ldquo;') + '</p>'
      + '<p style="margin:10px 0 0;font-size:15.5px;line-height:1.85;color:' + spec.c.ink + ';font-weight:600;">' + leaf(txt(t.text)) + '</p>'
      + (author ? '<p style="text-align:right;font-size:12px;color:' + spec.c.sub + ';margin:10px 0 0;">' + leaf(txt(author)) + '</p>' : '')
      + '</section>';
  }

  /* 目录 = 刊头行 + PART 卡片（首张实色）/ 列表 */
  function buildToc(spec, titles, parts) {
    if (!titles || titles.length === 0) return '';
    var h = '<section style="margin:26px 0;">'
      + '<section style="display:flex;align-items:center;justify-content:space-between;">'
      + '<p style="margin:0;font-size:10px;letter-spacing:2.5px;color:' + spec.c.sub + ';font-weight:700;">' + leaf('CONTENTS · 本章导览') + '</p>'
      + '<p style="margin:0;font-size:10px;letter-spacing:1.5px;color:' + spec.c.sub + ';">' + leaf(parts + ' PARTS') + '</p>'
      + '</section>';
    if (spec.toc === 'cards') {
      h += '<section style="display:flex;margin-top:12px;">';
      for (var i = 0; i < titles.length; i++) {
        var solid = i === 0;
        var bg = solid ? spec.c.primary : '#FFFFFF';
        var numColor = solid ? 'rgba(255,255,255,.8)' : spec.c.primary;
        var titleColor = solid ? '#FFFFFF' : spec.c.ink;
        var borderStyle = solid ? 'border:1px solid ' + spec.c.primary + ';' : 'border:1px solid ' + spec.c.border + ';';
        h += '<section style="flex:1;' + (i > 0 ? 'margin-left:9px;' : '') + borderStyle + 'background:' + bg + ';border-radius:10px;padding:13px 10px;">'
          + '<p style="margin:0;font-size:9px;letter-spacing:2px;color:' + numColor + ';font-weight:700;">' + leaf('PART 0' + (i + 1)) + '</p>'
          + '<p style="margin:7px 0 0;font-size:12.5px;font-weight:700;line-height:1.55;color:' + titleColor + ';">' + leaf(txt(titles[i])) + '</p>'
          + '</section>';
      }
      h += '</section>';
    } else {
      h += '<section style="background:#FFFFFF;border:1px solid ' + spec.c.border + ';border-radius:10px;padding:4px 16px;margin-top:12px;">';
      for (var j = 0; j < titles.length; j++) {
        h += '<section style="display:flex;align-items:center;' + (j > 0 ? 'border-top:1px solid ' + spec.c.border + ';' : '') + 'padding:12px 0;">'
          + '<p style="margin:0;font-size:13px;font-weight:800;color:' + spec.c.primary + ';margin-right:12px;flex-shrink:0;">' + leaf('0' + (j + 1)) + '</p>'
          + '<p style="margin:0;flex:1;font-size:13.5px;font-weight:600;color:' + spec.c.ink + ';line-height:1.6;">' + leaf(txt(titles[j])) + '</p>'
          + '</section>';
      }
      h += '</section>';
    }
    return h + '</section>';
  }

  function buildPara(spec, t) {
    return '<p style="margin:18px 0;font-size:15px;line-height:1.9;letter-spacing:.3px;color:' + spec.c.text + ';text-align:justify;">'
      + inline(t.raw, spec, { allowKeyword: true, firstStrongDone: false }) + '</p>';
  }

  /* 代码块 = macOS 红绿灯 + 语言标签 */
  function buildCode(spec, t) {
    var dark = spec.code === 'dark';
    var bg = dark ? spec.c.codeBg : '#FFFFFF';
    var fg = dark ? '#E2E8F0' : spec.c.deep;
    var h = '<section style="background:' + bg + ';border-radius:10px;padding:12px 16px 14px;margin:20px 0;' + (dark ? '' : 'border:1px solid ' + spec.c.border + ';') + '">'
      + '<section style="display:flex;align-items:center;margin-bottom:10px;">'
      + '<section style="width:10px;height:10px;border-radius:50%;background:#FF5F57;"></section>'
      + '<section style="width:10px;height:10px;border-radius:50%;background:#FEBC2E;margin-left:6px;"></section>'
      + '<section style="width:10px;height:10px;border-radius:50%;background:#28C840;margin-left:6px;"></section>'
      + '<p style="margin:0 0 0 10px;font-size:11px;letter-spacing:1px;color:' + (dark ? '#94A3B8' : spec.c.sub) + ';font-family:Menlo,Consolas,monospace;">' + leaf(esc(t.lang || 'code')) + '</p>'
      + '</section>'
      + '<section style="font-size:13px;line-height:1.7;color:' + fg + ';font-family:Menlo,Consolas,\u0027Courier New\u0027,monospace;">';
    for (var i = 0; i < t.lines.length; i++) {
      var raw = t.lines[i];
      var line = raw.length ? esc(raw).replace(/^( +)/, function (m) { return new Array(m.length + 1).join('\u3000'); }) : '\u00A0';
      h += '<p style="margin:0;">' + leaf(line) + '</p>';
    }
    return h + '</section></section>';
  }

  function buildImage(spec, t) {
    return '<section style="margin:20px 0;text-align:center;">'
      + '<img src="' + esc(t.src) + '" alt="' + esc(t.alt || '') + '" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:10px;border:1px solid ' + spec.c.border + ';"/>'
      + (t.alt ? '<p style="margin:8px 0 0;font-size:11.5px;color:' + spec.c.sub + ';">' + leaf(txt(t.alt)) + '</p>' : '')
      + '</section>';
  }

  function buildList(spec, t) {
    var h = '<section style="margin:18px 0;">';
    for (var i = 0; i < t.items.length; i++) {
      var it = inline(t.items[i], spec, { allowKeyword: true, firstStrongDone: false });
      var marker;
      if (t.ordered) {
        marker = '<span style="color:' + spec.c.primary + ';font-weight:800;font-size:14px;" leaf="">' + (i + 1) + '. </span>';
      } else {
        marker = '<span style="color:' + spec.c.primary + ';font-size:11px;" leaf="">● </span>';
      }
      h += '<section style="display:flex;margin:10px 0;">'
        + '<section style="flex-shrink:0;margin-right:7px;line-height:1.9;">' + marker + '</section>'
        + '<section style="flex:1;font-size:15px;line-height:1.9;color:' + spec.c.text + ';text-align:justify;">' + it + '</section>'
        + '</section>';
    }
    return h + '</section>';
  }

  function buildTable(spec, t) {
    var h = '<section style="margin:20px 0;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';
    h += '<thead><tr>';
    for (var c = 0; c < t.head.length; c++) {
      h += '<th style="background:' + spec.c.ink + ';color:#FFFFFF;padding:9px 10px;text-align:left;border:1px solid ' + spec.c.ink + ';font-weight:600;">' + leaf(txt(t.head[c])) + '</th>';
    }
    h += '</tr></thead><tbody>';
    for (var r = 0; r < t.rows.length; r++) {
      h += '<tr>';
      for (var d = 0; d < t.rows[r].length; d++) {
        h += '<td style="padding:9px 10px;border:1px solid ' + spec.c.border + ';color:' + spec.c.text + ';line-height:1.7;">' + leaf(txt(t.rows[r][d])) + '</td>';
      }
      h += '</tr>';
    }
    return h + '</tbody></table></section>';
  }

  function buildDivider(spec) {
    return '<section style="display:flex;align-items:center;margin:32px 0;">'
      + '<section style="flex:1;height:1px;background:' + spec.c.border + ';"></section>'
      + '<section style="width:5px;height:5px;border-radius:50%;background:' + spec.c.primary + ';margin:0 12px;"></section>'
      + '<section style="flex:1;height:1px;background:' + spec.c.border + ';"></section>'
      + '</section>';
  }

  /* 签名 = ABOUT 刊头 + 发丝线卡片 */
  function buildSignature(spec, t) {
    var dark = spec.sigDark === true;
    var boxBg = dark ? spec.c.ink : '#FFFFFF';
    var boxBorder = dark ? spec.c.ink : spec.c.border;
    var textColor = dark ? 'rgba(255,255,255,.9)' : spec.c.text;
    var labelColor = dark ? spec.c.accent : spec.c.sub;
    var strongColor = dark ? spec.c.accent : spec.c.primary;
    var h = '<section style="background:' + boxBg + ';border:1px solid ' + boxBorder + ';border-radius:12px;padding:16px 18px;margin:34px 0 10px;">'
      + '<p style="margin:0;font-size:9px;letter-spacing:2.5px;color:' + labelColor + ';font-weight:700;">' + leaf('ABOUT · 作者') + '</p>';
    if (t.author) {
      h += '<p style="margin:9px 0 0;font-size:14px;line-height:1.9;color:' + textColor + ';">'
        + leaf('我是 ')
        + '<strong style="color:' + strongColor + ';"><span leaf="">' + txt(t.author) + '</span></strong>'
        + leaf('，' + (t.intro ? txt(t.intro) : '热衷于分享 AI 编码一线实战')) + '</p>';
    }
    h += '<p style="margin:' + (t.author ? '6px' : '9px') + ' 0 0;font-size:14px;line-height:1.9;color:' + textColor + ';">'
      + leaf('如果觉得今天这篇有收获，欢迎')
      + '<strong style="color:' + strongColor + ';"><span leaf="">点赞、在看、转发</span></strong>'
      + leaf('三连，我们下篇见') + '</p>';
    return h + '</section>';
  }

  function render(tokens, spec, opt) {
    opt = opt || {};
    var sectionTokens = tokens.filter(function (x) { return x.type === 'section'; });
    var parts = sectionTokens.length;
    var keywords = sectionTokens.slice(0, 4).map(function (x) { return x.title; });
    var sectionTitles = sectionTokens.slice(0, 3).map(function (x) { return x.title; });

    var introQuote = null;
    var body = tokens.slice();
    var firstQuoteIdx = -1;
    for (var i = 0; i < body.length; i++) {
      if (body[i].type === 'quote') { firstQuoteIdx = i; break; }
    }
    if (firstQuoteIdx !== -1 && firstQuoteIdx <= 2) {
      introQuote = body[firstQuoteIdx];
      body.splice(firstQuoteIdx, 1);
    }

    var signature = { type: 'signature' };
    var bodyHtml = [];
    var coverHtml = '';
    for (var k = 0; k < body.length; k++) {
      var tk = body[k];
      switch (tk.type) {
        case 'cover':
          tk.keywords = keywords; tk.parts = parts; tk.author = opt.author || '';
          coverHtml = buildCover(spec, tk);
          break;
        case 'section': bodyHtml.push(buildSectionTitle(spec, tk)); break;
        case 'subsection': bodyHtml.push(buildSubsection(spec, tk)); break;
        case 'para': bodyHtml.push(buildPara(spec, tk)); break;
        case 'code': bodyHtml.push(buildCode(spec, tk)); break;
        case 'image': bodyHtml.push(buildImage(spec, tk)); break;
        case 'list': bodyHtml.push(buildList(spec, tk)); break;
        case 'table': bodyHtml.push(buildTable(spec, tk)); break;
        case 'divider': bodyHtml.push(buildDivider(spec)); break;
        case 'quote': bodyHtml.push(buildQuote(spec, tk)); break;
        case 'signature': signature = tk; break;
      }
    }

    var out = [coverHtml];
    var motionBlocks = opt.motion || [];
    for (var m = 0; m < motionBlocks.length; m++) {
      out.push('<section style="margin:4px 0;text-align:center;">' + motionBlocks[m] + '</section>');
    }
    if (introQuote) {
      introQuote.author = introQuote.author || (opt.author ? opt.author : '');
      out.push(buildQuote(spec, introQuote));
    }
    out.push(buildToc(spec, sectionTitles, parts));
    out = out.concat(bodyHtml);
    var sigAuthor = signature.author || opt.author || '';
    out.push(buildSignature(spec, { author: sigAuthor, intro: signature.intro || '' }));
    return '<section style="font-family:-apple-system,BlinkMacSystemFont,\'Helvetica Neue\',\'PingFang SC\',\'Microsoft YaHei\',sans-serif;padding:4px 6px;">'
      + out.join('\n') + '</section>';
  }

  /* ---------------- 33 套主题 ----------------
   * base library: editorial / classic / fresh（18 套）
   * original library: motion（高级排版，蓝梦原创视觉 15 套）
   * classic 组的配色与下划线取自原版 theme-index.md，组件形态为参数化复刻。
   */

  var SPECS = [
    /* ---------- 杂志编辑部（原创） ---------- */
    {
      id: 'ocean', name: '深海蓝', en: 'DEEP OCEAN', kickerZh: '深度长文', group: 'editorial',
      desc: '科技蓝 · 教程与实战首选',
      swatch: '#1D4ED8',
      radius: '10px',
      underline: 'border-bottom:2px solid #BFDBFE;font-weight:600;',
      cover: 'full', sectionTitle: 'bar', quote: 'gradient', toc: 'cards', signature: 'card', code: 'dark',
      c: { primary: '#1D4ED8', deep: '#1E3A8A', light: '#BFDBFE', tint: '#EFF6FF', ink: '#111827', text: '#374151', sub: '#9CA3AF', border: '#E8EAEE', accent: '#1D4ED8', coverA: '#2563EB', coverB: '#1E3A8A', codeBg: '#0F172A' }
    },
    {
      id: 'sunrise', name: '曙光橙', en: 'SUNRISE NOTES', kickerZh: '经验分享', group: 'editorial',
      desc: '暖橙奶油 · 经验随笔亲和风',
      swatch: '#EA580C',
      radius: '14px',
      underline: 'border-bottom:2px solid #FED7AA;font-weight:600;',
      cover: 'full', sectionTitle: 'pill', quote: 'leftbar', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#EA580C', deep: '#9A3412', light: '#FED7AA', tint: '#FFF7ED', ink: '#1C1917', text: '#44403C', sub: '#A8A29E', border: '#EEE6DC', accent: '#EA580C', coverA: '#F97316', coverB: '#C2410C', codeBg: '#FFF7ED' }
    },
    {
      id: 'nebula', name: '星穹紫', en: 'NEBULA', kickerZh: 'AI 前沿', group: 'editorial',
      desc: '紫粉渐变 · AI 前沿与观点',
      swatch: '#7C3AED',
      radius: '12px',
      underline: 'border-bottom:2px solid #DDD6FE;font-weight:600;',
      cover: 'full', sectionTitle: 'line', quote: 'tint', toc: 'cards', signature: 'card', code: 'dark',
      c: { primary: '#7C3AED', deep: '#5B21B6', light: '#DDD6FE', tint: '#F5F3FF', ink: '#1E1B2E', text: '#3F3A52', sub: '#A29DB8', border: '#E8E4F4', accent: '#C026D3', coverA: '#7C3AED', coverB: '#A21CAF', codeBg: '#1E1B2E' }
    },
    {
      id: 'onyx', name: '鎏金黑', en: 'ONYX & GOLD', kickerZh: '深度分析', group: 'editorial',
      desc: '黑金衬线 · 深度分析与财经',
      swatch: '#111827',
      radius: '6px',
      underline: 'border-bottom:2px solid #F0D48A;font-weight:600;',
      cover: 'minimal', sectionTitle: 'chip', quote: 'leftbar', toc: 'list', signature: 'card', code: 'dark',
      chipDark: true, sigDark: true, darkBars: true,
      c: { primary: '#B45309', deep: '#78350F', light: '#FDE68A', tint: '#F9FAFB', ink: '#111827', text: '#374151', sub: '#9CA3AF', border: '#E5E7EB', accent: '#D97706', coverA: '#111827', coverB: '#374151', codeBg: '#111827' }
    },
    {
      id: 'celadon', name: '青瓷', en: 'CELADON', kickerZh: '知识整理', group: 'editorial',
      desc: '青绿瓷感 · 知识整理与清单',
      swatch: '#0F766E',
      radius: '8px',
      underline: 'border-bottom:2px solid #99F6E4;font-weight:600;',
      cover: 'full', sectionTitle: 'chip', quote: 'tint', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#0F766E', deep: '#115E59', light: '#99F6E4', tint: '#F0FDFA', ink: '#134E4A', text: '#3F4A48', sub: '#94A8A5', border: '#DDE9E6', accent: '#0D9488', coverA: '#0D9488', coverB: '#115E59', codeBg: '#F0FDFA' }
    },
    {
      id: 'sakura', name: '绯樱', en: 'SAKURA', kickerZh: '生活手记', group: 'editorial',
      desc: '樱粉圆角 · 生活与情感随笔',
      swatch: '#DB2777',
      radius: '16px',
      underline: 'border-bottom:2px solid #FBCFE8;font-weight:600;',
      cover: 'full', sectionTitle: 'pill', quote: 'gradient', toc: 'cards', signature: 'card', code: 'light',
      c: { primary: '#DB2777', deep: '#9D174D', light: '#FBCFE8', tint: '#FDF2F8', ink: '#1F1723', text: '#4A3B47', sub: '#B294A9', border: '#F1E2EA', accent: '#E11D48', coverA: '#EC4899', coverB: '#BE185D', codeBg: '#FDF2F8' }
    },

    /* ---------- 经典复刻（gzh-design-skill） ---------- */
    {
      id: 'moyu-green', name: '摸鱼绿', en: 'MOYU GREEN', kickerZh: '效率工具', group: 'classic',
      desc: '教程测评万能款',
      swatch: '#059669',
      radius: '10px',
      underline: 'border-bottom:2px solid #A7F3D0;font-weight:600;',
      cover: 'full', sectionTitle: 'bar', quote: 'dashed', toc: 'cards', signature: 'card', code: 'dark',
      c: { primary: '#059669', deep: '#047857', light: '#A7F3D0', tint: '#ECFDF5', ink: '#111827', text: '#374151', sub: '#9CA3AF', border: '#E4E9E7', accent: '#059669', coverA: '#10B981', coverB: '#047857', codeBg: '#0F172A' }
    },
    {
      id: 'red-white', name: '红白风', en: 'RED & WHITE', kickerZh: '深度观点', group: 'classic',
      desc: '观点文的力量感',
      swatch: '#DC2626',
      radius: '8px',
      underline: 'border-bottom:2px solid #FECACA;font-weight:600;',
      cover: 'full', sectionTitle: 'pill', quote: 'gradient', toc: 'cards', signature: 'line', code: 'dark',
      c: { primary: '#DC2626', deep: '#991B1B', light: '#FECACA', tint: '#FEF2F2', ink: '#111827', text: '#374151', sub: '#9CA3AF', border: '#E8EAEE', accent: '#DC2626', coverA: '#EF4444', coverB: '#991B1B', codeBg: '#18181B' }
    },
    {
      id: 'graphite', name: '石墨极简', en: 'GRAPHITE', kickerZh: '设计评论', group: 'classic',
      desc: '全灰阶 · 高级留白',
      swatch: '#52525B',
      radius: '6px',
      underline: 'border-bottom:2px solid #52525B;font-weight:600;',
      cover: 'minimal', sectionTitle: 'line', quote: 'leftbar', toc: 'list', signature: 'line', code: 'dark',
      c: { primary: '#52525B', deep: '#3F3F46', light: '#D4D4D8', tint: '#F4F4F5', ink: '#18181B', text: '#3F3F46', sub: '#A1A1AA', border: '#E4E4E7', accent: '#52525B', coverA: '#3F3F46', coverB: '#18181B', codeBg: '#18181B' }
    },
    {
      id: 'zen', name: '留白禅意', en: 'ZEN', kickerZh: '随笔生活', group: 'classic',
      desc: '禅意留白 · 呼吸感最强',
      swatch: '#4A5D52',
      radius: '12px',
      underline: 'border-bottom:1.5px solid #B5C8BC;font-weight:500;',
      cover: 'minimal', sectionTitle: 'line', quote: 'tint', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#4A5D52', deep: '#3B4A42', light: '#B5C8BC', tint: '#F6F8F7', ink: '#26332C', text: '#3F4A45', sub: '#9AA8A1', border: '#E2E8E4', accent: '#4A5D52', coverA: '#4A5D52', coverB: '#3B4A42', codeBg: '#26332C' }
    },
    {
      id: 'ticket', name: '摸鱼票据', en: 'MOYU TICKET', kickerZh: '工具测评', group: 'classic',
      desc: '票据隐喻 · 测评对比',
      swatch: '#047857',
      radius: '12px',
      underline: 'border-bottom:2px solid #A7F3D0;font-weight:600;',
      cover: 'full', sectionTitle: 'chip', quote: 'dashed', toc: 'cards', signature: 'card', code: 'dark',
      c: { primary: '#047857', deep: '#065F46', light: '#A7F3D0', tint: '#ECFDF5', ink: '#111827', text: '#374151', sub: '#9CA3AF', border: '#E4E9E7', accent: '#059669', coverA: '#059669', coverB: '#065F46', codeBg: '#134E4A' }
    },
    {
      id: 'olive', name: '橄榄手记', en: 'OLIVE JOURNAL', kickerZh: '手记专栏', group: 'classic',
      desc: '内刊质感 · 黑与橙',
      swatch: '#1E1F23',
      radius: '6px',
      underline: 'border-bottom:2px solid #ed7b2f;font-weight:600;',
      cover: 'minimal', sectionTitle: 'chip', quote: 'leftbar', toc: 'list', signature: 'card', code: 'dark',
      chipDark: true, sigDark: true, darkBars: true,
      c: { primary: '#1E1F23', deep: '#9A3412', light: '#FED7AA', tint: '#F5F4EF', ink: '#1E1F23', text: '#3F3F46', sub: '#A1A1AA', border: '#E5E2D9', accent: '#ED7B2F', coverA: '#1E1F23', coverB: '#3F3F46', codeBg: '#1E1F23' }
    },

    /* ---------- 新锐系列 ---------- */
    {
      id: 'mocha', name: '摩卡', en: 'MOCHA', kickerZh: '读书手记', group: 'fresh',
      desc: '咖啡棕 · 读书笔记与书评',
      swatch: '#92400E',
      radius: '10px',
      underline: 'border-bottom:2px solid #FDDFBB;font-weight:600;',
      cover: 'full', sectionTitle: 'chip', quote: 'tint', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#92400E', deep: '#78350F', light: '#FDDFBB', tint: '#FFFBF3', ink: '#1C1917', text: '#44403C', sub: '#A8A29E', border: '#EDE4D8', accent: '#B45309', coverA: '#A16207', coverB: '#78350F', codeBg: '#FFFBF3' }
    },
    {
      id: 'burgundy', name: '勃艮第', en: 'BURGUNDY', kickerZh: '品牌专栏', group: 'fresh',
      desc: '酒红酒金 · 品牌与高端质感',
      swatch: '#9F1239',
      radius: '8px',
      underline: 'border-bottom:2px solid #FECDD3;font-weight:600;',
      cover: 'minimal', sectionTitle: 'bar', quote: 'gradient', toc: 'cards', signature: 'card', code: 'dark',
      c: { primary: '#9F1239', deep: '#881337', light: '#FECDD3', tint: '#FFF1F2', ink: '#1C1017', text: '#43333B', sub: '#A78E98', border: '#EDDFE4', accent: '#D97706', coverA: '#BE123C', coverB: '#881337', codeBg: '#1C1017' }
    },
    {
      id: 'midnight', name: '午夜靛蓝', en: 'MIDNIGHT', kickerZh: '科技观察', group: 'fresh',
      desc: '靛蓝深空 · 硬核技术长文',
      swatch: '#3730A3',
      radius: '10px',
      underline: 'border-bottom:2px solid #C7D2FE;font-weight:600;',
      cover: 'full', sectionTitle: 'bar', quote: 'leftbar', toc: 'list', signature: 'card', code: 'dark',
      c: { primary: '#3730A3', deep: '#312E81', light: '#C7D2FE', tint: '#EEF2FF', ink: '#1E1B4B', text: '#3B3A5C', sub: '#9A98BD', border: '#E3E5F2', accent: '#6366F1', coverA: '#4338CA', coverB: '#312E81', codeBg: '#1E1B4B' }
    },
    {
      id: 'mango', name: '芒果琥珀', en: 'MANGO', kickerZh: '效率清单', group: 'fresh',
      desc: '琥珀黄 · 活力清单与盘点',
      swatch: '#CA8A04',
      radius: '12px',
      underline: 'border-bottom:2px solid #FDE68A;font-weight:600;',
      cover: 'full', sectionTitle: 'pill', quote: 'tint', toc: 'cards', signature: 'line', code: 'light',
      c: { primary: '#CA8A04', deep: '#854D0E', light: '#FDE68A', tint: '#FEFCE8', ink: '#1C1917', text: '#44403C', sub: '#A8A29E', border: '#EDE7D3', accent: '#D97706', coverA: '#EAB308', coverB: '#854D0E', codeBg: '#FEFCE8' }
    },
    {
      id: 'lake', name: '湖水青', en: 'LAKE', kickerZh: '商业案例', group: 'fresh',
      desc: '湖水青 · 商业案例与复盘',
      swatch: '#0E7490',
      radius: '10px',
      underline: 'border-bottom:2px solid #A5F3FC;font-weight:600;',
      cover: 'full', sectionTitle: 'pill', quote: 'leftbar', toc: 'cards', signature: 'line', code: 'light',
      c: { primary: '#0E7490', deep: '#155E75', light: '#A5F3FC', tint: '#ECFEFF', ink: '#164E63', text: '#3F525A', sub: '#93AAB2', border: '#DCEAEE', accent: '#0891B2', coverA: '#0891B2', coverB: '#155E75', codeBg: '#164E63' }
    },
    {
      id: 'oat', name: '燕麦拿铁', en: 'OAT LATTE', kickerZh: '极简生活', group: 'fresh',
      desc: '暖灰米白 · 无彩色极简生活',
      swatch: '#78716C',
      radius: '14px',
      underline: 'border-bottom:2px solid #D6D3D1;font-weight:600;',
      cover: 'minimal', sectionTitle: 'line', quote: 'leftbar', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#57534E', deep: '#44403C', light: '#D6D3D1', tint: '#FAFAF9', ink: '#1C1917', text: '#44403C', sub: '#A8A29E', border: '#E7E5E4', accent: '#78716C', coverA: '#57534E', coverB: '#292524', codeBg: '#FAFAF9' }
    },

    /* ---------- 高级排版（蓝梦原创视觉，与 wechat-motion-layout-studio Production V6 资产配套） ---------- */
    {
      id: 'sepia-archive', name: '档案棕褐', en: 'ARCHIVE SEPIA', kickerZh: '档案手记', group: 'motion',
      desc: '复古档案 · 棕褐纸感',
      swatch: '#8B5B3E', radius: '8px',
      underline: 'border-bottom:2px solid #E0C9A6;font-weight:600;',
      cover: 'full', sectionTitle: 'chip', quote: 'tint', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#8B5B3E', deep: '#3A3028', light: '#E0C9A6', tint: '#FBF7EF', ink: '#3A3028', text: '#4A4038', sub: '#756658', border: '#E7DECF', accent: '#C79C68', coverA: '#8B5B3E', coverB: '#3A3028', codeBg: '#FBF7EF' }
    },
    {
      id: 'blueprint', name: '蓝图网格', en: 'BLUEPRINT GRID', kickerZh: '技术图谱', group: 'motion',
      desc: '蓝图网格 · 砖红点缀',
      swatch: '#2F718C', radius: '6px',
      underline: 'border-bottom:2px solid #A9C6D4;font-weight:600;',
      cover: 'full', sectionTitle: 'bar', quote: 'leftbar', toc: 'cards', signature: 'card', code: 'dark',
      c: { primary: '#2F718C', deep: '#16364A', light: '#C8D9E0', tint: '#F2F7F9', ink: '#16364A', text: '#33475A', sub: '#5D7480', border: '#D8E2E8', accent: '#B86157', coverA: '#2F718C', coverB: '#16364A', codeBg: '#16364A' }
    },
    {
      id: 'botanical', name: '植物手记', en: 'BOTANICAL NOTES', kickerZh: '自然观察', group: 'motion',
      desc: '橄榄绿 · 植物观察手记',
      swatch: '#627A45', radius: '10px',
      underline: 'border-bottom:2px solid #C4CFAF;font-weight:600;',
      cover: 'full', sectionTitle: 'pill', quote: 'tint', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#627A45', deep: '#29352B', light: '#D2D9CC', tint: '#F7FAF5', ink: '#29352B', text: '#3D4A3E', sub: '#68766A', border: '#DCE3D5', accent: '#D2A66B', coverA: '#759054', coverB: '#3D4E35', codeBg: '#F7FAF5' }
    },
    {
      id: 'citrus', name: '柑橘报告', en: 'CITRUS REPORT', kickerZh: '数据复盘', group: 'motion',
      desc: '橄榄青柠 · 轻快测评',
      swatch: '#65731F', radius: '10px',
      underline: 'border-bottom:2px solid #C9D1A0;font-weight:600;',
      cover: 'full', sectionTitle: 'chip', quote: 'gradient', toc: 'cards', signature: 'card', code: 'light',
      c: { primary: '#65731F', deep: '#3F4813', light: '#D2D7CD', tint: '#F8FAF1', ink: '#20241F', text: '#3A4038', sub: '#6D736A', border: '#E2E6D9', accent: '#C87945', coverA: '#7A8A2A', coverB: '#3F4813', codeBg: '#F8FAF1' }
    },
    {
      id: 'coral-zine', name: '珊瑚杂志', en: 'CORAL ZINE', kickerZh: '独立杂志', group: 'motion',
      desc: '珊瑚粉红 · 独立杂志感',
      swatch: '#B95054', radius: '12px',
      underline: 'border-bottom:2px solid #ECC0B9;font-weight:600;',
      cover: 'full', sectionTitle: 'pill', quote: 'gradient', toc: 'cards', signature: 'card', code: 'light',
      c: { primary: '#B95054', deep: '#402D33', light: '#E4B1A6', tint: '#FFF7F5', ink: '#402D33', text: '#52424A', sub: '#79676C', border: '#EBDDD9', accent: '#B95054', coverA: '#C96A6E', coverB: '#9E4247', codeBg: '#FFF7F5' }
    },
    {
      id: 'deep-sea', name: '深海终端', en: 'DEEP SEA TERMINAL', kickerZh: '终端手记', group: 'motion',
      desc: '墨蓝铜金 · 极客终端风',
      swatch: '#17242D', radius: '6px',
      underline: 'border-bottom:2px solid #C39A5E;font-weight:600;',
      cover: 'minimal', sectionTitle: 'chip', quote: 'leftbar', toc: 'list', signature: 'card', code: 'dark',
      chipDark: true, sigDark: true, darkBars: true,
      c: { primary: '#5FAE9E', deep: '#17242D', light: '#91A3A8', tint: '#F0F4F4', ink: '#101A22', text: '#26343C', sub: '#6E8288', border: '#D9E1E1', accent: '#C39A5E', coverA: '#17242D', coverB: '#30434D', codeBg: '#101A22' }
    },
    {
      id: 'vermilion', name: '墨红社论', en: 'EDITORIAL VERMILION', kickerZh: '深度评论', group: 'motion',
      desc: '朱砂红 · 编辑部署评',
      swatch: '#B33A2B', radius: '6px',
      underline: 'border-bottom:2px solid #E7BBA9;font-weight:600;',
      cover: 'minimal', sectionTitle: 'bar', quote: 'gradient', toc: 'list', signature: 'line', code: 'dark',
      c: { primary: '#B33A2B', deep: '#201F1D', light: '#E4C5B8', tint: '#FBFAF8', ink: '#201F1D', text: '#3A3835', sub: '#777168', border: '#E3DED6', accent: '#B33A2B', coverA: '#B33A2B', coverB: '#201F1D', codeBg: '#201F1D' }
    },
    {
      id: 'mist-research', name: '雾蓝研究', en: 'MIST RESEARCH', kickerZh: '研究报告', group: 'motion',
      desc: '灰蓝雾感 · 冷静研究风',
      swatch: '#4F7489', radius: '10px',
      underline: 'border-bottom:2px solid #B8CCD6;font-weight:600;',
      cover: 'full', sectionTitle: 'line', quote: 'tint', toc: 'cards', signature: 'line', code: 'light',
      c: { primary: '#4F7489', deep: '#263843', light: '#B8CCD6', tint: '#F5F8FA', ink: '#263843', text: '#3C4F5C', sub: '#5F717C', border: '#DFE7EB', accent: '#4F7489', coverA: '#6C8FA3', coverB: '#3E5A6B', codeBg: '#F5F8FA' }
    },
    {
      id: 'mono-gold', name: '黑金刊读', en: 'MONO GOLD JOURNAL', kickerZh: '专业长文', group: 'motion',
      desc: '暖金素纸 · 手记质感',
      swatch: '#87682F', radius: '6px',
      underline: 'border-bottom:2px solid #D8CCAE;font-weight:600;',
      cover: 'minimal', sectionTitle: 'chip', quote: 'leftbar', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#87682F', deep: '#171714', light: '#D8CCAE', tint: '#FAF8F3', ink: '#171714', text: '#3C382F', sub: '#6D675B', border: '#E5DFD2', accent: '#87682F', coverA: '#87682F', coverB: '#171714', codeBg: '#FAF8F3' }
    },
    {
      id: 'neo-brutal', name: '新粗野', en: 'NEO BRUTAL', kickerZh: '锐评专栏', group: 'motion',
      desc: '黑框撞色 · 锐利点评',
      swatch: '#B94A32', radius: '4px',
      underline: 'border-bottom:2px solid #A9C8BC;font-weight:600;',
      cover: 'full', sectionTitle: 'chip', quote: 'leftbar', toc: 'cards', signature: 'card', code: 'light',
      chipDark: true, sigDark: true, darkBars: true,
      c: { primary: '#B94A32', deep: '#1D1D1B', light: '#A9C8BC', tint: '#FFF8E8', ink: '#1D1D1B', text: '#3A3833', sub: '#55504A', border: '#D8D4CC', accent: '#A9C8BC', coverA: '#D95B3F', coverB: '#8F3823', codeBg: '#FFF8E8' }
    },
    {
      id: 'night-editorial', name: '暗夜编辑', en: 'NIGHT EDITORIAL', kickerZh: '趋势观察', group: 'motion',
      desc: '锈金夜色 · 深夜长评',
      swatch: '#B95833', radius: '6px',
      underline: 'border-bottom:2px solid #C6A85F;font-weight:600;',
      cover: 'full', sectionTitle: 'bar', quote: 'leftbar', toc: 'cards', signature: 'line', code: 'dark',
      c: { primary: '#B95833', deep: '#26231F', light: '#D8D2CA', tint: '#FAF7F2', ink: '#26231F', text: '#45403A', sub: '#746F68', border: '#E5DFD6', accent: '#C6A85F', coverA: '#B95833', coverB: '#26231F', codeBg: '#26231F' }
    },
    {
      id: 'rice-paper', name: '稻纸朱砂', en: 'RICE PAPER', kickerZh: '传统文化', group: 'motion',
      desc: '宣纸朱砂 · 东方文人气',
      swatch: '#A64232', radius: '4px',
      underline: 'border-bottom:2px solid #C9B88F;font-weight:600;',
      cover: 'minimal', sectionTitle: 'chip', quote: 'tint', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#A64232', deep: '#34312B', light: '#C9B88F', tint: '#FAF6EE', ink: '#34312B', text: '#4A463E', sub: '#736C60', border: '#E6DFD2', accent: '#A64232', coverA: '#A64232', coverB: '#34312B', codeBg: '#FAF6EE' }
    },
    {
      id: 'soft-clay', name: '柔和陶土', en: 'SOFT CLAY', kickerZh: '生活随笔', group: 'motion',
      desc: '陶土暖棕 · 温软生活流',
      swatch: '#9F5E45', radius: '14px',
      underline: 'border-bottom:2px solid #E0C0AC;font-weight:600;',
      cover: 'full', sectionTitle: 'pill', quote: 'tint', toc: 'cards', signature: 'card', code: 'light',
      c: { primary: '#9F5E45', deep: '#4A352C', light: '#D2B49D', tint: '#FFF7F2', ink: '#4A352C', text: '#5C4A40', sub: '#806B62', border: '#EBDFD7', accent: '#9F5E45', coverA: '#C08268', coverB: '#9F5E45', codeBg: '#FFF7F2' }
    },
    {
      id: 'swiss-signal', name: '瑞士信号', en: 'SWISS SIGNAL', kickerZh: '信号速递', group: 'motion',
      desc: '蓝金瑞士 · 版式速递',
      swatch: '#3157A4', radius: '4px',
      underline: 'border-bottom:2px solid #9FB4DC;font-weight:600;',
      cover: 'minimal', sectionTitle: 'bar', quote: 'leftbar', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#3157A4', deep: '#1D1D1B', light: '#C8C7C2', tint: '#F7F7F5', ink: '#1D1D1B', text: '#3C3A36', sub: '#66645E', border: '#E2E1DC', accent: '#D0B85A', coverA: '#3157A4', coverB: '#1D1D1B', codeBg: '#F7F7F5' }
    },
    {
      id: 'violet-studio', name: '紫灰工作室', en: 'VIOLET STUDIO', kickerZh: '工作室观察', group: 'motion',
      desc: '灰紫陶橙 · 工作室观察',
      swatch: '#705B8C', radius: '10px',
      underline: 'border-bottom:2px solid #C9BEDA;font-weight:600;',
      cover: 'full', sectionTitle: 'line', quote: 'gradient', toc: 'cards', signature: 'card', code: 'dark',
      c: { primary: '#705B8C', deep: '#352E3E', light: '#DDD7E1', tint: '#F7F5FA', ink: '#352E3E', text: '#4A4254', sub: '#716779', border: '#E4DFEA', accent: '#D97A4A', coverA: '#8A6FA8', coverB: '#5C4A75', codeBg: '#352E3E' }
    }
  ];

  var GROUPS = [
    { id: 'all', name: '全部' },
    { id: 'editorial', name: '杂志编辑部' },
    { id: 'classic', name: '经典复刻' },
    { id: 'fresh', name: '新锐系列' },
    { id: 'motion', name: '高级排版' }
  ];

  /* 顶层资源域：基础主题与高级排版不得在选择器中混排。 */
  var LIBRARIES = [
    { id: 'base', name: '基础主题', shortName: '基础', en: 'BASIC THEMES', groups: ['editorial', 'classic', 'fresh'] },
    { id: 'original', name: '高级排版', shortName: '高级排版', en: 'ADVANCED LAYOUTS', groups: ['motion'] }
  ];

  function getSpec(id) {
    for (var i = 0; i < SPECS.length; i++) if (SPECS[i].id === id) return SPECS[i];
    return SPECS[0];
  }

  return {
    esc: esc,
    leaf: leaf,
    autoEn: autoEn,
    zhPunct: zhPunct,
    inline: inline,
    SPECS: SPECS,
    GROUPS: GROUPS,
    LIBRARIES: LIBRARIES,
    getSpec: getSpec,
    render: render,
    COMPONENTS: {
      buildCover: buildCover,
      buildSectionTitle: buildSectionTitle,
      buildSubsection: buildSubsection,
      buildQuote: buildQuote,
      buildToc: buildToc,
      buildPara: buildPara,
      buildCode: buildCode,
      buildImage: buildImage,
      buildList: buildList,
      buildTable: buildTable,
      buildDivider: buildDivider,
      buildSignature: buildSignature
    }
  };
});

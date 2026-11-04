/* 蓝梦原创视觉渲染器。
 * 将 Production V6 的静态/动态 SVG 组件按 6 档等级组合成可编辑公众号正文。
 */
(function (global, factory) {
  var themes = global.Md2GZHThemes || (typeof require === 'function' ? require('./themes.js') : null);
  var data = global.Md2GZHOriginalData || (typeof require === 'function' ? require('./original-visuals-data.js') : null);
  var shared = global.Md2GZHShared || (typeof require === 'function' ? require('./shared.js') : null);
  var api = factory(themes, data, shared);
  global.Md2GZHOriginalVisuals = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function (Themes, Data, Shared) {
  'use strict';

  function fail(message) { throw new Error(message); }
  function esc(value) { return Themes.esc(String(value == null ? '' : value)); }
  function text(value, style) { return Themes.leaf(esc(Themes.zhPunct(String(value == null ? '' : value))), style || ''); }
  function raw(value, style) { return Themes.leaf(String(value == null ? '' : value), style || ''); }
  function number(value) { return Math.round(Number(value) * 1000) / 1000; }
  function surfaceInk(p) { return p.surfaceInk || p.ink; }
  function surfaceMuted(p) { return p.surfaceMuted || p.muted; }

  function inlineSpec(spec, p) {
    var clone = {};
    Object.keys(spec || {}).forEach(function (key) { clone[key] = spec[key]; });
    /* 配色变体会携带重建的 underline（themes.js 的 underline 按默认配色硬编码），优先取 p.underline。 */
    clone.underline = p.underline || (spec && spec.underline) || ('border-bottom:2px solid ' + p.accent2 + ';font-weight:600;');
    clone.c = {
      primary: p.accent, deep: p.ink, light: p.accent2, tint: p.surface,
      ink: p.ink, text: p.ink, sub: p.muted, border: p.line,
      accent: p.accent2, coverA: p.accent, coverB: p.ink, codeBg: p.surface
    };
    return clone;
  }

  /* 配色变体换色：把冻结模板 / 组件 SVG 文本中的默认 hex（与 gridLine rgba 字面量）
   * 按 profile.colorMap 整表替换。替换是纯文本、大小写不敏感的值替换，
   * 不触碰 SVG 几何、viewBox 与 SMIL 动画；默认配色无 colorMap 时原样返回。
   * hex 源值若存在 3 位缩写形式（如 #FFFFFF/#FFF）一并替换；长值优先，避免部分匹配。
   */
  function recolor(source, p) {
    var map = p && p.colorMap;
    var text = String(source == null ? '' : source);
    if (!map || !map.length) return text;
    for (var i = 0; i < map.length; i++) {
      var from = map[i][0];
      var to = map[i][1];
      if (!from || !to || from === to) continue;
      var pattern;
      if (from.charAt(0) === '#') {
        pattern = escapeRe(from) + '\\b';
        var shorthand = hexShorthand(from);
        if (shorthand) pattern = '(?:' + escapeRe(from) + '|' + escapeRe(shorthand) + ')\\b';
      } else {
        pattern = escapeRe(from);
      }
      text = text.replace(new RegExp(pattern, 'gi'), to);
    }
    return text;
  }

  var escapeRe = Shared.escapeRegExp;

  function hexShorthand(hex) {
    var match = /^#([0-9A-Fa-f])\1([0-9A-Fa-f])\2([0-9A-Fa-f])\3$/.exec(hex);
    return match ? '#' + match[1] + match[2] + match[3] : null;
  }

  function inline(value, spec) {
    return Themes.inline(value || '', spec, { allowKeyword: true, firstStrongDone: false });
  }

  function leadVisualUnits(value) {
    var clean = String(value || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, 'x')
      .replace(/\s+/g, ' ')
      .trim();
    var units = 0;
    for (var i = 0; i < clean.length; i++) {
      var code = clean.charCodeAt(i);
      if (/\s/.test(clean.charAt(i))) units += 0.35;
      else if (code <= 0x7f) units += 0.55;
      else units += 1;
    }
    return units;
  }

  function isFrameSafeLead(value) {
    var units = leadVisualUnits(value);
    return units > 0 && units <= 42;
  }

  function pickPreludeLead(prelude) {
    var limit = Math.min(prelude.length, 3);
    var i;
    for (i = 0; i < limit; i++) {
      if (prelude[i].type === 'quote' && isFrameSafeLead(prelude[i].text)) {
        return { index: i, html: esc(prelude[i].text) };
      }
    }
    for (i = 0; i < limit; i++) {
      if (prelude[i].type === 'para' && isFrameSafeLead(prelude[i].raw)) {
        return { index: i, html: prelude[i].raw };
      }
    }
    return null;
  }

  function articleFromTokens(tokens) {
    var cover = { title: '未命名文章', sub: '' };
    var signature = null;
    var hasSections = tokens.some(function (token) { return token.type === 'section'; });
    var bodyTokens = tokens.filter(function (token) {
      if (token.type === 'cover') { cover = token; return false; }
      if (token.type === 'signature') { signature = token; return false; }
      return true;
    });

    if (!hasSections) {
      var fallbackLead = cover.sub && isFrameSafeLead(cover.sub) ? esc(cover.sub) : '';
      var fallbackIntro = [];
      if (cover.sub && !fallbackLead) fallbackIntro.push({ type: 'para', raw: esc(cover.sub) });
      return {
        title: cover.title || '未命名文章',
        leadRaw: fallbackLead,
        intro: fallbackIntro, signature: signature,
        sections: [{ title: '正文', num: '01', items: bodyTokens }]
      };
    }

    var prelude = [];
    var sections = [];
    var current = null;
    bodyTokens.forEach(function (token) {
      if (token.type === 'section') {
        current = { title: token.title, num: token.num, items: [] };
        sections.push(current);
        return;
      }
      if (current) { current.items.push(token); return; }
      prelude.push(token);
    });
    var leadRaw = '';
    var intro = prelude.slice();
    if (cover.sub && isFrameSafeLead(cover.sub)) {
      leadRaw = esc(cover.sub);
    } else {
      if (cover.sub) intro.unshift({ type: 'para', raw: esc(cover.sub) });
      var pickedLead = pickPreludeLead(prelude);
      if (pickedLead) {
        leadRaw = pickedLead.html;
        intro.splice(pickedLead.index + (cover.sub ? 1 : 0), 1);
      }
    }
    return {
      title: cover.title || '未命名文章',
      leadRaw: leadRaw,
      intro: intro, signature: signature, sections: sections
    };
  }

  function canvasStyle(p) {
    if (p.backgroundMode === 'grid') {
      var line = p.gridLine || 'rgba(47,113,140,.03)';
      return 'background-color:' + p.paper + ';background-image:linear-gradient(' + line
        + ' 1px,transparent 1px),linear-gradient(90deg,' + line
        + ' 1px,transparent 1px);background-size:24px 24px';
    }
    return 'background:' + p.paper;
  }

  function shell(p, levelId, content) {
    var pad = p.density === 'airy' ? '30px 22px' : (p.density === 'compact' ? '22px 18px' : '26px 20px');
    return '<section data-original-system="production-v6" data-original-level="' + esc(levelId)
      + '" data-original-style="' + esc(p.styleId)
      + '" style="max-width:750px;margin:0 auto;padding:' + pad + ';box-sizing:border-box;'
      + canvasStyle(p) + ';color:' + p.ink
      + ';font-family:-apple-system,BlinkMacSystemFont,\'PingFang SC\',\'Microsoft YaHei\',sans-serif;">'
      + content + '</section>';
  }

  /* ---------- 2026.11 创意高级排版（水墨长卷 / 复古号外 / 像素游戏机 / 胶片影志） ----------
   * 只用 section/p/span/h1/h2/table + 内联样式；不用 SVG、grid、定位、外链字体，确保粘贴进公众号稳定。 */
  function filmHoles(p, count) {
    var h = '';
    for (var i = 0; i < count; i++) h += '<span style="display:inline-block;width:9px;height:6px;margin:0 4px;border-radius:1px;background:' + p.paper + ';"></span>';
    return '<p style="margin:0;padding:4px 0;background:' + p.accent2 + ';text-align:center;line-height:6px;font-size:0;white-space:nowrap;overflow:hidden;">' + h + '</p>';
  }

  function pixelBar(p, filled, total) {
    var h = '';
    for (var i = 0; i < total; i++) h += '<span style="display:inline-block;width:10px;height:10px;margin-right:2px;border:1px solid ' + p.ink + ';background:' + (i < filled ? p.accent2 : p.paper) + ';box-sizing:border-box;"></span>';
    return h;
  }

  var ZH_NUM = ['壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖', '拾'];

  function creativeHeader(article, p, spec) {
    var titleHtml = text(article.title);
    var leadHtml = inline(article.leadRaw, spec);
    var kind = p.header;
    if (kind === 'ink-scroll') {
      return '<section style="padding:8px 0 30px;">'
        + '<section style="display:flex;align-items:stretch;gap:16px;">'
        + '<section style="flex:none;width:30px;padding:14px 0;border:1px solid ' + p.accent + ';text-align:center;box-sizing:border-box;">'
        + '<p style="margin:0;font-family:STKaiti,KaiTi,serif;font-size:13px;line-height:1.5;color:' + p.accent + ';">' + raw('墨<br/>卷<br/>壹') + '</p></section>'
        + '<section style="flex:1;min-width:0;padding:6px 0 0;">'
        + '<p style="margin:0 0 14px;font-size:10px;letter-spacing:.4em;color:' + p.muted + ';">' + text('水墨长卷 · INK SCROLL') + '</p>'
        + '<h1 style="margin:0;font-family:STKaiti,KaiTi,STSong,serif;font-size:29px;line-height:1.35;font-weight:700;color:' + p.ink + ';">' + titleHtml + '</h1>'
        + '<p style="margin:16px 0 0;height:3px;line-height:3px;font-size:0;background:' + p.ink + ';width:56px;">' + raw('&nbsp;') + '</p>'
        + '</section></section>'
        + '<p style="margin:22px 0 0;padding:16px 18px;background:' + p.surface + ';border-left:2px solid ' + p.accent2 + ';font-family:STKaiti,KaiTi,serif;font-size:14.5px;line-height:2;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'gazette') {
      return '<section style="padding:0 0 26px;">'
        + '<section style="border-top:4px solid ' + p.ink + ';border-bottom:1px solid ' + p.ink + ';padding:2px 0 0;"><section style="border-top:1px solid ' + p.ink + ';"></section></section>'
        + '<section style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid ' + p.ink + ';font-size:9px;letter-spacing:.12em;color:' + p.muted + ';">'
        + '<span style="font-size:9px;">' + text('VOL. 01') + '</span><span style="font-size:9px;font-weight:800;color:' + p.accent + ';">' + text('号外 · EXTRA') + '</span><span style="font-size:9px;">' + text('定价 一份关注') + '</span></section>'
        + '<p style="margin:16px 0 4px;text-align:center;font-family:STSong,SimSun,serif;font-size:12px;letter-spacing:.6em;color:' + p.ink + ';">' + text('THE DAILY GAZETTE') + '</p>'
        + '<h1 style="margin:6px 0 0;text-align:center;font-family:STSong,SimSun,serif;font-size:30px;line-height:1.25;font-weight:900;color:' + p.ink + ';">' + titleHtml + '</h1>'
        + '<section style="margin:16px 0 0;border-top:1px solid ' + p.ink + ';border-bottom:3px double ' + p.ink + ';padding:12px 2px;">'
        + '<p style="margin:0;font-family:STSong,SimSun,serif;font-size:14px;line-height:1.9;color:' + p.ink + ';text-align:justify;">' + text('【本报讯】') + leadHtml + '</p></section></section>';
    }
    if (kind === 'pixel-hud') {
      return '<section style="padding:0 6px 6px 0;background:' + p.ink + ';margin-bottom:26px;">'
        + '<section style="padding:16px 16px 18px;background:' + p.surface + ';border:2px solid ' + p.ink + ';">'
        + '<section style="display:flex;justify-content:space-between;align-items:center;margin:0 0 14px;">'
        + '<span style="font-family:Menlo,Consolas,monospace;font-size:10px;font-weight:900;color:' + p.accent + ';">' + text('▶ PLAYER 1') + '</span>'
        + '<span style="font-size:0;line-height:10px;">' + pixelBar(p, 7, 8) + '</span></section>'
        + '<h1 style="margin:0;font-size:27px;line-height:1.25;font-weight:900;color:' + p.ink + ';">' + titleHtml + '</h1>'
        + '<p style="margin:12px 0 0;display:inline-block;padding:3px 8px;background:' + p.accent2 + ';border:2px solid ' + p.ink + ';font-family:Menlo,Consolas,monospace;font-size:10px;font-weight:900;color:' + p.ink + ';">' + text('NEW GAME · ' + article.sections.length + ' STAGES') + '</p>'
        + '<p style="margin:16px 0 0;padding-top:12px;border-top:2px dashed ' + p.ink + ';font-size:14px;line-height:1.85;color:' + p.ink + ';">' + leadHtml + '</p></section></section>';
    }
    /* film-reel */
    return '<section style="margin:0 0 26px;background:' + p.accent2 + ';border-radius:' + p.radius + 'px;overflow:hidden;">'
      + filmHoles(p, 16)
      + '<section style="padding:22px 20px 20px;background:' + p.accent2 + ';">'
      + '<p style="margin:0 0 12px;font-family:Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:.3em;color:' + p.accent + ';">' + text('● REC  ROLL 01 · 胶片影志') + '</p>'
      + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:28px;line-height:1.3;font-weight:800;color:#FFFFFF;">' + titleHtml + '</h1>'
      + '<p style="margin:16px 0 0;font-size:14px;line-height:1.9;color:#E9E3D8;">' + leadHtml + '</p></section>'
      + filmHoles(p, 16) + '</section>';
  }

  function creativeBrief(article, p) {
    var items = article.sections.slice(0, 4).map(function (section) { return section.title; });
    if (!items.length) return '';
    if (p.brief === 'gazette-index') {
      return '<section style="margin:0 0 30px;border-bottom:1px solid ' + p.ink + ';">'
        + '<p style="margin:0 0 8px;font-size:10px;font-weight:900;letter-spacing:.3em;color:' + p.accent + ';">' + text('本期要目') + '</p>'
        + items.map(function (item, index) {
          return '<section style="display:flex;gap:12px;padding:8px 0;border-top:1px solid ' + p.line + ';"><span style="flex:none;font-family:STSong,SimSun,serif;font-size:12px;font-weight:900;color:' + p.ink + ';">' + text('第' + ZH_NUM[index] + '版') + '</span><span style="font-family:STSong,SimSun,serif;font-size:13px;color:' + p.ink + ';">' + text(item) + '</span></section>';
        }).join('') + '</section>';
    }
    if (p.brief === 'pixel-quest') {
      return '<section style="margin:0 0 30px;padding:12px 14px;border:2px solid ' + p.ink + ';background:' + p.paper + ';">'
        + '<p style="margin:0 0 8px;font-family:Menlo,Consolas,monospace;font-size:10px;font-weight:900;color:' + p.ink + ';">' + text('★ QUEST LOG 任务清单') + '</p>'
        + items.map(function (item, index) {
          return '<p style="margin:6px 0 0;font-size:13px;line-height:1.6;color:' + p.ink + ';"><span style="display:inline-block;width:12px;height:12px;margin-right:8px;border:2px solid ' + p.ink + ';background:' + (index === 0 ? p.accent2 : p.paper) + ';box-sizing:border-box;vertical-align:-1px;"></span>' + text('STAGE ' + (index + 1) + ' · ' + item) + '</p>';
        }).join('') + '</section>';
    }
    if (p.brief === 'film-frames') {
      return '<section style="display:flex;gap:6px;margin:0 0 30px;">' + items.map(function (item, index) {
        return '<section style="flex:1;min-width:0;padding:10px 8px;border:1px solid ' + p.line + ';border-top:3px solid ' + p.accent + ';background:' + p.surface + ';">'
          + '<p style="margin:0 0 6px;font-family:Menlo,Consolas,monospace;font-size:9px;color:' + p.accent + ';">' + text('SCENE ' + (index + 1)) + '</p>'
          + '<p style="margin:0;font-size:12px;line-height:1.55;color:' + p.ink + ';">' + text(item) + '</p></section>';
      }).join('') + '</section>';
    }
    return '<section style="margin:0 0 32px;text-align:center;">'
      + '<p style="margin:0 0 10px;font-size:10px;letter-spacing:.4em;color:' + p.accent + ';">' + text('卷 目') + '</p>'
      + items.map(function (item, index) {
        return '<p style="margin:6px 0 0;font-family:STKaiti,KaiTi,serif;font-size:14px;line-height:1.7;color:' + p.ink + ';">' + text(ZH_NUM[index] + '　' + item) + '</p>';
      }).join('') + '</section>';
  }

  function creativeSection(index, section, p) {
    var n = index + 1;
    var nn = n < 10 ? '0' + n : String(n);
    if (p.section === 'ink-numeral') {
      return '<section style="margin:42px 0 20px;text-align:center;">'
        + '<p style="margin:0;font-family:STKaiti,KaiTi,serif;font-size:30px;line-height:1.2;color:' + p.accent + ';">' + text(ZH_NUM[index % 10]) + '</p>'
        + '<h2 style="margin:8px 0 0;font-family:STKaiti,KaiTi,STSong,serif;font-size:20px;line-height:1.45;font-weight:700;color:' + p.ink + ';">' + text(section.title) + '</h2>'
        + '<section style="display:flex;align-items:center;justify-content:center;margin:12px 0 0;"><span style="width:48px;height:1px;background:' + p.accent2 + ';"></span><span style="width:6px;height:6px;margin:0 8px;background:' + p.accent + ';"></span><span style="width:48px;height:1px;background:' + p.accent2 + ';"></span></section></section>';
    }
    if (p.section === 'gazette-rule') {
      return '<section style="margin:38px 0 18px;">'
        + '<section style="border-top:3px double ' + p.ink + ';"></section>'
        + '<p style="margin:8px 0 4px;font-size:9px;font-weight:900;letter-spacing:.3em;color:' + p.accent + ';">' + text('第' + ZH_NUM[index % 10] + '版 · SECTION ' + nn) + '</p>'
        + '<h2 style="margin:0;padding-bottom:8px;border-bottom:1px solid ' + p.ink + ';font-family:STSong,SimSun,serif;font-size:21px;line-height:1.35;font-weight:900;color:' + p.ink + ';">' + text(section.title) + '</h2></section>';
    }
    if (p.section === 'pixel-level') {
      return '<section style="margin:36px 0 18px;">'
        + '<p style="margin:0;display:inline-block;padding:4px 10px;background:' + p.ink + ';font-family:Menlo,Consolas,monospace;font-size:11px;font-weight:900;color:' + p.accent2 + ';">' + text('STAGE ' + nn) + '</p>'
        + '<h2 style="margin:0;padding:10px 12px;border:2px solid ' + p.ink + ';background:' + p.accent + ';font-size:18px;line-height:1.4;font-weight:900;color:#FFFFFF;">' + text(section.title) + '</h2></section>';
    }
    /* scene-slate */
    var stripes = '';
    for (var i = 0; i < 8; i++) stripes += '<span style="display:inline-block;width:12.5%;height:8px;background:' + (i % 2 ? p.paper : p.accent2) + ';"></span>';
    return '<section style="margin:38px 0 18px;border:1px solid ' + p.accent2 + ';border-radius:' + p.radius + 'px;overflow:hidden;">'
      + '<p style="margin:0;font-size:0;line-height:8px;white-space:nowrap;">' + stripes + '</p>'
      + '<section style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:' + p.surface + ';">'
      + '<span style="flex:none;font-family:Menlo,Consolas,monospace;font-size:10px;font-weight:800;color:' + p.accent + ';">' + text('SCENE ' + nn) + '</span>'
      + '<h2 style="margin:0;font-family:STSong,SimSun,serif;font-size:18px;line-height:1.4;font-weight:800;color:' + p.ink + ';">' + text(section.title) + '</h2></section></section>';
  }

  function creativeQuote(token, p) {
    if (p.quote === 'pull-quote') {
      return '<section data-advanced-effect="quote" style="margin:22px 8px 24px;padding:14px 4px;border-top:3px double ' + p.ink + ';border-bottom:3px double ' + p.ink + ';text-align:center;">'
        + '<p style="margin:0;font-family:STSong,SimSun,serif;font-size:16px;line-height:1.75;font-weight:800;color:' + p.accent + ';">' + text('“' + token.text + '”') + '</p></section>';
    }
    if (p.quote === 'dialog-box') {
      return '<section data-advanced-effect="quote" style="margin:20px 0 24px;padding:12px 14px;border:2px solid ' + p.ink + ';background:' + p.paper + ';">'
        + '<p style="margin:0 0 6px;font-family:Menlo,Consolas,monospace;font-size:10px;font-weight:900;color:' + p.accent + ';">' + text('NPC ▸') + '</p>'
        + '<p style="margin:0;font-size:13.5px;line-height:1.8;font-weight:700;color:' + p.ink + ';">' + text(token.text) + '</p>'
        + '<p style="margin:4px 0 0;text-align:right;font-size:10px;color:' + p.accent + ';">' + text('▼') + '</p></section>';
    }
    if (p.quote === 'subtitle') {
      return '<section data-advanced-effect="quote" style="margin:20px 0 24px;padding:14px 16px;background:' + p.accent2 + ';border-radius:' + p.radius + 'px;text-align:center;">'
        + '<p style="margin:0;font-size:14px;line-height:1.8;font-weight:700;color:#FFFFFF;">' + text(token.text) + '</p>'
        + '<p style="margin:6px 0 0;font-size:9px;letter-spacing:.3em;color:' + p.accent + ';">' + text('— SUBTITLE —') + '</p></section>';
    }
    return '<section data-advanced-effect="quote" style="margin:22px 0 24px;padding:6px 0 6px 16px;border-left:2px solid ' + p.accent + ';">'
      + '<p style="margin:0;font-family:STKaiti,KaiTi,serif;font-size:15px;line-height:1.95;color:' + p.ink + ';">' + text('「' + token.text + '」') + '</p></section>';
  }

  function creativeFinish(article, p) {
    if (p.finish === 'gazette-end') {
      return '<section style="margin-top:40px;text-align:center;"><section style="border-top:1px solid ' + p.ink + ';border-bottom:3px double ' + p.ink + ';padding:10px 0;">'
        + '<p style="margin:0;font-family:STSong,SimSun,serif;font-size:13px;font-weight:900;letter-spacing:.4em;color:' + p.ink + ';">' + text('— 本期完 —') + '</p>'
        + '<p style="margin:4px 0 0;font-size:9px;letter-spacing:.2em;color:' + p.muted + ';">' + text('THE DAILY GAZETTE · 欢迎订阅下一期') + '</p></section></section>';
    }
    if (p.finish === 'game-clear') {
      return '<section style="margin-top:40px;padding:16px;border:2px solid ' + p.ink + ';background:' + p.accent + ';text-align:center;">'
        + '<p style="margin:0;font-family:Menlo,Consolas,monospace;font-size:18px;font-weight:900;letter-spacing:.1em;color:' + p.accent2 + ';">' + text('★ GAME CLEAR ★') + '</p>'
        + '<p style="margin:6px 0 0;font-size:11px;color:#FFFFFF;">' + text('通关！点赞即可保存进度') + '</p></section>';
    }
    if (p.finish === 'the-end') {
      return '<section style="margin-top:40px;background:' + p.accent2 + ';border-radius:' + p.radius + 'px;overflow:hidden;">' + filmHoles(p, 16)
        + '<section style="padding:18px;text-align:center;"><p style="margin:0;font-family:STSong,SimSun,serif;font-size:20px;letter-spacing:.3em;color:#FFFFFF;">' + text('THE END') + '</p>'
        + '<p style="margin:6px 0 0;font-size:10px;letter-spacing:.2em;color:' + p.accent + ';">' + text('感谢观影 · 胶片影志') + '</p></section>' + filmHoles(p, 16) + '</section>';
    }
    return '<section style="margin-top:42px;text-align:center;">'
      + '<p style="margin:0;display:inline-block;padding:8px 10px;border:2px solid ' + p.accent + ';font-family:STKaiti,KaiTi,serif;font-size:16px;line-height:1.2;font-weight:700;color:' + p.accent + ';">' + text('完') + '</p>'
      + '<p style="margin:10px 0 0;font-size:10px;letter-spacing:.4em;color:' + p.muted + ';">' + text('水墨长卷 · 感谢阅读') + '</p></section>';
  }

  function header(article, p, spec) {
    if (p.creative) return creativeHeader(article, p, spec);
    var titleHtml = text(article.title);
    var leadHtml = inline(article.leadRaw, spec);
    var nameHtml = text(p.name);
    var kind = p.header;
    if (kind === 'masthead') {
      return '<section style="border-top:7px solid ' + p.accent + ';padding:16px 0 28px;">'
        + '<p style="margin:0 0 36px;font-size:10px;letter-spacing:.22em;color:' + p.muted + ';">' + text('EDITORIAL / ') + nameHtml + '</p>'
        + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:28px;line-height:1.22;font-weight:900;color:' + p.ink + ';">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid ' + p.line + ';font-size:14px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'luxury-rule') {
      return '<section style="padding:30px 10px 34px;text-align:center;border-top:1px solid ' + p.accent + ';border-bottom:1px solid ' + p.accent + ';">'
        + '<p style="margin:0 0 20px;font-size:9px;letter-spacing:.35em;color:' + p.accent + ';">' + nameHtml + '</p>'
        + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:26px;line-height:1.35;font-weight:600;color:' + p.ink + ';">' + titleHtml + '</h1>'
        + '<p style="max-width:580px;margin:22px auto 0;font-size:14px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'zine-block') {
      return '<section style="padding:0 0 30px;"><section style="display:inline-block;padding:8px 14px;background:' + p.accent + ';color:' + p.accentOn + ';font-size:10px;font-weight:800;letter-spacing:.12em;">' + nameHtml + '</section>'
        + '<h1 style="margin:18px 0 0;font-size:29px;line-height:1.16;font-weight:900;color:' + p.ink + ';">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding:18px 20px;background:' + p.surface + ';border-radius:18px;font-size:14px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'split-grid') {
      return '<section style="border:2px solid ' + p.ink + ';"><section style="display:flex;align-items:stretch;">'
        + '<section style="width:24%;padding:18px 10px;background:' + p.accent2 + ';border-right:2px solid ' + p.ink + ';box-sizing:border-box;">'
        + '<p style="margin:0;font-size:10px;font-weight:900;">' + text('NO. 01') + '</p><p style="margin:42px 0 0;font-size:9px;line-height:1.5;">' + nameHtml + '</p></section>'
        + '<section style="width:76%;padding:20px;box-sizing:border-box;"><h1 style="margin:0;font-size:26px;line-height:1.15;font-weight:950;">' + titleHtml + '</h1></section></section>'
        + '<p style="margin:0;padding:16px 18px;border-top:2px solid ' + p.ink + ';font-size:14px;line-height:1.8;">' + leadHtml + '</p></section>';
    }
    if (kind === 'report-strip') {
      return '<section style="padding:0 0 26px;"><section style="height:12px;background:' + p.accent + ';border-bottom:3px solid ' + p.ink + ';"></section>'
        + '<p style="margin:16px 0 12px;font-size:10px;font-weight:900;letter-spacing:.16em;">' + text('REPORT / ') + nameHtml + '</p>'
        + '<h1 style="margin:0;font-size:27px;line-height:1.2;font-weight:900;">' + titleHtml + '</h1>'
        + '<p style="margin:18px 0 0;padding:14px 0;border-top:1px solid ' + p.line + ';border-bottom:1px solid ' + p.line + ';font-size:14px;line-height:1.85;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'technical-plate') {
      return '<section style="padding:18px;border:1px solid ' + p.accent + ';background:' + p.surface + ';">'
        + '<p style="margin:0 0 12px;font-family:Consolas,monospace;font-size:9px;letter-spacing:.12em;color:' + p.accent + ';">' + text('DOC-001 / ') + nameHtml + '</p>'
        + '<h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:850;">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding:14px;border:1px solid ' + p.line + ';font-size:14px;line-height:1.85;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'vertical-seal') {
      return '<section style="display:flex;gap:18px;padding:14px 0 32px;border-bottom:1px solid ' + p.line + ';">'
        + '<section style="width:34px;flex:none;padding:12px 6px;background:' + p.accent + ';color:' + p.accentOn + ';text-align:center;font-size:10px;line-height:1.45;box-sizing:border-box;">' + raw('静<br/>态<br/>刊<br/>读') + '</section>'
        + '<section><p style="margin:0 0 12px;font-size:10px;color:' + p.muted + ';">' + nameHtml + '</p>'
        + '<h1 style="margin:0;font-family:STKaiti,KaiTi,serif;font-size:28px;line-height:1.35;font-weight:700;">' + titleHtml + '</h1>'
        + '<p style="margin:18px 0 0;font-size:14px;line-height:1.95;color:' + p.muted + ';">' + leadHtml + '</p></section></section>';
    }
    if (kind === 'field-note') {
      return '<section style="padding:22px;border:1px solid ' + p.line + ';border-radius:14px;background:' + p.surface + ';">'
        + '<section style="display:flex;justify-content:space-between;align-items:center;"><p style="margin:0;font-size:9px;letter-spacing:.14em;color:' + p.accent + ';">' + text('FIELD NOTE 01') + '</p><span style="width:12px;height:12px;border-radius:50%;background:' + p.accent2 + ';"></span></section>'
        + '<h1 style="margin:24px 0 0;font-family:STSong,SimSun,serif;font-size:26px;line-height:1.3;">' + titleHtml + '</h1>'
        + '<p style="margin:18px 0 0;font-size:14px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'soft-arch') {
      return '<section style="padding:28px 22px 24px;border-radius:60px 60px 24px 24px;background:' + p.surface + ';text-align:center;">'
        + '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + p.accent + ';"></span><p style="margin:10px 0 18px;font-size:9px;letter-spacing:.18em;color:' + p.muted + ';">' + nameHtml + '</p>'
        + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:26px;line-height:1.35;">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;font-size:14px;line-height:1.9;color:' + p.muted + ';text-align:left;">' + leadHtml + '</p></section>';
    }
    if (kind === 'terminal-log') {
      return '<section style="padding:22px;border:1px solid ' + p.line + ';border-radius:8px;background:' + p.surface + ';">'
        + '<p style="margin:0 0 18px;font-family:Consolas,monospace;font-size:10px;color:' + p.accent + ';">' + text('$ open /article/') + nameHtml + '</p>'
        + '<h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;color:' + p.ink + ';">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding-left:14px;border-left:2px solid ' + p.accent2 + ';font-size:14px;line-height:1.85;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'research-card') {
      return '<section style="padding:24px;border:1px solid ' + p.line + ';border-radius:12px;background:' + p.surface + ';">'
        + '<p style="margin:0 0 18px;font-size:9px;font-weight:800;letter-spacing:.16em;color:' + p.accent + ';">' + text('RESEARCH ABSTRACT') + '</p>'
        + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:26px;line-height:1.35;font-weight:700;">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid ' + p.line + ';font-size:14px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'studio-board') {
      return '<section style="padding:10px 10px 10px 0;background:' + p.accent2 + ';border-radius:16px;"><section style="padding:24px;background:' + p.surface + ';border:1px solid ' + p.ink + ';border-radius:16px;">'
        + '<p style="margin:0 0 14px;font-size:9px;font-weight:800;letter-spacing:.18em;color:' + p.accent + ';">' + text('STUDIO BOARD / ') + nameHtml + '</p>'
        + '<h1 style="margin:0;font-size:27px;line-height:1.2;font-weight:880;">' + titleHtml + '</h1>'
        + '<p style="margin:18px 0 0;font-size:14px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section></section>';
    }
    if (kind === 'brutal-poster') {
      return '<section style="padding:0 9px 9px 0;background:' + p.accent + ';"><section style="padding:20px;background:' + p.surface + ';border:3px solid ' + p.ink + ';">'
        + '<p style="display:inline-block;margin:0 0 18px;padding:5px 8px;background:' + p.accent2 + ';border:2px solid ' + p.ink + ';font-size:9px;font-weight:950;">' + nameHtml + '</p>'
        + '<h1 style="margin:0;font-size:29px;line-height:1.08;font-weight:950;text-transform:uppercase;">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding-top:15px;border-top:3px solid ' + p.ink + ';font-size:14px;line-height:1.75;font-weight:650;">' + leadHtml + '</p></section></section>';
    }
    if (kind === 'night-cover') {
      return '<section style="padding:24px 22px;background:' + p.surface + ';border-left:8px solid ' + p.accent + ';">'
        + '<p style="margin:0 0 24px;font-size:9px;letter-spacing:.25em;color:' + p.accent2 + ';">' + text('NIGHT EDITION / ') + nameHtml + '</p>'
        + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:28px;line-height:1.2;color:' + surfaceInk(p) + ';">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding-top:18px;border-top:1px solid #4A4741;font-size:14px;line-height:1.9;color:' + surfaceMuted(p) + ';">' + leadHtml + '</p></section>';
    }
    return '<section style="padding:0 0 28px;"><span style="display:inline-block;padding:7px 12px;background:' + p.accent + ';color:' + p.accentOn + ';font-size:9px;font-weight:800;">' + text('ARCHIVE 001') + '</span>'
      + '<section style="margin-top:0;padding:24px 20px;border:1px solid ' + p.line + ';background:' + p.surface + ';"><p style="margin:0 0 14px;font-family:Consolas,monospace;font-size:9px;color:' + p.muted + ';">' + text('CATALOG / ') + nameHtml + '</p>'
      + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:26px;line-height:1.3;">' + titleHtml + '</h1><p style="margin:18px 0 0;font-size:14px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section></section>';
  }

  function brief(article, p) {
    if (p.creative) return creativeBrief(article, p);
    var items = article.sections.slice(0, 3).map(function (section) { return section.title; });
    while (items.length < 3) items.push('延伸思考');
    if (['columns', 'number-grid', 'metric-row', 'tile-grid', 'status-grid'].indexOf(p.brief) !== -1) {
      var cells = items.map(function (item, index) {
        return '<section style="flex:1;min-width:0;padding:14px 10px;border:' + p.border + 'px solid ' + p.line + ';background:' + p.surface + ';">'
          + '<p style="margin:0 0 8px;font-size:9px;font-weight:850;color:' + p.accent + ';">' + text('0' + (index + 1)) + '</p>'
          + '<p style="margin:0;font-size:12px;line-height:1.55;color:' + surfaceInk(p) + ';">' + text(item) + '</p></section>';
      }).join('');
      return '<section style="display:flex;gap:8px;margin:26px 0 32px;">' + cells + '</section>';
    }
    if (['ledger', 'spec-list', 'quiet-list', 'dark-ledger'].indexOf(p.brief) !== -1) {
      var rows = items.map(function (item, index) {
        return '<section style="display:flex;gap:14px;padding:11px 0;border-bottom:1px solid ' + p.line + ';"><span style="font-size:10px;color:' + p.accent + ';">' + text('0' + (index + 1)) + '</span><span style="font-size:12px;color:' + surfaceInk(p) + ';">' + text(item) + '</span></section>';
      }).join('');
      return '<section style="margin:26px 0 34px;padding:4px 16px;border-left:3px solid ' + p.accent + ';background:' + p.surface + ';">' + rows + '</section>';
    }
    return '<section style="margin:26px 0 34px;">' + items.map(function (item, index) {
      return '<p style="margin:' + (index === 0 ? 0 : 8) + 'px 0 0;padding:12px 16px;border-radius:' + p.radius + 'px;background:' + p.surface + ';font-size:12px;line-height:1.6;color:' + surfaceInk(p) + ';"><strong style="color:' + p.accent + ';">' + text('0' + (index + 1)) + '</strong>' + text('　' + item) + '</p>';
    }).join('') + '</section>';
  }

  function sectionHeading(index, section, p) {
    if (p.creative) return creativeSection(index, section, p);
    var n = index + 1;
    var kind = p.section;
    if (['rule-number', 'roman', 'orange-rule', 'marker-line'].indexOf(kind) !== -1) {
      var romans = ['I', 'II', 'III', 'IV', 'V'];
      var label = kind === 'roman' && index < romans.length ? romans[index] : (n < 10 ? '0' + n : String(n));
      var family = ['rule-number', 'roman'].indexOf(kind) !== -1 ? 'STSong,SimSun,serif' : 'inherit';
      return '<section style="margin:38px 0 18px;padding-top:13px;border-top:' + (kind === 'orange-rule' ? 2 : 1) + 'px solid ' + p.accent + ';">'
        + '<p style="margin:0 0 6px;font-size:9px;font-weight:850;letter-spacing:.16em;color:' + p.accent + ';">' + text(label) + '</p>'
        + '<h2 style="margin:0;font-family:' + family + ';font-size:19px;line-height:1.4;color:' + p.ink + ';">' + text(section.title) + '</h2></section>';
    }
    if (['block-index', 'boxed-number'].indexOf(kind) !== -1) {
      return '<section style="display:flex;align-items:center;gap:12px;margin:34px 0 17px;"><span style="padding:6px 9px;background:' + p.accent + ';border:' + p.border + 'px solid ' + p.ink + ';color:' + p.accentOn + ';font-size:11px;font-weight:900;">' + text(n < 10 ? '0' + n : String(n)) + '</span><h2 style="margin:0;font-size:19px;line-height:1.35;">' + text(section.title) + '</h2></section>';
    }
    if (['chapter-seal', 'leaf-index', 'rounded-tab', 'pill-index'].indexOf(kind) !== -1) {
      var radius = ['rounded-tab', 'pill-index'].indexOf(kind) !== -1 ? 999 : p.radius;
      return '<section style="margin:36px 0 18px;"><span style="display:inline-block;padding:5px 11px;border-radius:' + radius + 'px;background:' + p.accent + ';color:' + p.accentOn + ';font-size:9px;letter-spacing:.1em;">' + text('第 ' + n + ' 章') + '</span><h2 style="margin:12px 0 0;font-family:STSong,SimSun,serif;font-size:19px;line-height:1.4;">' + text(section.title) + '</h2></section>';
    }
    if (['command-line', 'side-code', 'coordinate', 'figure-index'].indexOf(kind) !== -1) {
      var prefix = kind === 'command-line' ? '>' : (kind === 'figure-index' ? 'FIG.' : '#');
      return '<section style="margin:34px 0 17px;padding-left:14px;border-left:3px solid ' + p.accent + ';"><p style="margin:0 0 5px;font-family:Consolas,monospace;font-size:9px;color:' + p.accent + ';">' + text(prefix + ' ' + (n < 10 ? '0' + n : n)) + '</p><h2 style="margin:0;font-size:18px;line-height:1.4;">' + text(section.title) + '</h2></section>';
    }
    return '<section style="margin:36px 0 18px;border-bottom:1px solid ' + p.line + ';"><span style="display:inline-block;padding:7px 12px;background:' + p.accent2 + ';font-size:9px;color:' + p.ink + ';">' + text('FILE ' + (n < 10 ? '0' + n : n)) + '</span><h2 style="margin:12px 0 10px;font-family:STSong,SimSun,serif;font-size:19px;">' + text(section.title) + '</h2></section>';
  }

  function buildAdvancedSubsection(token, p) {
    return '<section data-advanced-effect="subsection" style="display:flex;align-items:center;margin:27px 0 14px;">'
      + '<span style="display:block;width:3px;height:16px;margin-right:10px;border-radius:2px;background:' + p.accent + ';"></span>'
      + '<span style="font-size:14.5px;line-height:1.45;font-weight:750;color:' + p.ink + ';">'
      + text(token.text) + '</span></section>';
  }

  function buildAdvancedQuote(token, p) {
    if (p.creative) return creativeQuote(token, p);
    if (['oversize', 'centered', 'ink-quote', 'spotlight'].indexOf(p.quote) !== -1) {
      return '<section data-advanced-effect="quote" style="margin:20px 0 23px;padding:16px 10px;'
        + 'border-top:1px solid ' + p.accent + ';border-bottom:1px solid ' + p.accent + ';text-align:center;">'
        + '<p style="margin:0;font-family:STSong,SimSun,serif;font-size:14.5px;line-height:1.78;font-weight:650;color:'
        + p.ink + ';">' + text('“' + token.text + '”') + '</p></section>';
    }
    return '<section data-advanced-effect="quote" style="margin:18px 0 23px;padding:13px 15px;'
      + 'border:' + p.border + 'px solid ' + p.line + ';border-left:2px solid ' + p.accent
      + ';border-radius:' + p.radius + 'px;background:' + p.surface + ';">'
      + '<p style="margin:0;font-size:13px;line-height:1.82;font-weight:620;color:' + surfaceInk(p) + ';">'
      + text(token.text) + '</p></section>';
  }

  function buildAdvancedList(token, p, spec) {
    var kind = token.ordered ? 'ordered' : 'unordered';
    var h = '<section data-advanced-effect="list" data-list-kind="' + kind + '" style="margin:18px 0 24px;'
      + 'padding:14px 15px;border:1px solid ' + p.line + ';border-radius:' + p.radius + 'px;background:' + p.surface + ';">'
      + '<p style="margin:0 0 8px;font-size:7.5px;line-height:1.4;letter-spacing:.15em;font-weight:750;color:'
      + p.accent2 + ';">' + text(token.ordered ? 'ORDERED / 步骤列表' : 'UNORDERED / 要点列表') + '</p>';
    token.items.forEach(function (item, index) {
      h += '<section style="display:flex;gap:9px;padding:8px 0;'
        + (index ? 'border-top:1px solid ' + p.line + ';' : '') + '">'
        + '<span style="flex:0 0 20px;font-size:8.5px;line-height:1.85;color:' + p.accent + ';font-weight:800;">'
        + text(token.ordered ? ('0' + (index + 1)) : '—') + '</span>'
        + '<span style="min-width:0;font-size:13px;line-height:1.85;color:' + p.ink + ';text-wrap:pretty;overflow-wrap:anywhere;">'
        + inline(item, spec) + '</span></section>';
    });
    return h + '</section>';
  }

  function buildAdvancedCode(token, p) {
    var h = '<section data-advanced-effect="code" style="margin:22px 0 26px;padding:13px 15px 15px;'
      + 'border:1px solid ' + p.line + ';border-radius:' + p.radius + 'px;background:' + p.surface + ';">'
      + '<section style="display:flex;align-items:center;margin-bottom:10px;">'
      + Shared.trafficLightsHtml(8, 6, '50%')
      + '<span style="margin-left:10px;font-size:7.5px;letter-spacing:.12em;color:' + surfaceMuted(p)
      + ';font-family:Menlo,Consolas,monospace;">' + text(String(token.lang || 'code').toUpperCase()) + '</span></section>'
      + '<section style="font-size:11.5px;line-height:1.72;color:' + surfaceInk(p)
      + ';font-family:Menlo,Consolas,\'Courier New\',monospace;overflow-wrap:anywhere;">';
    token.lines.forEach(function (line) {
      h += '<p style="margin:0;white-space:pre-wrap;">' + raw(esc(line || '') || '&nbsp;') + '</p>';
    });
    return h + '</section></section>';
  }

  var placeholderRatio = Shared.placeholderRatio;

  function genericPlaceholderMotif(p) {
    return '<section aria-hidden="true" data-placeholder-motif="fallback" style="width:100%;display:flex;align-items:center;">'
      + '<span style="flex:1;height:1px;background:' + p.line + ';"></span>'
      + '<span style="box-sizing:border-box;width:30px;height:30px;margin:0 11px;border:1px solid ' + p.accent
      + ';border-radius:' + (p.radius > 8 ? '50%' : Math.max(0, p.radius) + 'px') + ';background:' + p.surface + ';"></span>'
      + '<span style="width:8px;height:8px;margin-left:-22px;margin-right:11px;border-radius:50%;background:' + p.accent2 + ';"></span>'
      + '<span style="flex:1;height:1px;background:' + p.line + ';"></span></section>';
  }

  function buildAdvancedPlaceholder(token, p, ratio, motifSvg) {
    var themeName = p.name || '黑白极简';
    var styleId = p.styleId || 'minimal-mono';
    var motif = motifSvg
      ? '<section data-placeholder-motif="template" style="width:100%;">' + motifSvg + '</section>'
      : genericPlaceholderMotif(p);
    return '<figure data-advanced-effect="image" data-image-kind="theme-placeholder" data-placeholder-theme="'
      + esc(styleId) + '" data-placeholder-ratio="' + ratio.label + '" style="margin:20px auto 24px;width:'
      + ratio.width + ';text-align:center;">'
      + '<section data-placeholder-canvas="true" style="box-sizing:border-box;width:100%;aspect-ratio:' + ratio.css
      + ';min-height:132px;display:flex;flex-direction:column;justify-content:center;align-items:center;overflow:hidden;'
      + 'padding:18px 16px;border:1px solid ' + p.line + ';border-radius:' + p.radius + 'px;background:' + p.surface + ';">'
      + '<section aria-hidden="true" style="width:48%;max-width:150px;margin:0 0 13px;">' + motif + '</section>'
      + '<p style="margin:0;font-size:7.5px;line-height:1.45;letter-spacing:.16em;font-weight:750;color:' + p.accent2 + ';">'
      + text('VISUAL SLOT / ' + ratio.label) + '</p>'
      + '<p style="margin:7px 0 0;font-size:12px;line-height:1.65;font-weight:700;color:' + surfaceInk(p) + ';">'
      + text(themeName + ' · 图片待补充') + '</p></section>'
      + (token.alt ? '<figcaption style="margin:6px 1px 0;font-size:9.5px;line-height:1.65;letter-spacing:.02em;color:'
        + p.muted + ';text-align:left;">' + text(token.alt) + '</figcaption>' : '')
      + '</figure>';
  }

  function buildAdvancedImage(token, p, motifSvg) {
    var ratio = placeholderRatio(token.src);
    if (ratio) return buildAdvancedPlaceholder(token, p, ratio, motifSvg);
    return '<figure data-advanced-effect="image" style="margin:20px auto 24px;width:100%;text-align:center;">'
      + '<img src="' + esc(token.src) + '" alt="' + esc(token.alt || '') + '" style="display:block;width:100%;max-width:100%;'
      + 'height:auto;margin:0 auto;border:1px solid ' + p.line + ';border-radius:' + p.radius + 'px;background:' + p.surface + ';">'
      + (token.alt ? '<figcaption style="margin:6px 1px 0;font-size:9.5px;line-height:1.65;letter-spacing:.02em;color:'
        + p.muted + ';text-align:left;">' + text(token.alt) + '</figcaption>' : '')
      + '</figure>';
  }

  function buildAdvancedTable(token, p) {
    var h = '<section data-advanced-effect="table" style="margin:22px 0 28px;overflow-x:auto;">'
      + '<table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:11.5px;">'
      + '<thead><tr>';
    for (var c = 0; c < token.head.length; c++) {
      h += '<th style="padding:9px 8px;background:' + p.surface + ';color:' + p.accent
        + ';border:1px solid ' + p.line + ';border-top:2px solid ' + p.accent
        + ';text-align:left;font-size:10.5px;font-weight:750;line-height:1.55;overflow-wrap:anywhere;">'
        + text(token.head[c]) + '</th>';
    }
    h += '</tr></thead><tbody>';
    for (var r = 0; r < token.rows.length; r++) {
      h += '<tr>';
      for (var d = 0; d < token.rows[r].length; d++) {
        h += '<td style="padding:9px 8px;background:' + (r % 2 ? p.surface : p.paper)
          + ';color:' + p.ink + ';border:1px solid ' + p.line
          + ';line-height:1.7;overflow-wrap:anywhere;">' + text(token.rows[r][d]) + '</td>';
      }
      h += '</tr>';
    }
    return h + '</tbody></table></section>';
  }

  function buildAdvancedDivider(p) {
    return '<section data-advanced-effect="divider" style="display:flex;align-items:center;margin:28px 0;">'
      + '<span style="flex:1;height:1px;background:' + p.line + ';"></span>'
      + '<span style="width:5px;height:5px;margin:0 12px;border-radius:50%;background:' + p.accent + ';"></span>'
      + '<span style="flex:1;height:1px;background:' + p.line + ';"></span></section>';
  }

  function bodyBlock(token, p, spec, motifSvg) {
    if (token.type === 'quote') return buildAdvancedQuote(token, p);
    if (token.type === 'list') return buildAdvancedList(token, p, spec);
    if (token.type === 'para') {
      return '<p style="margin:0 0 15px;font-size:13px;line-height:1.86;letter-spacing:.015em;color:' + p.ink
        + ';text-wrap:pretty;overflow-wrap:anywhere;">' + inline(token.raw, spec) + '</p>';
    }
    if (token.type === 'subsection') return buildAdvancedSubsection(token, p);
    if (token.type === 'code') return buildAdvancedCode(token, p);
    if (token.type === 'image') return buildAdvancedImage(token, p, motifSvg);
    if (token.type === 'table') return buildAdvancedTable(token, p);
    if (token.type === 'divider') return buildAdvancedDivider(p);
    return '';
  }

  function finish(article, p) {
    if (p.creative) return creativeFinish(article, p);
    var endTitle = article.sections.length ? article.sections[article.sections.length - 1].title : '继续前行';
    if (['black-bar', 'color-band', 'report-end'].indexOf(p.finish) !== -1) {
      return '<section style="margin-top:38px;padding:18px;background:' + p.accent + ';color:' + p.accentOn + ';"><p style="margin:0;font-size:10px;letter-spacing:.14em;">' + text('END / ' + p.name) + '</p><p style="margin:8px 0 0;font-size:15px;font-weight:800;">' + text(endTitle) + '</p></section>';
    }
    if (['red-seal', 'soft-dot', 'square-mark', 'cursor'].indexOf(p.finish) !== -1) {
      return '<section style="margin-top:38px;text-align:center;"><span style="display:inline-block;width:16px;height:16px;border-radius:' + (p.finish === 'soft-dot' ? '50%' : '0') + ';background:' + p.accent + ';"></span><p style="margin:12px 0 0;font-size:10px;letter-spacing:.16em;color:' + p.muted + ';">' + text('感谢阅读 · ' + p.name) + '</p></section>';
    }
    return '<section style="margin-top:38px;padding-top:16px;border-top:1px solid ' + p.accent + ';"><p style="margin:0;font-size:10px;letter-spacing:.14em;color:' + p.muted + ';">' + text(p.name + ' / ARTICLE END') + '</p></section>';
  }

  function buildAdvancedSignature(p, t) {
    var h = '<section data-advanced-effect="signature" style="margin:36px 0 14px;padding:18px 20px;'
      + 'background:' + p.surface + ';border:1px solid ' + p.line + ';border-top:2px solid ' + p.accent
      + ';border-radius:' + p.radius + 'px;">'
      + '<p style="margin:0;font-size:8px;letter-spacing:.18em;color:' + p.accent2 + ';font-weight:750;">'
      + text('ABOUT · 作者') + '</p>';
    if (t.author) {
      h += '<p style="margin:10px 0 0;font-size:12.5px;line-height:1.9;color:' + p.ink + ';">'
        + text('我是 ') + '<strong style="color:' + p.accent + ';font-weight:750;">' + text(t.author) + '</strong>'
        + text('，' + (t.intro || '持续分享一线实践与长期观察')) + '</p>';
    } else if (t.intro) {
      h += '<p style="margin:10px 0 0;font-size:12.5px;line-height:1.9;color:' + p.ink + ';">'
        + text(t.intro) + '</p>';
    }
    h += '<p style="margin:' + (t.author || t.intro ? '7px' : '10px') + ' 0 0;font-size:12.5px;line-height:1.9;color:' + p.ink + ';">'
      + text('如果觉得今天这篇有收获，欢迎')
      + '<strong style="color:' + p.accent + ';font-weight:750;">' + text('点赞、在看、转发') + '</strong>'
      + text('三连，我们下篇见') + '</p>';
    return h + '</section>';
  }

  function signature(article, opt, spec, p) {
    var token = article.signature || {};
    var author = token.author || opt.author || '';
    if (!author && !token.intro) return '';
    return buildAdvancedSignature(p, { author: author, intro: token.intro || '' });
  }

  function renderStatic(article, p, spec, levelId) {
    var parts = [header(article, p, spec), brief(article, p)];
    article.intro.forEach(function (token) { parts.push(bodyBlock(token, p, spec)); });
    article.sections.forEach(function (section, index) {
      parts.push(sectionHeading(index, section, p));
      section.items.forEach(function (token) { parts.push(bodyBlock(token, p, spec)); });
    });
    parts.push(finish(article, p));
    return shell(p, levelId, parts.join('\n'));
  }

  function minimalBody(token, spec) {
    if (token.type === 'quote') return '<section style="margin:24px 0;padding:18px 0;border-top:1px solid #111111;border-bottom:1px solid #111111;"><p style="margin:0;font-family:STSong,SimSun,serif;font-size:17px;line-height:1.75;color:#111111;">' + text(token.text) + '</p></section>';
    if (token.type === 'list') return token.items.map(function (item, index) { return '<p style="margin:8px 0;font-size:14px;line-height:1.9;color:#111111;">' + text((token.ordered ? (index + 1) + '. ' : '— ')) + inline(item, spec) + '</p>'; }).join('');
    if (token.type === 'para') return '<p style="margin:0 0 17px;font-size:14px;line-height:2;letter-spacing:.02em;color:#111111;">' + inline(token.raw, spec) + '</p>';
    return bodyBlock(token, { ink: '#111111', muted: '#5E5E5E', accent: '#111111', accent2: '#D8D8D8', line: '#D8D8D8', surface: '#FFFFFF', radius: 0, border: 1, quote: 'oversize', density: 'airy' }, spec);
  }

  function renderMinimal(article, opt) {
    var minimalSpec = inlineSpec({}, { accent: '#111111', ink: '#111111', accent2: '#D8D8D8', surface: '#FFFFFF', muted: '#5E5E5E', line: '#D8D8D8' });
    var parts = ['<section style="padding:8px 0 30px;border-top:1px solid #111111;"><p style="margin:12px 0 30px;font-size:9px;letter-spacing:.24em;color:#5E5E5E;">' + text('MONO / LONGFORM') + '</p><h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:28px;line-height:1.28;font-weight:700;color:#111111;">' + text(article.title) + '</h1>' + (article.leadRaw ? '<p style="margin:20px 0 0;font-size:14px;line-height:1.95;color:#5E5E5E;">' + inline(article.leadRaw, minimalSpec) + '</p>' : '') + '</section>'];
    article.intro.forEach(function (token) { parts.push(minimalBody(token, minimalSpec)); });
    article.sections.forEach(function (section, index) {
      parts.push('<section style="margin:38px 0 18px;padding-top:12px;border-top:1px solid #D8D8D8;"><p style="margin:0 0 7px;font-size:9px;letter-spacing:.18em;color:#5E5E5E;">' + text((index + 1 < 10 ? '0' : '') + (index + 1)) + '</p><h2 style="margin:0;font-family:STSong,SimSun,serif;font-size:19px;line-height:1.45;font-weight:700;color:#111111;">' + text(section.title) + '</h2></section>');
      section.items.forEach(function (token) { parts.push(minimalBody(token, minimalSpec)); });
    });
    parts.push('<section style="margin-top:42px;padding-top:14px;border-top:1px solid #111111;"><p style="margin:0;font-size:9px;letter-spacing:.2em;color:#5E5E5E;">' + text('ARTICLE END') + '</p></section>');
    return '<section data-original-system="production-v6" data-original-level="minimal-mono" style="max-width:750px;margin:0 auto;padding:34px 24px;box-sizing:border-box;background:#FFFFFF;color:#111111;font-family:-apple-system,BlinkMacSystemFont,\'PingFang SC\',\'Microsoft YaHei\',sans-serif;">' + parts.join('\n') + '</section>';
  }

  function component(manifest, styleId, role) {
    if (!manifest || !manifest.components) return null;
    for (var i = 0; i < manifest.components.length; i++) {
      var item = manifest.components[i];
      if (item.style === styleId && item.role === role) return item;
    }
    return null;
  }

  function sitePath(path) { return path.replace('assets/production-motion-v6', 'motion'); }

  function templateFilename(styleId, dynamic) {
    return 'information-to-action_' + styleId + '_motion-v6' + (dynamic ? '' : '_static') + '.html';
  }

  function templatePath(styleId, dynamic) {
    return 'motion/templates-v6/' + templateFilename(styleId, dynamic);
  }

  function assetRequirements(themeId, levelId, motionEnabled, manifest) {
    var p = Data.profileForTheme(themeId);
    if (!p || p.creative) return [];
    var level = Data.level(levelId);
    if (level.order < 3) return [];
    var needs = [];
    function addTemplate(mode) {
      var source = templatePath(p.styleId, mode === 'motion');
      needs.push({ sourcePath: source, sitePath: source, role: 'template', mode: mode });
    }
    function add(role, mode) {
      var item = component(manifest, p.styleId, role);
      if (!item) return;
      var source = mode === 'motion' ? item.motion_file : item.static_file;
      if (!source) return;
      if (!needs.some(function (need) { return need.sourcePath === source; })) {
        needs.push({ sourcePath: source, sitePath: sitePath(source), role: role, mode: mode });
      }
    }
    if (level.order >= 4) {
      addTemplate('static');
      if (motionEnabled && level.motion !== 'none') addTemplate('motion');
      return needs;
    }
    add('title', 'static');
    if (motionEnabled && level.motion !== 'none') add('title', 'motion');
    add('section-title', 'static');
    return needs;
  }

  function svgMeta(svg) {
    var match = String(svg || '').match(/viewBox\s*=\s*["']\s*([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s*["']/i);
    if (!match) fail('SVG 缺少 viewBox');
    return { x: Number(match[1]), y: Number(match[2]), width: Number(match[3]), height: Number(match[4]) };
  }

  function cleanSvg(svg, label, crop) {
    var source = String(svg || '').replace(/^\uFEFF/, '').replace(/<\?xml[^>]*>\s*/i, '');
    var meta = svgMeta(source);
    var view = crop || meta;
    return source.replace(/<svg\b([^>]*)>/i, function (_match, attributes) {
      var attrs = attributes
        .replace(/\s(?:width|height|style|role|aria-label)\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
        .replace(/\sviewBox\s*=\s*(?:"[^"]*"|'[^']*')/i, '');
      return '<svg' + attrs + ' viewBox="' + number(view.x) + ' ' + number(view.y) + ' ' + number(view.width) + ' ' + number(view.height)
        + '" width="100%" role="img" aria-label="' + esc(label)
        + '" style="display:block;width:100%;height:auto;overflow:' + (crop ? 'hidden' : 'visible') + ';">';
    });
  }

  function assetText(assets, path) {
    var value = assets && assets[path];
    if (!value) fail('缺少原创视觉资产：' + path);
    return value;
  }

  function titleBands(p, level, motionEnabled, manifest, assets) {
    var item = component(manifest, p.styleId, 'title');
    if (!item) fail('主题缺少 title 组件：' + p.styleId);
    var staticSvg = recolor(assetText(assets, item.static_file), p);
    var dynamic = motionEnabled && level.motion !== 'none';
    var motionSvg = dynamic && item.motion_file ? recolor(assetText(assets, item.motion_file), p) : staticSvg;
    var meta = svgMeta(staticSvg);
    var topHeight = Math.max(112, Math.min(170, meta.height * 0.47));
    var bottomY = Math.max(208, Math.min(meta.height - 54, meta.height * 0.58));
    var topRaw = dynamic ? motionSvg : staticSvg;
    var bottomRaw = dynamic && level.id === 'motion-themed-frame' ? motionSvg : staticSvg;
    return {
      top: cleanSvg(topRaw, p.name + '开篇上沿', { x: meta.x, y: meta.y, width: meta.width, height: topHeight }),
      bottom: cleanSvg(bottomRaw, p.name + '开篇下沿', { x: meta.x, y: bottomY, width: meta.width, height: meta.height - bottomY }),
      rail: cleanSvg(staticSvg, p.name + '静态标题引导线', { x: meta.x, y: Math.max(meta.y, meta.height - 82), width: meta.width, height: Math.min(82, meta.height) })
    };
  }

  function decoratedHeading(index, section, p, manifest, assets) {
    var base = sectionHeading(index, section, p);
    var item = component(manifest, p.styleId, 'section-title');
    if (!item) return base;
    var svg = cleanSvg(recolor(assetText(assets, item.static_file), p), p.name + '章节装饰');
    return '<section data-component-role="section-title" style="margin:0;">' + base + svg + '</section>';
  }

  function renderDecorated(article, p, spec, level, manifest, assets, opt) {
    var bands = titleBands(p, level, false, manifest, assets);
    var parts = ['<section data-component-role="title-rail" style="margin:0 0 18px;">' + bands.rail + '</section>', header(article, p, spec), brief(article, p)];
    article.intro.forEach(function (token) { parts.push(bodyBlock(token, p, spec)); });
    article.sections.forEach(function (section, index) {
      parts.push(decoratedHeading(index, section, p, manifest, assets));
      section.items.forEach(function (token) { parts.push(bodyBlock(token, p, spec)); });
    });
    parts.push(finish(article, p));
    parts.push(signature(article, opt, spec, p));
    return shell(p, level.id, parts.join('\n'));
  }

  function parseTemplate(source, label) {
    var doc = new DOMParser().parseFromString('<!doctype html><html><body>' + source + '</body></html>', 'text/html');
    var root = doc.body && doc.body.firstElementChild;
    if (!root || root.tagName.toLowerCase() !== 'section') fail(label + '不是有效的正文模板');
    return { document: doc, root: root };
  }

  function directRole(root, role) {
    for (var i = 0; i < root.children.length; i++) {
      if (root.children[i].getAttribute('data-component-role') === role) return root.children[i];
    }
    return null;
  }

  function setSlot(slot, html) {
    if (!slot) return;
    slot.innerHTML = html;
  }

  function replaceHeadingNumber(root, numberText) {
    function walk(node) {
      if (node.nodeType === 1 && node.namespaceURI === 'http://www.w3.org/2000/svg') return;
      for (var child = node.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === 3 && /01/.test(child.nodeValue || '')) {
          child.nodeValue = child.nodeValue.replace(/01/g, numberText);
        } else if (child.nodeType === 1) walk(child);
      }
    }
    walk(root);
  }

  function populateDirectory(root, article) {
    var directory = root.querySelector('[data-semantic-role="article-directory"]');
    if (!directory) return;
    var titles = article.sections.slice(0, 4).map(function (section) { return section.title; });
    while (titles.length < 4) titles.push('继续阅读');
    var paragraphs = directory.querySelectorAll('p');
    var cursor = 0;
    for (var i = 0; i < paragraphs.length && cursor < 4; i++) {
      var label = (paragraphs[i].textContent || '').trim();
      var titleSlot = paragraphs[i].nextElementSibling;
      if (!/^\d{2}$/.test(label) || !titleSlot || titleSlot.tagName.toLowerCase() !== 'p') continue;
      setSlot(paragraphs[i], text(cursor < 9 ? '0' + (cursor + 1) : String(cursor + 1)));
      setSlot(titleSlot, text(titles[cursor]));
      cursor++;
    }
  }

  function appendMarkup(doc, target, markup) {
    if (!markup) return;
    var holder = doc.createElement('section');
    holder.innerHTML = markup;
    while (holder.firstChild) target.appendChild(holder.firstChild);
  }

  function appendBody(doc, target, token, p, spec, paragraphPrototype, motifSvg) {
    if (token.type === 'para' && paragraphPrototype) {
      var paragraph = paragraphPrototype.cloneNode(false);
      setSlot(paragraph, inline(token.raw, spec));
      target.appendChild(paragraph);
      return;
    }
    appendMarkup(doc, target, bodyBlock(token, p, spec, motifSvg));
  }

  function placeholderMotifSvg(root) {
    var source = root && root.querySelector('[data-motif-placement="header-end"] svg');
    if (!source) return '';
    var clone = source.cloneNode(true);
    var animations = clone.querySelectorAll('animate,animateTransform,animateMotion,set');
    for (var i = animations.length - 1; i >= 0; i--) animations[i].parentNode.removeChild(animations[i]);
    clone.removeAttribute('role');
    clone.removeAttribute('aria-label');
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('focusable', 'false');
    clone.setAttribute('data-placeholder-theme-motif', 'true');
    clone.setAttribute('style', 'display:block;width:100%;height:auto;overflow:visible;');
    return clone.outerHTML;
  }

  function wrapVisibleText(root) {
    var doc = root.ownerDocument;
    function walk(node) {
      if (node.nodeType === 1) {
        if (node.namespaceURI === 'http://www.w3.org/2000/svg') return;
        if (node.tagName.toLowerCase() === 'span' && node.hasAttribute('leaf')) return;
      }
      var child = node.firstChild;
      while (child) {
        var next = child.nextSibling;
        if (child.nodeType === 3 && /\S/.test(child.nodeValue || '')) {
          var span = doc.createElement('span');
          span.setAttribute('leaf', '');
          span.textContent = child.nodeValue;
          node.replaceChild(span, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
        child = next;
      }
    }
    walk(root);
  }

  function frozenTemplate(article, p, spec, level, motionEnabled, assets, opt) {
    var dynamic = motionEnabled && level.motion !== 'none';
    var staticPath = templatePath(p.styleId, false);
    var motionPath = templatePath(p.styleId, true);
    var basePath = dynamic && level.id === 'motion-themed-frame' ? motionPath : staticPath;
    var parsed = parseTemplate(recolor(assetText(assets, basePath), p), p.name + '最终模板');
    var doc = parsed.document;
    var root = parsed.root;

    if (dynamic && level.id === 'motion-title-static-frame') {
      var motionParsed = parseTemplate(recolor(assetText(assets, motionPath), p), p.name + '动态标题模板');
      var staticTitle = directRole(root, 'title');
      var motionTitle = directRole(motionParsed.root, 'title');
      if (!staticTitle || !motionTitle) fail(p.name + '缺少最终标题槽');
      staticTitle.parentNode.replaceChild(doc.importNode(motionTitle, true), staticTitle);
    }

    root.setAttribute('data-original-system', 'production-template-v6');
    root.setAttribute('data-original-level', level.id);
    root.setAttribute('data-original-style', p.styleId);
    root.setAttribute('data-original-colorway', p.colorId || 'default');
    root.setAttribute('data-original-template-release', 'v30-standard402-full-effects');
    root.setAttribute('data-original-motion-release', 'v6');
    root.setAttribute('data-original-motion-enabled', dynamic ? 'true' : 'false');

    var titleCopy = root.querySelector('[data-title-copy="true"]');
    var titleSlot = titleCopy && titleCopy.querySelector('h1');
    if (!titleSlot) fail(p.name + '最终模板缺少标题文字锚点');
    setSlot(titleSlot, text(article.title));

    var frame = directRole(root, 'frame');
    var frameCopy = frame && frame.querySelector('[data-frame-content-kind]');
    var leadSlot = frameCopy && frameCopy.querySelector('p');
    if (article.leadRaw) {
      if (!leadSlot) fail(p.name + '最终模板缺少导读文字锚点');
      setSlot(leadSlot, inline(article.leadRaw, spec));
    } else if (frame) {
      root.removeChild(frame);
    }
    populateDirectory(root, article);

    var headingPrototype = root.querySelector('[data-article-section-heading="true"]');
    var tail = directRole(root, 'tail');
    var directory = directRole(root, 'directory');
    if (!headingPrototype || !tail || !directory) fail(p.name + '最终模板结构不完整');
    var placeholderMotif = placeholderMotifSvg(directory);
    var paragraphPrototype = headingPrototype.nextElementSibling;
    if (!paragraphPrototype || paragraphPrototype.tagName.toLowerCase() !== 'p') fail(p.name + '最终模板缺少正文段落样式');
    paragraphPrototype = paragraphPrototype.cloneNode(false);

    var node = directory.nextElementSibling;
    while (node && node !== tail) {
      var next = node.nextElementSibling;
      root.removeChild(node);
      node = next;
    }

    var content = doc.createDocumentFragment();
    var longform = doc.createElement('section');
    longform.setAttribute('data-longform-article', 'true');
    longform.setAttribute('style', 'margin:0;padding:0;');

    if (article.intro.length) {
      var introBody = doc.createElement('section');
      introBody.setAttribute('data-section-body', 'intro');
      introBody.setAttribute('style', 'width:100%;max-width:370px;margin:0 auto 20px;box-sizing:border-box;');
      article.intro.forEach(function (token) { appendBody(doc, introBody, token, p, spec, paragraphPrototype, placeholderMotif); });
      longform.appendChild(introBody);
    }

    var lastBody = null;
    article.sections.forEach(function (section, index) {
      var heading = headingPrototype.cloneNode(true);
      var headingTitle = heading.querySelector('[data-title-slot="true"]');
      if (!headingTitle) fail(p.name + '最终模板缺少章节标题文字锚点');
      replaceHeadingNumber(heading, index < 9 ? '0' + (index + 1) : String(index + 1));
      setSlot(headingTitle, text(section.title));
      heading.style.marginTop = index ? '29px' : '18px';
      longform.appendChild(heading);

      var sectionBody = doc.createElement('section');
      sectionBody.setAttribute('data-section-body', 'true');
      sectionBody.setAttribute('style', 'width:100%;max-width:370px;margin:6px auto 27px;box-sizing:border-box;');
      section.items.forEach(function (token) { appendBody(doc, sectionBody, token, p, spec, paragraphPrototype, placeholderMotif); });
      longform.appendChild(sectionBody);
      lastBody = sectionBody;
    });

    var signatureHtml = signature(article, opt, spec, p);
    if (signatureHtml) {
      if (!lastBody) {
        lastBody = doc.createElement('section');
        lastBody.setAttribute('data-section-body', 'signature');
        lastBody.setAttribute('style', 'width:100%;max-width:370px;margin:6px auto 27px;box-sizing:border-box;');
        longform.appendChild(lastBody);
      }
      appendMarkup(doc, lastBody, signatureHtml);
    }
    content.appendChild(longform);
    root.insertBefore(content, tail);

    var tailCopy = tail.querySelector('[data-tail-copy="true"]');
    var tailLabel = tailCopy && tailCopy.querySelector('p');
    if (!tailCopy || tailCopy.getAttribute('data-tail-slot-source') !== 'content_anchor' || !tailLabel) {
      fail(p.name + '最终模板缺少尾部 content_anchor');
    }
    setSlot(tailLabel, text('END · 继续阅读'));
    wrapVisibleText(root);
    return root.outerHTML;
  }

  function render(tokens, themeSpec, opt, assets, manifest) {
    opt = opt || {};
    assets = assets || {};
    var p = Data.profileForTheme(themeSpec && themeSpec.id, opt.colorId);
    if (!p) fail('不是蓝梦原创视觉主题：' + (themeSpec && themeSpec.id));
    var level = Data.level(opt.levelId || 'motion-themed-frame');
    /* 创意高级排版只提供纯静态结构：除 L1 黑白极简外一律按 static-simple 渲染 */
    if (p.creative && level.id !== 'minimal-mono') level = Data.level('static-simple');
    var article = articleFromTokens(tokens);
    var spec = inlineSpec(themeSpec, p);
    if (level.id === 'minimal-mono') return renderMinimal(article, opt);
    if (level.id === 'static-simple') {
      var simple = renderStatic(article, p, spec, level.id);
      var simpleSignature = signature(article, opt, spec, p);
      return simpleSignature ? simple.replace(/<\/section>$/, simpleSignature + '</section>') : simple;
    }
    if (!manifest) fail('原创视觉等级需要 motion/manifest.json');
    if (level.id === 'static-title-bar') return renderDecorated(article, p, spec, level, manifest, assets, opt);
    return frozenTemplate(article, p, spec, level, opt.motionEnabled !== false, assets, opt);
  }

  return {
    LEVELS: Data.LEVELS,
    PROFILES: Data.PROFILES,
    render: render,
    assetRequirements: assetRequirements,
    cleanSvg: cleanSvg,
    sitePath: sitePath,
    templatePath: templatePath
  };
});

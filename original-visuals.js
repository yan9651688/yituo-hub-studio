/* 蓝梦原创视觉渲染器。
 * 将 Production V6 的静态/动态 SVG 组件按 6 档等级组合成可编辑公众号正文。
 */
(function (global, factory) {
  var themes = global.Md2GZHThemes || (typeof require === 'function' ? require('./themes.js') : null);
  var data = global.Md2GZHOriginalData || (typeof require === 'function' ? require('./original-visuals-data.js') : null);
  var api = factory(themes, data);
  global.Md2GZHOriginalVisuals = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function (Themes, Data) {
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
    clone.underline = (spec && spec.underline) || ('border-bottom:2px solid ' + p.accent2 + ';font-weight:600;');
    clone.c = {
      primary: p.accent, deep: p.ink, light: p.accent2, tint: p.surface,
      ink: p.ink, text: p.ink, sub: p.muted, border: p.line,
      accent: p.accent2, coverA: p.accent, coverB: p.ink, codeBg: p.surface
    };
    return clone;
  }

  function inline(value, spec) {
    return Themes.inline(value || '', spec, { allowKeyword: true, firstStrongDone: false });
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
      return {
        title: cover.title || '未命名文章',
        leadRaw: cover.sub ? esc(cover.sub) : '',
        intro: [], signature: signature,
        sections: [{ title: '正文', num: '01', items: bodyTokens }]
      };
    }

    var leadParts = [];
    var intro = [];
    var sections = [];
    var current = null;
    bodyTokens.forEach(function (token) {
      if (token.type === 'section') {
        current = { title: token.title, num: token.num, items: [] };
        sections.push(current);
        return;
      }
      if (current) { current.items.push(token); return; }
      if (token.type === 'para') leadParts.push(token.raw);
      else if (token.type === 'quote') leadParts.push(esc(token.text));
      else if (token.type === 'list') token.items.forEach(function (item) { leadParts.push(item); });
      else intro.push(token);
    });
    return {
      title: cover.title || '未命名文章',
      leadRaw: leadParts.join(' ') || (cover.sub ? esc(cover.sub) : ''),
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

  function header(article, p, spec) {
    var titleHtml = text(article.title);
    var leadHtml = inline(article.leadRaw, spec);
    var nameHtml = text(p.name);
    var kind = p.header;
    if (kind === 'masthead') {
      return '<section style="border-top:7px solid ' + p.accent + ';padding:16px 0 28px;">'
        + '<p style="margin:0 0 36px;font-size:12px;letter-spacing:.22em;color:' + p.muted + ';">' + text('EDITORIAL / ') + nameHtml + '</p>'
        + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:38px;line-height:1.22;font-weight:900;color:' + p.ink + ';">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid ' + p.line + ';font-size:17px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'luxury-rule') {
      return '<section style="padding:30px 10px 34px;text-align:center;border-top:1px solid ' + p.accent + ';border-bottom:1px solid ' + p.accent + ';">'
        + '<p style="margin:0 0 20px;font-size:11px;letter-spacing:.35em;color:' + p.accent + ';">' + nameHtml + '</p>'
        + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:34px;line-height:1.35;font-weight:600;color:' + p.ink + ';">' + titleHtml + '</h1>'
        + '<p style="max-width:580px;margin:22px auto 0;font-size:16px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'zine-block') {
      return '<section style="padding:0 0 30px;"><section style="display:inline-block;padding:8px 14px;background:' + p.accent + ';color:' + p.accentOn + ';font-size:12px;font-weight:800;letter-spacing:.12em;">' + nameHtml + '</section>'
        + '<h1 style="margin:18px 0 0;font-size:40px;line-height:1.16;font-weight:900;color:' + p.ink + ';">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding:18px 20px;background:' + p.surface + ';border-radius:18px;font-size:17px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'split-grid') {
      return '<section style="border:2px solid ' + p.ink + ';"><section style="display:flex;align-items:stretch;">'
        + '<section style="width:24%;padding:18px 10px;background:' + p.accent2 + ';border-right:2px solid ' + p.ink + ';box-sizing:border-box;">'
        + '<p style="margin:0;font-size:12px;font-weight:900;">' + text('NO. 01') + '</p><p style="margin:42px 0 0;font-size:11px;line-height:1.5;">' + nameHtml + '</p></section>'
        + '<section style="width:76%;padding:20px;box-sizing:border-box;"><h1 style="margin:0;font-size:35px;line-height:1.15;font-weight:950;">' + titleHtml + '</h1></section></section>'
        + '<p style="margin:0;padding:16px 18px;border-top:2px solid ' + p.ink + ';font-size:16px;line-height:1.8;">' + leadHtml + '</p></section>';
    }
    if (kind === 'report-strip') {
      return '<section style="padding:0 0 26px;"><section style="height:12px;background:' + p.accent + ';border-bottom:3px solid ' + p.ink + ';"></section>'
        + '<p style="margin:16px 0 12px;font-size:12px;font-weight:900;letter-spacing:.16em;">' + text('REPORT / ') + nameHtml + '</p>'
        + '<h1 style="margin:0;font-size:36px;line-height:1.2;font-weight:900;">' + titleHtml + '</h1>'
        + '<p style="margin:18px 0 0;padding:14px 0;border-top:1px solid ' + p.line + ';border-bottom:1px solid ' + p.line + ';font-size:16px;line-height:1.85;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'technical-plate') {
      return '<section style="padding:18px;border:1px solid ' + p.accent + ';background:' + p.surface + ';">'
        + '<p style="margin:0 0 12px;font-family:Consolas,monospace;font-size:11px;letter-spacing:.12em;color:' + p.accent + ';">' + text('DOC-001 / ') + nameHtml + '</p>'
        + '<h1 style="margin:0;font-size:34px;line-height:1.2;font-weight:850;">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding:14px;border:1px solid ' + p.line + ';font-size:16px;line-height:1.85;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'vertical-seal') {
      return '<section style="display:flex;gap:18px;padding:14px 0 32px;border-bottom:1px solid ' + p.line + ';">'
        + '<section style="width:34px;flex:none;padding:12px 6px;background:' + p.accent + ';color:' + p.accentOn + ';text-align:center;font-size:12px;line-height:1.45;box-sizing:border-box;">' + raw('静<br/>态<br/>刊<br/>读') + '</section>'
        + '<section><p style="margin:0 0 12px;font-size:12px;color:' + p.muted + ';">' + nameHtml + '</p>'
        + '<h1 style="margin:0;font-family:STKaiti,KaiTi,serif;font-size:38px;line-height:1.35;font-weight:700;">' + titleHtml + '</h1>'
        + '<p style="margin:18px 0 0;font-size:17px;line-height:1.95;color:' + p.muted + ';">' + leadHtml + '</p></section></section>';
    }
    if (kind === 'field-note') {
      return '<section style="padding:22px;border:1px solid ' + p.line + ';border-radius:14px;background:' + p.surface + ';">'
        + '<section style="display:flex;justify-content:space-between;align-items:center;"><p style="margin:0;font-size:11px;letter-spacing:.14em;color:' + p.accent + ';">' + text('FIELD NOTE 01') + '</p><span style="width:12px;height:12px;border-radius:50%;background:' + p.accent2 + ';"></span></section>'
        + '<h1 style="margin:24px 0 0;font-family:STSong,SimSun,serif;font-size:35px;line-height:1.3;">' + titleHtml + '</h1>'
        + '<p style="margin:18px 0 0;font-size:16px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'soft-arch') {
      return '<section style="padding:28px 22px 24px;border-radius:60px 60px 24px 24px;background:' + p.surface + ';text-align:center;">'
        + '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + p.accent + ';"></span><p style="margin:10px 0 18px;font-size:11px;letter-spacing:.18em;color:' + p.muted + ';">' + nameHtml + '</p>'
        + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:35px;line-height:1.35;">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;font-size:17px;line-height:1.9;color:' + p.muted + ';text-align:left;">' + leadHtml + '</p></section>';
    }
    if (kind === 'terminal-log') {
      return '<section style="padding:22px;border:1px solid ' + p.line + ';border-radius:8px;background:' + p.surface + ';">'
        + '<p style="margin:0 0 18px;font-family:Consolas,monospace;font-size:12px;color:' + p.accent + ';">' + text('$ open /article/') + nameHtml + '</p>'
        + '<h1 style="margin:0;font-size:34px;line-height:1.2;font-weight:800;color:' + p.ink + ';">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding-left:14px;border-left:2px solid ' + p.accent2 + ';font-size:16px;line-height:1.85;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'research-card') {
      return '<section style="padding:24px;border:1px solid ' + p.line + ';border-radius:12px;background:' + p.surface + ';">'
        + '<p style="margin:0 0 18px;font-size:11px;font-weight:800;letter-spacing:.16em;color:' + p.accent + ';">' + text('RESEARCH ABSTRACT') + '</p>'
        + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:34px;line-height:1.35;font-weight:700;">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid ' + p.line + ';font-size:16px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section>';
    }
    if (kind === 'studio-board') {
      return '<section style="padding:10px 10px 10px 0;background:' + p.accent2 + ';border-radius:16px;"><section style="padding:24px;background:' + p.surface + ';border:1px solid ' + p.ink + ';border-radius:16px;">'
        + '<p style="margin:0 0 14px;font-size:11px;font-weight:800;letter-spacing:.18em;color:' + p.accent + ';">' + text('STUDIO BOARD / ') + nameHtml + '</p>'
        + '<h1 style="margin:0;font-size:36px;line-height:1.2;font-weight:880;">' + titleHtml + '</h1>'
        + '<p style="margin:18px 0 0;font-size:16px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section></section>';
    }
    if (kind === 'brutal-poster') {
      return '<section style="padding:0 9px 9px 0;background:' + p.accent + ';"><section style="padding:20px;background:' + p.surface + ';border:3px solid ' + p.ink + ';">'
        + '<p style="display:inline-block;margin:0 0 18px;padding:5px 8px;background:' + p.accent2 + ';border:2px solid ' + p.ink + ';font-size:11px;font-weight:950;">' + nameHtml + '</p>'
        + '<h1 style="margin:0;font-size:40px;line-height:1.08;font-weight:950;text-transform:uppercase;">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding-top:15px;border-top:3px solid ' + p.ink + ';font-size:16px;line-height:1.75;font-weight:650;">' + leadHtml + '</p></section></section>';
    }
    if (kind === 'night-cover') {
      return '<section style="padding:24px 22px;background:' + p.surface + ';border-left:8px solid ' + p.accent + ';">'
        + '<p style="margin:0 0 24px;font-size:11px;letter-spacing:.25em;color:' + p.accent2 + ';">' + text('NIGHT EDITION / ') + nameHtml + '</p>'
        + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:39px;line-height:1.2;color:' + surfaceInk(p) + ';">' + titleHtml + '</h1>'
        + '<p style="margin:20px 0 0;padding-top:18px;border-top:1px solid #4A4741;font-size:17px;line-height:1.9;color:' + surfaceMuted(p) + ';">' + leadHtml + '</p></section>';
    }
    return '<section style="padding:0 0 28px;"><span style="display:inline-block;padding:7px 12px;background:' + p.accent + ';color:' + p.accentOn + ';font-size:11px;font-weight:800;">' + text('ARCHIVE 001') + '</span>'
      + '<section style="margin-top:0;padding:24px 20px;border:1px solid ' + p.line + ';background:' + p.surface + ';"><p style="margin:0 0 14px;font-family:Consolas,monospace;font-size:11px;color:' + p.muted + ';">' + text('CATALOG / ') + nameHtml + '</p>'
      + '<h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:35px;line-height:1.3;">' + titleHtml + '</h1><p style="margin:18px 0 0;font-size:16px;line-height:1.9;color:' + p.muted + ';">' + leadHtml + '</p></section></section>';
  }

  function brief(article, p) {
    var items = article.sections.slice(0, 3).map(function (section) { return section.title; });
    while (items.length < 3) items.push('延伸思考');
    if (['columns', 'number-grid', 'metric-row', 'tile-grid', 'status-grid'].indexOf(p.brief) !== -1) {
      var cells = items.map(function (item, index) {
        return '<section style="flex:1;min-width:0;padding:14px 10px;border:' + p.border + 'px solid ' + p.line + ';background:' + p.surface + ';">'
          + '<p style="margin:0 0 8px;font-size:11px;font-weight:850;color:' + p.accent + ';">' + text('0' + (index + 1)) + '</p>'
          + '<p style="margin:0;font-size:14px;line-height:1.55;color:' + surfaceInk(p) + ';">' + text(item) + '</p></section>';
      }).join('');
      return '<section style="display:flex;gap:8px;margin:26px 0 32px;">' + cells + '</section>';
    }
    if (['ledger', 'spec-list', 'quiet-list', 'dark-ledger'].indexOf(p.brief) !== -1) {
      var rows = items.map(function (item, index) {
        return '<section style="display:flex;gap:14px;padding:11px 0;border-bottom:1px solid ' + p.line + ';"><span style="font-size:12px;color:' + p.accent + ';">' + text('0' + (index + 1)) + '</span><span style="font-size:14px;color:' + surfaceInk(p) + ';">' + text(item) + '</span></section>';
      }).join('');
      return '<section style="margin:26px 0 34px;padding:4px 16px;border-left:3px solid ' + p.accent + ';background:' + p.surface + ';">' + rows + '</section>';
    }
    return '<section style="margin:26px 0 34px;">' + items.map(function (item, index) {
      return '<p style="margin:' + (index === 0 ? 0 : 8) + 'px 0 0;padding:12px 16px;border-radius:' + p.radius + 'px;background:' + p.surface + ';font-size:14px;line-height:1.6;color:' + surfaceInk(p) + ';"><strong style="color:' + p.accent + ';">' + text('0' + (index + 1)) + '</strong>' + text('　' + item) + '</p>';
    }).join('') + '</section>';
  }

  function sectionHeading(index, section, p) {
    var n = index + 1;
    var kind = p.section;
    if (['rule-number', 'roman', 'orange-rule', 'marker-line'].indexOf(kind) !== -1) {
      var romans = ['I', 'II', 'III', 'IV', 'V'];
      var label = kind === 'roman' && index < romans.length ? romans[index] : (n < 10 ? '0' + n : String(n));
      var family = ['rule-number', 'roman'].indexOf(kind) !== -1 ? 'STSong,SimSun,serif' : 'inherit';
      return '<section style="margin:38px 0 18px;padding-top:13px;border-top:' + (kind === 'orange-rule' ? 2 : 1) + 'px solid ' + p.accent + ';">'
        + '<p style="margin:0 0 6px;font-size:11px;font-weight:850;letter-spacing:.16em;color:' + p.accent + ';">' + text(label) + '</p>'
        + '<h2 style="margin:0;font-family:' + family + ';font-size:25px;line-height:1.4;color:' + p.ink + ';">' + text(section.title) + '</h2></section>';
    }
    if (['block-index', 'boxed-number'].indexOf(kind) !== -1) {
      return '<section style="display:flex;align-items:center;gap:12px;margin:34px 0 17px;"><span style="padding:6px 9px;background:' + p.accent + ';border:' + p.border + 'px solid ' + p.ink + ';color:' + p.accentOn + ';font-size:13px;font-weight:900;">' + text(n < 10 ? '0' + n : String(n)) + '</span><h2 style="margin:0;font-size:25px;line-height:1.35;">' + text(section.title) + '</h2></section>';
    }
    if (['chapter-seal', 'leaf-index', 'rounded-tab', 'pill-index'].indexOf(kind) !== -1) {
      var radius = ['rounded-tab', 'pill-index'].indexOf(kind) !== -1 ? 999 : p.radius;
      return '<section style="margin:36px 0 18px;"><span style="display:inline-block;padding:5px 11px;border-radius:' + radius + 'px;background:' + p.accent + ';color:' + p.accentOn + ';font-size:11px;letter-spacing:.1em;">' + text('第 ' + n + ' 章') + '</span><h2 style="margin:12px 0 0;font-family:STSong,SimSun,serif;font-size:25px;line-height:1.4;">' + text(section.title) + '</h2></section>';
    }
    if (['command-line', 'side-code', 'coordinate', 'figure-index'].indexOf(kind) !== -1) {
      var prefix = kind === 'command-line' ? '>' : (kind === 'figure-index' ? 'FIG.' : '#');
      return '<section style="margin:34px 0 17px;padding-left:14px;border-left:3px solid ' + p.accent + ';"><p style="margin:0 0 5px;font-family:Consolas,monospace;font-size:11px;color:' + p.accent + ';">' + text(prefix + ' ' + (n < 10 ? '0' + n : n)) + '</p><h2 style="margin:0;font-size:24px;line-height:1.4;">' + text(section.title) + '</h2></section>';
    }
    return '<section style="margin:36px 0 18px;border-bottom:1px solid ' + p.line + ';"><span style="display:inline-block;padding:7px 12px;background:' + p.accent2 + ';font-size:11px;color:' + p.ink + ';">' + text('FILE ' + (n < 10 ? '0' + n : n)) + '</span><h2 style="margin:12px 0 10px;font-family:STSong,SimSun,serif;font-size:25px;">' + text(section.title) + '</h2></section>';
  }

  function bodyBlock(token, p, spec) {
    var components = Themes.COMPONENTS || {};
    if (token.type === 'quote') {
      if (['oversize', 'centered', 'ink-quote', 'spotlight'].indexOf(p.quote) !== -1) {
        return '<section style="margin:24px 0;padding:22px 12px;border-top:1px solid ' + p.accent + ';border-bottom:1px solid ' + p.accent + ';text-align:center;"><p style="margin:0;font-family:STSong,SimSun,serif;font-size:22px;line-height:1.75;color:' + p.ink + ';">' + text('“' + token.text + '”') + '</p></section>';
      }
      return '<section style="margin:22px 0;padding:18px;border:' + p.border + 'px solid ' + p.line + ';border-radius:' + p.radius + 'px;background:' + p.surface + ';"><p style="margin:0;font-size:18px;line-height:1.8;font-weight:650;color:' + surfaceInk(p) + ';">' + text(token.text) + '</p></section>';
    }
    if (token.type === 'list') {
      return token.items.map(function (item, index) {
        var marker = token.ordered ? ((index + 1) + '. ') : '— ';
        return '<p style="margin:8px 0;padding-left:10px;border-left:2px solid ' + p.accent + ';font-size:16px;line-height:1.85;color:' + p.ink + ';">' + text(marker) + inline(item, spec) + '</p>';
      }).join('');
    }
    if (token.type === 'para') {
      return '<p style="margin:0 0 16px;font-size:16px;line-height:' + (p.density === 'airy' ? 2 : 1.82) + ';letter-spacing:.02em;color:' + p.ink + ';">' + inline(token.raw, spec) + '</p>';
    }
    if (token.type === 'subsection' && components.buildSubsection) return components.buildSubsection(spec, token);
    if (token.type === 'code' && components.buildCode) return components.buildCode(spec, token);
    if (token.type === 'image' && components.buildImage) return components.buildImage(spec, token);
    if (token.type === 'table' && components.buildTable) return components.buildTable(spec, token);
    if (token.type === 'divider' && components.buildDivider) return components.buildDivider(spec);
    return '';
  }

  function finish(article, p) {
    var endTitle = article.sections.length ? article.sections[article.sections.length - 1].title : '继续前行';
    if (['black-bar', 'color-band', 'report-end'].indexOf(p.finish) !== -1) {
      return '<section style="margin-top:38px;padding:18px;background:' + p.accent + ';color:' + p.accentOn + ';"><p style="margin:0;font-size:12px;letter-spacing:.14em;">' + text('END / ' + p.name) + '</p><p style="margin:8px 0 0;font-size:18px;font-weight:800;">' + text(endTitle) + '</p></section>';
    }
    if (['red-seal', 'soft-dot', 'square-mark', 'cursor'].indexOf(p.finish) !== -1) {
      return '<section style="margin-top:38px;text-align:center;"><span style="display:inline-block;width:16px;height:16px;border-radius:' + (p.finish === 'soft-dot' ? '50%' : '0') + ';background:' + p.accent + ';"></span><p style="margin:12px 0 0;font-size:12px;letter-spacing:.16em;color:' + p.muted + ';">' + text('感谢阅读 · ' + p.name) + '</p></section>';
    }
    return '<section style="margin-top:38px;padding-top:16px;border-top:1px solid ' + p.accent + ';"><p style="margin:0;font-size:12px;letter-spacing:.14em;color:' + p.muted + ';">' + text(p.name + ' / ARTICLE END') + '</p></section>';
  }

  function signature(article, opt, spec) {
    var token = article.signature || {};
    var author = token.author || opt.author || '';
    if (!author && !token.intro) return '';
    return Themes.COMPONENTS && Themes.COMPONENTS.buildSignature
      ? Themes.COMPONENTS.buildSignature(spec, { author: author, intro: token.intro || '' }) : '';
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
    if (token.type === 'quote') return '<section style="margin:24px 0;padding:18px 0;border-top:1px solid #111111;border-bottom:1px solid #111111;"><p style="margin:0;font-family:STSong,SimSun,serif;font-size:21px;line-height:1.75;color:#111111;">' + text(token.text) + '</p></section>';
    if (token.type === 'list') return token.items.map(function (item, index) { return '<p style="margin:8px 0;font-size:16px;line-height:1.9;color:#111111;">' + text((token.ordered ? (index + 1) + '. ' : '— ')) + inline(item, spec) + '</p>'; }).join('');
    if (token.type === 'para') return '<p style="margin:0 0 17px;font-size:16px;line-height:2;letter-spacing:.02em;color:#111111;">' + inline(token.raw, spec) + '</p>';
    return bodyBlock(token, { ink: '#111111', muted: '#5E5E5E', accent: '#111111', accent2: '#D8D8D8', line: '#D8D8D8', surface: '#FFFFFF', radius: 0, border: 1, quote: 'oversize', density: 'airy' }, spec);
  }

  function renderMinimal(article, opt) {
    var minimalSpec = inlineSpec({}, { accent: '#111111', ink: '#111111', accent2: '#D8D8D8', surface: '#FFFFFF', muted: '#5E5E5E', line: '#D8D8D8' });
    var parts = ['<section style="padding:8px 0 30px;border-top:1px solid #111111;"><p style="margin:12px 0 30px;font-size:10px;letter-spacing:.24em;color:#5E5E5E;">' + text('MONO / LONGFORM') + '</p><h1 style="margin:0;font-family:STSong,SimSun,serif;font-size:38px;line-height:1.28;font-weight:700;color:#111111;">' + text(article.title) + '</h1>' + (article.leadRaw ? '<p style="margin:20px 0 0;font-size:17px;line-height:1.95;color:#5E5E5E;">' + inline(article.leadRaw, minimalSpec) + '</p>' : '') + '</section>'];
    article.intro.forEach(function (token) { parts.push(minimalBody(token, minimalSpec)); });
    article.sections.forEach(function (section, index) {
      parts.push('<section style="margin:38px 0 18px;padding-top:12px;border-top:1px solid #D8D8D8;"><p style="margin:0 0 7px;font-size:10px;letter-spacing:.18em;color:#5E5E5E;">' + text((index + 1 < 10 ? '0' : '') + (index + 1)) + '</p><h2 style="margin:0;font-family:STSong,SimSun,serif;font-size:25px;line-height:1.45;font-weight:700;color:#111111;">' + text(section.title) + '</h2></section>');
      section.items.forEach(function (token) { parts.push(minimalBody(token, minimalSpec)); });
    });
    parts.push('<section style="margin-top:42px;padding-top:14px;border-top:1px solid #111111;"><p style="margin:0;font-size:10px;letter-spacing:.2em;color:#5E5E5E;">' + text('ARTICLE END') + '</p></section>');
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
    if (!p) return [];
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
    var staticSvg = assetText(assets, item.static_file);
    var dynamic = motionEnabled && level.motion !== 'none';
    var motionSvg = dynamic && item.motion_file ? assetText(assets, item.motion_file) : staticSvg;
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
    var svg = cleanSvg(assetText(assets, item.static_file), p.name + '章节装饰');
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
    parts.push(signature(article, opt, spec));
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

  function appendBody(doc, target, token, p, spec, paragraphPrototype) {
    if (token.type === 'para' && paragraphPrototype) {
      var paragraph = paragraphPrototype.cloneNode(false);
      setSlot(paragraph, inline(token.raw, spec));
      target.appendChild(paragraph);
      return;
    }
    appendMarkup(doc, target, bodyBlock(token, p, spec));
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
    var parsed = parseTemplate(assetText(assets, basePath), p.name + '最终模板');
    var doc = parsed.document;
    var root = parsed.root;

    if (dynamic && level.id === 'motion-title-static-frame') {
      var motionParsed = parseTemplate(assetText(assets, motionPath), p.name + '动态标题模板');
      var staticTitle = directRole(root, 'title');
      var motionTitle = directRole(motionParsed.root, 'title');
      if (!staticTitle || !motionTitle) fail(p.name + '缺少最终标题槽');
      staticTitle.parentNode.replaceChild(doc.importNode(motionTitle, true), staticTitle);
    }

    root.setAttribute('data-original-system', 'production-template-v6');
    root.setAttribute('data-original-level', level.id);
    root.setAttribute('data-original-style', p.styleId);
    root.setAttribute('data-original-template-release', 'v24-static-final');
    root.setAttribute('data-original-motion-release', 'v6');
    root.setAttribute('data-original-motion-enabled', dynamic ? 'true' : 'false');

    var titleCopy = root.querySelector('[data-title-copy="true"]');
    var titleSlot = titleCopy && titleCopy.querySelector('h1');
    if (!titleSlot) fail(p.name + '最终模板缺少标题文字锚点');
    setSlot(titleSlot, text(article.title));

    var frameCopy = root.querySelector('[data-frame-content-kind]');
    var leadSlot = frameCopy && frameCopy.querySelector('p');
    if (!leadSlot) fail(p.name + '最终模板缺少导读文字锚点');
    setSlot(leadSlot, article.leadRaw ? inline(article.leadRaw, spec) : text(''));
    populateDirectory(root, article);

    var headingPrototype = root.querySelector('[data-article-section-heading="true"]');
    var tail = directRole(root, 'tail');
    var directory = directRole(root, 'directory');
    if (!headingPrototype || !tail || !directory) fail(p.name + '最终模板结构不完整');
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
    article.intro.forEach(function (token) { appendBody(doc, content, token, p, spec, paragraphPrototype); });
    article.sections.forEach(function (section, index) {
      var heading = headingPrototype.cloneNode(true);
      var headingTitle = heading.querySelector('[data-title-slot="true"]');
      if (!headingTitle) fail(p.name + '最终模板缺少章节标题文字锚点');
      replaceHeadingNumber(heading, index < 9 ? '0' + (index + 1) : String(index + 1));
      setSlot(headingTitle, text(section.title));
      content.appendChild(heading);
      section.items.forEach(function (token) { appendBody(doc, content, token, p, spec, paragraphPrototype); });
    });

    var signatureHtml = signature(article, opt, spec);
    appendMarkup(doc, content, signatureHtml);
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
    var p = Data.profileForTheme(themeSpec && themeSpec.id);
    if (!p) fail('不是蓝梦原创视觉主题：' + (themeSpec && themeSpec.id));
    var level = Data.level(opt.levelId || 'motion-themed-frame');
    var article = articleFromTokens(tokens);
    var spec = inlineSpec(themeSpec, p);
    if (level.id === 'minimal-mono') return renderMinimal(article, opt);
    if (level.id === 'static-simple') {
      var simple = renderStatic(article, p, spec, level.id);
      var simpleSignature = signature(article, opt, spec);
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

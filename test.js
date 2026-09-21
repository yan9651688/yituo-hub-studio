/* Node 冒烟测试：全部主题 × 全要素样例文章 → 校验器必须全绿 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.window = dom.window;
global.DOMParser = dom.window.DOMParser;

const Themes = require('./themes.js');
const Converter = require('./converter.js');
const Validator = require('./validator.js');
const OriginalData = require('./original-visuals-data.js');
const OriginalVisuals = require('./original-visuals.js');
const manifest = require('./motion/manifest.json');
const templateManifest = require('./motion/templates-v6/manifest.json');
let fail = false;

const studioSource = fs.readFileSync(path.join(__dirname, 'studio.html'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const stylesSource = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
const studioDoc = new JSDOM(studioSource).window.document;
const previewWidths = Array.from(studioDoc.querySelectorAll('[data-preview-width]'), function (button) {
  return button.getAttribute('data-preview-width');
});
const previewPresetsOk = JSON.stringify(previewWidths) === JSON.stringify(['fit', '375', '402', '440'])
  && studioDoc.querySelectorAll('[data-preview-width][aria-pressed="true"]').length === 1
  && studioDoc.querySelector('[data-preview-width][aria-pressed="true"]').getAttribute('data-preview-width') === 'fit';
console.log('preview-width-presets ' + (previewPresetsOk ? 'PASS' : 'FAIL')
  + ' values=' + previewWidths.join(','));
if (!previewPresetsOk) fail = true;

const responsivePreviewOk = appSource.indexOf('function applyPreviewLayout()') !== -1
  && appSource.indexOf('function syncPreviewHeight()') !== -1
  && appSource.indexOf('function queuePreviewHeight()') !== -1
  && appSource.indexOf("previewWrap.classList.toggle('device', fixed);") !== -1
  && appSource.indexOf("previewWrap.classList.toggle('readable', !fixed);") !== -1
  && appSource.indexOf("body.style.zoom = '1';") !== -1
  && appSource.indexOf("body.setAttribute('data-preview-scale', '1');") !== -1
  && appSource.indexOf('data-preview-content-layer') === -1
  && appSource.indexOf('data-preview-screen="true"') === -1
  && stylesSource.indexOf('.preview-wrap.device #preview') !== -1
  && stylesSource.indexOf('.preview-wrap.readable #preview') !== -1
  && stylesSource.indexOf('width: min(500px, 100%);') !== -1
  && stylesSource.indexOf('background: #EDF0F3; overflow: auto;') !== -1
  && stylesSource.indexOf('body { min-height: 0; overflow: hidden; }') !== -1
  && appSource.indexOf('html,body{overflow:hidden;scrollbar-width:none;}') !== -1
  && appSource.indexOf('function previewShell(html, advanced)') !== -1
  && appSource.indexOf('padding:0;background:transparent;display:flex;justify-content:center;align-items:flex-start;') !== -1
  && appSource.indexOf('padding:18px 16px;background:#fff;') !== -1;
console.log('preview-outer-scroll-canvas ' + (responsivePreviewOk ? 'PASS' : 'FAIL'));
if (!responsivePreviewOk) fail = true;

const localServeHintOk = appSource.indexOf('http://127.0.0.1:8123/studio.html') !== -1
  && appSource.indexOf("location.protocol === 'file:'") !== -1;
console.log('local-file-resource-hint ' + (localServeHintOk ? 'PASS' : 'FAIL'));
if (!localServeHintOk) fail = true;

const imageExportOk = studioDoc.querySelector('#btnDownload + #btnExportImage')
  && studioDoc.querySelector('script[src="vendor/html2canvas.min.js"]')
  && fs.existsSync(path.join(__dirname, 'vendor', 'html2canvas.min.js'))
  && appSource.indexOf('function exportLongImage()') !== -1
  && appSource.indexOf('window.html2canvas(target') !== -1
  && appSource.indexOf('useCORS: true') !== -1
  && appSource.indexOf('preferredScale = 3') !== -1
  && appSource.indexOf('maxCanvasSide = 16384') !== -1;
console.log('offline-long-image-export ' + (imageExportOk ? 'PASS' : 'FAIL'));
if (!imageExportOk) fail = true;

const baseLibrary = Themes.LIBRARIES.find(function (library) { return library.id === 'base'; });
const originalLibrary = Themes.LIBRARIES.find(function (library) { return library.id === 'original'; });
const baseThemeCount = Themes.SPECS.filter(function (spec) { return baseLibrary.groups.includes(spec.group); }).length;
const originalThemeCount = Themes.SPECS.filter(function (spec) { return originalLibrary.groups.includes(spec.group); }).length;
const librariesOk = baseThemeCount === 18 && originalThemeCount === 16
  && originalLibrary.name === '高级排版' && originalLibrary.shortName === '高级排版'
  && baseLibrary.groups.every(function (group) { return !originalLibrary.groups.includes(group); });
console.log('theme-libraries ' + (librariesOk ? 'PASS' : 'FAIL')
  + ' base=' + baseThemeCount + ' original=' + originalThemeCount);
if (!librariesOk) fail = true;

const md = fs.readFileSync(path.join(__dirname, 'assets/sample-article.md'), 'utf8');
const tokens = Converter.parse(md);
console.log('tokens: ' + tokens.map(function (t) { return t.type; }).join(','));

const placeholderMd = '# 主题图片占位测试 / 暂无图床\n\n'
  + '> 图片资源补齐前，先保留真实比例和主题识别。\n\n'
  + '## 图片位置\n\n'
  + '![横图位置](placeholder://16-9)\n\n'
  + '![竖图位置](placeholder://4-5)\n\n'
  + '![超宽图位置](placeholder://2.35-1)';
const placeholderTokens = Converter.parse(placeholderMd);
const appPlaceholderMarkers = appSource.match(/placeholder:\/\/(?:16-9|4-5|2\.35-1)/g) || [];
const appPlaceholderOk = JSON.stringify(appPlaceholderMarkers) === JSON.stringify([
  'placeholder://16-9', 'placeholder://4-5', 'placeholder://2.35-1'
]) && appSource.indexOf('assets/mountains-hero.jpg') === -1;
console.log('sample-theme-placeholders ' + (appPlaceholderOk ? 'PASS' : 'FAIL')
  + ' markers=' + appPlaceholderMarkers.join(','));
if (!appPlaceholderOk) fail = true;

let basePlaceholderFailures = 0;
for (const spec of Themes.SPECS.filter(function (item) { return baseLibrary.groups.includes(item.group); })) {
  const placeholderHtml = Themes.render(placeholderTokens, spec, { author: '' });
  const placeholderDoc = new JSDOM(placeholderHtml).window.document;
  const placeholderNodes = Array.from(placeholderDoc.querySelectorAll('[data-image-kind="theme-placeholder"]'));
  const placeholderOk = placeholderNodes.length === 3
    && placeholderDoc.querySelectorAll('img').length === 0
    && placeholderNodes.map(function (node) { return node.getAttribute('data-placeholder-ratio'); }).join(',') === '16:9,4:5,2.35:1'
    && placeholderNodes.every(function (node) { return node.getAttribute('data-placeholder-theme') === spec.id; })
    && Validator.validate(placeholderHtml).ok;
  if (!placeholderOk) basePlaceholderFailures++;
}
console.log('base-theme-placeholders ' + (basePlaceholderFailures === 0 ? 'PASS' : 'FAIL')
  + ' themes=' + baseThemeCount + ' failures=' + basePlaceholderFailures);
if (basePlaceholderFailures) fail = true;

for (const spec of Themes.SPECS) {
  const html = Themes.render(tokens, spec, { author: '张三' });
  const v = Validator.validate(html);
  const status = v.ok ? 'PASS' : 'FAIL';
  console.log(status + ' ' + spec.id.padEnd(8) + ' len=' + html.length
    + (v.errors.length ? ' errors=' + JSON.stringify(v.errors) : '')
    + (v.warnings.length ? ' warnings=' + JSON.stringify(v.warnings) : ''));
  if (!v.ok) fail = true;
}

const html0 = Themes.render(tokens, Themes.getSpec('ocean'), { author: '张三' });
const counts = {
  leafSpans: (html0.match(/leaf=""/g) || []).length,
  keywordUnderline: (html0.match(/border-bottom:2px solid/g) || []).length,
  sections: (html0.match(/CHAPTER|PRACTICE|SUMMARY/g) || []).length,
  codeBlocks: (html0.match(/FF5F57/g) || []).length,
  tables: (html0.match(/<table/g) || []).length,
  images: (html0.match(/<img /g) || []).length
};
console.log('sanity:', JSON.stringify(counts));
if (counts.leafSpans < 30 || counts.keywordUnderline < 3) { console.log('SANITY FAIL'); fail = true; }

/* 无 H1 / 空输入兜底 */
const bare = Themes.render(Converter.parse('只有一段正文，**测试**兜底。'), Themes.getSpec('sakura'), {});
const bareOk = Validator.validate(bare).ok;
console.log('fallback-cover ' + (bareOk ? 'PASS' : 'FAIL'));
if (!bareOk) fail = true;

/* 动效 manifest 必须自洽，且每个声明文件均能从站点根目录访问 */
if (manifest.component_count !== manifest.components.length) {
  console.log('MOTION COUNT FAIL manifest=' + manifest.component_count + ' actual=' + manifest.components.length);
  fail = true;
}
let missingMotion = 0;
for (const component of manifest.components) {
  for (const key of ['static_file', 'motion_file']) {
    if (!component[key]) continue;
    const sitePath = component[key].replace('assets/production-motion-v6', 'motion');
    if (!fs.existsSync(path.join(__dirname, sitePath))) {
      console.log('MOTION FILE FAIL ' + sitePath);
      missingMotion++;
    }
  }
}
console.log('motion-manifest ' + (missingMotion === 0 ? 'PASS' : 'FAIL')
  + ' components=' + manifest.components.length + ' missing=' + missingMotion);
if (missingMotion) fail = true;

/* V30 原画廊直编 402 终稿与其 V6 动态派生文件必须逐字节匹配清单哈希。 */
let templateHashFailures = 0;
for (const template of templateManifest.templates) {
  for (const pair of [['static_file', 'static_sha256'], ['motion_file', 'motion_sha256']]) {
    const file = path.join(__dirname, 'motion', 'templates-v6', template[pair[0]]);
    const actual = fs.existsSync(file)
      ? crypto.createHash('sha256').update(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')).digest('hex') : '';
    if (actual !== template[pair[1]]) {
      console.log('FINAL TEMPLATE HASH FAIL ' + template.style + ' ' + pair[0]);
      templateHashFailures++;
    }
  }
}
console.log('final-template-hashes ' + (templateHashFailures === 0 ? 'PASS' : 'FAIL')
  + ' files=' + (templateManifest.templates.length * 2) + ' failures=' + templateHashFailures);
if (templateHashFailures) fail = true;

let templateTypographyFailures = 0;
const templateFontSizes = new Set();
for (const template of templateManifest.templates) {
  for (const key of ['static_file', 'motion_file']) {
    const file = path.join(__dirname, 'motion', 'templates-v6', template[key]);
    const rendered = new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
    const root = rendered.body.firstElementChild;
    root.querySelectorAll('[style]').forEach(function (node) {
      if (node.style.fontSize) templateFontSizes.add(node.style.fontSize);
    });
    const heading = root.querySelector('[data-article-section-heading="true"]');
    const sizes = [
      root.querySelector('[data-component-role="title"] h1').style.fontSize,
      root.querySelector('[data-component-role="frame"] p').style.fontSize,
      root.querySelector('[data-component-role="directory"] h2').style.fontSize,
      heading.querySelector('h2').style.fontSize,
      heading.nextElementSibling.style.fontSize,
      root.querySelector('[data-component-role="title"] p').style.fontSize
    ];
    const directoryMotif = root.querySelector('[data-motif-placement="header-end"]');
    const rightMotif = heading.querySelector('[data-section-title-reusable-decor="foreground"]');
    const contentLayer = heading.querySelector('[data-section-title-content-layer="base"]');
    const standardGeometryOk = root.style.maxWidth === '402px'
      && root.getAttribute('data-standard-screen') === '402'
      && root.getAttribute('data-standard-source-width') === '750'
      && root.getAttribute('data-standard-content-width') === '370'
      && root.getAttribute('data-template-typography') === 'v30-standard402-full-effects'
      && directoryMotif && directoryMotif.style.width === '51.46px'
      && directoryMotif.style.maxWidth === '24%'
      && rightMotif && rightMotif.style.width === '18%'
      && rightMotif.style.minWidth === '37.52px'
      && rightMotif.style.maxWidth === '51.46px'
      && contentLayer && contentLayer.style.paddingRight === '58.96px'
      && heading.getAttribute('data-section-title-decor-safe-right') === '58.96';
    if (sizes.join('/') !== '18px/12px/16px/15px/13px/7.5px' || !standardGeometryOk) {
      console.log('FINAL TEMPLATE TYPOGRAPHY FAIL ' + template.style + ' ' + key + ' sizes=' + sizes.join('/'));
      templateTypographyFailures++;
    }
  }
}
const requiredTemplateFontSizes = ['7.5px', '8px', '8.5px', '12px', '13px', '15px', '16px', '18px'];
const templateFontRangeOk = requiredTemplateFontSizes.every(function (size) { return templateFontSizes.has(size); })
  && Array.from(templateFontSizes).every(function (size) { return parseFloat(size) <= 18; });
if (!templateFontRangeOk) {
  console.log('FINAL TEMPLATE FONT RANGE FAIL sizes=' + Array.from(templateFontSizes).join(','));
  templateTypographyFailures++;
}
console.log('final-template-standard402-typography ' + (templateTypographyFailures === 0 ? 'PASS' : 'FAIL')
  + ' files=' + (templateManifest.templates.length * 2) + ' failures=' + templateTypographyFailures);
if (templateTypographyFailures) fail = true;

/* 高级排版（蓝梦原创视觉）：1 个单例 + 16 主题 × 5 档 = 81 个组合。 */
function loadOriginalAssets(requirements) {
  const assets = {};
  for (const requirement of requirements) {
    const file = path.join(__dirname, requirement.sitePath);
    if (!fs.existsSync(file)) {
      console.log('ORIGINAL ASSET FAIL ' + requirement.sitePath);
      fail = true;
      continue;
    }
    assets[requirement.sourcePath] = fs.readFileSync(file, 'utf8');
  }
  return assets;
}

/* 基础排版支持的完整 Markdown 效果，在高级排版最终模板里也必须全部存在。
 * 深色主题额外检查表头与作者尾卡的前景/背景对比，避免“浅底白字”。 */
const fullEffectMd = md
  .replace(
    '## 落地四步法实战',
    '这一段用于长文压力测试。材料有长有短，但阅读宽度、行距和段间距必须保持一致，读者才不会因为内容变长而失去方向。\n\n'
      + '连续第二段继续增加文字量，用来观察正文经过多屏滚动之后，左右边界和章节节奏是否仍然稳定。\n\n'
      + '连续第三段检验短句与长句混排，确认模板不会为了填满画面而制造多余空洞。\n\n'
      + '## 落地四步法实战'
  )
  .replace(
    '## 写在最后',
    '![第二张长文测试图](assets/mountains-hero.jpg)\n\n'
      + '![第三张连续图片测试图](assets/mountains-hero.jpg)\n\n'
      + '### 行内效果补充\n\n*斜体补充*、~~删除内容~~、[资料链接](https://example.com) 与 `行内代码`。\n\n## 写在最后'
  );
const fullEffectTokens = Converter.parse(fullEffectMd);
const fullEffectTypes = new Set(fullEffectTokens.map(function (token) { return token.type; }));
const deepSeaSpec = Themes.getSpec('deep-sea');
const deepSeaRequirements = OriginalVisuals.assetRequirements(
  deepSeaSpec.id, 'motion-themed-frame', false, manifest
);
const deepSeaAssets = loadOriginalAssets(deepSeaRequirements);
const deepSeaFullHtml = OriginalVisuals.render(fullEffectTokens, deepSeaSpec, {
  author: '蓝梦', levelId: 'motion-themed-frame', motionEnabled: false
}, deepSeaAssets, manifest);
const deepSeaFullDoc = new JSDOM(deepSeaFullHtml).window.document;
const deepSeaTable = deepSeaFullDoc.querySelector('[data-advanced-effect="table"] table');
const deepSeaHeader = deepSeaTable && deepSeaTable.querySelector('th');
const deepSeaSignature = deepSeaFullDoc.querySelector('[data-advanced-effect="signature"]');
const deepSeaSignatureText = deepSeaSignature && deepSeaSignature.querySelectorAll('p')[1];
const requiredEffectTypes = ['subsection', 'quote', 'list', 'code', 'image', 'table', 'divider', 'signature'];
const deepSeaEffectTypes = new Set(Array.from(deepSeaFullDoc.querySelectorAll('[data-advanced-effect]'), function (node) {
  return node.getAttribute('data-advanced-effect');
}));
const deepSeaBodies = Array.from(deepSeaFullDoc.querySelectorAll('[data-section-body="true"]'));
const fullEffectParityOk = requiredEffectTypes.every(function (type) { return fullEffectTypes.has(type); })
  && requiredEffectTypes.every(function (type) { return deepSeaEffectTypes.has(type); })
  && deepSeaFullDoc.querySelectorAll('img').length === 3
  && deepSeaFullDoc.querySelectorAll('table').length === 1
  && deepSeaFullDoc.querySelector('[data-longform-article="true"]')
  && deepSeaBodies.length === fullEffectTokens.filter(function (token) { return token.type === 'section'; }).length
  && deepSeaBodies.every(function (body) { return body.style.maxWidth === '370px'; })
  && deepSeaBodies.every(function (body) {
    return Array.from(body.children).filter(function (node) { return node.tagName === 'P'; })
      .every(function (node) { return node.style.fontSize === '13px' && node.style.lineHeight === '1.86'; });
  })
  && deepSeaFullHtml.indexOf('#FF5F57') !== -1
  && deepSeaFullHtml.indexOf('font-style:italic') !== -1
  && deepSeaFullHtml.indexOf('text-decoration:line-through') !== -1
  && deepSeaFullHtml.indexOf('border-bottom:2px solid') !== -1
  && deepSeaFullHtml.indexOf('background:linear-gradient(transparent 60%') !== -1
  && deepSeaFullHtml.indexOf('font-family:Menlo') !== -1
  && deepSeaHeader && /background:\s*#17242D/i.test(deepSeaHeader.getAttribute('style') || '')
  && /color:\s*#5FAE9E/i.test(deepSeaHeader.getAttribute('style') || '')
  && deepSeaSignature && /background:\s*#17242D/i.test(deepSeaSignature.getAttribute('style') || '')
  && deepSeaSignatureText && /color:\s*#D8E1E1/i.test(deepSeaSignatureText.getAttribute('style') || '')
  && Validator.validate(deepSeaFullHtml).ok;
console.log('advanced-full-effect-parity ' + (fullEffectParityOk ? 'PASS' : 'FAIL')
  + ' types=' + requiredEffectTypes.filter(function (type) { return fullEffectTypes.has(type); }).join(','));
if (!fullEffectParityOk) fail = true;

let fullEffectThemeFailures = 0;
for (const profile of OriginalData.PROFILES) {
  const spec = Themes.getSpec(profile.themeId);
  const requirements = OriginalVisuals.assetRequirements(
    profile.themeId, 'motion-themed-frame', false, manifest
  );
  const assets = loadOriginalAssets(requirements);
  const html = OriginalVisuals.render(fullEffectTokens, spec, {
    author: '蓝梦', levelId: 'motion-themed-frame', motionEnabled: false
  }, assets, manifest);
  const doc = new JSDOM(html).window.document;
  const textContent = doc.body.textContent.replace(/\s+/g, ' ');
  const effectTypes = new Set(Array.from(doc.querySelectorAll('[data-advanced-effect]'), function (node) {
    return node.getAttribute('data-advanced-effect');
  }));
  const bodies = Array.from(doc.querySelectorAll('[data-section-body="true"]'));
  const themeParityOk = doc.querySelectorAll('table').length === 1
    && doc.querySelectorAll('img').length === 3
    && requiredEffectTypes.every(function (type) { return effectTypes.has(type); })
    && doc.querySelector('[data-longform-article="true"]')
    && bodies.length === fullEffectTokens.filter(function (token) { return token.type === 'section'; }).length
    && bodies.every(function (body) { return body.style.maxWidth === '370px'; })
    && html.indexOf('#FF5F57') !== -1
    && html.indexOf('font-style:italic') !== -1
    && html.indexOf('text-decoration:line-through') !== -1
    && html.indexOf('background:linear-gradient(transparent 60%') !== -1
    && html.indexOf('font-family:Menlo') !== -1
    && textContent.indexOf('效能数据先说话') !== -1
    && textContent.indexOf('需求平均交付周期') !== -1
    && textContent.indexOf('最大的坑') !== -1
    && textContent.indexOf('ABOUT · 作者') !== -1
    && Validator.validate(html).ok;
  if (!themeParityOk) {
    console.log('ADVANCED FULL EFFECT FAIL ' + profile.themeId);
    fullEffectThemeFailures++;
  }
}
console.log('advanced-full-effect-themes ' + (fullEffectThemeFailures === 0 ? 'PASS' : 'FAIL')
  + ' themes=' + OriginalData.PROFILES.length + ' failures=' + fullEffectThemeFailures);
if (fullEffectThemeFailures) fail = true;

/* 默认示例没有图床：16 套最终模板均用本主题目录纹样占位，且占位副本不得携带动画。 */
let advancedPlaceholderFailures = 0;
for (const profile of OriginalData.PROFILES) {
  const spec = Themes.getSpec(profile.themeId);
  const requirements = OriginalVisuals.assetRequirements(
    profile.themeId, 'motion-themed-frame', true, manifest
  );
  const assets = loadOriginalAssets(requirements);
  const html = OriginalVisuals.render(placeholderTokens, spec, {
    author: '', levelId: 'motion-themed-frame', motionEnabled: true
  }, assets, manifest);
  const doc = new JSDOM(html).window.document;
  const placeholders = Array.from(doc.querySelectorAll('[data-image-kind="theme-placeholder"]'));
  const placeholderOk = placeholders.length === 3
    && doc.querySelectorAll('img').length === 0
    && placeholders.map(function (node) { return node.getAttribute('data-placeholder-ratio'); }).join(',') === '16:9,4:5,2.35:1'
    && placeholders.every(function (node) { return node.getAttribute('data-placeholder-theme') === profile.styleId; })
    && placeholders.every(function (node) { return node.querySelectorAll('[data-placeholder-theme-motif="true"]').length === 1; })
    && placeholders.every(function (node) { return node.querySelectorAll('animate,animateTransform,animateMotion,set').length === 0; })
    && doc.querySelectorAll('animate,animateTransform').length > 0
    && Validator.validate(html).ok;
  if (!placeholderOk) {
    console.log('ADVANCED PLACEHOLDER FAIL ' + profile.themeId);
    advancedPlaceholderFailures++;
  }
}
console.log('advanced-theme-placeholders ' + (advancedPlaceholderFailures === 0 ? 'PASS' : 'FAIL')
  + ' themes=' + OriginalData.PROFILES.length + ' failures=' + advancedPlaceholderFailures);
if (advancedPlaceholderFailures) fail = true;

function viewBoxes(html) {
  return Array.from(html.matchAll(/<svg\b[^>]*viewBox="([^"]+)"/g), function (match) { return match[1]; });
}

let originalCombinations = 0;
let originalFailures = 0;
let dynamicPairs = 0;
let exportTypographyOk = false;
const expectedSectionCount = tokens.filter(function (token) { return token.type === 'section'; }).length || 1;

const firstOriginalSpec = Themes.SPECS.find(function (spec) { return spec.group === 'motion'; });
const minimalHtml = OriginalVisuals.render(tokens, firstOriginalSpec, {
  author: '张三', levelId: 'minimal-mono', motionEnabled: false
}, {}, null);
const minimalValidation = Validator.validate(minimalHtml);
const minimalTitleSize = new JSDOM(minimalHtml).window.document.querySelector('h1').style.fontSize;
originalCombinations++;
if (!minimalValidation.ok || /<svg\b/i.test(minimalHtml) || minimalTitleSize !== '28px') {
  console.log('ORIGINAL FAIL minimal-mono ' + JSON.stringify(minimalValidation.errors));
  originalFailures++;
}

/* 手机宽度下，固定视觉框只接短导语；其余前言必须回到可增高的正常文流。 */
const mobileRequirements = OriginalVisuals.assetRequirements(
  firstOriginalSpec.id, 'motion-themed-frame', true, manifest
);
const mobileAssets = loadOriginalAssets(mobileRequirements);
const mobilePreludeMd = '# 手机预览排版 / 十字以内的短导语\n\n'
  + '> 这条引用必须保留在正常文流里，不能与下一段拼进固定框。\n\n'
  + '这段前言也必须独立排版，并随着内容自然增高。\n\n'
  + '## 第一章\n\n正文内容。';
const mobilePreludeHtml = OriginalVisuals.render(Converter.parse(mobilePreludeMd), firstOriginalSpec, {
  author: '', levelId: 'motion-themed-frame', motionEnabled: true
}, mobileAssets, manifest);
const mobilePreludeDoc = new JSDOM(mobilePreludeHtml).window.document;
const mobilePreludeRoot = mobilePreludeDoc.body.firstElementChild;
const mobilePreludeFrame = Array.from(mobilePreludeRoot.children).find(function (node) {
  return node.getAttribute('data-component-role') === 'frame';
});
const mobilePreludeDirectory = Array.from(mobilePreludeRoot.children).findIndex(function (node) {
  return node.getAttribute('data-component-role') === 'directory';
});
const mobilePreludeHeading = Array.from(mobilePreludeRoot.children).findIndex(function (node) {
  return node.getAttribute('data-article-section-heading') === 'true';
});
const mobileFlowText = Array.from(mobilePreludeRoot.children)
  .slice(mobilePreludeDirectory + 1, mobilePreludeHeading)
  .map(function (node) { return node.textContent.replace(/\s+/g, ' ').trim(); })
  .join(' ');
const mobilePreludeOk = mobilePreludeFrame
  && mobilePreludeFrame.textContent.indexOf('十字以内的短导语') !== -1
  && mobilePreludeFrame.textContent.indexOf('这条引用必须保留') === -1
  && mobileFlowText.indexOf('这条引用必须保留在正常文流里') !== -1
  && mobileFlowText.indexOf('这段前言也必须独立排版') !== -1;

const longPrelude = '这是一段故意超过固定视觉框容量的前言内容，用来确认系统不会为了保留装饰而把长文字强行塞进固定高度的画框。';
const longPreludeHtml = OriginalVisuals.render(Converter.parse(
  '# 没有副标题的文章\n\n' + longPrelude + '\n\n## 第一章\n\n正文内容。'
), firstOriginalSpec, {
  author: '', levelId: 'motion-themed-frame', motionEnabled: true
}, mobileAssets, manifest);
const longPreludeDoc = new JSDOM(longPreludeHtml).window.document;
const longPreludeRoot = longPreludeDoc.body.firstElementChild;
const longPreludeFrame = Array.from(longPreludeRoot.children).find(function (node) {
  return node.getAttribute('data-component-role') === 'frame';
});
const longPreludeOk = !longPreludeFrame && longPreludeRoot.textContent.indexOf(longPrelude) !== -1;
const mobileContentOk = mobilePreludeOk && longPreludeOk;
console.log('original-mobile-content ' + (mobileContentOk ? 'PASS' : 'FAIL')
  + ' shortLead=' + !!mobilePreludeOk + ' longLeadFallback=' + !!longPreludeOk);
if (!mobileContentOk) originalFailures++;

for (const profile of OriginalData.PROFILES) {
  const spec = Themes.getSpec(profile.themeId);
  if (spec.group !== 'motion' || spec.name !== profile.name) {
    console.log('ORIGINAL REGISTRY FAIL ' + profile.themeId + ' spec=' + spec.name + ' profile=' + profile.name);
    originalFailures++;
    continue;
  }
  for (const level of OriginalData.LEVELS.slice(1)) {
    const dynamic = level.motion !== 'none';
    const requirements = OriginalVisuals.assetRequirements(profile.themeId, level.id, dynamic, manifest);
    const assets = loadOriginalAssets(requirements);
    let html;
    try {
      html = OriginalVisuals.render(tokens, spec, {
        author: '张三', levelId: level.id, motionEnabled: dynamic
      }, assets, level.order >= 3 ? manifest : null);
    } catch (error) {
      console.log('ORIGINAL RENDER FAIL ' + profile.themeId + ' ' + level.id + ' ' + error.message);
      originalFailures++;
      originalCombinations++;
      continue;
    }
    const validation = Validator.validate(html);
    if (!validation.ok || html.indexOf('data-original-level="' + level.id + '"') === -1) {
      console.log('ORIGINAL VALIDATION FAIL ' + profile.themeId + ' ' + level.id
        + ' errors=' + JSON.stringify(validation.errors));
      originalFailures++;
    }
    if (level.order >= 4) {
      const rendered = new JSDOM(html).window.document;
      const root = rendered.body.firstElementChild;
      const title = Array.from(root.children).find(function (node) { return node.getAttribute('data-component-role') === 'title'; });
      const frame = Array.from(root.children).find(function (node) { return node.getAttribute('data-component-role') === 'frame'; });
      const directory = Array.from(root.children).find(function (node) { return node.getAttribute('data-component-role') === 'directory'; });
      const tail = root.lastElementChild;
      const tailCopy = tail && tail.querySelector('[data-tail-copy="true"]');
      const sectionCount = root.querySelectorAll('[data-article-section-heading="true"]').length;
      const motionCount = root.querySelectorAll('animate,animateTransform').length;
      const titleMotionCount = title ? title.querySelectorAll('animate,animateTransform').length : 0;
      const tailMotionCount = tail ? tail.querySelectorAll('animate,animateTransform').length : 0;
      if (profile.themeId === 'deep-sea' && level.id === 'motion-themed-frame') {
        const articleHeading = root.querySelector('[data-article-section-heading="true"]');
        const articleBody = articleHeading.nextElementSibling;
        const bodyParagraph = articleBody && articleBody.querySelector('p');
        exportTypographyOk = title.querySelector('h1').style.fontSize === '18px'
          && frame.querySelector('p').style.fontSize === '12px'
          && directory.querySelector('h2').style.fontSize === '16px'
          && articleHeading.querySelector('h2').style.fontSize === '15px'
          && articleBody && articleBody.getAttribute('data-section-body') === 'true'
          && articleBody.style.maxWidth === '370px'
          && bodyParagraph && bodyParagraph.style.fontSize === '13px'
          && bodyParagraph.style.lineHeight === '1.86'
          && title.querySelector('p').style.fontSize === '7.5px';
      }
      const structureOk = root.getAttribute('data-original-template-release') === 'v30-standard402-full-effects'
        && title && frame && directory && tail && tail.getAttribute('data-component-role') === 'tail'
        && root.querySelector('[data-title-copy="true"]')
        && root.querySelector('[data-frame-content-kind]')
        && directory.querySelector('[data-semantic-role="article-directory"]')
        && root.querySelector('[data-longform-article="true"]')
        && root.querySelectorAll('[data-section-body="true"]').length === expectedSectionCount
        && tailCopy && tailCopy.getAttribute('data-tail-slot-source') === 'content_anchor'
        && sectionCount === expectedSectionCount
        && (level.id !== 'static-themed-frame' || motionCount === 0)
        && (level.id !== 'motion-title-static-frame' || (titleMotionCount > 0 && motionCount === titleMotionCount && tailMotionCount === 0))
        && (level.id !== 'motion-themed-frame' || tailMotionCount > 0);
      if (!structureOk) {
        console.log('FINAL TEMPLATE STRUCTURE FAIL ' + profile.themeId + ' ' + level.id
          + ' sections=' + sectionCount + ' motion=' + motionCount + ' titleMotion=' + titleMotionCount
          + ' tailMotion=' + tailMotionCount);
        originalFailures++;
      }
    }
    if (dynamic) {
      dynamicPairs++;
      const fallbackRequirements = OriginalVisuals.assetRequirements(profile.themeId, level.id, false, manifest);
      const fallbackAssets = loadOriginalAssets(fallbackRequirements);
      const fallback = OriginalVisuals.render(tokens, spec, {
        author: '张三', levelId: level.id, motionEnabled: false
      }, fallbackAssets, manifest);
      const fallbackValidation = Validator.validate(fallback);
      const dynamicHasMotion = /<(?:animate|animateTransform)\b/i.test(html);
      const fallbackHasMotion = /<(?:animate|animateTransform)\b/i.test(fallback);
      const fallbackDoc = new JSDOM(fallback).window.document;
      const fallbackRoot = fallbackDoc.body.firstElementChild;
      const fallbackTail = fallbackRoot && fallbackRoot.lastElementChild;
      const fallbackTailCopy = fallbackTail && fallbackTail.querySelector('[data-tail-copy="true"]');
      const fallbackAnchorOk = level.order < 4 || (fallbackTail
        && fallbackTail.getAttribute('data-component-role') === 'tail'
        && fallbackTailCopy && fallbackTailCopy.getAttribute('data-tail-slot-source') === 'content_anchor');
      if (!fallbackValidation.ok || !dynamicHasMotion || fallbackHasMotion
          || !fallbackAnchorOk || JSON.stringify(viewBoxes(html)) !== JSON.stringify(viewBoxes(fallback))) {
        console.log('ORIGINAL PAIR FAIL ' + profile.themeId + ' ' + level.id
          + ' dynamic=' + dynamicHasMotion + ' fallbackMotion=' + fallbackHasMotion
          + ' fallbackAnchor=' + fallbackAnchorOk + ' fallbackErrors=' + JSON.stringify(fallbackValidation.errors));
        originalFailures++;
      }
    }
    originalCombinations++;
  }
}

console.log('advanced-standard402-typography ' + (exportTypographyOk ? 'PASS' : 'FAIL')
  + ' exported-deep-sea=18/12/16/15/13/7.5 minimal=' + minimalTitleSize);
if (!exportTypographyOk) originalFailures++;

const combinationOk = originalCombinations === 81 && originalFailures === 0 && dynamicPairs === 32;
console.log('original-visuals ' + (combinationOk ? 'PASS' : 'FAIL')
  + ' combinations=' + originalCombinations + ' dynamicPairs=' + dynamicPairs
  + ' failures=' + originalFailures);
if (!combinationOk) fail = true;

/* 158 个 SVG 必须保持保守子集，禁止可执行/引用型特性。 */
let unsafeSvg = 0;
for (const component of manifest.components) {
  for (const key of ['static_file', 'motion_file']) {
    const site = OriginalVisuals.sitePath(component[key]);
    const svg = fs.readFileSync(path.join(__dirname, site), 'utf8');
    if (/<(?:script|style|defs|symbol|use|image|foreignObject|filter|mask|clipPath)\b|\b(?:id|class|xlink:href)\s*=/i.test(svg)) {
      console.log('SVG SAFETY FAIL ' + site);
      unsafeSvg++;
    }
  }
}
console.log('svg-safety ' + (unsafeSvg === 0 ? 'PASS' : 'FAIL') + ' files=158 unsafe=' + unsafeSvg);
if (unsafeSvg) fail = true;

/* ---------- 高级排版配色系统：16 主题 × 5 配色（默认 + 4 定制） ---------- */

function colorLuminance(hex) {
  const channels = [1, 3, 5].map(function (offset) {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function colorContrast(a, b) {
  const [l1, l2] = [colorLuminance(a), colorLuminance(b)].sort(function (x, y) { return y - x; });
  return (l1 + 0.05) / (l2 + 0.05);
}

function normalizeHexColor(value) {
  const hex = String(value).toUpperCase().slice(1);
  if (hex.length !== 3) return '#' + hex;
  return '#' + hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
}

const COLORWAY_CORE_ROLES = ['paper', 'surface', 'ink', 'muted', 'accent', 'accent2', 'line'];
const COLORWAY_EXTRA_ROLES = ['gridLine', 'surfaceInk', 'surfaceMuted', 'wash', 'washSoft', 'decor', 'decorSoft'];

let colorwayEntryFailures = 0;
let colorwayVariantCount = 0;
for (const profile of OriginalData.PROFILES) {
  const list = OriginalData.colorwaysForTheme(profile.themeId);
  if (!list || list.length !== 5 || list[0].id !== 'default' || list[0].colors) {
    console.log('COLORWAY REGISTRY FAIL ' + profile.themeId + ' 必须为 5 条且首条 default 不带 colors');
    colorwayEntryFailures++;
    continue;
  }
  colorwayVariantCount += list.length - 1;
  const ids = new Set(list.map(function (entry) { return entry.id; }));
  if (ids.size !== list.length || list.some(function (entry) { return !entry.id || !entry.name; })) {
    console.log('COLORWAY REGISTRY FAIL ' + profile.themeId + ' id 重复或名称缺失');
    colorwayEntryFailures++;
  }
  if (OriginalData.profileForTheme(profile.themeId, 'non-existent') !== OriginalData.profileForTheme(profile.themeId)) {
    console.log('COLORWAY REGISTRY FAIL ' + profile.themeId + ' 未知 colorId 必须回退默认配色');
    colorwayEntryFailures++;
  }
}
console.log('colorway-registry ' + (colorwayEntryFailures === 0 ? 'PASS' : 'FAIL')
  + ' themes=' + OriginalData.PROFILES.length + ' variants=' + colorwayVariantCount);
if (colorwayEntryFailures) fail = true;

let colorwayRoleFailures = 0;
for (const profile of OriginalData.PROFILES) {
  const required = COLORWAY_CORE_ROLES.concat(
    COLORWAY_EXTRA_ROLES.filter(function (role) { return typeof profile[role] === 'string'; })
  );
  for (const entry of OriginalData.colorwaysForTheme(profile.themeId).slice(1)) {
    let merged = null;
    try {
      merged = OriginalData.profileForTheme(profile.themeId, entry.id);
    } catch (error) {
      console.log('COLORWAY ROLE FAIL ' + profile.themeId + '/' + entry.id + ' ' + error.message);
      colorwayRoleFailures++;
      continue;
    }
    for (const role of required) {
      const value = entry.colors[role];
      const valid = role === 'gridLine'
        ? /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0?\.\d+\s*\)$/.test(value || '')
        : /^#[0-9A-Fa-f]{6}$/.test(value || '');
      if (!valid) {
        console.log('COLORWAY ROLE FAIL ' + profile.themeId + '/' + entry.id + ' 角色 ' + role + ' 缺失或格式非法');
        colorwayRoleFailures++;
      }
    }
    if (merged.accentOn !== merged.paper) {
      console.log('COLORWAY ROLE FAIL ' + profile.themeId + '/' + entry.id + ' accentOn 必须跟随 paper');
      colorwayRoleFailures++;
    }
    if (!merged.underline || merged.underline.indexOf(merged.accent2) === -1) {
      console.log('COLORWAY ROLE FAIL ' + profile.themeId + '/' + entry.id + ' underline 未随配色重建');
      colorwayRoleFailures++;
    }
  }
}
console.log('colorway-roles ' + (colorwayRoleFailures === 0 ? 'PASS' : 'FAIL'));
if (colorwayRoleFailures) fail = true;

let colorwayMapFailures = 0;
for (const profile of OriginalData.PROFILES) {
  for (const entry of OriginalData.colorwaysForTheme(profile.themeId).slice(1)) {
    const merged = OriginalData.profileForTheme(profile.themeId, entry.id);
    const sources = new Set(merged.colorMap.map(function (pair) { return pair[0]; }));
    if (sources.size !== merged.colorMap.length) {
      console.log('COLORWAY MAP FAIL ' + profile.themeId + '/' + entry.id + ' 存在一源多目标的冲突映射');
      colorwayMapFailures++;
    }
    if (!merged.colorMap.length) {
      console.log('COLORWAY MAP FAIL ' + profile.themeId + '/' + entry.id + ' 变体必须至少改变一个颜色');
      colorwayMapFailures++;
    }
  }
}
console.log('colorway-map ' + (colorwayMapFailures === 0 ? 'PASS' : 'FAIL'));
if (colorwayMapFailures) fail = true;

/* 冻结模板 + 组件 SVG 内出现的每个着色 hex（含 3 位缩写）都必须属于该主题的默认角色值，
 * 否则配色变体会在模板上留下换不掉的“孤儿色”。 */
let colorwayCoverageFailures = 0;
for (const profile of OriginalData.PROFILES) {
  const entry = templateManifest.templates.find(function (item) { return item.style === profile.styleId; });
  if (!entry) {
    console.log('COLORWAY COVERAGE FAIL ' + profile.themeId + ' 模板清单缺条目');
    colorwayCoverageFailures++;
    continue;
  }
  const roleValues = new Set(COLORWAY_CORE_ROLES.concat(COLORWAY_EXTRA_ROLES, ['accentOn'])
    .map(function (role) { return profile[role]; })
    .filter(function (value) { return typeof value === 'string' && value.charAt(0) === '#'; })
    .map(normalizeHexColor));
  const sources = {};
  for (const file of [entry.motion_file, entry.static_file]) {
    const html = fs.readFileSync(path.join(__dirname, 'motion', 'templates-v6', file), 'utf8');
    for (const hex of html.match(/#[0-9A-Fa-f]{3,6}\b/g) || []) {
      sources[normalizeHexColor(hex)] = true;
    }
  }
  for (const component of manifest.components) {
    if (component.style !== profile.styleId) continue;
    for (const key of ['static_file', 'motion_file']) {
      const svg = fs.readFileSync(path.join(__dirname, OriginalVisuals.sitePath(component[key])), 'utf8');
      for (const hex of svg.match(/#[0-9A-Fa-f]{3,6}\b/g) || []) {
        sources[normalizeHexColor(hex)] = true;
      }
    }
  }
  for (const hex of Object.keys(sources)) {
    if (!roleValues.has(hex)) {
      console.log('COLORWAY COVERAGE FAIL ' + profile.themeId + ' 资产色 ' + hex + ' 不在默认配色角色中，变体无法覆盖');
      colorwayCoverageFailures++;
    }
  }
}
console.log('colorway-asset-coverage ' + (colorwayCoverageFailures === 0 ? 'PASS' : 'FAIL')
  + ' themes=' + OriginalData.PROFILES.length);
if (colorwayCoverageFailures) fail = true;

/* 可读性底线：正文、次要文字、强调色、强调底上的文字对比度。 */
let colorwayContrastFailures = 0;
for (const profile of OriginalData.PROFILES) {
  const variants = [{ id: 'default' }].concat(OriginalData.colorwaysForTheme(profile.themeId).slice(1));
  for (const entry of variants) {
    const merged = OriginalData.profileForTheme(profile.themeId, entry.id);
    const label = profile.themeId + '/' + merged.colorId;
    const checks = [
      ['ink/paper', colorContrast(merged.ink, merged.paper), 4.5],
      ['muted/paper', colorContrast(merged.muted, merged.paper), 3.5],
      ['accent/paper', colorContrast(merged.accent, merged.paper), 3],
      ['accentOn/accent', colorContrast(merged.accentOn, merged.accent), 3]
    ];
    if (merged.surfaceInk) checks.push(['surfaceInk/surface', colorContrast(merged.surfaceInk, merged.surface), 4.5]);
    for (const [name, ratio, min] of checks) {
      if (ratio < min) {
        console.log('COLORWAY CONTRAST FAIL ' + label + ' ' + name + '=' + ratio.toFixed(2) + ' < ' + min);
        colorwayContrastFailures++;
      }
    }
  }
}
console.log('colorway-contrast ' + (colorwayContrastFailures === 0 ? 'PASS' : 'FAIL')
  + ' combinations=' + (OriginalData.PROFILES.length * 5));
if (colorwayContrastFailures) fail = true;

/* 渲染级验证：每个变体输出不得残留任何“已变化的默认色”，且携带追溯属性。 */
const colorwayRenderMd = [
  '# 配色验证标题', '',
  '这段**正文**用于确认换色后的内容注入块。', '',
  '> 引用块确认装饰色。', '',
  '- 列表项确认符号色。', '',
  '## 章节一', '第二章正文确认章节标题与段落。', '',
  '## 章节二', '![占位](placeholder://16-9)', '',
  '---', '', '署名：配色验证'
].join('\n');
const colorwayRenderTokens = Converter.parse(colorwayRenderMd);
let colorwayRenderFailures = 0;
let colorwayRenderCount = 0;
for (const profile of OriginalData.PROFILES) {
  const spec = Themes.getSpec(profile.themeId);
  const assets = loadOriginalAssets(OriginalVisuals.assetRequirements(profile.themeId, 'motion-themed-frame', true, manifest));
  for (const entry of OriginalData.colorwaysForTheme(profile.themeId)) {
    const merged = OriginalData.profileForTheme(profile.themeId, entry.id);
    const colorMap = merged.colorMap || [];
    const html = OriginalVisuals.render(colorwayRenderTokens, spec, {
      levelId: 'motion-themed-frame', motionEnabled: true, colorId: entry.id
    }, assets, manifest);
    colorwayRenderCount++;
    for (const [from, to] of colorMap) {
      const residue = new RegExp(escapeRegExp(from) + '\\b', 'gi');
      if (residue.test(html)) {
        console.log('COLORWAY RENDER FAIL ' + profile.themeId + '/' + entry.id + ' 残留默认色 ' + from + '（应替换为 ' + to + '）');
        colorwayRenderFailures++;
      }
    }
    if (html.indexOf('data-original-colorway="' + entry.id + '"') === -1) {
      console.log('COLORWAY RENDER FAIL ' + profile.themeId + '/' + entry.id + ' 缺少 colorway 追溯属性');
      colorwayRenderFailures++;
    }
  }
}
console.log('colorway-render ' + (colorwayRenderFailures === 0 ? 'PASS' : 'FAIL')
  + ' combinations=' + colorwayRenderCount);
if (colorwayRenderFailures) fail = true;

/* 工坊 UI：配色弹层插槽、事件接线与渲染参数必须就位。 */
const colorwayUiOk = studioDoc.getElementById('colorPickerSlot')
  && appSource.indexOf('function buildColorPicker()') !== -1
  && appSource.indexOf('function renderColorControls()') !== -1
  && appSource.indexOf('function renderColorPop()') !== -1
  && appSource.indexOf('colorId: state.colorId') !== -1
  && appSource.indexOf('state.colorId = \'default\';') !== -1
  && appSource.indexOf('buildColorPicker();') !== -1
  && appSource.indexOf('closeColorPicker();') !== -1
  && stylesSource.indexOf('.color-pop') !== -1;
console.log('colorway-ui ' + (colorwayUiOk ? 'PASS' : 'FAIL'));
if (!colorwayUiOk) fail = true;

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

process.exit(fail ? 1 : 0);

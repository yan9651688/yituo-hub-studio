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

const baseLibrary = Themes.LIBRARIES.find(function (library) { return library.id === 'base'; });
const originalLibrary = Themes.LIBRARIES.find(function (library) { return library.id === 'original'; });
const baseThemeCount = Themes.SPECS.filter(function (spec) { return baseLibrary.groups.includes(spec.group); }).length;
const originalThemeCount = Themes.SPECS.filter(function (spec) { return originalLibrary.groups.includes(spec.group); }).length;
const librariesOk = baseThemeCount === 18 && originalThemeCount === 15
  && originalLibrary.name === '高级排版' && originalLibrary.shortName === '高级排版'
  && baseLibrary.groups.every(function (group) { return !originalLibrary.groups.includes(group); });
console.log('theme-libraries ' + (librariesOk ? 'PASS' : 'FAIL')
  + ' base=' + baseThemeCount + ' original=' + originalThemeCount);
if (!librariesOk) fail = true;

const md = fs.readFileSync(path.join(__dirname, 'assets/sample-article.md'), 'utf8');
const tokens = Converter.parse(md);
console.log('tokens: ' + tokens.map(function (t) { return t.type; }).join(','));

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

/* 冻结的 V24 静态终稿与其 V6 动态派生文件必须逐字节保持原始哈希。 */
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

/* 高级排版（蓝梦原创视觉）：1 个单例 + 15 主题 × 5 档 = 76 个组合。 */
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

function viewBoxes(html) {
  return Array.from(html.matchAll(/<svg\b[^>]*viewBox="([^"]+)"/g), function (match) { return match[1]; });
}

let originalCombinations = 0;
let originalFailures = 0;
let dynamicPairs = 0;
const expectedSectionCount = tokens.filter(function (token) { return token.type === 'section'; }).length || 1;

const firstOriginalSpec = Themes.SPECS.find(function (spec) { return spec.group === 'motion'; });
const minimalHtml = OriginalVisuals.render(tokens, firstOriginalSpec, {
  author: '张三', levelId: 'minimal-mono', motionEnabled: false
}, {}, null);
const minimalValidation = Validator.validate(minimalHtml);
originalCombinations++;
if (!minimalValidation.ok || /<svg\b/i.test(minimalHtml)) {
  console.log('ORIGINAL FAIL minimal-mono ' + JSON.stringify(minimalValidation.errors));
  originalFailures++;
}

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
      const structureOk = root.getAttribute('data-original-template-release') === 'v24-static-final'
        && title && frame && directory && tail && tail.getAttribute('data-component-role') === 'tail'
        && root.querySelector('[data-title-copy="true"]')
        && root.querySelector('[data-frame-content-kind]')
        && directory.querySelector('[data-semantic-role="article-directory"]')
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

const combinationOk = originalCombinations === 76 && originalFailures === 0 && dynamicPairs === 30;
console.log('original-visuals ' + (combinationOk ? 'PASS' : 'FAIL')
  + ' combinations=' + originalCombinations + ' dynamicPairs=' + dynamicPairs
  + ' failures=' + originalFailures);
if (!combinationOk) fail = true;

/* 148 个 SVG 必须保持保守子集，禁止可执行/引用型特性。 */
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
console.log('svg-safety ' + (unsafeSvg === 0 ? 'PASS' : 'FAIL') + ' files=148 unsafe=' + unsafeSvg);
if (unsafeSvg) fail = true;

process.exit(fail ? 1 : 0);

/* 蓝梦原创视觉系统：15 套定稿主题 × 6 档展示等级。
 * 数据取自 wechat-motion-layout Production V6 / presentation-levels v2。
 */
(function (global, factory) {
  var api = factory();
  global.Md2GZHOriginalData = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var LEVELS = [
    { id: 'minimal-mono', order: 1, name: '黑白极简', short: '黑白极简', description: '全库唯一一套黑白排版，只保留文字层级、留白与细线。', motion: 'none' },
    { id: 'static-simple', order: 2, name: '静态简约', short: '静态简约', description: '十五套定稿静态模板，保留各自结构与阅读节奏。', motion: 'none' },
    { id: 'static-title-bar', order: 3, name: '静态装饰标题栏', short: '静态标题栏', description: '增加静态标题引导线与同主题章节路径装饰。', motion: 'none' },
    { id: 'static-themed-frame', order: 4, name: '静态主题场景', short: '静态主题场景', description: '严格使用冻结的 V24 完整静态模板，保留标题、目录、章节与尾部锚点。', motion: 'none' },
    { id: 'motion-title-static-frame', order: 5, name: '标题场景动效', short: '标题场景动效', description: '使用 V6 动态标题，其余结构保持冻结的 V24 静态模板。', motion: 'title-scene-only' },
    { id: 'motion-themed-frame', order: 6, name: '完整主题动效', short: '完整主题动效', description: '严格使用由 V24 静态终稿派生的 V6 完整动态模板，正文保持可编辑。', motion: 'production-v6-full' }
  ];

  /* themeId 是 Yi Tuo Hub 内部 ID；styleId 是 Production V6 资产 ID。 */
  var PROFILES = [
    { themeId: 'vermilion', styleId: 'editorial-vermilion', name: '墨红社论', school: 'editorial', bestFor: '深度观点、评论', paper: '#FFFFFF', surface: '#FBFAF8', ink: '#201F1D', muted: '#777168', accent: '#B33A2B', accent2: '#E4C5B8', line: '#DDD8D0', radius: 0, border: 1, header: 'masthead', section: 'rule-number', brief: 'columns', quote: 'oversize', finish: 'signature', density: 'airy', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'mono-gold', styleId: 'mono-gold-journal', name: '黑金刊读', school: 'editorial', bestFor: '品牌观点、专业长文', paper: '#FFFFFF', surface: '#FBFAF6', ink: '#171714', muted: '#6D675B', accent: '#87682F', accent2: '#D8CCAE', line: '#C7BEAD', radius: 4, border: 1, header: 'luxury-rule', section: 'roman', brief: 'ledger', quote: 'centered', finish: 'thin-rule', density: 'airy', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'coral-zine', styleId: 'coral-zine', name: '珊瑚杂志', school: 'editorial', bestFor: '人物、文化、生活方式', paper: '#FFFFFF', surface: '#FFF7F5', ink: '#402D33', muted: '#79676C', accent: '#B95054', accent2: '#E4B1A6', line: '#E9D8D4', radius: 18, border: 0, header: 'zine-block', section: 'pill-index', brief: 'stacked', quote: 'soft-card', finish: 'color-band', density: 'balanced', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'swiss-signal', styleId: 'swiss-signal', name: '瑞士信号', school: 'international', bestFor: '方法论、清单、工具文章', paper: '#FFFFFF', surface: '#F7F7F5', ink: '#1D1D1B', muted: '#66645E', accent: '#3157A4', accent2: '#D0B85A', line: '#C8C7C2', radius: 0, border: 2, header: 'split-grid', section: 'block-index', brief: 'number-grid', quote: 'hard-box', finish: 'square-mark', density: 'compact', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'citrus', styleId: 'citrus-report', name: '柑橘报告', school: 'international', bestFor: '数据报告、复盘', paper: '#FFFFFF', surface: '#F8FAF1', ink: '#20241F', muted: '#6D736A', accent: '#65731F', accent2: '#C87945', line: '#D2D7CD', radius: 8, border: 1, header: 'report-strip', section: 'marker-line', brief: 'metric-row', quote: 'highlight-band', finish: 'report-end', density: 'compact', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'blueprint', styleId: 'blueprint-grid', name: '蓝图网格', school: 'international', bestFor: '技术教程、流程说明', paper: '#FFFFFF', surface: '#F7FAFC', ink: '#16364A', muted: '#5D7480', accent: '#2F718C', accent2: '#B86157', line: '#C8D9E0', radius: 2, border: 1, header: 'technical-plate', section: 'coordinate', brief: 'spec-list', quote: 'annotation', finish: 'axis', density: 'compact', backgroundMode: 'grid', gridLine: 'rgba(47,113,140,.03)', accentOn: '#FFFFFF' },
    { themeId: 'rice-paper', styleId: 'rice-paper', name: '稻纸朱砂', school: 'humanist', bestFor: '随笔、传统文化、深度观察', paper: '#FFFFFF', surface: '#FAF7F0', ink: '#34312B', muted: '#736C60', accent: '#A64232', accent2: '#C9B88F', line: '#DED5C3', radius: 2, border: 0, header: 'vertical-seal', section: 'chapter-seal', brief: 'quiet-list', quote: 'ink-quote', finish: 'red-seal', density: 'airy', backgroundMode: 'soft-local', accentOn: '#FFFFFF' },
    { themeId: 'botanical', styleId: 'botanical-notes', name: '植物手记', school: 'humanist', bestFor: '知识、自然、生活方式', paper: '#FFFFFF', surface: '#F7FAF5', ink: '#29352B', muted: '#68766A', accent: '#627A45', accent2: '#D2A66B', line: '#D2D9CC', radius: 14, border: 1, header: 'field-note', section: 'leaf-index', brief: 'specimen', quote: 'pressed-note', finish: 'herbarium', density: 'balanced', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'soft-clay', styleId: 'soft-clay', name: '柔和陶土', school: 'humanist', bestFor: '教育、成长、情绪表达', paper: '#FFFFFF', surface: '#FFF7F2', ink: '#4A352C', muted: '#806B62', accent: '#9F5E45', accent2: '#D2B49D', line: '#E7D6CB', radius: 24, border: 0, header: 'soft-arch', section: 'rounded-tab', brief: 'bubble-stack', quote: 'warm-well', finish: 'soft-dot', density: 'balanced', backgroundMode: 'soft-local', accentOn: '#FFFFFF' },
    { themeId: 'deep-sea', styleId: 'deep-sea-terminal', name: '深海终端', school: 'digital', bestFor: 'AI、开发工具、技术资讯', paper: '#101A22', surface: '#17242D', ink: '#D8E1E1', muted: '#91A3A8', accent: '#5FAE9E', accent2: '#C39A5E', line: '#30434D', radius: 8, border: 1, header: 'terminal-log', section: 'command-line', brief: 'status-grid', quote: 'console-block', finish: 'cursor', density: 'compact', backgroundMode: 'dark', accentOn: '#101A22' },
    { themeId: 'mist-research', styleId: 'mist-research', name: '雾蓝研究', school: 'digital', bestFor: '研究摘要、专业解释', paper: '#FFFFFF', surface: '#F5F8FA', ink: '#263843', muted: '#5F717C', accent: '#4F7489', accent2: '#B8CCD6', line: '#D2DEE3', radius: 12, border: 1, header: 'research-card', section: 'figure-index', brief: 'abstract-box', quote: 'paper-note', finish: 'reference-line', density: 'airy', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'violet-studio', styleId: 'violet-studio', name: '紫灰工作室', school: 'digital', bestFor: '创意工具、设计观察', paper: '#FFFFFF', surface: '#F8F6FA', ink: '#352E3E', muted: '#716779', accent: '#705B8C', accent2: '#B4C185', line: '#DDD7E1', radius: 16, border: 1, header: 'studio-board', section: 'side-code', brief: 'tile-grid', quote: 'studio-frame', finish: 'crop-marks', density: 'balanced', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'neo-brutal', styleId: 'neo-brutal', name: '新粗野', school: 'expressive', bestFor: '强观点、反常识、创意评论', paper: '#FFFFFF', surface: '#FFF8E8', ink: '#1D1D1B', muted: '#55504A', accent: '#B94A32', accent2: '#A9C8BC', line: '#1D1D1B', radius: 0, border: 3, header: 'brutal-poster', section: 'boxed-number', brief: 'offset-cards', quote: 'loud-box', finish: 'black-bar', density: 'compact', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'night-editorial', styleId: 'night-editorial', name: '暗夜编辑', school: 'expressive', bestFor: '趋势、观察、故事化科技', paper: '#FFFFFF', surface: '#242320', surfaceInk: '#F5F1E8', surfaceMuted: '#C7BFB4', ink: '#26231F', muted: '#746F68', accent: '#B95833', accent2: '#C6A85F', line: '#D8D2CA', radius: 2, border: 1, header: 'night-cover', section: 'orange-rule', brief: 'dark-ledger', quote: 'spotlight', finish: 'night-line', density: 'airy', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'sepia-archive', styleId: 'archive-sepia', name: '档案棕褐', school: 'expressive', bestFor: '案例复盘、历史、资料整理', paper: '#FFFFFF', surface: '#F8F3EA', ink: '#3A3028', muted: '#756658', accent: '#8B5B3E', accent2: '#C79C68', line: '#D4C5B0', radius: 3, border: 1, header: 'archive-folder', section: 'file-tab', brief: 'index-card', quote: 'document-stamp', finish: 'catalog-code', density: 'balanced', backgroundMode: 'white', accentOn: '#FFFFFF' }
  ];

  function profileForTheme(themeId) {
    for (var i = 0; i < PROFILES.length; i++) if (PROFILES[i].themeId === themeId) return PROFILES[i];
    return null;
  }

  function level(id) {
    for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i];
    return LEVELS[LEVELS.length - 1];
  }

  return { LEVELS: LEVELS, PROFILES: PROFILES, profileForTheme: profileForTheme, level: level };
});

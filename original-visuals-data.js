/* 蓝梦原创视觉系统：16 套定稿主题 × 6 档展示等级。
 * 数据取自 wechat-motion-layout Production V6 / presentation-levels v2。
 * 松烟刊读（pine-soot-journal）为项目内自黑金刊读派生的姊妹篇。
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

  /* themeId 是 YI TUO HUB STUDIO 内部 ID；styleId 是 Production V6 资产 ID。 */
  var PROFILES = [
    { themeId: 'vermilion', styleId: 'editorial-vermilion', name: '墨红社论', school: 'editorial', bestFor: '深度观点、评论', paper: '#FFFFFF', surface: '#FBFAF8', ink: '#201F1D', muted: '#777168', accent: '#B33A2B', accent2: '#E4C5B8', line: '#DDD8D0', radius: 0, border: 1, header: 'masthead', section: 'rule-number', brief: 'columns', quote: 'oversize', finish: 'signature', density: 'airy', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'mono-gold', styleId: 'mono-gold-journal', name: '黑金刊读', school: 'editorial', bestFor: '品牌观点、专业长文', paper: '#FFFFFF', surface: '#FBFAF6', ink: '#171714', muted: '#6D675B', accent: '#87682F', accent2: '#D8CCAE', line: '#C7BEAD', radius: 4, border: 1, header: 'luxury-rule', section: 'roman', brief: 'ledger', quote: 'centered', finish: 'thin-rule', density: 'airy', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'pine-soot', styleId: 'pine-soot-journal', name: '松烟刊读', school: 'editorial', bestFor: '人文随笔、专栏长文', paper: '#FFFFFF', surface: '#F7F8F3', ink: '#1A1D18', muted: '#6A6F64', accent: '#48603F', accent2: '#CBD6BE', line: '#C2C8B8', radius: 4, border: 1, header: 'luxury-rule', section: 'roman', brief: 'ledger', quote: 'centered', finish: 'thin-rule', density: 'airy', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'coral-zine', styleId: 'coral-zine', name: '珊瑚杂志', school: 'editorial', bestFor: '人物、文化、生活方式', paper: '#FFFFFF', surface: '#FFF7F5', ink: '#402D33', muted: '#79676C', accent: '#B95054', accent2: '#E4B1A6', line: '#E9D8D4', radius: 18, border: 0, header: 'zine-block', section: 'pill-index', brief: 'stacked', quote: 'soft-card', finish: 'color-band', density: 'balanced', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'swiss-signal', styleId: 'swiss-signal', name: '瑞士信号', school: 'international', bestFor: '方法论、清单、工具文章', paper: '#FFFFFF', surface: '#F7F7F5', ink: '#1D1D1B', muted: '#66645E', accent: '#3157A4', accent2: '#D0B85A', line: '#C8C7C2', radius: 0, border: 2, header: 'split-grid', section: 'block-index', brief: 'number-grid', quote: 'hard-box', finish: 'square-mark', density: 'compact', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'citrus', styleId: 'citrus-report', name: '柑橘报告', school: 'international', bestFor: '数据报告、复盘', paper: '#FFFFFF', surface: '#F8FAF1', ink: '#20241F', muted: '#6D736A', accent: '#65731F', accent2: '#C87945', line: '#D2D7CD', wash: '#FFF9EE', washSoft: '#FFFDF8', radius: 8, border: 1, header: 'report-strip', section: 'marker-line', brief: 'metric-row', quote: 'highlight-band', finish: 'report-end', density: 'compact', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'blueprint', styleId: 'blueprint-grid', name: '蓝图网格', school: 'international', bestFor: '技术教程、流程说明', paper: '#FFFFFF', surface: '#F7FAFC', ink: '#16364A', muted: '#5D7480', accent: '#2F718C', accent2: '#B86157', line: '#C8D9E0', radius: 2, border: 1, header: 'technical-plate', section: 'coordinate', brief: 'spec-list', quote: 'annotation', finish: 'axis', density: 'compact', backgroundMode: 'grid', gridLine: 'rgba(47,113,140,.03)', accentOn: '#FFFFFF' },
    { themeId: 'rice-paper', styleId: 'rice-paper', name: '稻纸朱砂', school: 'humanist', bestFor: '随笔、传统文化、深度观察', paper: '#FFFFFF', surface: '#FAF7F0', ink: '#34312B', muted: '#736C60', accent: '#A64232', accent2: '#C9B88F', line: '#DED5C3', radius: 2, border: 0, header: 'vertical-seal', section: 'chapter-seal', brief: 'quiet-list', quote: 'ink-quote', finish: 'red-seal', density: 'airy', backgroundMode: 'soft-local', accentOn: '#FFFFFF' },
    { themeId: 'botanical', styleId: 'botanical-notes', name: '植物手记', school: 'humanist', bestFor: '知识、自然、生活方式', paper: '#FFFFFF', surface: '#F7FAF5', ink: '#29352B', muted: '#68766A', accent: '#627A45', accent2: '#D2A66B', line: '#D2D9CC', radius: 14, border: 1, header: 'field-note', section: 'leaf-index', brief: 'specimen', quote: 'pressed-note', finish: 'herbarium', density: 'balanced', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'soft-clay', styleId: 'soft-clay', name: '柔和陶土', school: 'humanist', bestFor: '教育、成长、情绪表达', paper: '#FFFFFF', surface: '#FFF7F2', ink: '#4A352C', muted: '#806B62', accent: '#9F5E45', accent2: '#D2B49D', line: '#E7D6CB', radius: 24, border: 0, header: 'soft-arch', section: 'rounded-tab', brief: 'bubble-stack', quote: 'warm-well', finish: 'soft-dot', density: 'balanced', backgroundMode: 'soft-local', accentOn: '#FFFFFF' },
    { themeId: 'deep-sea', styleId: 'deep-sea-terminal', name: '深海终端', school: 'digital', bestFor: 'AI、开发工具、技术资讯', paper: '#101A22', surface: '#17242D', ink: '#D8E1E1', muted: '#91A3A8', accent: '#5FAE9E', accent2: '#C39A5E', line: '#30434D', radius: 8, border: 1, header: 'terminal-log', section: 'command-line', brief: 'status-grid', quote: 'console-block', finish: 'cursor', density: 'compact', backgroundMode: 'dark', accentOn: '#101A22' },
    { themeId: 'mist-research', styleId: 'mist-research', name: '雾蓝研究', school: 'digital', bestFor: '研究摘要、专业解释', paper: '#FFFFFF', surface: '#F5F8FA', ink: '#263843', muted: '#5F717C', accent: '#4F7489', accent2: '#B8CCD6', line: '#D2DEE3', radius: 12, border: 1, header: 'research-card', section: 'figure-index', brief: 'abstract-box', quote: 'paper-note', finish: 'reference-line', density: 'airy', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'violet-studio', styleId: 'violet-studio', name: '紫灰工作室', school: 'digital', bestFor: '创意工具、设计观察', paper: '#FFFFFF', surface: '#F8F6FA', ink: '#352E3E', muted: '#716779', accent: '#705B8C', accent2: '#B4C185', line: '#DDD7E1', decor: '#D97A4A', decorSoft: '#D88963', radius: 16, border: 1, header: 'studio-board', section: 'side-code', brief: 'tile-grid', quote: 'studio-frame', finish: 'crop-marks', density: 'balanced', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'neo-brutal', styleId: 'neo-brutal', name: '新粗野', school: 'expressive', bestFor: '强观点、反常识、创意评论', paper: '#FFFFFF', surface: '#FFF8E8', ink: '#1D1D1B', muted: '#55504A', accent: '#B94A32', accent2: '#A9C8BC', line: '#1D1D1B', radius: 0, border: 3, header: 'brutal-poster', section: 'boxed-number', brief: 'offset-cards', quote: 'loud-box', finish: 'black-bar', density: 'compact', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'night-editorial', styleId: 'night-editorial', name: '暗夜编辑', school: 'expressive', bestFor: '趋势、观察、故事化科技', paper: '#FFFFFF', surface: '#242320', surfaceInk: '#F5F1E8', surfaceMuted: '#C7BFB4', ink: '#26231F', muted: '#746F68', accent: '#B95833', accent2: '#C6A85F', line: '#D8D2CA', radius: 2, border: 1, header: 'night-cover', section: 'orange-rule', brief: 'dark-ledger', quote: 'spotlight', finish: 'night-line', density: 'airy', backgroundMode: 'white', accentOn: '#FFFFFF' },
    { themeId: 'sepia-archive', styleId: 'archive-sepia', name: '档案棕褐', school: 'expressive', bestFor: '案例复盘、历史、资料整理', paper: '#FFFFFF', surface: '#F8F3EA', ink: '#3A3028', muted: '#756658', accent: '#8B5B3E', accent2: '#C79C68', line: '#D4C5B0', wash: '#FBF7EF', radius: 3, border: 1, header: 'archive-folder', section: 'file-tab', brief: 'index-card', quote: 'document-stamp', finish: 'catalog-code', density: 'balanced', backgroundMode: 'white', accentOn: '#FFFFFF' }
  ];

  /* ---------- 配色系统 ----------
   * 每套高级主题在默认配色之外提供 4 套定制配色，共 5 套可选。
   * - default 条目不携带 colors，渲染时直接使用 PROFILES 的原色；
   * - 变体 colors 必须给全角色（通用 7 角色 + 主题专属角色），
   *   冻结模板与组件 SVG 在渲染期按「默认 hex → 变体 hex」整表替换上色；
   * - accentOn 在全部主题中恒等于 paper（模板同 hex 承担两角色），变体沿用该关系，不单独配置；
   * - 变体保持主题的明暗身份与 backgroundMode，只换色相个性。
   */
  var COLORWAY_ROLES = ['paper', 'surface', 'ink', 'muted', 'accent', 'accent2', 'line', 'gridLine', 'surfaceInk', 'surfaceMuted', 'wash', 'washSoft', 'decor', 'decorSoft'];
  var COLORWAY_CORE_ROLES = ['paper', 'surface', 'ink', 'muted', 'accent', 'accent2', 'line'];

  var COLORWAYS = {
    /* 墨红社论：默认朱砂红。黛蓝/松烟/紫棠/鎏金四个色相家族。 */
    vermilion: [
      { id: 'default', name: '默认' },
      { id: 'dai-lan', name: '黛蓝', colors: { paper: '#FFFFFF', surface: '#F7FAFB', ink: '#1D2429', muted: '#68757E', accent: '#2E4E68', accent2: '#C3D4DD', line: '#D3DCE1' } },
      { id: 'song-yan', name: '松烟', colors: { paper: '#FFFFFF', surface: '#F6FAF4', ink: '#21271E', muted: '#6C7767', accent: '#3E5C46', accent2: '#C7D6C2', line: '#D5DED1' } },
      { id: 'zi-tang', name: '紫棠', colors: { paper: '#FFFFFF', surface: '#FAF7FA', ink: '#262026', muted: '#746B76', accent: '#6B3D63', accent2: '#DAC4D6', line: '#DBD2D9' } },
      { id: 'liu-jin', name: '鎏金', colors: { paper: '#FFFFFF', surface: '#FBF9F1', ink: '#272215', muted: '#7B7260', accent: '#8A6A2F', accent2: '#E1D1AC', line: '#DED5C1' } }
    ],
    /* 黑金刊读：默认暖金。酒红/松石/紫檀/石墨。 */
    'mono-gold': [
      { id: 'default', name: '默认' },
      { id: 'jiu-hong', name: '酒红', colors: { paper: '#FFFFFF', surface: '#FBF6F6', ink: '#1A1416', muted: '#716266', accent: '#722F37', accent2: '#DAC2C6', line: '#CFC0C3' } },
      { id: 'song-shi', name: '松石', colors: { paper: '#FFFFFF', surface: '#F5FAF8', ink: '#131A18', muted: '#62706C', accent: '#2F6B62', accent2: '#C2D8D2', line: '#C1CFCB' } },
      { id: 'zi-tan', name: '紫檀', colors: { paper: '#FFFFFF', surface: '#FAF6F9', ink: '#181317', muted: '#6D616B', accent: '#5C3A58', accent2: '#D6C2D3', line: '#CCC0CA' } },
      { id: 'shi-mo', name: '石墨', colors: { paper: '#FFFFFF', surface: '#F7F8FA', ink: '#15171B', muted: '#666A72', accent: '#48505C', accent2: '#C9CDD4', line: '#C6CBD1' } }
    ],
    /* 松烟刊读：默认松绿。黛蓝/柿红/紫藤/玄墨。 */
    'pine-soot': [
      { id: 'default', name: '默认' },
      { id: 'dai-lan', name: '黛蓝', colors: { paper: '#FFFFFF', surface: '#F5F8F9', ink: '#1A1E24', muted: '#646C76', accent: '#3E5A74', accent2: '#C4D2DC', line: '#BFC9D2' } },
      { id: 'shi-hong', name: '柿红', colors: { paper: '#FFFFFF', surface: '#FBF5F0', ink: '#211A15', muted: '#75655C', accent: '#9E4A2F', accent2: '#E3C6B4', line: '#DAC9BC' } },
      { id: 'zi-teng', name: '紫藤', colors: { paper: '#FFFFFF', surface: '#F8F6FA', ink: '#1D1A22', muted: '#6E6878', accent: '#6A5580', accent2: '#D3C9DE', line: '#CFC8D8' } },
      { id: 'xuan-mo', name: '玄墨', colors: { paper: '#FFFFFF', surface: '#F6F7F8', ink: '#15171B', muted: '#666A70', accent: '#3C4048', accent2: '#C9CDD3', line: '#C4C8CE' } }
    ],
    /* 珊瑚杂志：默认珊瑚红。海盐/抹茶/鸢尾/芒果。 */
    'coral-zine': [
      { id: 'default', name: '默认' },
      { id: 'hai-yan', name: '海盐', colors: { paper: '#FFFFFF', surface: '#F3FAFC', ink: '#2B3E46', muted: '#65777E', accent: '#3E7C9B', accent2: '#BFD9E2', line: '#D6E3E8' } },
      { id: 'mo-cha', name: '抹茶', colors: { paper: '#FFFFFF', surface: '#F6FBF1', ink: '#323C2A', muted: '#6D7A60', accent: '#6E8F4E', accent2: '#D2E0BB', line: '#DAE4D0' } },
      { id: 'yuan-wei', name: '鸢尾', colors: { paper: '#FFFFFF', surface: '#F8F6FD', ink: '#352D44', muted: '#6F6880', accent: '#7C62B0', accent2: '#D3CAE8', line: '#DED8EC' } },
      { id: 'mang-guo', name: '芒果', colors: { paper: '#FFFFFF', surface: '#FFFBF1', ink: '#453421', muted: '#7C6F5E', accent: '#C08222', accent2: '#F0D8A5', line: '#ECDFC7' } }
    ],
    /* 瑞士信号：瑞士版式黑白骨架恒定，只换信号色。信号红/森林绿/南瓜橙/葡萄紫。 */
    'swiss-signal': [
      { id: 'default', name: '默认' },
      { id: 'xin-hao-hong', name: '信号红', colors: { paper: '#FFFFFF', surface: '#F7F7F5', ink: '#1D1D1B', muted: '#66645E', accent: '#C23324', accent2: '#F0C7BF', line: '#C8C7C2' } },
      { id: 'sen-lin-lv', name: '森林绿', colors: { paper: '#FFFFFF', surface: '#F7F7F5', ink: '#1D1D1B', muted: '#66645E', accent: '#2E6B3E', accent2: '#C4DBC8', line: '#C8C7C2' } },
      { id: 'nan-gua-cheng', name: '南瓜橙', colors: { paper: '#FFFFFF', surface: '#F7F7F5', ink: '#1D1D1B', muted: '#66645E', accent: '#CE5B14', accent2: '#F2D2B6', line: '#C8C7C2' } },
      { id: 'pu-tao-zi', name: '葡萄紫', colors: { paper: '#FFFFFF', surface: '#F7F7F5', ink: '#1D1D1B', muted: '#66645E', accent: '#6A3E96', accent2: '#D8C7EC', line: '#C8C7C2' } }
    ],
    /* 柑橘报告：默认橄榄青柠。浆果/海军/紫茄/石板。wash/washSoft 为模板装饰底彩。 */
    citrus: [
      { id: 'default', name: '默认' },
      { id: 'jiang-guo', name: '浆果', colors: { paper: '#FFFFFF', surface: '#FAF4F7', ink: '#241D22', muted: '#6D6370', accent: '#8E3A5C', accent2: '#DAAFC0', line: '#DACCD3', wash: '#FBF3F7', washSoft: '#FDFAFB' } },
      { id: 'hai-jun', name: '海军', colors: { paper: '#FFFFFF', surface: '#F4F8FA', ink: '#1D242C', muted: '#64707C', accent: '#2F4E75', accent2: '#BCC9DA', line: '#CED7DF', wash: '#F3F7FA', washSoft: '#FAFCFE' } },
      { id: 'zi-qie', name: '紫茄', colors: { paper: '#FFFFFF', surface: '#F8F6FB', ink: '#241F2A', muted: '#6B6676', accent: '#5E4470', accent2: '#CFC2DC', line: '#D7D2DF', wash: '#F8F4FA', washSoft: '#FCFAFD' } },
      { id: 'shi-ban', name: '石板', colors: { paper: '#FFFFFF', surface: '#F4FAF8', ink: '#1E2826', muted: '#667673', accent: '#37716F', accent2: '#BCD8D5', line: '#CFDDDA', wash: '#F2FAF8', washSoft: '#FAFCFC' } }
    ],
    /* 蓝图网格：默认晒图蓝。工程绿/制图紫/晒图橙/石墨黑，gridLine 随 accent 同族。 */
    blueprint: [
      { id: 'default', name: '默认' },
      { id: 'gong-cheng-lv', name: '工程绿', colors: { paper: '#FFFFFF', surface: '#F5FBF7', ink: '#1B3A2C', muted: '#5D7A69', accent: '#3E7250', accent2: '#C2A49A', line: '#C7DED1', gridLine: 'rgba(62,114,80,.03)' } },
      { id: 'zhi-tu-zi', name: '制图紫', colors: { paper: '#FFFFFF', surface: '#F8F7FC', ink: '#2B2A48', muted: '#69677F', accent: '#5C5590', accent2: '#C4998D', line: '#D1CFE1', gridLine: 'rgba(92,85,144,.03)' } },
      { id: 'shai-tu-cheng', name: '晒图橙', colors: { paper: '#FFFFFF', surface: '#FCF9F4', ink: '#3C2D1D', muted: '#796A5A', accent: '#B0622A', accent2: '#9BBCCB', line: '#E2D5C6', gridLine: 'rgba(176,98,42,.03)' } },
      { id: 'shi-mo-hei', name: '石墨黑', colors: { paper: '#FFFFFF', surface: '#F7F9FA', ink: '#21252B', muted: '#63696F', accent: '#3A424C', accent2: '#AE7850', line: '#CED3D9', gridLine: 'rgba(58,66,76,.03)' } }
    ],
    /* 稻纸朱砂：默认朱砂印。青花/苔绿/紫砂/黛黑。 */
    'rice-paper': [
      { id: 'default', name: '默认' },
      { id: 'qing-hua', name: '青花', colors: { paper: '#FFFFFF', surface: '#F6F9FA', ink: '#2B3237', muted: '#6A747A', accent: '#33586B', accent2: '#BAC7CE', line: '#D2DBDF' } },
      { id: 'tai-lv', name: '苔绿', colors: { paper: '#FFFFFF', surface: '#F8FAF2', ink: '#2F332A', muted: '#6D7464', accent: '#5C7040', accent2: '#C5CDA7', line: '#D5DACB' } },
      { id: 'zi-sha', name: '紫砂', colors: { paper: '#FFFFFF', surface: '#FAF5F0', ink: '#332A25', muted: '#74675D', accent: '#6E4A3A', accent2: '#D1BBA7', line: '#D9CFC4' } },
      { id: 'dai-hei', name: '黛黑', colors: { paper: '#FFFFFF', surface: '#F7F8F9', ink: '#2A2D32', muted: '#6A6E74', accent: '#3A3F45', accent2: '#C6C9CC', line: '#D4D7DA' } }
    ],
    /* 植物手记：默认橄榄叶绿。樱粉/蓝桉/柑黄/紫藤。 */
    botanical: [
      { id: 'default', name: '默认' },
      { id: 'ying-fen', name: '樱粉', colors: { paper: '#FFFFFF', surface: '#FBF5F5', ink: '#392B2F', muted: '#77666B', accent: '#A5646E', accent2: '#E3BFC0', line: '#E7D5D7' } },
      { id: 'lan-an', name: '蓝桉', colors: { paper: '#FFFFFF', surface: '#F4FAF9', ink: '#293538', muted: '#667679', accent: '#4E7A80', accent2: '#BFD8D5', line: '#D2E0DF' } },
      { id: 'gan-huang', name: '柑黄', colors: { paper: '#FFFFFF', surface: '#FCF9EE', ink: '#393121', muted: '#796F5D', accent: '#B98A2E', accent2: '#EBD3A3', line: '#E8DEC8' } },
      { id: 'zi-teng', name: '紫藤', colors: { paper: '#FFFFFF', surface: '#F8F6FC', ink: '#322B41', muted: '#706A7E', accent: '#7A64A0', accent2: '#D2C8E4', line: '#DED8EC' } }
    ],
    /* 柔和陶土：默认陶土棕。鼠尾草/雾蓝/藕荷/杏黄。 */
    'soft-clay': [
      { id: 'default', name: '默认' },
      { id: 'shu-wei-cao', name: '鼠尾草', colors: { paper: '#FFFFFF', surface: '#F7FAF3', ink: '#393F33', muted: '#757E6B', accent: '#7C8B6F', accent2: '#CCD6BE', line: '#DDD6C9' } },
      { id: 'wu-lan', name: '雾蓝', colors: { paper: '#FFFFFF', surface: '#F5F9FB', ink: '#34404B', muted: '#717D89', accent: '#7288A0', accent2: '#C4D2DE', line: '#D7DFE6' } },
      { id: 'ou-he', name: '藕荷', colors: { paper: '#FFFFFF', surface: '#FAF5F7', ink: '#45353F', muted: '#806E78', accent: '#A07A8C', accent2: '#E0C9D3', line: '#EADCE2' } },
      { id: 'xing-huang', name: '杏黄', colors: { paper: '#FFFFFF', surface: '#FCF8F0', ink: '#493B27', muted: '#81725F', accent: '#C08A4A', accent2: '#EDD6B1', line: '#EEE2CF' } }
    ],
    /* 深海终端：深色终端恒定暗底，换荧光色相。琥珀/极光/冰蓝/洋红。 */
    'deep-sea': [
      { id: 'default', name: '默认' },
      { id: 'hu-po', name: '琥珀', colors: { paper: '#1C150A', surface: '#272013', ink: '#E9E1D0', muted: '#A99D87', accent: '#CB984F', accent2: '#8AB1A5', line: '#3F3729' } },
      { id: 'ji-guang', name: '极光', colors: { paper: '#141020', surface: '#1F1931', ink: '#E1DBEF', muted: '#9C93B1', accent: '#9082C8', accent2: '#76B7AA', line: '#373051' } },
      { id: 'bing-lan', name: '冰蓝', colors: { paper: '#0E1620', surface: '#152331', ink: '#DDE9F3', muted: '#8FA6B8', accent: '#6FB4E8', accent2: '#9AD0C8', line: '#2C3E52' } },
      { id: 'yang-hong', name: '洋红', colors: { paper: '#1D1016', surface: '#291B23', ink: '#EEDEE5', muted: '#AC93A0', accent: '#D96C8A', accent2: '#7FA8A0', line: '#432F39' } }
    ],
    /* 雾蓝研究：默认雾蓝。雾绿/雾紫/雾橙/雾粉。 */
    'mist-research': [
      { id: 'default', name: '默认' },
      { id: 'wu-lv', name: '雾绿', colors: { paper: '#FFFFFF', surface: '#F4FAF6', ink: '#2B3933', muted: '#6A7A71', accent: '#5F8574', accent2: '#C1D6CC', line: '#D5E0DA' } },
      { id: 'wu-zi', name: '雾紫', colors: { paper: '#FFFFFF', surface: '#F8F7FB', ink: '#333042', muted: '#6F6B7D', accent: '#77689A', accent2: '#CDC6DE', line: '#DAD6E5' } },
      { id: 'wu-cheng', name: '雾橙', colors: { paper: '#FFFFFF', surface: '#FBF8F3', ink: '#3D3126', muted: '#7B6F62', accent: '#B07A50', accent2: '#E2CBB6', line: '#E5D9CC' } },
      { id: 'wu-fen', name: '雾粉', colors: { paper: '#FFFFFF', surface: '#FBF6F7', ink: '#3B2F33', muted: '#7C6C72', accent: '#A87580', accent2: '#E0C6CB', line: '#E7DADC' } }
    ],
    /* 紫灰工作室：默认灰紫+橄榄。墨绿/酒红/靛蓝/焦糖。decor/decorSoft 为模板装饰点缀色。 */
    'violet-studio': [
      { id: 'default', name: '默认' },
      { id: 'mo-lv', name: '墨绿', colors: { paper: '#FFFFFF', surface: '#F4F9F5', ink: '#28332C', muted: '#65756B', accent: '#40634F', accent2: '#C4BE8E', line: '#CCDAD1', decor: '#C08A3E', decorSoft: '#CFA05F' } },
      { id: 'jiu-hong', name: '酒红', colors: { paper: '#FFFFFF', surface: '#FAF4F5', ink: '#37292E', muted: '#776469', accent: '#8C4A58', accent2: '#D3C2B4', line: '#DFCFD3', decor: '#C9954A', decorSoft: '#D4AC70' } },
      { id: 'dian-lan', name: '靛蓝', colors: { paper: '#FFFFFF', surface: '#F4F8FA', ink: '#252F3D', muted: '#646F7D', accent: '#3E5A8C', accent2: '#B4C6CE', line: '#CFD8E1', decor: '#C9822E', decorSoft: '#D6A05C' } },
      { id: 'jiao-tang', name: '焦糖', colors: { paper: '#FFFFFF', surface: '#FAF6EE', ink: '#373023', muted: '#786D5D', accent: '#96602E', accent2: '#D9C38F', line: '#E1D6C3', decor: '#6E9878', decorSoft: '#93B298' } }
    ],
    /* 新粗野：黑色骨架（ink==line）恒定，撞色块整体换。电蓝/荧光绿/亮紫/亮橙。 */
    'neo-brutal': [
      { id: 'default', name: '默认' },
      { id: 'dian-lan', name: '电蓝', colors: { paper: '#FFFFFF', surface: '#EEF3FF', ink: '#1D1D1B', muted: '#55504A', accent: '#2E4DC0', accent2: '#E8C766', line: '#1D1D1B' } },
      { id: 'ying-guang-lv', name: '荧光绿', colors: { paper: '#FFFFFF', surface: '#EEFAF0', ink: '#1D1D1B', muted: '#55504A', accent: '#0E8A3E', accent2: '#F2A0C0', line: '#1D1D1B' } },
      { id: 'liang-zi', name: '亮紫', colors: { paper: '#FFFFFF', surface: '#F5EFFF', ink: '#1D1D1B', muted: '#55504A', accent: '#6B34C4', accent2: '#E3A6C6', line: '#1D1D1B' } },
      { id: 'liang-cheng', name: '亮橙', colors: { paper: '#FFFFFF', surface: '#FFF3EA', ink: '#1D1D1B', muted: '#55504A', accent: '#E05A10', accent2: '#7FD0D8', line: '#1D1D1B' } }
    ],
    /* 暗夜编辑：白纸+暗色块版式恒定，换夜色霓虹。冷蓝/青柠/玫瑰/紫铜。 */
    'night-editorial': [
      { id: 'default', name: '默认' },
      { id: 'leng-lan', name: '冷蓝', colors: { paper: '#FFFFFF', surface: '#242320', ink: '#26231F', muted: '#746F68', accent: '#3E6E9E', accent2: '#8FB6CC', line: '#D8D2CA', surfaceInk: '#EAF1F5', surfaceMuted: '#AEC2CE' } },
      { id: 'qing-ning', name: '青柠', colors: { paper: '#FFFFFF', surface: '#242320', ink: '#26231F', muted: '#746F68', accent: '#7A8C2E', accent2: '#C9CC8A', line: '#D8D2CA', surfaceInk: '#F2F4E6', surfaceMuted: '#C6CBA8' } },
      { id: 'mei-gui', name: '玫瑰', colors: { paper: '#FFFFFF', surface: '#242320', ink: '#26231F', muted: '#746F68', accent: '#A84E66', accent2: '#D4A8B4', line: '#D8D2CA', surfaceInk: '#F6EAEF', surfaceMuted: '#CDAAB8' } },
      { id: 'zi-tong', name: '紫铜', colors: { paper: '#FFFFFF', surface: '#242320', ink: '#26231F', muted: '#746F68', accent: '#6E4E8C', accent2: '#B49CC0', line: '#D8D2CA', surfaceInk: '#F0EAF6', surfaceMuted: '#BFB0CE' } }
    ],
    /* 档案棕褐：默认棕褐卷宗。档案蓝/档案绿/档案紫/印泥红。wash 为索引签底彩。 */
    'sepia-archive': [
      { id: 'default', name: '默认' },
      { id: 'dang-an-lan', name: '档案蓝', colors: { paper: '#FFFFFF', surface: '#F2F6F9', ink: '#2B343C', muted: '#646F7B', accent: '#46688C', accent2: '#A8BCCB', line: '#CED8DF', wash: '#F4F8FA' } },
      { id: 'dang-an-lv', name: '档案绿', colors: { paper: '#FFFFFF', surface: '#F5F8F0', ink: '#2F382A', muted: '#6C7562', accent: '#55704A', accent2: '#BCC5A4', line: '#D9DFCC', wash: '#F5F8F0' } },
      { id: 'dang-an-zi', name: '档案紫', colors: { paper: '#FFFFFF', surface: '#F8F5FA', ink: '#342D3B', muted: '#70687A', accent: '#6E557E', accent2: '#C8BACC', line: '#DBD4E1', wash: '#F8F5FA' } },
      { id: 'yin-ni-hong', name: '印泥红', colors: { paper: '#FFFFFF', surface: '#FBF3F0', ink: '#392B29', muted: '#7B6660', accent: '#9E3E38', accent2: '#DCB2A2', line: '#E5D3CC', wash: '#FBF2EF' } }
    ]
  };

  function colorwaysForTheme(themeId) {
    return COLORWAYS[themeId] || null;
  }

  function colorwayFor(themeId, colorId) {
    var list = COLORWAYS[themeId];
    if (!list) return null;
    for (var i = 0; i < list.length; i++) if (list[i].id === colorId) return list[i];
    return list[0];
  }

  var HEX_RE = /^#[0-9A-Fa-f]{6}$/;

  /* 合并默认 profile 与配色变体：
   * - 返回克隆 profile，附 colorId/colorName/colorMap（默认值→变体值 的整表替换映射，仅含有变化的项）；
   * - accentOn 恒随 paper（与全部冻结模板的 hex 复用关系一致）；
   * - underline 依主题公式重建，覆盖 themes.js 中按默认配色硬编码的下划线；
   * - 默认配色直接返回原 profile，不产生任何映射。
   */
  function profileForTheme(themeId, colorId) {
    var base = null;
    for (var i = 0; i < PROFILES.length; i++) if (PROFILES[i].themeId === themeId) base = PROFILES[i];
    if (!base) return null;
    var entry = colorwayFor(themeId, colorId || 'default');
    if (!entry || !entry.colors) return base;

    var required = COLORWAY_CORE_ROLES.slice();
    COLORWAY_ROLES.forEach(function (role) {
      if (COLORWAY_CORE_ROLES.indexOf(role) === -1 && typeof base[role] === 'string') required.push(role);
    });
    var merged = {};
    Object.keys(base).forEach(function (key) { merged[key] = base[key]; });
    var map = {};
    required.forEach(function (role) {
      var value = entry.colors[role];
      if (!value) failColorway(base, entry, '缺少配色角色 ' + role);
      if (role !== 'gridLine' && !HEX_RE.test(value)) failColorway(base, entry, role + ' 不是合法 hex：' + value);
      if (role === 'gridLine' && !/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0?\.\d+\s*\)$/.test(value)) failColorway(base, entry, 'gridLine 不是合法 rgba：' + value);
      merged[role] = value;
      var previous = base[role];
      if (previous && previous !== value) {
        if (map[previous] && map[previous] !== value) failColorway(base, entry, '替换映射冲突：' + previous + ' 同时映射到 ' + map[previous] + ' 与 ' + value);
        map[previous] = value;
      }
    });
    merged.accentOn = merged.paper;
    merged.underline = 'border-bottom:2px solid ' + merged.accent2 + ';font-weight:600;';
    merged.colorId = entry.id;
    merged.colorName = entry.name;
    merged.colorMap = Object.keys(map).map(function (from) { return [from, map[from]]; });
    return merged;
  }

  function failColorway(base, entry, message) {
    throw new Error('配色无效：' + base.name + ' / ' + (entry.name || entry.id) + '：' + message);
  }

  function level(id) {
    for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i];
    return LEVELS[LEVELS.length - 1];
  }

  return { LEVELS: LEVELS, PROFILES: PROFILES, COLORWAYS: COLORWAYS, colorwaysForTheme: colorwaysForTheme, colorwayFor: colorwayFor, profileForTheme: profileForTheme, level: level };
});

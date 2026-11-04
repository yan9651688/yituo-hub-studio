/* Md2GZH 主题注册数据（纯数据，与引擎分离）
 * original library: motion（基础排版，蓝梦原创视觉 16 套，原「高级排版」）
 * creative library: creative（高级排版，4 套创意排版）
 * RETIRED_SPECS：已下线的 18 套旧基础主题（editorial / classic / fresh）
 * classic 组的配色与下划线取自原版 gzh-design-skill，组件形态为参数化复刻。
 * 加载顺序要求：本文件必须在 themes.js 之前引入（见 studio.html）。
 */
(function (global, factory) {
  var api = factory();
  global.Md2GZHThemesData = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  /* 已下线的 18 套旧「基础主题」：不再出现在选择器中，仅保留给排版引擎回归测试与历史备份分支。
   * 完整旧版见分支 backup/before-theme-restructure-20261104。 */
  var RETIRED_SPECS = [
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
    }
  ];

  var SPECS = [
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
      id: 'pine-soot', name: '松烟刊读', en: 'PINE SOOT JOURNAL', kickerZh: '人文长文', group: 'motion',
      desc: '松烟墨绿 · 清雅刊读',
      swatch: '#48603F', radius: '6px',
      underline: 'border-bottom:2px solid #CBD6BE;font-weight:600;',
      cover: 'minimal', sectionTitle: 'chip', quote: 'leftbar', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#48603F', deep: '#1A1D18', light: '#CBD6BE', tint: '#F7F8F3', ink: '#1A1D18', text: '#3A3E36', sub: '#6A6F64', border: '#E0E4D8', accent: '#48603F', coverA: '#48603F', coverB: '#1A1D18', codeBg: '#F7F8F3' }
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
        },

    /* ---------- 高级排版（2026.11 新增 4 套创意排版，纯静态内联结构，兼容性优先） ---------- */
    {
      id: 'ink-scroll', name: '水墨长卷', en: 'INK SCROLL', kickerZh: '国风长卷', group: 'creative',
      desc: '宣纸墨色 · 竖排题签与朱印',
      swatch: '#2B2A27', radius: '2px',
      underline: 'border-bottom:2px solid #D9C9A8;font-weight:600;',
      cover: 'full', sectionTitle: 'line', quote: 'tint', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#2B2A27', deep: '#1A1917', light: '#D9C9A8', tint: '#F8F4EA', ink: '#2B2A27', text: '#4A4740', sub: '#8A8478', border: '#E3DACA', accent: '#B23A2A', coverA: '#2B2A27', coverB: '#1A1917', codeBg: '#F8F4EA' }
    },
    {
      id: 'retro-gazette', name: '复古号外', en: 'RETRO GAZETTE', kickerZh: '报刊号外', group: 'creative',
      desc: '老报纸版式 · 双线报头与引语',
      swatch: '#9E2B25', radius: '0',
      underline: 'border-bottom:2px solid #E2C9B2;font-weight:600;',
      cover: 'full', sectionTitle: 'line', quote: 'leftbar', toc: 'list', signature: 'line', code: 'light',
      c: { primary: '#9E2B25', deep: '#1F1B16', light: '#E2C9B2', tint: '#FAF6EE', ink: '#1F1B16', text: '#3D372F', sub: '#7A7064', border: '#D9CFC0', accent: '#9E2B25', coverA: '#1F1B16', coverB: '#3D372F', codeBg: '#FAF6EE' }
    },
    {
      id: 'pixel-console', name: '像素游戏机', en: 'PIXEL CONSOLE', kickerZh: '闯关攻略', group: 'creative',
      desc: '8-bit 像素 · 关卡、血条与对话框',
      swatch: '#3B5BDB', radius: '0',
      underline: 'border-bottom:2px solid #FFD43B;font-weight:600;',
      cover: 'full', sectionTitle: 'bar', quote: 'leftbar', toc: 'cards', signature: 'card', code: 'dark',
      c: { primary: '#3B5BDB', deep: '#1B1B3A', light: '#FFD43B', tint: '#F4F6FF', ink: '#1B1B3A', text: '#33334D', sub: '#6B6B8A', border: '#1B1B3A', accent: '#3B5BDB', coverA: '#3B5BDB', coverB: '#1B1B3A', codeBg: '#1B1B3A' }
    },
    {
      id: 'film-strip', name: '胶片影志', en: 'FILM STRIP', kickerZh: '影像故事', group: 'creative',
      desc: '电影胶片 · 场记板与字幕条',
      swatch: '#C8902E', radius: '4px',
      underline: 'border-bottom:2px solid #EBD3A4;font-weight:600;',
      cover: 'full', sectionTitle: 'chip', quote: 'gradient', toc: 'cards', signature: 'card', code: 'dark',
      c: { primary: '#C8902E', deep: '#1C1A17', light: '#EBD3A4', tint: '#FBF7EF', ink: '#1C1A17', text: '#3E3A33', sub: '#7D756A', border: '#E4DCCD', accent: '#C8902E', coverA: '#1C1A17', coverB: '#3E3A33', codeBg: '#1C1A17' }
    }
  ];

  var GROUPS = [
    { id: 'all', name: '全部' },
    { id: 'motion', name: '基础排版' },
    { id: 'creative', name: '高级排版' }
  ];

  /* 顶层资源域（2026.11 调整）：原 16 套「高级排版」转为基础排版；高级排版为 4 套新创意排版。 */
  var LIBRARIES = [
    { id: 'original', name: '基础排版', shortName: '基础', en: 'BASIC LAYOUTS', groups: ['motion'] },
    { id: 'creative', name: '高级排版', shortName: '高级排版', en: 'ADVANCED LAYOUTS', groups: ['creative'] }
  ];

  return { SPECS: SPECS, RETIRED_SPECS: RETIRED_SPECS, GROUPS: GROUPS, LIBRARIES: LIBRARIES };
});

/* Yi Tuo Hub 排版工坊前端
 * - 基础主题：18 套原有版式
 * - 高级排版：蓝梦原创的 15 套 Production V6 主题 × 6 档视觉等级
 */
(function () {
  'use strict';

  var Themes = window.Md2GZHThemes;
  var Converter = window.Md2GZHConverter;
  var Validator = window.Md2GZHValidator;
  var Originals = window.Md2GZHOriginalVisuals;
  var OriginalData = window.Md2GZHOriginalData;

  var editor = document.getElementById('editor');
  var preview = document.getElementById('preview');
  var previewWrap = document.getElementById('previewWrap');
  var validBadge = document.getElementById('validBadge');
  var validPanel = document.getElementById('validPanel');
  var authorInput = document.getElementById('authorInput');
  var toastEl = document.getElementById('toast');
  var pickerSlot = document.getElementById('themePickerSlot');
  var levelSlot = document.getElementById('levelPickerSlot');
  var motionModeBtn = document.getElementById('motionModeBtn');

  var state = {
    themeId: Themes.SPECS[0].id,
    library: 'base',
    group: 'all',
    levelId: 'motion-themed-frame',
    motionEnabled: true,
    html: '',
    timer: null,
    renderId: 0,
    pending: Promise.resolve(),
    manifest: null,
    assetCache: {},
    pickerOpen: false,
    levelOpen: false
  };

  var SAMPLE_MD =
    '# 把 Markdown 排成高级感 / 原创分级视觉已经接入\n\n'
    + '> 排版不该消耗创作热情，它应该一键发生。\n\n'
    + '把文章粘进来，先选**基础主题**或**高级排版**。高级排版还可以继续选择六档视觉等级，并在动态等级里切换静态回退。\n\n'
    + '## 三步完成排版\n\n'
    + '第一步，粘贴 Markdown；第二步，挑一套主题与等级；第三步，复制进公众号编辑器，==正文仍然可编辑==。\n\n'
    + '- **加粗**自动升级为关键词下划线\n'
    + '- `行内代码`、代码块、表格、图片全部支持\n'
    + '- 动态 SVG 与静态回退保持同一套几何结构\n\n'
    + '## 适用场景\n\n'
    + '教程、测评、随笔、周报，凡是要发公众号的文章都合适。**正文保持静态**，动效只承担开篇的视觉提示。\n\n'
    + '```bash\nnpm run check\n# 本地校验通过后再进入真实微信测试\n```\n\n'
    + '> 好排版让读者只关注内容本身。\n\n'
    + '现在就试试：清空本文，粘入你自己的文章。\n';

  function previewShell(html) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<style>body{margin:0;padding:18px 16px;background:#fff;'
      + 'font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;}'
      + 'img,svg{max-width:100%;}</style></head><body>' + html + '</body></html>';
  }

  function isOriginalSpec(spec) { return !!spec && spec.group === 'motion'; }
  function currentLevel() { return OriginalData.level(state.levelId); }
  function isDynamicLevel() { return currentLevel().motion !== 'none'; }

  function setLoading() {
    validBadge.className = 'badge';
    validBadge.textContent = '载入高级排版…';
    validPanel.hidden = true;
  }

  function commitHtml(html) {
    state.html = html;
    preview.srcdoc = previewShell(html);
    var result = Validator.validate(html);
    validBadge.className = 'badge ' + (result.ok ? (result.warnings.length ? 'warn' : 'ok') : 'bad');
    validBadge.textContent = result.ok
      ? (result.warnings.length ? '⚠ ' + result.warnings.length + ' 条建议' : '✓ 平台合规')
      : '✗ ' + result.errors.length + ' 个错误';
    var panelHtml = '';
    result.errors.forEach(function (message) { panelHtml += '<div class="err">✗ ' + message + '</div>'; });
    result.warnings.forEach(function (message) { panelHtml += '<div class="warn">⚠ ' + message + '</div>'; });
    validPanel.innerHTML = panelHtml;
    validPanel.hidden = result.ok && !result.warnings.length;
  }

  function renderFailure(error) {
    state.html = '';
    validBadge.className = 'badge bad';
    validBadge.textContent = '✗ 高级排版载入失败';
    validPanel.innerHTML = '<div class="err">✗ ' + Themes.esc(error && error.message ? error.message : String(error)) + '</div>';
    validPanel.hidden = false;
    preview.srcdoc = previewShell('<section style="padding:28px;color:#8A382F;font-size:14px;line-height:1.8;">高级排版资源暂时无法载入，请刷新后重试。</section>');
  }

  function ensureManifest() {
    if (state.manifest) return Promise.resolve(state.manifest);
    return fetch('motion/manifest.json').then(function (response) {
      if (!response.ok) throw new Error('无法读取 motion/manifest.json（' + response.status + '）');
      return response.json();
    }).then(function (manifest) {
      if (!manifest.components || manifest.component_count !== manifest.components.length) throw new Error('动静态组件清单不完整');
      state.manifest = manifest;
      return manifest;
    });
  }

  function fetchAsset(requirement) {
    if (state.assetCache[requirement.sourcePath]) return Promise.resolve(state.assetCache[requirement.sourcePath]);
    return fetch(requirement.sitePath).then(function (response) {
      if (!response.ok) throw new Error('无法读取 ' + requirement.sitePath + '（' + response.status + '）');
      return response.text();
    }).then(function (svg) {
      state.assetCache[requirement.sourcePath] = svg;
      return svg;
    });
  }

  function loadOriginalAssets(spec, manifest) {
    var requirements = Originals.assetRequirements(spec.id, state.levelId, state.motionEnabled, manifest);
    return Promise.all(requirements.map(fetchAsset)).then(function () {
      var assets = {};
      requirements.forEach(function (requirement) { assets[requirement.sourcePath] = state.assetCache[requirement.sourcePath]; });
      return assets;
    });
  }

  function convert() {
    var renderId = ++state.renderId;
    var spec = Themes.getSpec(state.themeId);
    var tokens;
    try { tokens = Converter.parse(editor.value); }
    catch (error) { renderFailure(error); return Promise.reject(error); }

    var task;
    if (!isOriginalSpec(spec)) {
      task = Promise.resolve(Themes.render(tokens, spec, { author: authorInput.value.trim() }));
    } else if (currentLevel().order < 3) {
      task = Promise.resolve(Originals.render(tokens, spec, {
        author: authorInput.value.trim(), levelId: state.levelId, motionEnabled: state.motionEnabled
      }, {}, null));
    } else {
      setLoading();
      task = ensureManifest().then(function (manifest) {
        return loadOriginalAssets(spec, manifest).then(function (assets) {
          return Originals.render(tokens, spec, {
            author: authorInput.value.trim(), levelId: state.levelId, motionEnabled: state.motionEnabled
          }, assets, manifest);
        });
      });
    }

    state.pending = task.then(function (html) {
      if (renderId === state.renderId) commitHtml(html);
      return html;
    }).catch(function (error) {
      if (renderId === state.renderId) renderFailure(error);
      throw error;
    });
    return state.pending;
  }

  function scheduleConvert() {
    clearTimeout(state.timer);
    state.timer = setTimeout(function () { convert().catch(function () {}); }, 350);
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toastEl.hidden = true; }, 2400);
  }

  /* ---------- 主题下拉选择器 ---------- */

  var pickerButtons = {};
  var pickerPop;

  function libraryThemes(library) {
    return Themes.SPECS.filter(function (spec) { return library.groups.indexOf(spec.group) !== -1; });
  }

  function libraryForTheme(spec) {
    for (var i = 0; i < Themes.LIBRARIES.length; i++) {
      if (Themes.LIBRARIES[i].groups.indexOf(spec.group) !== -1) return Themes.LIBRARIES[i];
    }
    return Themes.LIBRARIES[0];
  }

  function closePicker() {
    state.pickerOpen = false;
    if (pickerPop) pickerPop.hidden = true;
    renderPickerButtons();
  }

  function buildPicker() {
    pickerSlot.innerHTML = '';
    Themes.LIBRARIES.forEach(function (library) {
      var button = document.createElement('button');
      button.className = 'picker-btn';
      button.dataset.library = library.id;
      button.type = 'button';
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        closeLevelPicker();
        var sameOpenLibrary = state.pickerOpen && state.library === library.id;
        state.library = library.id;
        state.group = 'all';
        state.pickerOpen = !sameOpenLibrary;
        pickerPop.hidden = !state.pickerOpen;
        renderPickerButtons();
        if (state.pickerOpen) renderPickerPop();
      });
      pickerButtons[library.id] = button;
      pickerSlot.appendChild(button);
    });
    pickerPop = document.createElement('div');
    pickerPop.className = 'picker-pop';
    pickerPop.id = 'themePickerPop';
    pickerPop.hidden = true;
    pickerPop.addEventListener('click', function (event) { event.stopPropagation(); });
    pickerSlot.appendChild(pickerPop);
    renderPickerButtons();
    renderPickerPop();
  }

  function renderPickerButtons() {
    var spec = Themes.getSpec(state.themeId);
    var selectedLibrary = libraryForTheme(spec);
    Themes.LIBRARIES.forEach(function (library) {
      var button = pickerButtons[library.id];
      var selected = selectedLibrary.id === library.id;
      var open = state.pickerOpen && state.library === library.id;
      var count = libraryThemes(library).length;
      button.classList.toggle('selected', selected);
      button.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-controls', 'themePickerPop');
      button.setAttribute('aria-label', library.name + (selected ? '，当前为' + spec.name : '，共' + count + '套'));
      button.innerHTML = '<span class="picker-kind">' + library.shortName + '</span>'
        + (selected ? '<span class="swatch" style="background:' + spec.swatch + '"></span><span class="picker-name">' + spec.name + '</span>' : '<span class="picker-count">' + count + ' 套</span>')
        + '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    });
  }

  function renderPickerPop() {
    var library = Themes.LIBRARIES.filter(function (item) { return item.id === state.library; })[0] || Themes.LIBRARIES[0];
    var inLibrary = libraryThemes(library);
    var note = library.id === 'original' ? '15 THEMES · 6 LEVELS' : (inLibrary.length + ' THEMES');
    var html = '<div class="pop-head"><span class="pop-title">' + library.en + ' · ' + library.name + '</span><span class="pop-note">' + note + '</span></div>';
    if (library.id === 'base') {
      html += '<div class="pop-tabs">';
      Themes.GROUPS.filter(function (group) { return group.id === 'all' || library.groups.indexOf(group.id) !== -1; }).forEach(function (group) {
        var count = group.id === 'all' ? inLibrary.length : inLibrary.filter(function (spec) { return spec.group === group.id; }).length;
        html += '<button class="group-tab' + (state.group === group.id ? ' active' : '') + '" data-group="' + group.id + '">' + group.name + ' <span class="cnt">' + count + '</span></button>';
      });
      html += '</div>';
    }
    html += '<div class="pop-grid">';
    inLibrary.filter(function (spec) { return state.group === 'all' || spec.group === state.group; }).forEach(function (spec) {
      html += '<button class="pop-card' + (spec.id === state.themeId ? ' active' : '') + '" data-id="' + spec.id + '"><span class="swatch" style="background:' + spec.swatch + '"></span><span class="pop-card-text"><span class="tname">' + spec.name + '</span><span class="tdesc">' + spec.desc + '</span></span></button>';
    });
    html += '</div>';
    pickerPop.innerHTML = html;
    pickerPop.querySelectorAll('.group-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { state.group = tab.dataset.group; renderPickerPop(); });
    });
    pickerPop.querySelectorAll('.pop-card').forEach(function (card) {
      card.addEventListener('click', function () {
        state.themeId = card.dataset.id;
        state.library = libraryForTheme(Themes.getSpec(state.themeId)).id;
        closePicker();
        renderPickerButtons();
        renderLevelControls();
        convert().catch(function () {});
      });
    });
  }

  /* ---------- 高级排版视觉等级 ---------- */

  var levelButton;
  var levelPop;

  function closeLevelPicker() {
    state.levelOpen = false;
    if (levelPop) levelPop.hidden = true;
    renderLevelControls();
  }

  function buildLevelPicker() {
    levelSlot.innerHTML = '';
    levelButton = document.createElement('button');
    levelButton.type = 'button';
    levelButton.className = 'picker-btn level-picker-btn';
    levelButton.addEventListener('click', function (event) {
      event.stopPropagation();
      closePicker();
      state.levelOpen = !state.levelOpen;
      levelPop.hidden = !state.levelOpen;
      renderLevelControls();
      if (state.levelOpen) renderLevelPop();
    });
    levelPop = document.createElement('div');
    levelPop.id = 'levelPickerPop';
    levelPop.className = 'level-pop';
    levelPop.hidden = true;
    levelPop.addEventListener('click', function (event) { event.stopPropagation(); });
    levelSlot.appendChild(levelButton);
    levelSlot.appendChild(levelPop);
    renderLevelControls();
  }

  function renderLevelControls() {
    var original = isOriginalSpec(Themes.getSpec(state.themeId));
    levelSlot.hidden = !original;
    motionModeBtn.hidden = !original || !isDynamicLevel();
    if (!original) {
      state.levelOpen = false;
      if (levelPop) levelPop.hidden = true;
      return;
    }
    var level = currentLevel();
    levelButton.classList.toggle('open', state.levelOpen);
    levelButton.setAttribute('aria-expanded', String(state.levelOpen));
    levelButton.setAttribute('aria-controls', 'levelPickerPop');
    levelButton.innerHTML = '<span class="picker-kind">视觉</span><span class="level-index">L' + level.order + '</span><span class="picker-name">' + level.short + '</span><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    motionModeBtn.classList.toggle('active', state.motionEnabled);
    motionModeBtn.textContent = state.motionEnabled ? '动态' : '静态回退';
    motionModeBtn.setAttribute('aria-pressed', String(state.motionEnabled));
    motionModeBtn.title = state.motionEnabled ? '当前输出动态 SVG，点击切换为几何一致的静态回退' : '当前输出静态回退，点击恢复动态 SVG';
  }

  function renderLevelPop() {
    var html = '<div class="level-pop-head"><span class="pop-title">PRESENTATION LEVEL · 视觉等级</span><span class="pop-note">76 COMBINATIONS</span></div><div class="level-list">';
    OriginalData.LEVELS.forEach(function (level) {
      html += '<button class="level-option' + (state.levelId === level.id ? ' active' : '') + '" data-level="' + level.id + '"><span class="level-no">L' + level.order + '</span><span class="level-copy"><strong>' + level.name + '</strong><small>' + level.description + '</small></span>' + (level.motion !== 'none' ? '<span class="level-motion">动</span>' : '') + '</button>';
    });
    html += '</div><p class="level-footnote">L1 为全库唯一黑白排版；L2–L6 分别适用于 15 套原创主题。</p>';
    levelPop.innerHTML = html;
    levelPop.querySelectorAll('.level-option').forEach(function (option) {
      option.addEventListener('click', function () {
        state.levelId = option.dataset.level;
        state.motionEnabled = true;
        closeLevelPicker();
        renderLevelControls();
        convert().catch(function () {});
      });
    });
  }

  motionModeBtn.addEventListener('click', function () {
    state.motionEnabled = !state.motionEnabled;
    renderLevelControls();
    convert().catch(function () {});
  });

  /* ---------- 复制 / 下载 ---------- */

  function fallbackCopy() {
    var box = document.createElement('section');
    box.contentEditable = 'true';
    box.innerHTML = state.html;
    box.style.position = 'fixed';
    box.style.left = '-9999px';
    document.body.appendChild(box);
    var range = document.createRange();
    range.selectNodeContents(box);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
    document.body.removeChild(box);
  }

  function copyToWechat() {
    state.pending.then(function () {
      if (!state.html) { toast('先粘贴一点内容再复制'); return; }
      var plain = new Blob([Converter.plainText(editor.value)], { type: 'text/plain' });
      var rich = new Blob([state.html], { type: 'text/html' });
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([new ClipboardItem({ 'text/html': rich, 'text/plain': plain })])
          .then(function () { toast('✓ 已复制，去公众号编辑器粘贴'); })
          .catch(function () { fallbackCopy(); toast('✓ 已复制（兼容模式）'); });
      } else { fallbackCopy(); toast('✓ 已复制（兼容模式）'); }
    }).catch(function () { toast('高级排版尚未载入完成'); });
  }

  function download() {
    state.pending.then(function () {
      if (!state.html) { toast('先粘贴一点内容'); return; }
      var spec = Themes.getSpec(state.themeId);
      var title = (editor.value.match(/^#\s*(.+)$/m) || [])[1] || '文章';
      var name = title.trim().replace(/[\\/:*?"<>| ]/g, '_').slice(0, 30);
      var suffix = spec.name + '(' + spec.id + ')';
      if (isOriginalSpec(spec)) {
        var level = currentLevel();
        suffix += '_L' + level.order + '_' + level.short;
        if (isDynamicLevel()) suffix += state.motionEnabled ? '_动态' : '_静态回退';
      }
      var blob = new Blob(['\ufeff' + state.html], { type: 'text/html;charset=utf-8' });
      var anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = name + '_排版_' + suffix + '.html';
      anchor.click();
      URL.revokeObjectURL(anchor.href);
    }).catch(function () { toast('高级排版尚未载入完成'); });
  }

  /* ---------- 事件 / 启动 ---------- */

  editor.addEventListener('input', scheduleConvert);
  authorInput.addEventListener('input', scheduleConvert);
  document.getElementById('btnCopy').addEventListener('click', copyToWechat);
  document.getElementById('btnDownload').addEventListener('click', download);
  document.getElementById('btnSample').addEventListener('click', function () { editor.value = SAMPLE_MD; convert().catch(function () {}); });
  document.getElementById('btnClear').addEventListener('click', function () { editor.value = ''; convert().catch(function () {}); editor.focus(); });
  document.getElementById('widthFit').addEventListener('click', function () {
    previewWrap.classList.remove('phone'); this.classList.add('active'); document.getElementById('widthPhone').classList.remove('active');
  });
  document.getElementById('widthPhone').addEventListener('click', function () {
    previewWrap.classList.add('phone'); this.classList.add('active'); document.getElementById('widthFit').classList.remove('active');
  });
  validBadge.addEventListener('click', function () { validPanel.hidden = !validPanel.hidden; });
  document.addEventListener('click', function () { closePicker(); closeLevelPicker(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') { closePicker(); closeLevelPicker(); } });

  buildPicker();
  buildLevelPicker();
  editor.value = SAMPLE_MD;
  convert().catch(function () {});
})();

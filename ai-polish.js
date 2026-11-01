/* Md2GZH AI 润色（studio 侧边栏）：
 * 选中文本 → 润色 / 扩写 / 压缩，流式替换回编辑器。
 * 设置复用 create 页的 localStorage 键（yth.create.base/key/model），两页共享一份配置。
 * Node 侧只导出纯函数（提示词构造），DOM 交互仅在浏览器中可用。
 */
(function (global, factory) {
  var Shared = global.Md2GZHShared || (typeof require === 'function' ? require('./shared.js') : null);
  var api = factory(typeof document !== 'undefined' ? document : null, Shared);
  global.Md2GZHAiPolish = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function (documentRef, Shared) {
  'use strict';

  var LS = { base: 'yth.create.base', key: 'yth.create.key', model: 'yth.create.model' };
  var DEFAULT_BASE = 'https://api.yituohub.com';

  var ACTIONS = [
    { id: 'polish', name: '润色', brief: '保持原意与篇幅量级，让文字更自然、更有作者个人声口' },
    { id: 'expand', name: '扩写', brief: '在原意之内补充细节与例证，篇幅约增加一半' },
    { id: 'shorten', name: '压缩', brief: '删掉冗余，篇幅压缩到原来的六成左右，信息不丢' }
  ];

  function systemPromptFor(actionId) {
    var action = ACTIONS.filter(function (item) { return item.id === actionId; })[0] || ACTIONS[0];
    return '你是一名公众号编辑，对用户给出的文字片段做「' + action.name + '」：' + action.brief + '。'
      + '直接输出改写后的正文，不要任何解释、引号或前后缀，不要使用 Markdown 标题。'
      + '保留原文中的**加粗**、==高亮== 等标记语法。';
  }

  function buildMessages(actionId, text) {
    return [
      { role: 'system', content: systemPromptFor(actionId) },
      { role: 'user', content: String(text || '') }
    ];
  }

  function settings() {
    var saved = { base: DEFAULT_BASE, key: '', model: '' };
    try {
      saved.base = localStorage.getItem(LS.base) || DEFAULT_BASE;
      saved.key = localStorage.getItem(LS.key) || '';
      saved.model = localStorage.getItem(LS.model) || '';
    } catch (error) { /* 隐私模式：仅本次会话可用 */ }
    return saved;
  }

  function saveSettings(next) {
    try {
      if (next.base) localStorage.setItem(LS.base, next.base.trim().replace(/\/+$/, ''));
      if (typeof next.key === 'string') localStorage.setItem(LS.key, next.key.trim());
      if (typeof next.model === 'string') localStorage.setItem(LS.model, next.model.trim());
    } catch (error) { return false; }
    return true;
  }

  /* SSE 行解析（与 create.js 同规则：半行缓冲、[DONE] 哨兵、坏行跳过） */
  function readSseChunk(buffer, onDelta) {
    var lines = buffer.split('\n');
    var rest = lines.pop();
    lines.forEach(function (line) {
      line = line.trim();
      if (!line || line.indexOf('data:') !== 0) return;
      var payload = line.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        var json = JSON.parse(payload);
        var piece = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
        if (piece) onDelta(piece);
      } catch (error) { /* 跳过半截行 */ }
    });
    return rest;
  }

  function polish(actionId, text, opt) {
    opt = opt || {};
    var conf = settings();
    if (!conf.key) return Promise.reject(new Error('先在「AI 设置」里填写 API 密钥'));
    if (!conf.model) return Promise.reject(new Error('先在「AI 设置」里填写模型名'));
    var controller = opt.controller || new AbortController();
    var produced = '';
    var decoder = new TextDecoder();
    var buffer = '';
    return fetch(conf.base.replace(/\/+$/, '') + '/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + conf.key },
      body: JSON.stringify({ model: conf.model, stream: true, messages: buildMessages(actionId, text) })
    }).then(function (response) {
      if (response.status === 401) throw new Error('密钥无效（401）');
      if (!response.ok) throw new Error('接口返回 ' + response.status);
      var reader = response.body.getReader();
      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) return produced;
          buffer = readSseChunk(buffer + decoder.decode(chunk.value, { stream: true }), function (piece) {
            produced += piece;
            if (opt.onDelta) opt.onDelta(piece, produced);
          });
          return pump();
        });
      }
      return pump();
    }).then(function () {
      if (!produced.trim()) throw new Error('模型没有返回内容');
      return produced;
    });
  }

  /* ---------- 浏览器交互（Node 下不可用） ---------- */

  function init(deps) {
    if (!documentRef) return;
    var editor = deps.editor;
    var bar = deps.bar;
    var toast = deps.toast;
    var scheduleConvert = deps.scheduleConvert;
    var controller = null;
    var busy = false;

    var countLabel = bar.querySelector('[data-ai-count]');
    var stopBtn = bar.querySelector('[data-ai-stop]');
    var settingBtn = bar.querySelector('[data-ai-setting]');

    function refreshBar() {
      var active = document.activeElement === editor;
      var start = editor.selectionStart;
      var end = editor.selectionEnd;
      var selected = active && start !== end ? editor.value.slice(start, end) : '';
      bar.hidden = busy ? false : !selected;
      if (countLabel) countLabel.textContent = selected ? String(selected.length) : '…';
      bar.classList.toggle('busy', busy);
    }

    function run(actionId) {
      if (busy) return;
      var start = editor.selectionStart;
      var end = editor.selectionEnd;
      var original = editor.value.slice(start, end);
      if (!original.trim()) { toast('先选中要改写的文字'); return; }
      var conf = settings();
      if (!conf.key || !conf.model) { openSettingForm(original); return; }
      busy = true;
      editor.readOnly = true;
      refreshBar();
      var before = editor.value.slice(0, start);
      var after = editor.value.slice(end);
      controller = new AbortController();
      polish(actionId, original, {
        controller: controller,
        onDelta: function (piece, produced) {
          editor.value = before + produced + after;
          var caret = (before + produced).length;
          editor.setSelectionRange(caret, caret);
        }
      }).then(function () {
        toast('✓ 已' + (ACTIONS.filter(function (item) { return item.id === actionId; })[0] || {}).name);
      }).catch(function (error) {
        editor.value = before + original + after; /* 失败回滚原文 */
        toast(error && error.name === 'AbortError' ? '已停止，原文未改动' : 'AI 改写失败：' + (error.message || error));
      }).finally(function () {
        busy = false;
        controller = null;
        editor.readOnly = false;
        editor.focus();
        refreshBar();
        scheduleConvert();
      });
    }

    function openSettingForm(pendingText) {
      var conf = settings();
      var panel = document.createElement('div');
      panel.className = 'ai-setting-pop';
      panel.innerHTML = '<div class="ai-setting-head">AI 设置（与创作页共享）</div>'
        + '<label>API 地址<input data-field="base" type="text" value="' + Shared.esc(conf.base) + '"></label>'
        + '<label>API 密钥<input data-field="key" type="password" placeholder="sk-…" value="' + Shared.esc(conf.key) + '"></label>'
        + '<label>模型名<input data-field="model" type="text" placeholder="如 gpt-4o-mini" value="' + Shared.esc(conf.model) + '"></label>'
        + (conf.key ? '' : '<p class="ai-setting-tip"><a href="https://www.yituohub.si/" target="_blank" rel="noopener">没有密钥？可在易拓AI 中转站自助开通（OpenAI 兼容）</a></p>')
        + '<div class="ai-setting-actions"><button type="button" class="btn tiny primary" data-ai-save>保存</button>'
        + '<button type="button" class="btn tiny ghost" data-ai-cancel>取消</button></div>';
      panel.addEventListener('click', function (event) { event.stopPropagation(); });
      panel.querySelector('[data-ai-save]').addEventListener('click', function () {
        var next = {};
        panel.querySelectorAll('[data-field]').forEach(function (input) { next[input.dataset.field] = input.value; });
        saveSettings(next);
        document.body.removeChild(panel);
        toast('✓ AI 设置已保存');
        if (pendingText) run('polish');
      });
      panel.querySelector('[data-ai-cancel]').addEventListener('click', function () {
        document.body.removeChild(panel);
      });
      document.body.appendChild(panel);
      var dismiss = function (event) {
        if (panel.contains(event.target)) return;
        document.body.removeChild(panel);
        document.removeEventListener('click', dismiss);
      };
      setTimeout(function () { document.addEventListener('click', dismiss); }, 0);
    }

    bar.querySelectorAll('[data-ai-action]').forEach(function (button) {
      button.addEventListener('click', function () { run(button.dataset.aiAction); });
    });
    if (stopBtn) stopBtn.addEventListener('click', function () { if (controller) controller.abort(); });
    if (settingBtn) settingBtn.addEventListener('click', function () { openSettingForm(''); });

    document.addEventListener('selectionchange', refreshBar);
    editor.addEventListener('keyup', refreshBar);
    editor.addEventListener('mouseup', refreshBar);
    editor.addEventListener('focus', refreshBar);
    editor.addEventListener('blur', function () { setTimeout(refreshBar, 180); });
  }

  return {
    ACTIONS: ACTIONS,
    buildMessages: buildMessages,
    systemPromptFor: systemPromptFor,
    settings: settings,
    saveSettings: saveSettings,
    readSseChunk: readSseChunk,
    polish: polish,
    init: init
  };
});

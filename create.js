/* YI TUO HUB STUDIO · AI 文章创作
 * 直连用户填写的 OpenAI 兼容 API（默认 https://api.yituohub.com/）：
 * - GET  {base}/v1/models          载入模型列表
 * - POST {base}/v1/chat/completions 流式生成公众号文章 Markdown
 * 配图：粘贴/拖入/选择图片 → 压缩转 base64 内联；配置图床后自动上传换外链。
 * 密钥只保存在浏览器 localStorage，不经过本站任何后端。
 */
(function () {
  'use strict';

  var Shared = window.Md2GZHShared;

  var DEFAULT_BASE = 'https://api.yituohub.com';
  var LS = {
    base: 'yth.create.base', key: 'yth.create.key', model: 'yth.create.model', topic: 'yth.create.topic',
    type: 'yth.create.type', length: 'yth.create.length',
    customType: 'yth.create.customType', customLen: 'yth.create.customLen',
    imgbedUrl: 'yth.create.imgbed.url', imgbedKey: 'yth.create.imgbed.key',
    imgbedField: 'yth.create.imgbed.field', imgbedAuth: 'yth.create.imgbed.auth'
  };
  var HANDOFF_KEY = 'yth.create.handoff';

  var TYPES = [
    { id: 'deep', name: '深度长文', brief: '有论证链的完整长文，适合打磨成代表作' },
    { id: 'howto', name: '实用干货', brief: '以可操作步骤为主，看完就能上手' },
    { id: 'opinion', name: '观点评论', brief: '旗帜鲜明的个人观点，先立场后论据' },
    { id: 'case', name: '案例拆解', brief: '围绕一个真实案例复盘得失' },
    { id: 'trend', name: '热点解读', brief: '从近期事件切入，给出结构化解读' },
    { id: 'essay', name: '个人随笔', brief: '第一人称叙事，有温度的生活观察' },
    { id: 'custom', name: '自定义', brief: '' }
  ];
  var LENGTHS = [
    { id: 'short', name: '短篇', words: '800 字左右' },
    { id: 'mid', name: '中篇', words: '1500 字左右' },
    { id: 'long', name: '长篇', words: '3000 字左右' },
    { id: 'custom', name: '自定义', words: '' }
  ];

  var baseInput = document.getElementById('apiBase');
  var keyInput = document.getElementById('apiKey');
  var modelSelect = document.getElementById('modelSelect');
  var connBadge = document.getElementById('connBadge');
  var topicInput = document.getElementById('topic');
  var extraInput = document.getElementById('extra');
  var appendMode = document.getElementById('appendMode');
  var typeRow = document.getElementById('typeRow');
  var lenRow = document.getElementById('lenRow');
  var customType = document.getElementById('customType');
  var customLenRow = document.getElementById('customLenRow');
  var customLen = document.getElementById('customLen');
  var generateBtn = document.getElementById('btnGenerate');
  var modelsBtn = document.getElementById('btnModels');
  var stopBtn = document.getElementById('btnStop');
  var output = document.getElementById('output');
  var statBadge = document.getElementById('statBadge');
  var outputPane = document.querySelector('.output-pane');
  var copyBtn = document.getElementById('btnCopy');
  var toStudioBtn = document.getElementById('btnToStudio');
  var toastEl = document.getElementById('toast');

  var imageCard = document.getElementById('imageCard');
  var imageDrop = document.getElementById('imageDrop');
  var imageTray = document.getElementById('imageTray');
  var fileInput = document.getElementById('fileInput');
  var pickBtn = document.getElementById('btnPickImage');
  var imgbedToggle = document.getElementById('imgbedToggle');
  var imgbedPanel = document.getElementById('imgbedPanel');
  var imgbedState = document.getElementById('imgbedState');
  var imgbedUrl = document.getElementById('imgbedUrl');
  var imgbedKey = document.getElementById('imgbedKey');
  var imgbedField = document.getElementById('imgbedField');
  var imgbedAuth = document.getElementById('imgbedAuth');

  var state = {
    type: TYPES[0].id,
    length: LENGTHS[1].id,
    generating: false,
    controller: null,
    savedModel: '',
    images: [],
    imageSeq: 0
  };

  /* ---------- 基础工具 ---------- */

  function toast(message) { Shared.toast(toastEl, message, 2600); }

  function apiBase() {
    var value = (baseInput.value || DEFAULT_BASE).trim().replace(/\/+$/, '');
    if (/\/v1$/i.test(value)) value = value.replace(/\/v1$/i, '');
    return value || DEFAULT_BASE;
  }

  function apiKey() { return keyInput.value.trim(); }

  var apiKeyTip = document.getElementById('apiKeyTip');
  function refreshApiKeyTip() {
    if (!apiKeyTip) return;
    apiKeyTip.hidden = !!apiKey();
  }

  function needApiKey(actionLabel) {
    if (apiKey()) return false;
    refreshApiKeyTip();
    toast(actionLabel || '先填写 API 密钥');
    if (apiKeyTip && !apiKeyTip.hidden) {
      try { apiKeyTip.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
    }
    keyInput.focus();
    return true;
  }

  function persist() {
    try {
      localStorage.setItem(LS.base, baseInput.value.trim() || DEFAULT_BASE);
      localStorage.setItem(LS.key, apiKey());
      localStorage.setItem(LS.model, modelSelect.value || '');
      localStorage.setItem(LS.type, state.type);
      localStorage.setItem(LS.length, state.length);
      localStorage.setItem(LS.customType, customType.value.trim());
      localStorage.setItem(LS.customLen, customLen.value.trim());
      localStorage.setItem(LS.imgbedUrl, imgbedUrl.value.trim());
      localStorage.setItem(LS.imgbedKey, imgbedKey.value.trim());
      localStorage.setItem(LS.imgbedField, imgbedField.value.trim());
      localStorage.setItem(LS.imgbedAuth, imgbedAuth.value);
    } catch (error) { Shared.warnOnce('localStorage 不可用，设置不再保存', error); }
  }

  function wordCount(text) { return text.replace(/\s/g, '').length; }

  function setStat(text, cls) {
    statBadge.className = 'badge' + (cls ? ' ' + cls : '');
    statBadge.textContent = text;
  }

  function setConn(text, cls) {
    connBadge.className = 'badge' + (cls ? ' ' + cls : '');
    connBadge.textContent = text;
  }

  /* ---------- 选项 chips（含自定义） ---------- */

  function syncCustomFields() {
    customType.hidden = state.type !== 'custom';
    customLenRow.hidden = state.length !== 'custom';
  }

  function buildChips(row, list, kind, onPick) {
    list.forEach(function (item) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (state[kind] === item.id ? ' active' : '');
      chip.textContent = item.name;
      if (item.brief) chip.title = item.brief;
      if (item.words) chip.title = item.words;
      chip.addEventListener('click', function () {
        state[kind] = item.id;
        row.querySelectorAll('.chip').forEach(function (node) {
          node.classList.toggle('active', node === chip);
        });
        syncCustomFields();
        persist();
        if (onPick) onPick();
      });
      row.appendChild(chip);
    });
  }

  /* ---------- 模型列表 ---------- */

  function fillModels(ids) {
    modelSelect.innerHTML = '';
    ids.forEach(function (id) {
      var option = document.createElement('option');
      option.value = id;
      option.textContent = id;
      modelSelect.appendChild(option);
    });
    var preferred = state.savedModel && ids.indexOf(state.savedModel) !== -1 ? state.savedModel : '';
    if (!preferred && ids.length) {
      var hint = ids.filter(function (id) { return /gpt|claude|glm|deepseek|gemini|kimi|qwen/i.test(id); })[0];
      preferred = hint || ids[0];
    }
    modelSelect.value = preferred;
    state.savedModel = preferred;
  }

  function loadModels() {
    if (needApiKey('先填写 API 密钥')) return;
    persist();
    setConn('载入模型…', 'warn');
    modelsBtn.disabled = true;
    fetch(apiBase() + '/v1/models', { headers: { Authorization: 'Bearer ' + apiKey() } })
      .then(function (response) {
        if (response.status === 401) throw new Error('密钥无效（401），检查后重试');
        if (!response.ok) throw new Error('接口返回 ' + response.status);
        return response.json();
      })
      .then(function (payload) {
        var ids = (payload && payload.data || []).map(function (item) { return item.id; }).filter(Boolean);
        if (!ids.length) throw new Error('接口没有返回可用模型');
        fillModels(ids);
        setConn('已连接 · ' + ids.length + ' 个模型', 'ok');
        persist();
      })
      .catch(function (error) {
        setConn('连接失败', 'bad');
        toast(error.message === 'Failed to fetch'
          ? '连不上 API：检查地址拼写或本机网络'
          : '模型列表加载失败：' + error.message);
      })
      .finally(function () { modelsBtn.disabled = false; });
  }

  /* ---------- 生成 ---------- */

  var SYSTEM_PROMPT = [
    '你是一名公众号主笔，为作者的微信公众号写一篇完整文章。要求：',
    '- 像一个见过事、查过材料、愿意把来脉讲清楚的人在说话，拒绝空泛套话、喊口号和 AI 腔。',
    '- 观点具体、有取舍；例子和细节优先，少讲大道理。',
    '- 中文自然韵律：长短句交错，段落有呼吸感，不堆排比。',
    '- 第一行是「# 文章主标题」；正文章节用「## 章节名」，不要自己写章节编号（排版引擎会自动编号 01/02…）。',
    '- 每段开头的第一个「**加粗词**」会被升级为关键词下划线，善用它点出段落核心。',
    '- 可用语法：**加粗**、*斜体*、==荧光高亮==、++下划线++、> 引用、有序/无序列表、表格、代码块。',
    '- 不要插图，除非用户明确给了图片链接。',
    '- 不要署名、不要「以下是文章」之类的开场白，直接输出 Markdown 正文。'
  ].join('\n');

  function customWords() {
    var value = parseInt(customLen.value, 10);
    if (isNaN(value) || value < 100) return '';
    return Math.min(value, 20000) + ' 字左右';
  }

  function buildMessages() {
    var type = TYPES.filter(function (item) { return item.id === state.type; })[0];
    var length = LENGTHS.filter(function (item) { return item.id === state.length; })[0];
    var lines = [];
    if (type.id === 'custom') {
      lines.push('按下面的自定义写作要求写一篇公众号文章：');
      lines.push('「' + customType.value.trim() + '」');
    } else {
      lines.push('写一篇公众号「' + type.name + '」（' + type.brief + '）。');
    }
    var words = length.id === 'custom' ? customWords() : length.words;
    if (words) lines.push('篇幅 ' + words + '。');
    lines.push('选题：' + topicInput.value.trim());
    var extra = extraInput.value.trim();
    if (extra) lines.push('补充要求：' + extra);
    if (appendMode.checked && output.value.trim()) {
      lines.push('这是已有文章的续写：接着已给内容继续向下写，不要重复、不要改写上文。');
      lines.push('已有内容：\n' + output.value.trim());
    }
    return [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: lines.join('\n') }];
  }

  function readSseChunk(buffer, onDelta) {
    var lines = buffer.split('\n');
    var rest = lines.pop();
    lines.forEach(function (line) {
      line = line.trim();
      if (!line || line.indexOf('data:') !== 0) return;
      var payload = line.slice(5).trim();
      if (payload === '[DONE]') { onDelta(null, true); return; }
      try {
        var json = JSON.parse(payload);
        var delta = json.choices && json.choices[0] && json.choices[0].delta;
        var piece = delta && delta.content;
        if (piece) onDelta(piece, false);
      } catch (error) { /* 跳过半截/非 JSON 行 */ }
    });
    return rest;
  }

  function generate() {
    if (state.generating) return;
    if (needApiKey('先填写 API 密钥')) return;
    if (!modelSelect.value) { toast('先点「刷新模型」选一个模型'); return; }
    if (!topicInput.value.trim()) { toast('先写下选题'); topicInput.focus(); return; }
    if (state.type === 'custom' && !customType.value.trim()) { toast('自定义类型：先写一句要求'); customType.focus(); return; }
    if (state.length === 'custom' && !customWords()) { toast('自定义篇幅：填一个 100 以上的字数'); customLen.focus(); return; }

    persist();
    if (!appendMode.checked || !output.value.trim()) output.value = '';
    outputPane.classList.add('generating');
    state.generating = true;
    state.controller = new AbortController();
    generateBtn.disabled = true;
    stopBtn.hidden = false;
    setStat('生成中…', 'live');

    var produced = output.value;
    var decoder = new TextDecoder();
    var buffer = '';

    fetch(apiBase() + '/v1/chat/completions', {
      method: 'POST',
      signal: state.controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey() },
      body: JSON.stringify({ model: modelSelect.value, stream: true, messages: buildMessages() })
    }).then(function (response) {
      if (response.status === 401) throw new Error('密钥无效（401）');
      if (!response.ok) {
        return response.json().catch(function () { return {}; }).then(function (payload) {
          throw new Error((payload.error && payload.error.message) || '接口返回 ' + response.status);
        });
      }
      var reader = response.body.getReader();
      var lastStatAt = 0;
      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) return;
          buffer = readSseChunk(buffer + decoder.decode(chunk.value, { stream: true }), function (piece) {
            if (!piece) return;
            produced += piece;
            output.value = produced;
            output.scrollTop = output.scrollHeight;
            /* 字数统计节流：长文流式时避免每个 chunk 都全量扫描 */
            var now = Date.now();
            if (now - lastStatAt >= 400) {
              lastStatAt = now;
              setStat('生成中 · ' + wordCount(produced) + ' 字', 'live');
            }
          });
          return pump();
        });
      }
      return pump();
    }).then(function () {
      if (!produced.trim()) throw new Error('模型没有返回内容，换一个模型试试');
      setStat('完成 · ' + wordCount(produced) + ' 字', 'ok');
      toast('✓ 写完了，可以复制或送去排版');
    }).catch(function (error) {
      if (error && error.name === 'AbortError') {
        setStat(produced.trim() ? '已停止 · ' + wordCount(produced) + ' 字' : '已停止', 'warn');
      } else {
        setStat('失败', 'bad');
        toast(error.message === 'Failed to fetch'
          ? '连不上 API：检查地址、密钥与网络'
          : '生成失败：' + error.message);
      }
    }).finally(function () {
      state.generating = false;
      state.controller = null;
      generateBtn.disabled = false;
      stopBtn.hidden = true;
      outputPane.classList.remove('generating');
      if (topicInput.value.trim()) {
        try { localStorage.setItem(LS.topic, topicInput.value.trim()); } catch (error) { Shared.warnOnce('localStorage 不可用，选题不再保存', error); }
      }
    });
  }

  /* ---------- 配图：粘贴 / 拖入 / 选择 → 压缩 → base64 或图床 ---------- */

  function imgbedConfigured() { return imgbedUrl.value.trim().length > 0; }

  function refreshImgbedState() {
    imgbedState.textContent = imgbedConfigured()
      ? '已启用 · ' + imgbedUrl.value.trim().replace(/^https?:\/\//, '').slice(0, 42)
      : '未启用（配图走 base64 内联）';
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('读取图片失败')); };
      reader.readAsDataURL(blob);
    });
  }

  function decodeImage(blob) {
    return blobToDataUrl(blob).then(function (dataUrl) {
      return new Promise(function (resolve, reject) {
        var image = new Image();
        image.onload = function () { resolve({ image: image, dataUrl: dataUrl }); };
        image.onerror = function () { reject(new Error('不是有效的图片')); };
        image.src = dataUrl;
      });
    });
  }

  /* 大图自动压到最长边 1600 / JPEG 0.86，小图原样保留 */
  function normalizeImage(file) {
    if (file.size <= 600 * 1024) {
      return blobToDataUrl(file).then(function (dataUrl) {
        return { blob: file, dataUrl: dataUrl };
      });
    }
    return decodeImage(file).then(function (decoded) {
      var image = decoded.image;
      var longest = Math.max(image.width, image.height);
      if (longest <= 1600 && file.size <= 900 * 1024) {
        return { blob: file, dataUrl: decoded.dataUrl };
      }
      var scale = Math.min(1, 1600 / longest);
      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          if (blob && blob.size < file.size) {
            blobToDataUrl(blob).then(function (dataUrl) { resolve({ blob: blob, dataUrl: dataUrl }); });
          } else {
            resolve({ blob: file, dataUrl: decoded.dataUrl });
          }
        }, 'image/jpeg', 0.86);
      });
    });
  }

  function findImageUrl(value) {
    var preferred = ['url', 'link', 'img_url', 'image', 'src', 'path'];
    var found = null;
    function walk(node) {
      if (found) return;
      if (typeof node === 'string') {
        if (!found && /^https?:\/\/\S+$/i.test(node)) found = node;
        return;
      }
      if (!node || typeof node !== 'object') return;
      if (node.url && typeof node.url === 'string' && /^https?:/i.test(node.url)) { found = node.url; return; }
      for (var i = 0; i < preferred.length && !found; i++) {
        if (node[preferred[i]] && typeof node[preferred[i]] === 'string' && /^https?:/i.test(node[preferred[i]])) {
          found = node[preferred[i]];
          return;
        }
      }
      Object.keys(node).forEach(function (key) { if (!found) walk(node[key]); });
    }
    walk(value);
    return found;
  }

  function uploadToImgbed(item) {
    var url = imgbedUrl.value.trim();
    var key = imgbedKey.value.trim();
    var field = (imgbedField.value.trim() || 'file');
    var auth = imgbedAuth.value || 'both';
    var form = new FormData();
    form.append(field, item.blob, item.fileName);
    if (key && (auth === 'both' || auth === 'form')) form.append('token', key);
    var headers = {};
    if (key && (auth === 'both' || auth === 'bearer')) headers.Authorization = 'Bearer ' + key;
    if (key && auth === 'header') headers.Authorization = key;
    item.status = 'uploading';
    renderTray();
    return fetch(url, { method: 'POST', headers: headers, body: form })
      .then(function (response) {
        if (!response.ok) throw new Error('图床返回 ' + response.status);
        return response.json();
      })
      .then(function (payload) {
        var link = findImageUrl(payload);
        if (!link) throw new Error('返回里没解析出图片链接');
        item.url = link;
        item.status = 'hosted';
      })
      .catch(function (error) {
        item.status = 'local';
        item.error = error.message;
        toast('图床上传失败（' + error.message + '），该图改用 base64 内联');
      })
      .then(function () { renderTray(); });
  }

  var MAX_IMAGE_COUNT = 20;
  var MAX_IMAGE_TOTAL_BYTES = 50 * 1024 * 1024;

  function imageTotalBytes() {
    return state.images.reduce(function (sum, item) { return sum + (item.blob.size || 0); }, 0);
  }

  function addImageFile(file) {
    if (!file || !/^image\//.test(file.type)) { toast('只支持图片文件'); return; }
    if (file.size > 15 * 1024 * 1024) { toast('图片超过 15MB，先压缩一下再贴'); return; }
    if (state.images.length >= MAX_IMAGE_COUNT) { toast('配图最多 ' + MAX_IMAGE_COUNT + ' 张，先移除一些再添加'); return; }
    if (imageTotalBytes() + file.size > MAX_IMAGE_TOTAL_BYTES) { toast('配图总大小即将超过 50MB，先移除大图或启用图床'); return; }
    normalizeImage(file).then(function (normalized) {
      var item = {
        id: ++state.imageSeq,
        fileName: (file.name || '').replace(/\.[^.]+$/, '') || ('配图' + state.imageSeq),
        blob: normalized.blob,
        dataUrl: normalized.dataUrl,
        url: '',
        status: 'local',
        error: ''
      };
      state.images.push(item);
      renderTray();
      toast('已加入配图 ' + item.fileName + '，点「插入」放进文章');
      if (imgbedConfigured()) uploadToImgbed(item); else renderTray();
    }).catch(function (error) { toast(error.message || '图片处理失败'); });
  }

  function imageMarkdown(item) {
    var src = item.status === 'hosted' ? item.url : item.dataUrl;
    var alt = String(item.fileName).replace(/[\[\]]/g, ' ');
    return '![' + alt + '](' + src + ')';
  }

  function insertImage(item) {
    var markdown = imageMarkdown(item) + '\n\n';
    var caret = output.selectionStart;
    if (caret === null || caret === undefined || caret > output.value.length) caret = output.value.length;
    var before = output.value.slice(0, caret);
    var after = output.value.slice(caret);
    if (before && !/\n\n$/.test(before)) {
      if (/\n$/.test(before)) before += '\n';
      else before += '\n\n';
    }
    output.value = before + markdown + after;
    output.focus();
    var pos = before.length + markdown.length;
    output.setSelectionRange(pos, pos);
    setStat(wordCount(output.value) ? '已编辑 · ' + wordCount(output.value) + ' 字' : '等待创作');
  }

  function renderTray() {
    imageTray.innerHTML = '';
    imageTray.hidden = state.images.length === 0;
    state.images.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'tray-item' + (item.status === 'hosted' ? ' hosted' : '');
      var thumb = document.createElement('img');
      thumb.src = item.dataUrl;
      thumb.alt = item.fileName;
      card.appendChild(thumb);
      var meta = document.createElement('div');
      meta.className = 'tray-meta';
      var name = document.createElement('strong');
      name.textContent = item.fileName;
      meta.appendChild(name);
      var status = document.createElement('small');
      if (item.status === 'uploading') status.textContent = '上传图床中…';
      else if (item.status === 'hosted') status.textContent = '已上图床 · 外链';
      else if (item.error) status.textContent = '图床失败 · base64 内联';
      else status.textContent = (Math.ceil(item.blob.size / 1024)) + 'KB · base64 内联';
      meta.appendChild(status);
      card.appendChild(meta);
      var actions = document.createElement('div');
      actions.className = 'tray-actions';
      var insertBtn = document.createElement('button');
      insertBtn.type = 'button';
      insertBtn.className = 'btn tiny ghost';
      insertBtn.textContent = '插入';
      insertBtn.title = '在文章光标处插入这张配图';
      insertBtn.disabled = item.status === 'uploading';
      insertBtn.addEventListener('click', function () { insertImage(item); });
      actions.appendChild(insertBtn);
      if (item.status === 'local' && imgbedConfigured()) {
        var retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'btn tiny ghost';
        retryBtn.textContent = '传图床';
        retryBtn.addEventListener('click', function () { uploadToImgbed(item); });
        actions.appendChild(retryBtn);
      }
      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn tiny ghost';
      removeBtn.textContent = '移除';
      removeBtn.addEventListener('click', function () {
        state.images = state.images.filter(function (node) { return node !== item; });
        renderTray();
      });
      actions.appendChild(removeBtn);
      card.appendChild(actions);
      imageTray.appendChild(card);
    });
  }

  document.addEventListener('paste', function (event) {
    var items = event.clipboardData && event.clipboardData.items;
    if (!items) return;
    var images = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf('image/') === 0) {
        var file = items[i].getAsFile();
        if (file) images.push(file);
      }
    }
    if (!images.length) return;
    event.preventDefault();
    images.forEach(addImageFile);
  });

  imageCard.addEventListener('dragover', function (event) { event.preventDefault(); imageDrop.classList.add('over'); });
  imageCard.addEventListener('dragleave', function () { imageDrop.classList.remove('over'); });
  imageCard.addEventListener('drop', function (event) {
    event.preventDefault();
    imageDrop.classList.remove('over');
    Array.prototype.forEach.call(event.dataTransfer.files, addImageFile);
  });
  pickBtn.addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    Array.prototype.forEach.call(fileInput.files, addImageFile);
    fileInput.value = '';
  });

  imgbedToggle.addEventListener('click', function () {
    imgbedPanel.hidden = !imgbedPanel.hidden;
    imgbedToggle.classList.toggle('active', !imgbedPanel.hidden);
  });
  [imgbedUrl, imgbedKey, imgbedField].forEach(function (input) {
    input.addEventListener('change', function () { persist(); refreshImgbedState(); });
  });
  imgbedAuth.addEventListener('change', function () { persist(); });

  /* ---------- 复制 / 去排版 ---------- */

  function copyMarkdown() {
    var text = output.value;
    if (!text.trim()) { toast('还没有内容可复制'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('✓ Markdown 已复制'); });
    } else {
      output.select();
      document.execCommand('copy');
      toast('✓ Markdown 已复制（兼容模式）');
    }
  }

  function sendToStudio() {
    if (!output.value.trim()) { toast('先创作一篇文章'); return; }
    try { localStorage.setItem(HANDOFF_KEY, output.value); }
    catch (error) { toast('浏览器存储不可用：' + error.message); return; }
    location.href = 'studio.html';
  }

  /* ---------- 事件 / 启动 ---------- */

  generateBtn.addEventListener('click', generate);
  stopBtn.addEventListener('click', function () { if (state.controller) state.controller.abort(); });
  modelsBtn.addEventListener('click', loadModels);
  keyInput.addEventListener('input', refreshApiKeyTip);
  keyInput.addEventListener('change', function () { refreshApiKeyTip(); loadModels(); });
  baseInput.addEventListener('change', loadModels);
  copyBtn.addEventListener('click', copyMarkdown);
  toStudioBtn.addEventListener('click', sendToStudio);
  output.addEventListener('input', function () {
    if (!state.generating) setStat(wordCount(output.value) ? '已编辑 · ' + wordCount(output.value) + ' 字' : '等待创作');
  });
  topicInput.addEventListener('input', function () {
    clearTimeout(topicInput._timer);
    topicInput._timer = setTimeout(function () {
      try { localStorage.setItem(LS.topic, topicInput.value.trim()); } catch (error) { Shared.warnOnce('localStorage 不可用，选题不再保存', error); }
    }, 600);
  });
  customType.addEventListener('input', function () {
    clearTimeout(customType._timer);
    customType._timer = setTimeout(persist, 600);
  });
  customLen.addEventListener('change', persist);
  document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !state.generating) generate();
  });

  (function restore() {
    var saved = {};
    try {
      ['base', 'key', 'model', 'topic', 'type', 'length', 'customType', 'customLen',
       'imgbedUrl', 'imgbedKey', 'imgbedField', 'imgbedAuth'].forEach(function (name) {
        saved[name] = localStorage.getItem(LS[name]) || '';
      });
    } catch (error) { Shared.warnOnce('localStorage 不可用，设置不再恢复', error); }
    baseInput.value = saved.base || DEFAULT_BASE;
    keyInput.value = saved.key;
    topicInput.value = saved.topic;
    state.savedModel = saved.model;
    if (TYPES.some(function (item) { return item.id === saved.type; })) state.type = saved.type;
    if (LENGTHS.some(function (item) { return item.id === saved.length; })) state.length = saved.length;
    customType.value = saved.customType;
    customLen.value = saved.customLen;
    imgbedUrl.value = saved.imgbedUrl;
    imgbedKey.value = saved.imgbedKey;
    imgbedField.value = saved.imgbedField;
    if (saved.imgbedAuth) imgbedAuth.value = saved.imgbedAuth;
    buildChips(typeRow, TYPES, 'type');
    buildChips(lenRow, LENGTHS, 'length');
    syncCustomFields();
    refreshImgbedState();
    if (saved.topic) setStat('选题草稿已恢复', 'warn');
    refreshApiKeyTip();
    if (saved.key) loadModels(); else setConn('未连接 · 待填密钥', 'warn');
  })();
})();

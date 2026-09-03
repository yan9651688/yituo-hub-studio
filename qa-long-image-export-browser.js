/* 浏览器端到端测试：点击“导出长图”，并校验真实下载的 PNG 尺寸与状态反馈。 */
'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const MAX_CANVAS_SIDE = 16384;
const PREFERRED_SCALE = 3;

function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

async function poll(check, timeout, label) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeout) {
    try {
      const result = await check();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }
    await wait(100);
  }
  throw new Error('等待超时：' + label + (lastError ? '（' + lastError.message + '）' : ''));
}

function contentType(file) {
  const types = {
    '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml'
  };
  return types[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

function startStaticServer() {
  const server = http.createServer(function (request, response) {
    let pathname;
    try { pathname = decodeURIComponent((request.url || '/').split('?')[0]); }
    catch (_) { response.writeHead(400).end(); return; }
    if (pathname === '/') pathname = '/studio.html';
    const file = path.resolve(ROOT, '.' + pathname);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, function (error, content) {
      if (error) { response.writeHead(error.code === 'ENOENT' ? 404 : 500).end(); return; }
      response.writeHead(200, { 'content-type': contentType(file) });
      response.end(content);
    });
  });
  return new Promise(function (resolve, reject) {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', function () {
      const address = server.address();
      resolve({ server: server, url: 'http://127.0.0.1:' + address.port + '/studio.html' });
    });
  });
}

function findChrome() {
  const candidates = [
    process.env.YITUO_QA_CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/opt/homebrew/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  ].filter(Boolean);
  return candidates.find(function (candidate) { return fs.existsSync(candidate); });
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id && this.pending.has(message.id)) {
        const request = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message.result || {});
        return;
      }
      (this.listeners.get(message.method) || []).forEach(function (listener) { listener(message.params || {}); });
    });
  }

  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(listener);
  }

  async send(method, params) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve, reject: reject });
      this.socket.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    });
  }

  close() { try { this.socket.close(); } catch (_) {} }
}

function pngMetrics(file) {
  const bytes = fs.readFileSync(file);
  const signature = '89504e470d0a1a0a';
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('下载文件不是有效 PNG：' + path.basename(file));
  }
  return { bytes: bytes.length, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function main() {
  const chromePath = findChrome();
  if (!chromePath) throw new Error('未找到 Chromium/Chrome；可通过 YITUO_QA_CHROME 指定可执行文件路径');

  const serving = await startStaticServer();
  const sessionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yituo-long-image-qa-'));
  const profileDir = path.join(sessionDir, 'profile');
  const downloadDir = path.join(sessionDir, 'downloads');
  fs.mkdirSync(profileDir);
  fs.mkdirSync(downloadDir);
  const debugPort = 9700 + Math.floor(Math.random() * 200);
  const chrome = spawn(chromePath, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + debugPort, '--user-data-dir=' + profileDir,
    '--window-size=1600,1100', 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });
  let cdp;

  try {
    await poll(async function () {
      const response = await fetch('http://127.0.0.1:' + debugPort + '/json/version');
      return response.ok;
    }, 12000, 'Chrome 调试端口');
    const targetResponse = await fetch(
      'http://127.0.0.1:' + debugPort + '/json/new?' + encodeURIComponent(serving.url),
      { method: 'PUT' }
    );
    if (!targetResponse.ok) throw new Error('无法打开工坊页面：' + targetResponse.status);
    const target = await targetResponse.json();
    cdp = new Cdp(target.webSocketDebuggerUrl);
    await cdp.ready;
    await Promise.all([cdp.send('Page.enable'), cdp.send('Runtime.enable')]);
    await cdp.send('Browser.setDownloadBehavior', {
      behavior: 'allow', downloadPath: downloadDir, eventsEnabled: true
    });

    async function evaluate(expression) {
      const result = await cdp.send('Runtime.evaluate', {
        expression: expression, returnByValue: true, awaitPromise: true, userGesture: true
      });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result && result.result.value;
    }

    await poll(function () {
      return evaluate('document.readyState === "complete" && typeof window.html2canvas === "function"'
        + ' && !!document.getElementById("btnExportImage") && !!document.getElementById("preview").contentDocument.body');
    }, 12000, '工坊与离线长图组件初始化');

    const expected = await evaluate('(function(){var doc=document.getElementById("preview").contentDocument,target=doc.body;'
      + 'var width=Math.ceil(Math.max(target.scrollWidth,doc.documentElement.scrollWidth));'
      + 'var height=Math.ceil(Math.max(target.scrollHeight,doc.documentElement.scrollHeight));'
      + 'var scale=Math.min(' + PREFERRED_SCALE + ',' + MAX_CANVAS_SIDE + '/width,' + MAX_CANVAS_SIDE + '/height);'
      + 'return {width:width,height:height,scale:scale,pngWidth:Math.round(width*scale),pngHeight:Math.round(height*scale)};}())');
    if (expected.scale < 0.5) throw new Error('默认样例不应触发超长文章保护');

    await evaluate('document.getElementById("btnExportImage").click();true');
    const download = await poll(function () {
      const files = fs.readdirSync(downloadDir).filter(function (file) { return /\.png$/i.test(file); });
      if (files.length !== 1) return null;
      const file = path.join(downloadDir, files[0]);
      return fs.statSync(file).size > 0 ? file : null;
    }, 20000, 'PNG 下载完成');
    const png = pngMetrics(download);
    const uiState = await poll(function () {
      return evaluate('(function(){var button=document.getElementById("btnExportImage"),toast=document.getElementById("toast");'
        + 'return !button.disabled&&toast.textContent.indexOf("长图已导出 PNG")!==-1;}())');
    }, 5000, '导出完成提示');
    const dimensionsMatch = Math.abs(png.width - expected.pngWidth) <= 1
      && Math.abs(png.height - expected.pngHeight) <= 1;
    if (!dimensionsMatch || !uiState || png.width < 1200 || png.height <= png.width) {
      throw new Error('PNG 校验失败：' + JSON.stringify({ expected: expected, actual: png, uiState: uiState }));
    }
    console.log(JSON.stringify({
      result: 'PASS', filename: path.basename(download), expected: expected, png: png
    }, null, 2));
  } finally {
    if (cdp) { try { await cdp.send('Browser.close'); } catch (_) {} cdp.close(); }
    await new Promise(function (resolve) {
      if (chrome.exitCode !== null || chrome.signalCode !== null) { resolve(); return; }
      var timeout = setTimeout(resolve, 3000);
      chrome.once('exit', function () { clearTimeout(timeout); resolve(); });
      chrome.kill();
    });
    await new Promise(function (resolve) { serving.server.close(resolve); });
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }
}

main().catch(function (error) {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});

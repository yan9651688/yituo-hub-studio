/* 浏览器实测：16 套高级排版 × 动态 375/402/440 + 静态回退 402，生成指标报告与截图。 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const OriginalData = require('./original-visuals-data.js');

const STUDIO_URL = process.argv[2] || 'http://127.0.0.1:8123/studio.html';
const CHROME = process.env.YITUO_QA_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WIDTHS = [375, 402, 440];
const profiles = OriginalData.PROFILES.map(function (profile) {
  return { themeId: profile.themeId, styleId: profile.styleId, name: profile.name };
});

function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

async function poll(fn, timeout, label) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeout) {
    try {
      last = await fn();
      if (last) return last;
    } catch (error) {
      last = error.message;
    }
    await wait(100);
  }
  throw new Error('等待超时：' + label + (last ? '（' + String(last) + '）' : ''));
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
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result || {});
        return;
      }
      const callbacks = this.listeners.get(message.method) || [];
      callbacks.forEach(function (callback) { callback(message.params || {}); });
    });
  }

  on(method, callback) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(callback);
  }

  async send(method, params) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve, reject: reject });
      this.socket.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    });
  }

  close() {
    try { this.socket.close(); } catch (_) {}
  }
}

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error('找不到 Chrome：' + CHROME);
  const studioResponse = await fetch(STUDIO_URL);
  if (!studioResponse.ok) throw new Error('本地预览不可访问：' + STUDIO_URL + '（' + studioResponse.status + '）');

  const sessionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yituo-v30-qa-'));
  const profileDir = path.join(sessionDir, 'chrome-profile');
  const screenshotDir = path.join(sessionDir, 'screenshots');
  fs.mkdirSync(profileDir);
  fs.mkdirSync(screenshotDir);
  const port = 9300 + Math.floor(Math.random() * 500);
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + profileDir,
    '--window-size=1600,1100',
    'about:blank'
  ], { stdio: 'ignore', windowsHide: true });

  let cdp;
  try {
    await poll(async function () {
      const response = await fetch('http://127.0.0.1:' + port + '/json/version');
      return response.ok;
    }, 12000, 'Chrome 调试端口');

    const targetResponse = await fetch(
      'http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(STUDIO_URL),
      { method: 'PUT' }
    );
    if (!targetResponse.ok) throw new Error('无法创建浏览器测试页：' + targetResponse.status);
    const target = await targetResponse.json();
    cdp = new Cdp(target.webSocketDebuggerUrl);
    await cdp.ready;

    const browserErrors = [];
    const networkFailures = [];
    cdp.on('Runtime.exceptionThrown', function (event) {
      browserErrors.push(event.exceptionDetails && event.exceptionDetails.text || 'Runtime exception');
    });
    cdp.on('Log.entryAdded', function (event) {
      if (event.entry && event.entry.level === 'error') browserErrors.push(event.entry.text);
    });
    cdp.on('Network.loadingFailed', function (event) {
      if (!event.canceled) networkFailures.push(event.errorText + ' ' + (event.type || ''));
    });

    await Promise.all([
      cdp.send('Page.enable'),
      cdp.send('Runtime.enable'),
      cdp.send('Log.enable'),
      cdp.send('Network.enable'),
      cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1600, height: 1100, deviceScaleFactor: 1, mobile: false
      })
    ]);

    async function evaluate(expression) {
      const result = await cdp.send('Runtime.evaluate', {
        expression: expression,
        returnByValue: true,
        awaitPromise: true,
        userGesture: true
      });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text + ': ' + (result.exceptionDetails.exception
          && result.exceptionDetails.exception.description || ''));
      }
      return result.result && result.result.value;
    }

    await poll(async function () {
      return evaluate('document.readyState === "complete" && !!window.Md2GZHOriginalVisuals && !!document.getElementById("preview")');
    }, 12000, '工坊页面初始化');

    const report = [];
    let colorwayCombos = 0;
    for (const profile of profiles) {
      /* 每主题先跑默认配色全档位扫描，再逐个验证 4 套定制配色（402 动态 + 静态回退）。 */
      const colorways = OriginalData.colorwaysForTheme(profile.themeId);
      for (let ci = 0; ci < colorways.length; ci++) {
      const colorway = colorways[ci];
      const variantAccent = OriginalData.profileForTheme(profile.themeId, colorway.id).accent;
      colorwayCombos++;
      await evaluate('(function(){var button=document.querySelector("[data-library=original]");button.click();'
        + 'var card=document.querySelector(".pop-card[data-id=' + profile.themeId + ']");'
        + 'if(!card)throw new Error("找不到主题 ' + profile.themeId + '");card.click();return true;}())');

      if (ci) {
        /* 非默认配色通过真实 UI 弹层点击切换，同时验证配色选择器本身可用。 */
        await poll(async function () {
          return evaluate('(function(){var slot=document.getElementById("colorPickerSlot");'
            + 'return !!slot && !slot.hidden && !!slot.querySelector(".color-picker-btn");}())');
        }, 8000, profile.name + ' 配色按钮');
        await evaluate('(function(){document.querySelector("#colorPickerSlot .color-picker-btn").click();'
          + 'var option=document.querySelector(".color-option[data-color=' + colorway.id + ']");'
          + 'if(!option)throw new Error("找不到配色 ' + colorway.id + '");option.click();return true;}())');
      }

      await poll(async function () {
        return evaluate('(function(){var frame=document.getElementById("preview");var root=frame.contentDocument'
          + '&&frame.contentDocument.body&&frame.contentDocument.body.firstElementChild;return !!root'
          + '&&root.getAttribute("data-original-style")===' + JSON.stringify(profile.styleId)
          + '&&root.getAttribute("data-original-colorway")===' + JSON.stringify(colorway.id)
          + '&&root.getAttribute("data-original-template-release")==="v30-standard402-full-effects"'
          + '&&!document.getElementById("validBadge").classList.contains("bad")'
          + '&&document.getElementById("validBadge").textContent.indexOf("载入")===-1;}())');
      }, 15000, profile.name + ' ' + colorway.name + ' 渲染');

      const widths = ci === 0 ? WIDTHS : [402];
      for (const width of widths) {
        const widthSelector = JSON.stringify('[data-preview-width="' + width + '"]');
        await evaluate('(function(){document.querySelector(' + widthSelector + ').click();return true;}())');
        await wait(120);
        const metrics = await evaluate('(function(){'
          + 'var frame=document.getElementById("preview"),doc=frame.contentDocument,body=doc.body,root=body.firstElementChild;'
          + 'var rootRect=root.getBoundingClientRect(),bodyStyle=getComputedStyle(body);'
          + 'var effects=Array.from(root.querySelectorAll("[data-advanced-effect]")).map(function(n){return n.getAttribute("data-advanced-effect");});'
          + 'var placeholders=Array.from(root.querySelectorAll("[data-image-kind=theme-placeholder]"));'
          + 'var placeholderCanvases=placeholders.map(function(n){return n.querySelector("[data-placeholder-canvas=true]");});'
          + 'var headings=Array.from(root.querySelectorAll("[data-article-section-heading=true]"));'
          + 'var gaps=headings.map(function(h){var title=h.querySelector("h2"),motif=h.querySelector("[data-section-title-reusable-decor=foreground]");'
          + 'if(!title||!motif)return null;var a=title.getBoundingClientRect(),b=motif.getBoundingClientRect();return Math.round((b.left-a.right)*100)/100;}).filter(function(v){return v!==null;});'
          + 'var bodyParagraphs=Array.from(root.querySelectorAll("[data-section-body=true] > p"));'
          + 'return {'
          + 'previewWidth:Math.round(frame.getBoundingClientRect().width*100)/100,'
          + 'innerWidth:frame.contentWindow.innerWidth,'
          + 'rootWidth:Math.round(rootRect.width*100)/100,'
          + 'rootMaxWidth:root.style.maxWidth,'
          + 'rootScrollWidth:root.scrollWidth,rootClientWidth:root.clientWidth,'
          + 'bodyScrollWidth:body.scrollWidth,bodyClientWidth:body.clientWidth,'
          + 'bodyPadding:bodyStyle.padding,bodyDisplay:bodyStyle.display,bodyBackground:bodyStyle.backgroundColor,'
          + 'release:root.getAttribute("data-original-template-release"),'
          + 'canvas:root.getAttribute("data-standard-screen"),contentWidth:root.getAttribute("data-standard-content-width"),'
          + 'headings:headings.length,bodies:root.querySelectorAll("[data-section-body=true]").length,'
          + 'longform:!!root.querySelector("[data-longform-article=true]"),'
          + 'images:root.querySelectorAll("img").length,tables:root.querySelectorAll("table").length,'
          + 'placeholderCount:placeholders.length,'
          + 'placeholderThemes:placeholders.map(function(n){return n.getAttribute("data-placeholder-theme");}),'
          + 'placeholderRatios:placeholders.map(function(n){return n.getAttribute("data-placeholder-ratio");}),'
          + 'placeholderAnimations:placeholders.reduce(function(sum,n){return sum+n.querySelectorAll("animate,animateTransform,animateMotion,set").length;},0),'
          + 'placeholderCanvasRatios:placeholderCanvases.map(function(n){var r=n.getBoundingClientRect();return Math.round((r.width/r.height)*100)/100;}),'
          + 'effects:Array.from(new Set(effects)).sort(),effectCount:effects.length,'
          + 'paragraphFonts:Array.from(new Set(bodyParagraphs.map(function(p){return p.style.fontSize+"/"+p.style.lineHeight;}))),'
          + 'bodyWidths:Array.from(new Set(Array.from(root.querySelectorAll("[data-section-body=true]")).map(function(n){return n.style.maxWidth;}))),'
          + 'accentApplied:root.outerHTML.indexOf(' + JSON.stringify(variantAccent) + ')!==-1,'
          + 'colorway:root.getAttribute("data-original-colorway"),'
          + 'headingGaps:gaps};}())');

        const expectedRoot = Math.min(width, 402);
        const requiredEffects = ['code', 'divider', 'image', 'list', 'quote', 'signature', 'subsection', 'table'];
        const ok = metrics.previewWidth === width
          && metrics.innerWidth === width
          && Math.abs(metrics.rootWidth - expectedRoot) <= 0.5
          && metrics.rootMaxWidth === '402px'
          && metrics.rootScrollWidth <= metrics.rootClientWidth + 1
          && metrics.bodyScrollWidth <= metrics.bodyClientWidth + 1
          && metrics.bodyPadding === '0px'
          && metrics.bodyDisplay === 'flex'
          && metrics.release === 'v30-standard402-full-effects'
          && metrics.canvas === '402'
          && metrics.contentWidth === '370'
          && metrics.headings === 4
          && metrics.bodies === 4
          && metrics.longform
          && metrics.images === 0
          && metrics.placeholderCount === 3
          && metrics.placeholderThemes.every(function (theme) { return theme === profile.styleId; })
          && metrics.placeholderRatios.join(',') === '16:9,4:5,2.35:1'
          && metrics.placeholderAnimations === 0
          && metrics.placeholderCanvasRatios.length === 3
          && metrics.placeholderCanvasRatios.every(function (ratio, index) {
            return Math.abs(ratio - [16 / 9, 4 / 5, 2.35][index]) <= 0.03;
          })
          && metrics.tables === 1
          && metrics.accentApplied
          && metrics.colorway === colorway.id
          && requiredEffects.every(function (effect) { return metrics.effects.includes(effect); })
          && metrics.paragraphFonts.every(function (font) { return font === '13px/1.86'; })
          && metrics.bodyWidths.length === 1 && metrics.bodyWidths[0] === '370px';
        report.push({ theme: profile.themeId, name: profile.name, colorway: colorway.id, colorwayName: colorway.name, mode: 'dynamic', width: width, ok: ok, metrics: metrics });

        if (width === 402) {
          const clip = await evaluate('(function(){var r=document.getElementById("preview").getBoundingClientRect();'
            + 'return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:Math.min(1180,r.height)};}())');
          const screenshot = await cdp.send('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: true,
            fromSurface: true,
            clip: { x: clip.x, y: clip.y, width: clip.width, height: clip.height, scale: 1 }
          });
          fs.writeFileSync(path.join(screenshotDir, profile.themeId + (ci ? '-' + colorway.id : '') + '-402.png'), Buffer.from(screenshot.data, 'base64'));
        }
      }

      await evaluate('(function(){Array.from(document.querySelectorAll("[data-preview-width]")).find(function(button){'
        + 'return button.getAttribute("data-preview-width")==="402";}).click();'
        + 'var motion=document.getElementById("motionModeBtn");if(motion.getAttribute("aria-pressed")==="true")motion.click();return true;}())');
      await poll(async function () {
        return evaluate('(function(){var root=document.getElementById("preview").contentDocument.body.firstElementChild;'
          + 'return root&&root.getAttribute("data-original-style")===' + JSON.stringify(profile.styleId)
          + '&&root.getAttribute("data-original-colorway")===' + JSON.stringify(colorway.id)
          + '&&root.getAttribute("data-original-motion-enabled")==="false";}())');
      }, 15000, profile.name + ' ' + colorway.name + ' 静态回退');
      const staticMetrics = await evaluate('(function(){var frame=document.getElementById("preview"),doc=frame.contentDocument,'
        + 'body=doc.body,root=body.firstElementChild,r=root.getBoundingClientRect(),'
        + 'placeholders=Array.from(root.querySelectorAll("[data-image-kind=theme-placeholder]"));return {'
        + 'previewWidth:frame.contentWindow.innerWidth,rootWidth:Math.round(r.width*100)/100,'
        + 'rootScrollWidth:root.scrollWidth,rootClientWidth:root.clientWidth,'
        + 'bodyScrollWidth:body.scrollWidth,bodyClientWidth:body.clientWidth,'
        + 'animations:root.querySelectorAll("animate,animateTransform").length,'
        + 'headings:root.querySelectorAll("[data-article-section-heading=true]").length,'
        + 'bodies:root.querySelectorAll("[data-section-body=true]").length,'
        + 'images:root.querySelectorAll("img").length,tables:root.querySelectorAll("table").length,'
        + 'placeholderCount:placeholders.length,'
        + 'placeholderThemes:placeholders.map(function(n){return n.getAttribute("data-placeholder-theme");}),'
        + 'placeholderRatios:placeholders.map(function(n){return n.getAttribute("data-placeholder-ratio");}),'
        + 'placeholderAnimations:placeholders.reduce(function(sum,n){return sum+n.querySelectorAll("animate,animateTransform,animateMotion,set").length;},0),'
        + 'accentApplied:root.outerHTML.indexOf(' + JSON.stringify(variantAccent) + ')!==-1,'
        + 'release:root.getAttribute("data-original-template-release")};}())');
      const staticOk = staticMetrics.previewWidth === 402
        && staticMetrics.rootWidth === 402
        && staticMetrics.rootScrollWidth <= staticMetrics.rootClientWidth + 1
        && staticMetrics.bodyScrollWidth <= staticMetrics.bodyClientWidth + 1
        && staticMetrics.animations === 0
        && staticMetrics.headings === 4
        && staticMetrics.bodies === 4
        && staticMetrics.images === 0
        && staticMetrics.placeholderCount === 3
        && staticMetrics.placeholderThemes.every(function (theme) { return theme === profile.styleId; })
        && staticMetrics.placeholderRatios.join(',') === '16:9,4:5,2.35:1'
        && staticMetrics.placeholderAnimations === 0
        && staticMetrics.tables === 1
        && staticMetrics.accentApplied
        && staticMetrics.release === 'v30-standard402-full-effects';
      report.push({ theme: profile.themeId, name: profile.name, colorway: colorway.id, colorwayName: colorway.name, mode: 'static-fallback', width: 402, ok: staticOk, metrics: staticMetrics });
      await evaluate('(function(){var motion=document.getElementById("motionModeBtn");'
        + 'if(motion.getAttribute("aria-pressed")==="false")motion.click();return true;}())');
      await poll(async function () {
        return evaluate('(function(){var root=document.getElementById("preview").contentDocument.body.firstElementChild;'
          + 'return root&&root.getAttribute("data-original-style")===' + JSON.stringify(profile.styleId)
          + '&&root.getAttribute("data-original-motion-enabled")==="true";}())');
      }, 15000, profile.name + ' 恢复动态');
      }
    }

    /* 额外保留不受工坊滚动容器裁切的深海终端全长样张（默认 + 4 套配色），便于人工检查下半篇效果。 */
    const captureFullSample = async function (colorway) {
      /* 全长样张会把主 frame 替换为预览文档，因此每张样张前重新加载工作室。 */
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1600, height: 1100, deviceScaleFactor: 1, mobile: false
      });
      await cdp.send('Page.navigate', { url: STUDIO_URL });
      await poll(async function () {
        return evaluate('document.readyState === "complete" && !!window.Md2GZHOriginalVisuals && !!document.getElementById("preview")');
      }, 12000, '工坊页面初始化（全长样张）');
      await evaluate('(function(){var button=document.querySelector("[data-library=original]");button.click();'
        + 'document.querySelector(".pop-card[data-id=deep-sea]").click();return true;}())');
      /* 切主题会把配色重置为 default，先等 default 渲染落地。 */
      await poll(async function () {
        return evaluate('(function(){var root=document.getElementById("preview").contentDocument.body.firstElementChild;'
          + 'return root&&root.getAttribute("data-original-style")==="deep-sea-terminal"'
          + '&&root.getAttribute("data-original-colorway")==="default";}())');
      }, 15000, '深海终端全长样张 ' + colorway.name);
      if (colorway.id !== 'default') {
        await evaluate('(function(){document.querySelector("#colorPickerSlot .color-picker-btn").click();'
          + 'var option=document.querySelector(".color-option[data-color=' + colorway.id + ']");'
          + 'if(!option)throw new Error("找不到配色 ' + colorway.id + '");option.click();return true;}())');
        await poll(async function () {
          return evaluate('(function(){var root=document.getElementById("preview").contentDocument.body.firstElementChild;'
            + 'return root&&root.getAttribute("data-original-colorway")===' + JSON.stringify(colorway.id) + ';}())');
        }, 15000, '深海终端配色切换 ' + colorway.name);
      }
      await evaluate('(function(){Array.from(document.querySelectorAll("[data-preview-width]")).find(function(button){'
        + 'return button.getAttribute("data-preview-width")==="402";}).click();return true;}())');
      await wait(150);
      const fullPreviewHtml = await evaluate('document.getElementById("preview").contentDocument.documentElement.outerHTML');
      const frameTree = await cdp.send('Page.getFrameTree');
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 402, height: 1100, deviceScaleFactor: 1, mobile: false
      });
      await cdp.send('Page.setDocumentContent', {
        frameId: frameTree.frameTree.frame.id,
        html: fullPreviewHtml
      });
      await poll(async function () {
        return evaluate('document.readyState==="complete"&&Array.from(document.images).every(function(img){return img.complete;})');
      }, 12000, '全长样张图片');
      await evaluate('document.documentElement.style.overflow="visible";document.body.style.overflow="visible";true');
      const fullLayout = await cdp.send('Page.getLayoutMetrics');
      const fullSize = fullLayout.cssContentSize || fullLayout.contentSize;
      const fullScreenshot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        fromSurface: true,
        clip: { x: 0, y: 0, width: 402, height: Math.ceil(fullSize.height), scale: 1 }
      });
      const fullScreenshotPath = path.join(screenshotDir, 'deep-sea-' + (colorway.id === 'default' ? 'full' : colorway.id) + '-402.png');
      fs.writeFileSync(fullScreenshotPath, Buffer.from(fullScreenshot.data, 'base64'));
      return fullScreenshotPath;
    };
    const deepSeaColorways = OriginalData.colorwaysForTheme('deep-sea');
    let fullScreenshotPath = '';
    for (const colorway of deepSeaColorways) {
      fullScreenshotPath = await captureFullSample(colorway);
    }

    const failures = report.filter(function (item) { return !item.ok; });
    const result = {
      url: STUDIO_URL,
      release: 'v30-standard402-full-effects',
      themes: profiles.length,
      colorwayCombos: colorwayCombos,
      widths: WIDTHS,
      checks: report.length,
      results: report,
      failures: failures,
      browserErrors: browserErrors,
      networkFailures: Array.from(new Set(networkFailures)),
      screenshotDir: screenshotDir,
      fullScreenshot: fullScreenshotPath
    };
    const reportPath = path.join(sessionDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify({
      themes: result.themes,
      colorwayCombos: result.colorwayCombos,
      checks: result.checks,
      failures: failures.length,
      browserErrors: browserErrors.length,
      networkFailures: result.networkFailures,
      reportPath: reportPath,
      screenshotDir: screenshotDir,
      fullScreenshot: fullScreenshotPath
    }, null, 2));
    if (failures.length || browserErrors.length || result.networkFailures.length) process.exitCode = 1;
  } finally {
    if (cdp) {
      try { await cdp.send('Browser.close'); } catch (_) {}
      cdp.close();
    }
    await wait(250);
    if (!chrome.killed) chrome.kill();
  }
}

main().catch(function (error) {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});

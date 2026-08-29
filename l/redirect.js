(() => {
  "use strict";

  // The destination is fixed at build time. It is encoded only to avoid
  // accidental indexing; it is not treated as a secret.
  const encodedTarget = "aHR0cHM6Ly91LndlY2hhdC5jb20vRUVScnZENTYyV0ZYYnRILXRRd3E3bmM/cz0y";
  const status = document.getElementById("status");
  const link = document.getElementById("continue-link");

  try {
    const bytes = Uint8Array.from(atob(encodedTarget), (character) => character.charCodeAt(0));
    const target = new TextDecoder().decode(bytes);
    const url = new URL(target);
    if (url.protocol !== "https:" || url.hostname !== "u.wechat.com") {
      throw new Error("Unexpected redirect target");
    }
    link.href = url.href;
    link.hidden = false;
    window.location.replace(url.href);
  } catch (_error) {
    status.textContent = "跳转地址校验失败，请返回官网重试。";
  }
})();

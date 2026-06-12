function injectScript(file_path, tag) {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file_path);
  node.appendChild(script);
}

// Inject local CryptoJS library
//injectScript(chrome.runtime.getURL("crypto-js.min.js"), "body");
injectScript(chrome.runtime.getURL("forge.min.js"), "body");

// Inject content.js
injectScript(chrome.runtime.getURL("content.js"), "body");

// Bridge page context -> extension service worker for status sync.
window.addEventListener("message", function (event) {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== "ANF_STATUS_EXTENSION") return;
  if (data.type !== "STATUS_UPDATE") return;

  chrome.runtime.sendMessage(
    {
      type: "ANF_STATUS_FROM_PAGE",
      payload: data.payload,
    },
    function () {
      // Ignore runtime errors when service worker is sleeping/restarting.
      void chrome.runtime.lastError;
    }
  );
});

// Runs in <head> before React hydrates (root layout). `beforeinstallprompt` fires once per page
// load, often before any component effect exists, so it is kept on window and announced with an
// event the Account page's alerts panel listens for. A plain module, not "use client": a server
// layout importing a string from a client module gets a reference, not the string
// (_config/guides/nextjs-installable-app-and-push.md, install traps).
export const INSTALL_CAPTURE = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__eccpInstall=e;window.dispatchEvent(new Event("eccp-install-ready"))});if("serviceWorker"in navigator){navigator.serviceWorker.register("/sw.js").catch(function(){})}`;

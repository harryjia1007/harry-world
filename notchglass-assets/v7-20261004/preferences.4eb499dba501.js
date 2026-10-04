
// Read preferences defensively before paint; storage may be unavailable.
(function () {
  var t = "auto";
  try { t = localStorage.getItem("ng-theme") || "auto"; } catch (e) {}
  if (["auto", "light", "dark"].indexOf(t) < 0) t = "auto";
  window.ngTheme = t;
  document.documentElement.dataset.theme = t === "auto" ? (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : t;
}());

/* Handwriting input: canvas strokes -> HanziLookupJS (Make Me a Hanzi data, fully offline) */
(function (root) {
  'use strict';
  var ready = false, matcher = null, waiting = [];
  function init(url) {
    return new Promise(function (res) {
      if (ready) return res(true);
      HanziLookup.init('mmah', url || 'data/mmah.json', function (ok) { ready = !!ok; if (ok) matcher = new HanziLookup.Matcher('mmah'); res(ready); waiting.forEach(function (f) { f(); }); });
    });
  }
  // 手指抖动会产生很多小折线（超过识别库的子笔画上限，也会降低准确率）：用 Douglas-Peucker 抽稀
  function rdp(pts, eps) {
    if (pts.length < 3) return pts;
    var a = pts[0], b = pts[pts.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, md = -1, mi = 0;
    for (var i = 1; i < pts.length - 1; i++) {
      var d = L > 1 ? Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L : Math.hypot(pts[i][0] - a[0], pts[i][1] - a[1]);
      if (d > md) { md = d; mi = i; }
    }
    if (md <= eps) return [a, b];
    return rdp(pts.slice(0, mi + 1), eps).slice(0, -1).concat(rdp(pts.slice(mi), eps));
  }
  function prep(strokes, k) {
    var xs = [], ys = [];
    strokes.forEach(function (st) { st.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
    var size = Math.max(Math.max.apply(null, xs) - Math.min.apply(null, xs), Math.max.apply(null, ys) - Math.min.apply(null, ys), 1);
    return strokes.map(function (st) {
      var o = rdp(st, size * (k || 0.02));
      if (o.length === 1) o = [o[0], [o[0][0] + 1, o[0][1] + 1]];
      return o;
    });
  }
  function recognize(strokes, limit) {
    return new Promise(function (res) {
      if (!ready || !strokes.length) return res([]);
      var ks = [0.02, 0.04, 0.08];
      for (var i = 0; i < ks.length; i++) {
        try {
          var ac = new HanziLookup.AnalyzedCharacter(prep(strokes, ks[i])), out = null;
          matcher.match(ac, limit || 16, function (m) { out = (m || []).map(function (x) { return x.character; }); });
          return res(out || []);
        } catch (e) { /* 子笔画太多，抽稀后再试 */ }
      }
      res([]);
    });
  }
  function Pad(canvas, onChange) {
    var ctx = canvas.getContext('2d'), strokes = [], cur = null, dpr = root.devicePixelRatio || 1;
    function resize() {
      var r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      redraw();
    }
    function grid() {
      var w = canvas.width, h = canvas.height;
      ctx.save(); ctx.strokeStyle = '#f3c6d3'; ctx.lineWidth = 1 * dpr; ctx.setLineDash([6 * dpr, 6 * dpr]);
      ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
      ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke(); ctx.restore();
    }
    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height); grid();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#4a3b3f'; ctx.lineWidth = 9 * dpr;
      strokes.concat(cur ? [cur] : []).forEach(function (s) {
        ctx.beginPath(); s.forEach(function (p, i) { if (i) ctx.lineTo(p[0] * dpr, p[1] * dpr); else ctx.moveTo(p[0] * dpr, p[1] * dpr); });
        if (s.length === 1) ctx.lineTo(s[0][0] * dpr + 0.1, s[0][1] * dpr + 0.1); ctx.stroke();
      });
    }
    function pos(e) { var r = canvas.getBoundingClientRect(); return [Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)]; }
    canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); canvas.setPointerCapture(e.pointerId); cur = [pos(e)]; redraw(); });
    canvas.addEventListener('pointermove', function (e) { if (!cur) return; var p = pos(e), l = cur[cur.length - 1]; if (Math.abs(p[0] - l[0]) + Math.abs(p[1] - l[1]) >= 2) { cur.push(p); redraw(); } });
    function end() { if (!cur) return; strokes.push(cur); cur = null; redraw(); onChange && onChange(strokes.slice()); }
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    root.addEventListener('resize', function () { setTimeout(resize, 50); });
    setTimeout(resize, 0);
    return {
      undo: function () { strokes.pop(); redraw(); onChange && onChange(strokes.slice()); },
      clear: function () { strokes = []; redraw(); onChange && onChange([]); },
      strokes: function () { return strokes.slice(); },
      resize: resize
    };
  }
  root.HW = { init: init, recognize: recognize, prep: prep, Pad: Pad, get ready() { return ready; } };
})(window);

/* Hanzi Bear · voice input in Chinese / English / German.
 * Main path: record PCM with Web Audio -> 16 kHz mono WAV in the browser -> proxy /asr (works in iOS Safari and in
 * home-screen apps, no mp4/aac problem). Fallback: the browser's Web Speech API (webkitSpeechRecognition). */
(function (root) {
  'use strict';
  var CODES = { zh: 'zh-CN', en: 'en-US', de: 'de-DE' };
  var rec = null, ws = null, wsText = '', wsFinal = '', mode = null;
  function hasMic() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
  function SR() { return root.SpeechRecognition || root.webkitSpeechRecognition || null; }
  function isIOS() { var n = root.navigator; return /iP(hone|ad|od)/.test(n.userAgent) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1); }
  function standalone() { return !!(root.navigator.standalone || (root.matchMedia && matchMedia('(display-mode: standalone)').matches)); }
  // decide how to listen for a language: 'proxy' | 'webspeech' | 'none' | 'de_soon'
  var plans = {};
  async function plan(lang) { var m = await plan0(lang); plans[lang] = m; return m; }
  async function plan0(lang) {
    var code = CODES[lang] || 'zh-CN';
    var h = (root.AI && AI.configured() && hasMic() && navigator.onLine !== false) ? await AI.asrHealth() : null;
    if (h && (h.langs.indexOf(code) >= 0 || lang === 'zh' || (lang === 'en' && h.langs.indexOf('zh-CN') >= 0))) return 'proxy';
    // iOS home-screen apps expose webkitSpeechRecognition but it does not work there (WebKit bug 225298), so don't offer it
    if (SR() && navigator.onLine !== false && !(isIOS() && standalone())) return 'webspeech';
    if (h && lang === 'de') return 'de_soon';
    return 'none';
  }
  // ---- Web Audio recorder (iOS-safe: AudioContext is created synchronously inside the tap) ----
  function prepareContext() {
    var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null;
    var ctx = new AC();
    try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) { }
    return ctx;
  }
  async function startRecord(ctx) {
    try { if (navigator.audioSession) navigator.audioSession.type = 'play-and-record'; } catch (e) { }
    var stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch (e) { try { ctx && ctx.close(); } catch (x) { } var er = new Error('no_permission'); er.code = 'no_permission'; throw er; }
    ctx = ctx || prepareContext();
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch (e) { } }
    var src = ctx.createMediaStreamSource(stream), proc = ctx.createScriptProcessor(4096, 1, 1), chunks = [], mute = ctx.createGain();
    mute.gain.value = 0;
    proc.onaudioprocess = function (e) { chunks.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
    src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
    rec = { stream: stream, ctx: ctx, proc: proc, src: src, mute: mute, chunks: chunks, rate: ctx.sampleRate, t0: Date.now() };
  }
  // box-filter downsampling (avoids aliasing from plain decimation) -> 16-bit PCM WAV
  function toWav16k(chunks, rate, maxSec) {
    var len = chunks.reduce(function (a, c) { return a + c.length; }, 0), all = new Float32Array(len), o = 0;
    chunks.forEach(function (c) { all.set(c, o); o += c.length; });
    var ratio = rate / 16000, n = Math.min(Math.floor(len / ratio), 16000 * (maxSec || 15)), pcm = new Int16Array(n), peak = 0;
    for (var i = 0; i < n; i++) {
      var a = Math.floor(i * ratio), b = Math.max(a + 1, Math.floor((i + 1) * ratio)), s = 0;
      for (var j = a; j < b && j < len; j++) s += all[j];
      s /= (b - a); if (Math.abs(s) > peak) peak = Math.abs(s);
      s = Math.max(-1, Math.min(1, s)); pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    var buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    function w(off, str) { for (var k = 0; k < str.length; k++) v.setUint8(off + k, str.charCodeAt(k)); }
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 16000, true); v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    new Int16Array(buf, 44).set(pcm);
    var out = new Uint8Array(buf); out.peak = peak; out.seconds = n / 16000; return out;
  }
  function b64(u8) { var s = ''; for (var i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  function release(r) {
    try { r.proc.disconnect(); r.src.disconnect(); r.mute.disconnect(); } catch (e) { }
    try { r.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { }
    try { r.ctx.close(); } catch (e) { }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { }
  }
  async function stopRecord(lang) {
    if (!rec) return '';
    var r = rec; rec = null; release(r);
    if (Date.now() - r.t0 < 600) { var e = new Error('too_short'); e.code = 'too_short'; throw e; }
    var wav = toWav16k(r.chunks, r.rate);
    if (wav.peak < 0.004) { var e2 = new Error('silent'); e2.code = 'silent'; throw e2; }
    var res = await AI.asr(b64(wav), CODES[lang]);
    return res.text;
  }
  // ---- Web Speech fallback ----
  function startWebSpeech(lang) {
    var R = SR(); ws = new R(); wsText = ''; wsFinal = '';
    ws.lang = CODES[lang]; ws.interimResults = true; ws.continuous = false; ws.maxAlternatives = 1;
    ws.onresult = function (ev) {
      var fin = '', interim = '';
      for (var i = 0; i < ev.results.length; i++) { var t = ev.results[i][0].transcript; if (ev.results[i].isFinal) fin += t; else interim += t; }
      wsFinal = fin; wsText = fin + interim;
    };
    var done = new Promise(function (res) { ws.onend = function () { res(); }; ws.onerror = function (ev) { ws._err = ev.error; res(); }; });
    ws._done = done;
    ws.start();
  }
  async function stopWebSpeech() {
    var w = ws; ws = null; if (!w) return '';
    try { w.stop(); } catch (e) { }
    await Promise.race([w._done, new Promise(function (r) { setTimeout(r, 2500); })]);
    if (w._err === 'not-allowed' || w._err === 'service-not-allowed') { var e = new Error('no_permission'); e.code = 'no_permission'; throw e; }
    return (wsFinal || wsText || '').trim();
  }
  var active = false, curLang = 'en';
  // start(lang, ctx): call from the tap handler. Pass prepareContext() created synchronously in that handler.
  async function start(lang, ctx) {
    curLang = lang;
    // use the plan computed earlier so Web Speech can start synchronously inside the tap (iOS requirement)
    mode = plans[lang] || await plan(lang);
    if (mode === 'none' || mode === 'de_soon') { try { ctx && ctx.close(); } catch (e) { } var e = new Error(mode); e.code = mode === 'none' ? 'no_asr' : 'de_soon'; throw e; }
    active = true;
    if (mode === 'webspeech') { try { ctx && ctx.close(); } catch (e) { } return startWebSpeech(lang); }
    try { await startRecord(ctx); } catch (e) { active = false; throw e; }
  }
  async function stop() {
    if (!active) return ''; active = false;
    if (mode === 'webspeech') return stopWebSpeech();
    return stopRecord(curLang);
  }
  function cancel() { active = false; if (rec) { release(rec); rec = null; } if (ws) { try { ws.abort(); } catch (e) { } ws = null; } }
  root.Voice = { plan: plan, planned: function (l) { return plans[l] || null; }, resetPlans: function () { plans = {}; }, start: start, stop: stop, cancel: cancel, prepareContext: prepareContext, toWav16k: toWav16k, b64: b64, CODES: CODES, standalone: standalone, get mode() { return mode; }, get active() { return active; } };
})(window);

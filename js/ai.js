/* Hanzi Bear · AI layer: chat, Chinese TTS, speech recognition via the mitsuri proxy.
 * English / German speech output uses the phone's own voices (speechSynthesis). */
(function (root) {
  'use strict';
  function C() { return root.AI_CONFIG || {}; }
  function today() { return new Date().toISOString().slice(0, 10); }
  var Quota = {
    key: 'hb_quota',
    read: function () { try { var q = JSON.parse(localStorage.getItem(this.key) || '{}'); return q.day === today() ? q : { day: today() }; } catch (e) { return { day: today() }; } },
    used: function (k) { return this.read()[k] || 0; },
    left: function (k) { return Math.max(0, ((C().daily || {})[k] || 999) - this.used(k)); },
    add: function (k) { var q = this.read(); q[k] = (q[k] || 0) + 1; try { localStorage.setItem(this.key, JSON.stringify(q)); } catch (e) { } }
  };
  function err(code) { var e = new Error(code); e.code = code; return e; }
  function logErr(where, e) { try { var l = JSON.parse(localStorage.getItem('hb_errlog') || '[]'); l.push([new Date().toISOString(), where, String(e && (e.code || e.message) || e)]); localStorage.setItem('hb_errlog', JSON.stringify(l.slice(-50))); } catch (x) { } }
  function configured() { var c = C(); return !!(c.baseUrl && c.token); }
  function url(path) { return C().baseUrl.replace(/\/+$/, '') + path; }
  async function post(path, body, timeoutMs) {
    if (!configured()) throw err('not_configured');
    if (navigator.onLine === false) throw err('offline');
    var ac = new AbortController(), t = setTimeout(function () { ac.abort(); }, timeoutMs || C().timeoutMs || 30000);
    try { return await fetch(url(path), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-App-Token': C().token }, body: JSON.stringify(body), signal: ac.signal }); }
    catch (e) { throw err(e.name === 'AbortError' ? 'timeout' : 'network'); }
    finally { clearTimeout(t); }
  }
  function status(r) {
    if (r.status === 429) throw err('rate_limited');
    if (r.status === 401) throw err('unauthorized');
    if (r.status === 404) throw err('unsupported');
    if (!r.ok) throw err('http_' + r.status);
  }
  async function chat(messages, opt) {
    opt = opt || {}; var c = C();
    if (Quota.left('chat') <= 0) throw err('daily_limit');
    var body = { messages: messages, temperature: opt.temperature != null ? opt.temperature : c.temperature, max_tokens: opt.maxTokens || c.maxTokens, app_id: c.appId };
    if (c.thinking) body.thinking = { type: c.thinking };
    var last;
    for (var a = 0; a <= (c.retries || 0); a++) {
      try {
        Quota.add('chat');
        var r = await post(c.chatPath, body); status(r);
        var j = await r.json(), text = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
        if (!text) throw err('empty');
        return String(text).trim();
      } catch (e) { last = e; logErr('chat', e); if (['rate_limited', 'unauthorized', 'not_configured', 'offline', 'daily_limit'].indexOf(e.code) >= 0) break; }
    }
    throw last;
  }
  // ---- audio output. iOS: one shared <audio>, unlocked in the first tap; audioSession = playback ----
  var player = null, unlocked = false;
  var SILENT = 'audio/silence.mp3';
  function getPlayer() { if (!player) { player = new Audio(); player.preload = 'auto'; player.setAttribute('playsinline', ''); } return player; }
  function unlock() {
    if (unlocked) return; unlocked = true;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { }
    var p = getPlayer(); try { p.src = SILENT; var pr = p.play(); if (pr && pr.catch) pr.catch(function () { unlocked = false; }); } catch (e) { unlocked = false; }
    try { if (root.speechSynthesis) { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) { }
  }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function ckey(voice, text) { return 'https://tts.cache.local/' + hash(voice + '|' + text) + '-' + text.length; }
  async function ttsBlob(text) {
    var c = C(), tc = c.tts || {}, voice = tc.voice;
    text = String(text || '').slice(0, tc.maxChars || 200);
    var cache = null, k = ckey(voice, text);
    try { cache = await caches.open(tc.cacheName); var hit = await cache.match(k); if (hit) return await hit.blob(); } catch (e) { }
    if (Quota.left('tts') <= 0) throw err('daily_limit');
    Quota.add('tts');
    var r = await post(tc.path || '/tts', { req_params: { text: text, speaker: voice }, app_id: c.appId }, 30000); status(r);
    var raw = await r.text(), parts = [];
    raw.split(/\r?\n/).forEach(function (ln) { try { var d = JSON.parse(ln); if (d.data) parts.push(d.data); } catch (e) { } });
    if (!parts.length) throw err('tts_empty');
    var blob = new Blob(parts.map(function (b64) { var bin = atob(b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }), { type: 'audio/mpeg' });
    if (blob.size < 800) throw err('tts_too_small');
    try { if (cache) await cache.put(k, new Response(blob, { headers: { 'Content-Type': 'audio/mpeg' } })); } catch (e) { }
    return blob;
  }
  var curUrl = null;
  function stop() {
    var p = getPlayer(); try { p.pause(); } catch (e) { }
    if (curUrl) { URL.revokeObjectURL(curUrl); curUrl = null; }
    try { if (root.speechSynthesis) speechSynthesis.cancel(); } catch (e) { }
  }
  var VOICE_LANG = { zh: 'zh-CN', en: 'en-US', de: 'de-DE' };
  function pickVoice(code) {
    try { var vs = speechSynthesis.getVoices() || []; return vs.find(function (v) { return v.lang === code; }) || vs.find(function (v) { return v.lang && v.lang.slice(0, 2) === code.slice(0, 2); }) || null; } catch (e) { return null; }
  }
  function systemSpeak(text, lang) {
    if (!root.speechSynthesis || !root.SpeechSynthesisUtterance) return Promise.reject(err('no_tts'));
    return new Promise(function (res, rej) {
      var u = new SpeechSynthesisUtterance(text), code = VOICE_LANG[lang] || 'zh-CN', v = pickVoice(code);
      u.lang = code; if (v) u.voice = v; u.rate = lang === 'zh' ? 0.85 : 1;
      u.onend = function () { res('system'); }; u.onerror = function () { rej(err('speak_fail')); };
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    });
  }
  // speak(text, {lang:'zh'|'en'|'de'}): Chinese -> proxy TTS (cached) with phone voice fallback; en/de -> phone voice
  async function speak(text, opt) {
    opt = opt || {}; stop();
    var lang = opt.lang || 'zh';
    text = String(text || '').replace(/[*#>`_~]/g, '').trim();
    if (!text) return null;
    if (lang !== 'zh') return systemSpeak(text, lang);
    try {
      var blob = await ttsBlob(text), p = getPlayer();
      curUrl = URL.createObjectURL(blob); p.src = curUrl;
      await new Promise(function (res, rej) { p.onended = res; p.onerror = function () { rej(err('play_fail')); }; p.play().then(function () { opt.onStart && opt.onStart('cloud'); }).catch(rej); });
      return 'cloud';
    } catch (e) {
      logErr('tts', e);
      if (opt.noFallback) throw e;
      opt.onStart && opt.onStart('system');
      return systemSpeak(text, 'zh');
    }
  }
  // ---- speech recognition: proxy /asr with 16 kHz WAV. language: zh-CN | en-US | de-DE ----
  async function asr(wavBase64, language) {
    var c = C();
    if (Quota.left('asr') <= 0) throw err('daily_limit');
    Quota.add('asr');
    var r = await post((c.asr && c.asr.path) || '/asr', { audio: { data: wavBase64, format: 'wav', language: language }, language: language, app_id: c.appId }, 25000); status(r);
    var j = await r.json();
    return { text: String(j.text || '').trim(), language: j.language || null };
  }
  // which languages does the proxy's /asr support? v11 returns {langs:[...]}; older ones only Chinese (+ some English)
  var health = null;
  async function asrHealth() {
    if (health) return health;
    if (!configured() || navigator.onLine === false) return null;
    try {
      var ac = new AbortController(), t = setTimeout(function () { ac.abort(); }, 6000);
      var r = await fetch(url('/asr/health'), { signal: ac.signal }); clearTimeout(t);
      if (!r.ok) return null;
      var j = await r.json();
      health = { ok: true, langs: Array.isArray(j.langs) ? j.langs : ['zh-CN'], path: j.path || '' };
      return health;
    } catch (e) { return null; }
  }
  root.AI = { chat: chat, speak: speak, stop: stop, unlock: unlock, ttsBlob: ttsBlob, systemSpeak: systemSpeak, asr: asr, asrHealth: asrHealth, Quota: Quota, logErr: logErr, configured: configured, _reset: function () { health = null; } };
})(window);

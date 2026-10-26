/* Hanzi Bear · UI */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var t = I18N.t;
  var VERSION = '1.1.0';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  var toastT = null;
  function toast(msg, ms) { var el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('on'); }, ms || 2600); }
  // ---------- settings ----------
  var S = { ui: I18N.detect(), voice: null, mean: null };
  S.voice = store('hb_vlang') || S.ui;
  S.mean = store('hb_mlang') || (S.ui === 'de' ? 'de' : 'en');
  function ml() { return S.mean; }
  function other(l) { return l === 'de' ? 'en' : 'de'; }
  // ---------- i18n apply ----------
  function applyI18n() {
    I18N.set(S.ui);
    $$('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
    $$('[data-tph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-tph')); });
    $('#btnLang').textContent = { en: 'EN', de: 'DE', zh: '中' }[S.ui];
    $('#vlangFlag').textContent = { en: 'EN', de: 'DE', zh: '中' }[S.voice];
    document.title = t('app') + ' · ' + t('tagline');
    var ex = S.ui === 'de' ? ['Wasser', 'Bär', 'ni hao', 'xie4xie', '爱', 'danke'] : S.ui === 'zh' ? ['water', 'Bär', 'ni hao', '龍', 'xiong2', 'thank you'] : ['water', 'thank you', 'ni hao', 'ma3', '熊', 'Bär'];
    $('#examples').innerHTML = ex.map(function (x) { return '<button data-ex="' + esc(x) + '">' + esc(x) + '</button>'; }).join('');
    renderChips(); renderSettings(); renderRecent(); renderSaved();
    $('#installTxt').innerHTML = t('install'); $('#installOk').textContent = t('installOk');
    if (curList.length && $('#scr-char').classList.contains('active')) showChar(curIdx, true);
    if ($('#q').value) doSearch();
    if (!chatHist.length) resetChat();
  }
  // ---------- screens ----------
  var screenStack = ['home'];
  function show(name, push) {
    $$('.screen').forEach(function (s) { s.classList.toggle('active', s.id === 'scr-' + name); });
    $$('.tabbar button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === name || (name === 'char' && b.dataset.tab === screenStack[0])); });
    if (push) { screenStack.push(name); try { history.pushState({ s: name }, ''); } catch (e) { } }
    if (name !== 'char') stopWriterModes();
    if (name === 'saved') renderSaved();
    if (name === 'bear') { renderQuota(); setTimeout(function () { var l = $('#chatLog'); l.scrollTop = l.scrollHeight; }, 0); }
  }
  window.addEventListener('popstate', function () { if ($('#scr-char').classList.contains('active')) { screenStack.pop(); show(screenStack[screenStack.length - 1] === 'char' ? 'home' : screenStack[screenStack.length - 1] || 'home'); } });
  $$('.tabbar button').forEach(function (b) { b.addEventListener('click', function () { screenStack = [b.dataset.tab]; show(b.dataset.tab); }); });
  $$('[data-back]').forEach(function (b) { b.addEventListener('click', function () { if (history.state && history.state.s === 'char') history.back(); else { screenStack = [screenStack[0] || 'home']; show(screenStack[0]); } }); });
  // ---------- tone helpers ----------
  function toneOf(py) { return Dict.splitTone(py).tone; }
  function pyHtml(p) { return String(p || '').split(' ').map(function (s) { return '<span class="tone' + toneOf(s) + '">' + esc(s) + '</span>'; }).join(' '); }
  // ---------- search ----------
  var searchT = null;
  $('#q').addEventListener('input', function () { $('.search-box').classList.toggle('has', !!this.value); clearTimeout(searchT); searchT = setTimeout(doSearch, 140); });
  $('#q').addEventListener('keydown', function (e) { if (e.key === 'Enter') { clearTimeout(searchT); doSearch(); this.blur(); } });
  $('#qClear').addEventListener('click', function () { $('#q').value = ''; $('.search-box').classList.remove('has'); trBox = null; doSearch(); $('#q').focus(); });
  $('#examples').addEventListener('click', function (e) { var b = e.target.closest('[data-ex]'); if (b) setQuery(b.dataset.ex); });
  function setQuery(v) { $('#q').value = v; $('.search-box').classList.toggle('has', !!v); trBox = null; doSearch(); }
  var trBox = null; // {q, items|null, busy}
  var qHint = null; // {q, lang}: the language a spoken query was in (so German "Bär" is not read as English "bar")
  function searchLang(q) { if (qHint && qHint.q === q) return qHint.lang; if (/[äöüß]/i.test(q)) return 'de'; return ml(); }
  function rowHtml(x) {
    var tag = x.fromEn ? '<span class="tag">EN</span>' : '';
    return '<button class="row ' + (x.kind === 'w' ? 'w' : '') + '" data-open="' + esc(x.h) + '"><span class="h han">' + esc(x.h) + '</span><span class="m"><span class="p">' + pyHtml(x.p) + '</span>' + tag + '<div class="g">' + esc(x.g) + '</div></span></button>';
  }
  function charRow(c) { var e = Dict.get(c); if (!e) return ''; return rowHtml({ kind: 'c', h: c, p: e.p.join(' · '), g: Dict.gloss(c, ml()) }); }
  function wordRow(w) { return rowHtml({ kind: 'w', h: w.w, p: w.p, g: (ml() === 'de' ? w.de : w.en) || w.en || w.de }); }
  function sec(title, body, extra) { return '<div class="sec"><h3><span>' + esc(title) + '</span>' + (extra || '') + '</h3>' + body + '</div>'; }
  function doSearch() {
    var q = $('#q').value.trim(), out = '', r = Dict.search(q, searchLang(q), 40);
    $('#homeEmpty').hidden = r.type !== 'empty';
    if (r.type === 'empty') { $('#results').innerHTML = ''; return; }
    if (trBox && trBox.q === q) out += trHtml();
    if (r.type === 'han') {
      if (r.word) out += sec(t('secWords'), wordRow(r.word));
      if (r.chars.length) out += sec(t('secChars'), r.chars.map(charRow).join(''));
      if (r.missing.length) out += '<p class="hint">' + esc(t('notInDict', { x: r.missing.join(' ') })) + '</p>';
      if (r.chars.length === 1 && !r.word && Array.from(q).length === 1) { /* one character typed: rows already link to it */ }
    } else {
      var py = '', mean = '';
      if (r.py) {
        var pyb = '';
        if (r.py.words && r.py.words.length) pyb += r.py.words.slice(0, 12).map(wordRow).join('');
        if (r.py.chars && r.py.chars.length) pyb += r.py.chars.slice(0, r.py.type === 'words' ? 8 : 24).map(charRow).join('');
        if (r.py.more && r.py.more.length) pyb += '<h3 style="margin-top:8px">' + esc(t('secMore')) + '</h3><div class="grid">' + r.py.more.map(function (c) { var e = Dict.get(c); return '<button class="cell" data-open="' + c + '"><span class="h han">' + c + '</span><span class="p">' + esc(e.p[0]) + '</span></button>'; }).join('') + '</div>';
        if (pyb) py = sec(t('secPinyin'), pyb);
      }
      if (r.mean.length) mean = sec(t('secMeaning') + ' · ' + (r.mlang === 'de' ? 'Deutsch' : 'English'), r.mean.slice(0, 25).map(rowHtml).join(''));
      out += r.pyFirst ? py + mean : mean + py;
      var words = q.split(/\s+/).length;
      if (!r.pyFirst && (!r.mean.length || words >= 3) && q.length >= 2 && !(trBox && trBox.q === q)) out = '<button class="ask-tr" id="askTr">🐻 ' + esc(t('askBearTr', { x: q.length > 28 ? q.slice(0, 26) + '…' : q })) + '</button>' + out;
      if (!py && !mean && !(trBox && trBox.q === q)) out += '<p class="hint">' + esc(t('noResult')) + '</p>';
    }
    $('#results').innerHTML = out;
    var a = $('#askTr'); if (a) a.addEventListener('click', function () { translate(q, voiceOrUiLang(q)); });
  }
  function voiceOrUiLang(q) { return searchLang(q) === 'de' ? 'de' : 'en'; }
  $('#results').addEventListener('click', function (e) { var b = e.target.closest('[data-open]'); if (b) openText(b.dataset.open); });
  // open a character or a word
  function openText(s) {
    var chars = Array.from(s).filter(function (c) { return Dict.get(c); }).map(Dict.simp);
    if (!chars.length) return;
    var w = chars.length > 1 ? (Dict.findWord(chars.join('')) || { w: chars.join(''), p: '', en: '', de: '' }) : null;
    openChars(chars, 0, w);
  }
  // ---------- translation via the bear ----------
  function trHtml() {
    var b = '<div class="tr-box"><h3><img src="img/bear/think.webp" alt="">' + esc(t('trTitle')) + '</h3>';
    if (trBox.busy) b += '<p class="hint">' + esc(t('trBusy')) + '</p>';
    else if (trBox.err) b += '<p class="hint">' + esc(trBox.err) + '</p>';
    else if (!trBox.items.length) b += '<p class="hint">' + esc(t('noResult')) + '</p>';
    else b += trBox.items.map(function (x) { return rowHtml({ kind: 'w', h: x.zh, p: x.py, g: x.gloss }); }).join('');
    return b + '</div>';
  }
  async function translate(q, lang) {
    trBox = { q: q, busy: true, items: [] }; doSearch();
    try {
      var txt = await AI.chat(Bear.translateMessages(q, lang), { temperature: 0.2, maxTokens: 300 });
      trBox = { q: q, items: Bear.parseTranslation(txt).filter(function (x) { return Array.from(x.zh).every(function (c) { return Dict.get(c); }); }) };
    } catch (e) { trBox = { q: q, items: [], err: errMsg(e) }; }
    if ($('#q').value.trim() === q) doSearch();
  }
  function errMsg(e) { var c = e && e.code; return c === 'offline' ? t('offline') : c === 'daily_limit' ? t('dailyLimit') : c === 'not_configured' ? t('bearOffline') : t('netErr'); }
  // ---------- handwriting ----------
  var pad = null, padOpen = false;
  $('#btnWrite').addEventListener('click', function () {
    padOpen = !padOpen; $('#padWrap').hidden = !padOpen; this.classList.toggle('on', padOpen);
    if (padOpen) { if (!pad) pad = HW.Pad($('#pad'), onStrokes); else pad.resize(); $('#q').blur(); }
  });
  $('#padUndo').addEventListener('click', function () { pad && pad.undo(); });
  $('#padClear').addEventListener('click', function () { pad && pad.clear(); });
  async function onStrokes(strokes) {
    $('#padHint').hidden = strokes.length > 0;
    if (!strokes.length) { $('#cands').innerHTML = ''; return; }
    var list = (await HW.recognize(strokes, 16)).filter(function (c) { return Dict.get(c); });
    $('#cands').innerHTML = list.map(function (c) { return '<button class="han" data-c="' + c + '">' + c + '</button>'; }).join('');
  }
  $('#cands').addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (!b) return; var q = $('#q'); q.value = q.value.replace(/[a-zA-ZäöüÄÖÜß0-9 ]+$/, '') + b.dataset.c; $('.search-box').classList.add('has'); pad.clear(); doSearch(); if (Array.from(q.value).length === 1) openText(b.dataset.c); });
  // ---------- character view ----------
  var curList = [], curIdx = 0, curWord = null, writer = null, wmode = 'idle';
  function openChars(list, idx, word) { curList = list; curWord = word || null; showChar(idx || 0); if (!$('#scr-char').classList.contains('active')) show('char', true); }
  function readingWord(c, r) {
    var ws = Dict.wordsOf(c);
    for (var i = 0; i < ws.length; i++) { var w = ws[i], k = Array.from(w.w).indexOf(c), s = w.p.split(' ')[k]; if (s && Dict.splitTone(s).base + Dict.splitTone(s).tone === Dict.splitTone(r).base + Dict.splitTone(r).tone) return w.w; }
    return null;
  }
  function showChar(i, keepWriter) {
    curIdx = i; var c = curList[i], e = Dict.get(c); if (!e) return;
    $('#charTabs').innerHTML = curList.length > 1 ? curList.map(function (x, k) { return '<button class="han ' + (k === i ? 'on' : '') + '" data-i="' + k + '">' + x + '</button>'; }).join('') : '';
    var wb = $('#wordBanner');
    if (curWord && curWord.p) { wb.hidden = false; wb.innerHTML = '<span class="h han">' + esc(curWord.w) + '</span><span class="m"><div class="p">' + pyHtml(curWord.p) + '</div><div class="g">' + esc((ml() === 'de' ? curWord.de : curWord.en) || curWord.en || '') + '</div></span><button class="spk" data-say="' + esc(curWord.w) + '">🔊</button>'; }
    else wb.hidden = true;
    // readings
    $('#readings').innerHTML = '<h3>' + esc(t('pron')) + '</h3>' + e.p.map(function (r) {
      var tn = toneOf(r);
      return '<div class="rd"><span class="py tone' + tn + '">' + esc(r) + '</span><span class="tn">' + esc(t('tones')[tn]) + '</span><button data-say="' + esc(e.p.length > 1 ? (readingWord(c, r) || c) : c) + '" aria-label="listen">🔊</button></div>';
    }).join('');
    // meanings
    function defsHtml(lang) {
      var h = '', m = e[lang] || {}, rs = e.p.filter(function (r) { return m[r] && m[r].length; }).concat(Object.keys(m).filter(function (r) { return e.p.indexOf(r) < 0; }));
      rs.forEach(function (r) { h += (rs.length > 1 || e.p.length > 1 ? '<div class="mean-r">' + pyHtml(r) + '</div>' : '') + '<ol class="defs">' + m[r].slice(0, 6).map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ol>'; });
      if (!h && e['u' + lang]) { var u = e['u' + lang]; h = '<p>' + esc(t('usedIn')) + ' <span class="han" style="font-size:20px">' + esc(u[0]) + '</span> ' + pyHtml(u[1]) + ' — ' + esc(u[2]) + '</p>'; }
      return h;
    }
    var main = defsHtml(ml()), alt = defsHtml(other(ml()));
    var mt = ml() === 'de' ? (S.ui === 'zh' ? '德文释义' : S.ui === 'de' ? 'Bedeutung' : 'Meaning (German)') : (S.ui === 'zh' ? '英文释义' : S.ui === 'de' ? 'Bedeutung (Englisch)' : 'Meaning');
    var at = other(ml()) === 'de' ? (S.ui === 'zh' ? '德文释义' : S.ui === 'de' ? 'Deutsch' : 'In German') : (S.ui === 'zh' ? '英文释义' : S.ui === 'de' ? 'Auf Englisch' : 'In English');
    $('#meanings').innerHTML = '<h3>' + esc(mt) + '</h3>' + (main || (alt ? alt : '<p class="hint">' + esc(t('noMeaning')) + '</p>')) + (main && alt ? '<details class="other-lang"><summary>' + esc(at) + '</summary>' + alt + '</details>' : '');
    // facts
    var rads = e.r.split('、').filter(Boolean), radTxt = rads.map(function (r) { var m = Dict.rad(r), g = m ? (ml() === 'de' ? m[1] || m[0] : m[0] || m[1]) : ''; return '<span class="han">' + esc(r) + '</span>' + (g ? ' <small>' + esc(g.split(/[;,]/)[0]) + '</small>' : ''); }).join(' ');
    $('#facts').innerHTML = [
      [t('strokes'), e.s], [t('radical'), radTxt, 1], [t('structure'), (t('struct') || {})[e.t] || e.t],
      e.tr ? [t('traditional'), '<span class="han">' + esc(e.tr) + '</span>', 1] : [t('level'), (t('levelNames') || [])[e.l] || e.l]
    ].map(function (f) { return '<div class="fact"><div class="k">' + esc(f[0]) + '</div><div class="v">' + (f[2] ? f[1] : esc(f[1])) + '</div></div>'; }).join('');
    // words
    var ws = Dict.wordsOf(c).slice(0, 8);
    $('#wordsCard').hidden = !ws.length;
    $('#wordsBox').innerHTML = ws.map(function (w) { return '<div class="wrow" data-open="' + esc(w.w) + '"><span class="h han">' + esc(w.w) + '</span><span class="m"><div class="p">' + pyHtml(w.p) + '</div><div class="g">' + esc((ml() === 'de' ? w.de : w.en) || w.en || w.de) + '</div></span><button class="spk" data-say="' + esc(w.w) + '">🔊</button></div>'; }).join('');
    // bear explanation (cached per char + language)
    var cached = (store('hb_explain') || {})[c + '|' + S.ui];
    $('#explainBubble').innerHTML = cached ? explainHtml(cached) : '<button class="link-btn" id="explainBtn">' + esc(t('explain')) + ' ›</button>';
    // favourites + recent
    $('#favBtn').classList.toggle('on', isSaved(c)); $('#favBtn').textContent = isSaved(c) ? '★' : '☆';
    addRecent(c);
    if (!keepWriter || !writer) makeWriter(c);
    $('#charBody').parentNode.scrollTop = 0;
  }
  function explainHtml(txt) { return '<div>' + linkHan(txt) + '</div><div class="acts"><button data-read-ui="1">🔊</button></div>'; }
  function linkHan(txt) { return esc(txt).replace(/[\u3400-\u9fff]/g, function (c) { return Dict.get(c) ? '<span class="han-link" data-open="' + c + '">' + c + '</span>' : c; }); }
  $('#charTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) showChar(+b.dataset.i); });
  $('#scr-char').addEventListener('click', function (e) {
    var s = e.target.closest('[data-say]'); if (s) { e.stopPropagation(); say(s.dataset.say); return; }
    var r = e.target.closest('[data-read-ui]'); if (r) { var txt = r.closest('.bubble').firstChild.textContent; readUi(txt); return; }
    if (e.target.closest('#explainBtn')) { explain(); return; }
    var o = e.target.closest('[data-open]'); if (o) openText(o.dataset.open);
  });
  $('#favBtn').addEventListener('click', function () { toggleSaved(curList[curIdx]); showFav(); });
  function showFav() { var c = curList[curIdx], on = isSaved(c); $('#favBtn').classList.toggle('on', on); $('#favBtn').textContent = on ? '★' : '☆'; }
  // stroke data is packed in ~43 bundles (data/sb/<key>.json, made by tools/bundle_strokes.py) so the site stays < 100 files
  function strokeKey(ch) { var e = (window.__DATA && window.__DATA.chars[ch]) || {}; return (e.l === 1 ? 'c' : 'r') + (ch.codePointAt(0) >> 10).toString(16); }
  var sbCache = {};
  function bundle(k) { return sbCache[k] || (sbCache[k] = fetch('data/sb/' + k + '.json').then(function (r) { if (!r.ok) throw new Error('no data'); return r.json(); }).catch(function (e) { delete sbCache[k]; throw e; })); }
  function loader(ch, ok, fail) { bundle(strokeKey(ch)).then(function (b) { if (!b[ch]) throw new Error('no data'); ok(b[ch]); }).catch(fail); }
  function makeWriter(c) {
    stopWriterModes();
    var box = $('#writerWrap'), s = Math.round(box.getBoundingClientRect().width) || 240;
    $('#writer').innerHTML = ''; $('#strokeInfo').textContent = t('strokeN', { n: 0, t: (Dict.get(c) || {}).s || '' }).replace(/^.*?(\d+)\D*$/, function (m) { return m; });
    $('#strokeInfo').textContent = (Dict.get(c) || {}).s + ' ' + t('strokes').toLowerCase();
    writer = HanziWriter.create('writer', c, { width: s, height: s, padding: Math.round(s * 0.06), showOutline: true, showCharacter: true, strokeColor: '#3f3236', radicalColor: '#e2668e', outlineColor: '#efe3e7', highlightColor: '#5fbf86', drawingColor: '#3f3236', drawingWidth: Math.max(14, Math.round(s / 18)), strokeAnimationSpeed: 0.9, delayBetweenStrokes: 260, charDataLoader: loader, onLoadCharDataError: function () { $('#strokeInfo').textContent = navigator.onLine === false ? t('offline') : '—'; } });
  }
  function setBtn(id) { ['wPlay', 'wStep', 'wQuiz'].forEach(function (x) { $('#' + x).classList.toggle('on', x === id); }); }
  function stopWriterModes() { if (writer && wmode === 'quiz') { try { writer.cancelQuiz(); } catch (e) { } } wmode = 'idle'; setBtn(null); var q = $('#quizMsg'); if (q) q.textContent = ''; }
  var stepN = 0;
  $('#wPlay').addEventListener('click', function () { if (!writer) return; stopWriterModes(); wmode = 'play'; setBtn('wPlay'); writer.showCharacter(); writer.animateCharacter({ onComplete: function () { if (wmode === 'play') { setBtn(null); wmode = 'idle'; } } }); });
  $('#wStep').addEventListener('click', function () {
    if (!writer) return; var e = Dict.get(curList[curIdx]);
    if (wmode !== 'step') { stopWriterModes(); wmode = 'step'; setBtn('wStep'); stepN = 0; writer.hideCharacter(); }
    if (stepN >= e.s) { stepN = 0; writer.hideCharacter(); }
    writer.animateStroke(stepN); stepN++;
    $('#strokeInfo').textContent = t('strokeN', { n: stepN, t: e.s });
  });
  $('#wQuiz').addEventListener('click', function () {
    if (!writer) return; stopWriterModes(); wmode = 'quiz'; setBtn('wQuiz'); var miss = 0;
    $('#quizMsg').textContent = t('quizStart');
    writer.quiz({
      showHintAfterMisses: 2,
      onMistake: function () { miss++; $('#quizMsg').textContent = miss % 2 ? t('quizTry') : t('quizHint'); },
      onCorrectStroke: function (d) { $('#quizMsg').textContent = ''; $('#strokeInfo').textContent = t('strokeOk', { n: d.strokeNum + 1, r: d.strokesRemaining }); },
      onComplete: function (d) { var st = d.totalMistakes === 0 ? '⭐⭐⭐' : d.totalMistakes <= 3 ? '⭐⭐' : '⭐'; $('#quizMsg').textContent = t('quizDone', { stars: st }); wmode = 'idle'; setBtn(null); }
    });
  });
  $('#wSay').addEventListener('click', function () { var c = curList[curIdx]; say(curWord && curWord.p && curList.length > 1 ? curWord.w : c); });
  window.addEventListener('resize', function () { if (curList.length && $('#scr-char').classList.contains('active') && wmode !== 'quiz') { clearTimeout(window.__rz); window.__rz = setTimeout(function () { makeWriter(curList[curIdx]); }, 200); } });
  function say(text) { AI.unlock(); AI.speak(text, { lang: 'zh' }).catch(function () { toast(t('netErr')); }); }
  function readUi(text) {
    AI.unlock();
    if (S.ui === 'zh') return AI.speak(text.slice(0, 200), { lang: 'zh' }).catch(function () { });
    // read the explanation in English/German with the phone voice (Chinese characters are skipped by most voices)
    AI.speak(text.replace(/[\u3400-\u9fff]+/g, ' '), { lang: S.ui }).catch(function () { toast(t('voiceNone')); });
  }
  async function explain() {
    var c = curList[curIdx], e = Dict.get(c), b = $('#explainBubble');
    var pre = Bear.check('', S.ui);
    b.innerHTML = '<span class="hint">…</span>';
    try {
      var ctx = Object.assign({}, e, { wl: Dict.wordsOf(c), radm: (Dict.rad(e.r.split('、')[0]) || [])[ml() === 'de' ? 1 : 0] });
      var txt = await AI.chat(Bear.explainMessages(c, ctx, S.ui));
      var all = store('hb_explain') || {}; all[c + '|' + S.ui] = txt; var keys = Object.keys(all); if (keys.length > 120) delete all[keys[0]]; store('hb_explain', all);
      if (curList[curIdx] === c) b.innerHTML = explainHtml(txt);
    } catch (err) { if (curList[curIdx] === c) b.innerHTML = '<span>' + esc(errMsg(err)) + '</span> <button class="link-btn" id="explainBtn">↻</button>'; }
  }
  // ---------- saved / recent ----------
  function savedList() { return store('hb_saved') || []; }
  function isSaved(c) { return savedList().indexOf(c) >= 0; }
  function toggleSaved(c) { var l = savedList(), i = l.indexOf(c); if (i >= 0) l.splice(i, 1); else l.unshift(c); store('hb_saved', l.slice(0, 500)); toast(i >= 0 ? '☆' : '★ ' + t('savedOn')); }
  function addRecent(c) { var l = (store('hb_recent') || []).filter(function (x) { return x !== c; }); l.unshift(c); store('hb_recent', l.slice(0, 30)); renderRecent(); }
  function renderRecent() {
    var l = store('hb_recent') || [], h = l.map(function (c) { return '<button class="han" data-open="' + c + '">' + c + '</button>'; }).join('');
    $('#recent').innerHTML = h; $('#recent2').innerHTML = h; $('#recentWrap').hidden = !l.length;
  }
  function renderSaved() {
    var l = savedList();
    $('#savedGrid').innerHTML = l.map(function (c) { var e = Dict.get(c); if (!e) return ''; return '<button class="cell" data-open="' + c + '"><span class="h han">' + c + '</span><span class="p">' + esc(e.p[0]) + '</span><span class="g">' + esc(Dict.gloss(c, ml())) + '</span></button>'; }).join('');
    $('#savedEmpty').hidden = l.length > 0;
  }
  ['#recent', '#recent2', '#savedGrid'].forEach(function (s) { $(s).addEventListener('click', function (e) { var b = e.target.closest('[data-open]'); if (b) openText(b.dataset.open); }); });
  // ---------- voice ----------
  var VL = ['en', 'de', 'zh'];
  $('#vlangHome').addEventListener('click', function () { S.voice = VL[(VL.indexOf(S.voice) + 1) % 3]; store('hb_vlang', S.voice); $('#vlangFlag').textContent = { en: 'EN', de: 'DE', zh: '中' }[S.voice]; toast('🎤 ' + t('vlangs')[S.voice]); Voice.plan(S.voice); renderSettings(); });
  var recBtn = null, recWhere = null, recT0 = 0, autoStop = null;
  function micUi(btn, state) {
    btn.classList.toggle('rec', state === 'rec'); btn.classList.toggle('busy', state === 'busy');
    if (btn.id === 'micHome') $('.mic-txt', btn).textContent = state === 'rec' ? '■' : state === 'busy' ? '…' : t('mic');
    var vs = $('#voiceStatus');
    if (btn.id === 'micHome') { vs.hidden = !state; vs.textContent = state === 'rec' ? '🎙 ' + t('listening') + ' (' + t('vlangs')[S.voice] + ')' : state === 'busy' ? '⏳ ' + t('thinking') : ''; }
  }
  function bindMic(btn, where) {
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (Voice.active) { finishRec(); return; }
      var planned = Voice.planned(S.voice);
      // playing audio right before Web Speech breaks it on iOS (WebKit bug 321436), so only unlock audio for our own recorder
      if (planned !== 'webspeech') AI.unlock();
      var ctx = planned === 'webspeech' ? null : Voice.prepareContext(); // must be created inside the tap on iOS
      recBtn = btn; recWhere = where; recT0 = Date.now();
      micUi(btn, 'rec');
      Voice.start(S.voice, ctx).then(function () { clearTimeout(autoStop); autoStop = setTimeout(finishRec, 9000); }).catch(function (err) { micUi(btn, null); recBtn = null; voiceErr(err); });
    });
    btn.addEventListener('pointerup', function () { if (Voice.active && recBtn === btn && Date.now() - recT0 > 700) finishRec(); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  function voiceErr(err) {
    var c = err && err.code;
    toast(c === 'no_permission' ? t('voiceNoMic') : c === 'de_soon' ? t('voiceDeSoon') : c === 'no_asr' ? t('voiceNone') : c === 'too_short' ? t('voiceShort') : (c === 'silent' || c === 'empty') ? t('voiceEmpty') : errMsg(err), 4200);
  }
  async function finishRec() {
    clearTimeout(autoStop);
    var btn = recBtn, where = recWhere, lang = S.voice; if (!btn) return;
    micUi(btn, 'busy');
    try {
      var text = await Voice.stop();
      micUi(btn, null); recBtn = null;
      if (!text) { voiceErr({ code: 'empty' }); return; }
      onSpeech(text, lang, where);
    } catch (err) { micUi(btn, null); recBtn = null; voiceErr(err); }
  }
  function onSpeech(text, lang, where) {
    if (where === 'bear') { $('#chatQ').value = text; sendChat(); return; }
    var vs = $('#voiceStatus'); vs.hidden = false; vs.textContent = '🎙 ' + t('voiceHeard', { x: text });
    if (padOpen) $('#btnWrite').click(); // close the handwriting pad so the results are visible
    var hasHan = Array.from(text).some(Dict.isHan);
    if (lang === 'zh' || hasHan) {
      var r = Dict.fromSpeech(text);
      if (r.main) { setQuery(r.main); openText(r.main); return; }
      if (r.others && r.others.length) { setQuery(r.others.join('')); return; }
      setQuery(text); return;
    }
    var phrase = Dict.phraseFromSpeech(text, lang) || text;
    qHint = { q: phrase.trim(), lang: lang === 'de' ? 'de' : 'en' };
    setQuery(phrase);
    var res = Dict.search(phrase, qHint.lang);
    var weak = res.type === 'latin' && !res.mean.length && !(res.pyFirst);
    if ((weak || phrase.split(/\s+/).length >= 3) && AI.configured() && navigator.onLine !== false) translate(phrase, lang);
  }
  bindMic($('#micHome'), 'home'); bindMic($('#micBear'), 'bear');
  // ---------- bear chat ----------
  var chatHist = [];
  function resetChat() { chatHist = []; $('#chatLog').innerHTML = ''; addMsg('bot', t('bearHello')); setBear('happy'); }
  function addMsg(who, text) {
    var d = document.createElement('div'); d.className = 'msg ' + who;
    d.innerHTML = who === 'bot' ? linkHan(text) + '<div class="acts"><button data-read="1">🔊</button></div>' : esc(text);
    $('#chatLog').appendChild(d); $('#chatLog').scrollTop = $('#chatLog').scrollHeight;
    return d;
  }
  function setBear(m) { $('#bearImg').src = 'img/bear/' + m + '.webp'; }
  function renderChips() { $('#chatChips').innerHTML = (t('chips') || []).map(function (x) { return '<button>' + esc(x) + '</button>'; }).join(''); }
  function renderQuota() { $('#bearQuota').textContent = AI.Quota.left('chat') + ' / ' + (AI_CONFIG.daily.chat) + ' 🍯'; }
  $('#chatChips').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { $('#chatQ').value = b.textContent; sendChat(); } });
  $('#chatLog').addEventListener('click', function (e) {
    var r = e.target.closest('[data-read]'); if (r) { var m = r.closest('.msg'); readUi(m.textContent.replace('🔊', '')); return; }
    var o = e.target.closest('[data-open]'); if (o) openText(o.dataset.open);
  });
  $('#chatSend').addEventListener('click', sendChat);
  $('#chatQ').addEventListener('keydown', function (e) { if (e.key === 'Enter') sendChat(); });
  var chatBusy = false;
  async function sendChat() {
    var q = $('#chatQ').value.trim(); if (!q || chatBusy) return;
    $('#chatQ').value = ''; addMsg('me', q);
    var local = Bear.check(q, S.ui);
    if (local) { addMsg('bot', local.text); setBear(local.mood); return; }
    if (AI.Quota.left('chat') <= 0) { addMsg('bot', t('bearLimit', { n: AI_CONFIG.daily.chat })); setBear('think'); return; }
    chatBusy = true; $('#thinkDots').classList.add('on'); setBear('think');
    try {
      var a = await AI.chat(Bear.chatMessages(chatHist, q, S.ui));
      chatHist.push({ role: 'user', content: q }, { role: 'assistant', content: a });
      addMsg('bot', a); setBear(Bear.moodFor(a));
    } catch (err) { addMsg('bot', err.code === 'daily_limit' ? t('bearLimit', { n: AI_CONFIG.daily.chat }) : (err.code === 'offline' || err.code === 'not_configured') ? t('bearOffline') : t('bearErr')); setBear('think'); }
    finally { chatBusy = false; $('#thinkDots').classList.remove('on'); renderQuota(); }
  }
  // ---------- settings ----------
  function seg(el, opts, cur, fn) { el.innerHTML = opts.map(function (o) { return '<button data-v="' + o[0] + '" class="' + (o[0] === cur ? 'on' : '') + '">' + esc(o[1]) + '</button>'; }).join(''); el.onclick = function (e) { var b = e.target.closest('[data-v]'); if (b) fn(b.dataset.v); }; }
  function renderSettings() {
    var L = t('langs');
    seg($('#segUi'), [['en', L.en], ['de', L.de], ['zh', L.zh]], S.ui, function (v) { S.ui = v; if (!store('hb_mlang')) S.mean = v === 'de' ? 'de' : 'en'; if (!store('hb_vlang')) S.voice = v; applyI18n(); Voice.plan(S.voice); });
    seg($('#segVoice'), [['en', t('vlangs').en], ['de', t('vlangs').de], ['zh', t('vlangs').zh]], S.voice, function (v) { S.voice = v; store('hb_vlang', v); applyI18n(); Voice.plan(v); });
    seg($('#segMean'), [['en', 'English'], ['de', 'Deutsch']], S.mean, function (v) { S.mean = v; store('hb_mlang', v); applyI18n(); });
    $('#verInfo').textContent = 'v' + VERSION + ' · ' + Dict.stats().chars + ' characters · ' + Dict.stats().words + ' words';
  }
  $('#btnSettings').addEventListener('click', function () { $('#sheet').hidden = false; $('#sheetBg').hidden = false; strokeCount(); });
  $('#btnLang').addEventListener('click', function () { var v = VL[(VL.indexOf(S.ui) + 1) % 3]; S.ui = v; if (!store('hb_mlang')) S.mean = v === 'de' ? 'de' : 'en'; if (!store('hb_vlang')) S.voice = v; applyI18n(); Voice.plan(S.voice); toast(t('langs')[v]); });
  $('#sheetBg').addEventListener('click', function () { $('#sheet').hidden = true; $('#sheetBg').hidden = true; });
  function commonKeys() { var ks = {}; Object.keys(window.__DATA.chars).forEach(function (c) { if (window.__DATA.chars[c].l === 1) ks[strokeKey(c)] = (ks[strokeKey(c)] || 0) + 1; }); return ks; }
  async function strokeCount() {
    try {
      var c = await caches.open('hb-strokes-v2'), k = await c.keys(), ks = commonKeys(), n = 0;
      k.forEach(function (r) { var m = /\/data\/sb\/([cr][0-9a-f]+)\.json/.exec(r.url); if (m && ks[m[1]]) n += ks[m[1]]; });
      $('#dlInfo').textContent = t('offlineOk', { n: n }); return n;
    } catch (e) { return 0; }
  }
  var dlBusy = false;
  $('#dlStrokes').addEventListener('click', async function () {
    if (dlBusy) return; dlBusy = true;
    var ks = commonKeys(), list = Object.keys(ks), total = list.reduce(function (a, k) { return a + ks[k]; }, 0), done = 0, i = 0;
    async function worker() { while (i < list.length) { var k = list[i++]; try { await bundle(k); } catch (e) { } done += ks[k]; $('#dlInfo').textContent = t('offlineBusy', { n: done, t: total }); } }
    await Promise.all([worker(), worker(), worker(), worker()]);
    dlBusy = false; strokeCount();
  });
  // ---------- install tip (iOS Safari, not yet on home screen) ----------
  function maybeInstallTip() {
    var ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!ios || Voice.standalone() || store('hb_install_ok')) return;
    $('#installTip').hidden = false;
  }
  $('#installOk').addEventListener('click', function () { $('#installTip').hidden = true; store('hb_install_ok', 1); });
  // ---------- boot ----------
  async function boot() {
    try {
      var r = await Promise.all([fetch('data/chars.json').then(function (x) { return x.json(); }), fetch('data/words.json').then(function (x) { return x.json(); })]);
      window.__DATA = r[0]; Dict.load(r[0], r[1]);
    } catch (e) { $('#loading div').textContent = 'Could not load the dictionary. Please reload.'; return; }
    applyI18n();
    $('#loading').classList.add('off');
    HW.init('data/mmah.json');
    Voice.plan(S.voice);
    maybeInstallTip();
    window.addEventListener('online', function () { AI._reset(); Voice.resetPlans(); Voice.plan(S.voice); });
    var u = new URLSearchParams(location.search), q = u.get('q'), c = u.get('c');
    if (q) setQuery(q);
    if (c) openText(c);
    window.__ready = true;
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !/[?&]nosw/.test(location.search)) navigator.serviceWorker.register('sw.js').catch(function () { });
  window.App = { openText: openText, setQuery: setQuery, onSpeech: onSpeech, translate: translate, show: show, S: S, get cur() { return curList[curIdx]; } };
  boot();
})();

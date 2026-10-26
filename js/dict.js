/* Hanzi Bear · offline dictionary: characters, words, pinyin search, English / German meaning search.
 * Browser: window.Dict; Node tests: module.exports. */
(function (root) {
  'use strict';
  var TONE_MARKS = { 'ā': 'a1', 'á': 'a2', 'ǎ': 'a3', 'à': 'a4', 'ē': 'e1', 'é': 'e2', 'ě': 'e3', 'è': 'e4', 'ī': 'i1', 'í': 'i2', 'ǐ': 'i3', 'ì': 'i4',
    'ō': 'o1', 'ó': 'o2', 'ǒ': 'o3', 'ò': 'o4', 'ū': 'u1', 'ú': 'u2', 'ǔ': 'u3', 'ù': 'u4', 'ǖ': 'v1', 'ǘ': 'v2', 'ǚ': 'v3', 'ǜ': 'v4', 'ü': 'v0', 'ń': 'n2', 'ň': 'n3', 'ǹ': 'n4', 'ḿ': 'm2' };
  function splitTone(p) {
    var base = '', tone = 5;
    p = String(p || '').toLowerCase().normalize('NFC');
    for (var i = 0; i < p.length; i++) { var ch = p[i], m = TONE_MARKS[ch]; if (m) { base += m[0]; if (m[1] !== '0') tone = +m[1]; } else base += ch; }
    return { base: base.replace(/u:/g, 'v'), tone: tone };
  }
  var DB = null, RAD = {}, T2S = {}, WL = [], BY_BASE = {}, BY_TONED = {}, BASES = [], WORDS = [], IDX = { en: {}, de: {} }, KEYS = { en: [], de: [] };
  var STOP = { en: ' a an the to of for in on at by or and be as is with from up out sth sb one oneself someone something etc used e.g. eg also ', de: ' der die das ein eine einer einem einen eines etw jdn jdm jds jmd sich zu und oder von mit für im in am an auf aus ist sein werden etc usw z.b. bzw ' };
  function fold(s) { return String(s || '').toLowerCase().normalize('NFC').replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, "'"); }
  // a gloss -> {core, toks}
  function core(g, lang) {
    var s = fold(g).replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ').replace(/[\u3400-\u9fff]+/g, ' ').replace(/[~"“”!?.:]/g, ' ').replace(/\s+/g, ' ').trim();
    if (lang === 'en') s = s.replace(/^(a|an|the) /, '');
    else s = s.replace(/^(etw\.?|jdn\.?|jdm\.?|sich) /g, '').replace(/^(der|die|das|ein|eine) /, '');
    var toks = s.split(/[^a-z0-9'-]+/).filter(function (t) { return t.length > 1 && STOP[lang].indexOf(' ' + t + ' ') < 0; });
    return { core: s, toks: toks };
  }
  function addIdx(lang, key, id, q) {
    if (!key) return; var m = IDX[lang], a = m[key];
    if (!a) a = m[key] = [];
    if (a.length < 400 && !a.some(function (x) { return x[0] === id && x[1] <= q; })) a.push([id, q]);
  }
  function indexDefs(lang, id, defs, pen) {
    pen = pen || 0;
    defs.forEach(function (d, si) {
      String(d).split(lang === 'en' ? /;/ : /;|,(?![^(]*\))/).forEach(function (g, gi) {
        var c = core(g, lang); if (!c.core) return;
        var q = (si === 0 && gi === 0 ? 0 : si === 0 ? 1 : 2) + pen;
        if (c.toks.length <= 4) addIdx(lang, c.core, id, q);
        if (lang === 'en' && /^to /.test(c.core) && c.toks.length <= 4) addIdx(lang, c.core.slice(3), id, q + 0.7);
        if (c.toks.length > 1 || c.core !== (c.toks[0] || '')) c.toks.forEach(function (t) { addIdx(lang, t, id, 3 + Math.min(c.toks.length, 4) + (si ? 1 : 0)); });
      });
    });
  }
  // ids: 'c:水' for characters, 'w:123' for words
  function load(data, words) {
    DB = data.chars || data; RAD = data.rad || {}; T2S = data.t2s || {}; WL = words || [];
    BY_BASE = {}; BY_TONED = {}; WORDS = []; IDX = { en: {}, de: {} };
    Object.keys(DB).forEach(function (c) {
      var e = DB[c];
      e.p.forEach(function (py, idx) {
        var s = splitTone(py), score = e.k + idx * 600 + (e.l - 1) * 20000;
        (BY_BASE[s.base] = BY_BASE[s.base] || []).push([c, score]);
        (BY_TONED[s.base + s.tone] = BY_TONED[s.base + s.tone] || []).push([c, score]);
      });
      ['en', 'de'].forEach(function (lang) {
        var m = e[lang] || {}, rs = e.p.filter(function (r) { return m[r]; }).concat(Object.keys(m).filter(function (r) { return e.p.indexOf(r) < 0; }));
        rs.forEach(function (r, ri) { indexDefs(lang, 'c:' + c + '#' + e.p.indexOf(r), m[r], ri ? 0.6 : 0); });
      });
    });
    WL.forEach(function (w, i) {
      var sy = w[1].split(' ').map(splitTone);
      WORDS.push({ i: i, w: w[0], p: w[1], bs: sy.map(function (x) { return x.base; }), t: sy.map(function (x) { return x.base + x.tone; }) });
      if (w[2]) indexDefs('en', 'w:' + i, w[2].split('; '));
      if (w[3]) indexDefs('de', 'w:' + i, w[3].split('; '));
    });
    [BY_BASE, BY_TONED].forEach(function (m) { Object.keys(m).forEach(function (k) { m[k].sort(function (a, b) { return a[1] - b[1]; }); m[k] = Array.from(new Set(m[k].map(function (x) { return x[0]; }))); }); });
    BASES = Object.keys(BY_BASE).sort(function (a, b) { return b.length - a.length; });
    KEYS.en = Object.keys(IDX.en).sort(); KEYS.de = Object.keys(IDX.de).sort();
    return Object.keys(DB).length;
  }
  function get(c) { return DB && (DB[c] || DB[T2S[c]]) || null; }
  function simp(c) { return DB && DB[c] ? c : (T2S[c] || c); }
  function word(i) { var w = WL[i]; return w ? { w: w[0], p: w[1], en: w[2], de: w[3], i: i } : null; }
  function wordsOf(c) { var e = get(c); return e && e.w ? e.w.map(word) : []; }
  function findWord(w) { for (var i = 0; i < WL.length; i++) if (WL[i][0] === w) return word(i); return null; }
  function isHan(ch) { return /[\u3400-\u9fff\uf900-\ufaff]|[\ud840-\ud87f][\udc00-\udfff]/.test(ch); }
  function parsePinyin(input) {
    var s = String(input || '').toLowerCase().normalize('NFC').replace(/ü/g, 'v').replace(/u:/g, 'v').replace(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜv1-5\s']/g, ' ').trim();
    if (!s) return null;
    var parts = s.split(/[\s']+/).filter(Boolean), out = [];
    for (var i = 0; i < parts.length; i++) { var seg = segment(parts[i]); if (!seg) return null; out = out.concat(seg); }
    return out;
  }
  function segment(str) {
    var marked = '', toneAt = {};
    for (var i = 0; i < str.length; i++) { var m = TONE_MARKS[str[i]]; if (m) { marked += m[0]; if (m[1] !== '0') toneAt[marked.length - 1] = +m[1]; } else marked += str[i]; }
    var letters = '', numAfter = {}, markTone = {};
    for (var j = 0; j < marked.length; j++) { var ch = marked[j]; if (/[1-5]/.test(ch)) { numAfter[letters.length] = +ch; continue; } if (toneAt[j]) markTone[letters.length] = toneAt[j]; letters += ch; }
    if (/[1-5]/.test(str[0])) return null;
    var memo = {};
    function rec(pos) {
      if (pos === letters.length) return [];
      if (pos in memo) return memo[pos];
      var best = null;
      for (var n = Math.min(6, letters.length - pos); n >= 1; n--) {
        var sub = letters.substr(pos, n);
        if (!BY_BASE[sub]) continue;
        var rest = rec(pos + n);
        if (rest) { var tone = numAfter[pos + n] || null; for (var k = pos; k < pos + n; k++) if (markTone[k]) tone = markTone[k]; best = [{ base: sub, tone: tone }].concat(rest); break; }
      }
      memo[pos] = best; return best;
    }
    return rec(0);
  }
  function prefixChars(prefix, limit) {
    var bases = Object.keys(BY_BASE).filter(function (b) { return b.indexOf(prefix) === 0; }), list = [];
    bases.forEach(function (b) { BY_BASE[b].forEach(function (c) { list.push(c); }); });
    list = Array.from(new Set(list)).sort(function (a, b) { return DB[a].k - DB[b].k; });
    return { bases: bases.sort(), chars: list.slice(0, limit || 60) };
  }
  // ---- pinyin search ----
  function pinyinSearch(q, limit) {
    limit = limit || 60;
    var sy = parsePinyin(q);
    if (!sy) {
      var pre = q.toLowerCase().replace(/ü/g, 'v').replace(/[^a-z]/g, '');
      if (pre && pre.length <= 6 && /^[a-z]+$/.test(q.trim().toLowerCase())) { var r = prefixChars(pre, limit); if (r.chars.length) return { type: 'prefix', chars: r.chars, words: [] }; }
      return null;
    }
    var letters = q.toLowerCase().replace(/ü/g, 'v').trim();
    if (sy.length > 1 && /^[a-z]+$/.test(letters) && letters.length <= 5 && BASES.some(function (b) { return b.length > letters.length && b.indexOf(letters) === 0; })) {
      var rp = prefixChars(letters, limit); return { type: 'prefix', chars: rp.chars, words: [] };
    }
    if (sy.length === 1) {
      var s = sy[0], chars = s.tone ? (BY_TONED[s.base + s.tone] || []) : (BY_BASE[s.base] || []);
      var more = s.tone ? [] : prefixChars(s.base, limit).chars.filter(function (c) { return chars.indexOf(c) < 0; });
      return { type: 'syllable', syllables: sy, chars: chars.slice(0, limit), more: more.slice(0, 20), words: [] };
    }
    var words = WORDS.filter(function (w) {
      if (w.bs.length !== sy.length) return false;
      for (var i = 0; i < sy.length; i++) {
        if (w.bs[i] !== sy[i].base) return false;
        if (sy[i].tone && w.t[i] !== sy[i].base + sy[i].tone && sy[i].tone !== 5 && w.t[i] !== sy[i].base + '5') return false;
      }
      return true;
    }).slice(0, 30).map(function (w) { return word(w.i); });
    var first = sy[0], chars2 = first.tone ? (BY_TONED[first.base + first.tone] || []) : (BY_BASE[first.base] || []);
    return { type: 'words', syllables: sy, words: words, chars: chars2.slice(0, 30) };
  }
  // ---- meaning search (English / German) ----
  function lookupKey(lang, key) { return IDX[lang][key] || []; }
  function rankOf(id) { if (id[0] === 'c') { var e = DB[id.slice(2).split('#')[0]]; return e.k * 2 + (e.l - 1) * 6000; } return +id.slice(2) * 1.2 + 400; }
  function meaningSearch(q, lang, limit) {
    limit = limit || 40;
    var c = core(q, lang), hits = {};
    if (!c.core) return [];
    function add(id, score) { if (hits[id] == null || score < hits[id]) hits[id] = score; }
    lookupKey(lang, c.core).forEach(function (x) { add(x[0], x[1] * 1500 + rankOf(x[0])); });
    if (c.core.indexOf(' ') < 0 && c.toks.length) lookupKey(lang, c.core).length < 3 && lookupKey(lang, c.toks[0]).forEach(function (x) { add(x[0], x[1] * 1500 + rankOf(x[0])); });
    if (!Object.keys(hits).length && lang === 'de' && /(ae|oe|ue)/.test(c.core)) return meaningSearch(c.core.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u'), lang, limit);
    if (!Object.keys(hits).length && c.toks.length > 1) {
      // all tokens must appear: intersect token lists
      var sets = c.toks.map(function (t) { var m = {}; lookupKey(lang, t).forEach(function (x) { m[x[0]] = Math.min(m[x[0]] == null ? 9 : m[x[0]], x[1]); }); return m; });
      Object.keys(sets[0]).forEach(function (id) { if (sets.every(function (s) { return s[id] != null; })) add(id, 8e5 + rankOf(id)); });
    }
    if (Object.keys(hits).length < 3 && c.core.length >= 3 && c.core.indexOf(' ') < 0) {
      // typing prefix: "wat" -> water
      var K = KEYS[lang], lo = 0, hi = K.length;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (K[mid] < c.core) lo = mid + 1; else hi = mid; }
      for (var i = lo; i < K.length && i < lo + 30 && K[i].indexOf(c.core) === 0; i++) IDX[lang][K[i]].forEach(function (x) { if (x[1] <= 2) add(x[0], 9e5 + x[1] * 1e4 + rankOf(x[0])); });
    }
    var seen = {};
    return Object.keys(hits).sort(function (a, b) { return hits[a] - hits[b]; }).filter(function (id) { var k = id.split('#')[0]; if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, limit).map(function (id) { return entry(id, lang); });
  }
  function firstGloss(e, lang) {
    for (var i = 0; i < e.p.length; i++) { var d = e[lang] && e[lang][e.p[i]]; if (d && d.length) return d.slice(0, 2).join('; '); }
    var u = e['u' + lang]; return u ? '(' + u[0] + ' ' + u[2] + ')' : '';
  }
  function entry(id, lang) {
    if (id[0] === 'c') {
      var parts = id.slice(2).split('#'), c = parts[0], e = DB[c], ri = +(parts[1] || 0), r = e.p[ri] || e.p[0];
      var d = (e[lang] && e[lang][r]) || [];
      return { kind: 'c', h: c, p: r, g: d.length ? d.slice(0, 2).join('; ') : (firstGloss(e, lang) || firstGloss(e, 'en')) };
    }
    var w = word(+id.slice(2)); return { kind: 'w', h: w.w, p: w.p, g: (lang === 'de' ? w.de : w.en) || w.en, i: w.i };
  }
  function gloss(c, lang) { var e = get(c); return e ? (firstGloss(e, lang) || firstGloss(e, 'en')) : ''; }
  // ---- main search ----
  // returns {type:'empty'|'han'|'latin', chars, missing, py (pinyin result), mean (meaning hits), mlang}
  function search(input, lang, limit) {
    var q = String(input || '').trim();
    if (!q) return { type: 'empty' };
    var han = Array.from(q).filter(isHan);
    if (han.length) {
      var uniq = Array.from(new Set(han.map(simp)));
      var w = han.length > 1 ? findWord(han.map(simp).join('')) : null;
      return { type: 'han', chars: uniq.filter(function (c) { return !!DB[c]; }), missing: uniq.filter(function (c) { return !DB[c]; }), word: w };
    }
    var ml = lang === 'de' ? 'de' : 'en';
    var py = /[0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(q) || q.length <= 6 || /^[a-z' ]+$/i.test(q) ? pinyinSearch(q, limit) : null;
    var toned = /[1-5āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(q) && !/[äöüß]/i.test(q);
    var mean = toned ? [] : meaningSearch(q, ml, limit);
    if (!toned && ml === 'de' && mean.length < 3) mean = mean.concat(meaningSearch(q, 'en', limit).filter(function (x) { return !mean.some(function (y) { return y.h === x.h; }); }).map(function (x) { x.fromEn = true; return x; }));
    if (!toned && ml === 'en' && !mean.length) mean = meaningSearch(q, 'de', limit).map(function (x) { x.g = entry((x.kind === 'c' ? 'c:' + x.h + '#' + Math.max(0, DB[x.h].p.indexOf(x.p)) : 'w:' + x.i), 'en').g || x.g; return x; });
    // which first? exact English/German word beats pinyin prefix guesses
    var pyStrong = py && (py.type === 'syllable' || (py.type === 'words' && py.words.length)) && (toned || !mean.length || isSyllables(q));
    return { type: 'latin', py: py, mean: mean, mlang: ml, pyFirst: !!pyStrong };
  }
  function isSyllables(q) { var s = parsePinyin(q); return !!s && (s.length === 1 ? q.trim().length <= 6 && !known(q) : /\s/.test(q.trim()) || s.length >= 2 && !known(q)); }
  function known(q) { var k = core(q, 'en').core; return !!(IDX.en[k] || IDX.de[core(q, 'de').core]); }
  // ---- speech -> what to look up ----
  function fromSpeech(text) {
    var t = String(text || '').replace(/[，。！？、,.!?\s]/g, '').replace(/(这个字|字怎么写|怎么写|是什么字|这个|查一下|查|我想|请问)$/g, '');
    t = t.replace(/^(我想查|帮我查|查一下|请问|怎么写)/, '');
    var m = t.match(/^(.+?)的(.)字?$/);
    if (m && m[1].indexOf(m[2]) >= 0 && DB[m[2]]) return { main: m[2], context: m[1], others: [] };
    var han = Array.from(t).filter(function (c) { return isHan(c) && get(c); }).map(simp);
    if (!han.length) return { main: null, others: [] };
    if (han.length === 1) return { main: han[0], others: [] };
    return { main: null, context: t, others: Array.from(new Set(han)), word: findWord(han.join('')) };
  }
  // "How do you write 'water' in Chinese?" -> "water"; "Wie schreibt man Wasser auf Chinesisch" -> "wasser"
  function phraseFromSpeech(text, lang) {
    var t = String(text || '').trim().replace(/[“”"«»„.?!¿¡]/g, ' ').replace(/\s+/g, ' ').trim();
    if (lang === 'de') {
      t = t.replace(/^(ähm?|also|bitte|hallo)\s+/i, '').replace(/^(wie (schreibt|sagt) man|was (heißt|heisst|bedeutet)|wie heißt|wie heisst|zeig mir|ich suche( das zeichen für)?|das zeichen für|zeichen für)\s+/i, '').replace(/\s+(auf|in) (chinesisch|mandarin)$/i, '').replace(/\s+(bitte)$/i, '').replace(/^(das wort|das zeichen)\s+/i, '');
    } else {
      t = t.replace(/^(um+|uh+|so|please|hey)\s+/i, '').replace(/^(how (do|can) (you|i) (write|say)|what is|what's|show me|i want to (write|say|look up)|look up|the character for|character for|the chinese (word|character) for|how to (write|say))\s+/i, '').replace(/\s+(in (chinese|mandarin))$/i, '').replace(/^(the word|the character|the)\s+/i, '').replace(/\s+please$/i, '');
    }
    return t.trim();
  }
  function stats() { return { chars: DB ? Object.keys(DB).length : 0, syllables: Object.keys(BY_BASE).length, words: WL.length, en_keys: KEYS.en.length, de_keys: KEYS.de.length }; }
  var api = { load: load, get: get, simp: simp, word: word, wordsOf: wordsOf, findWord: findWord, search: search, pinyinSearch: pinyinSearch, meaningSearch: meaningSearch, parsePinyin: parsePinyin, splitTone: splitTone, fromSpeech: fromSpeech, phraseFromSpeech: phraseFromSpeech, isHan: isHan, stats: stats, prefixChars: prefixChars, gloss: gloss, rad: function (r) { return RAD[r] || null; }, fold: fold };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Dict = api;
})(typeof window !== 'undefined' ? window : globalThis);

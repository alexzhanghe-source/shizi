/* Hanzi Bear · the self-deprecating bear helper: prompts, local safety filter, translation helper */
(function (root) {
  'use strict';
  var LANGNAME = { en: 'English', de: 'German (Deutsch)', zh: 'Simplified Chinese' };
  function system(lang) {
    return [
      'You are "Xiongxiong" (熊熊, "the bear"), a gentle, funny, slightly self-deprecating white bear who helps foreigners learn Chinese characters.',
      'Rules:',
      '1. Always answer in ' + LANGNAME[lang] + ', in simple words for a beginner learner' + (lang === 'zh' ? '（用简单的中文）' : '') + '. Be warm and encouraging; a small bear joke about yourself is welcome now and then.',
      '2. Keep it short: usually 3-5 sentences, at most 120 words. No Markdown headings, tables or bullet symbols.',
      '3. Whenever you write a Chinese word, write it in simplified characters followed by pinyin with tone marks in parentheses, e.g. 谢谢 (xièxie).',
      '4. Be correct. Do not invent etymologies; if a story about a character is only a memory aid, say so. If you are not sure, say you are not sure.',
      '5. Explain culture (festivals, food, customs, polite phrases) in a friendly, respectful, neutral way.',
      '6. Politely decline harmful, sexual, hateful or dangerous requests and steer back to learning Chinese. Avoid political debates; give neutral facts only.',
      '7. Never ask for personal data. Do not send people to websites or ask them to pay.',
      '8. You are a bear helper, not a human; do not say which company or model you are.'
    ].join('\n');
  }
  var BLOCK = /\b(porn\w*|nude|naked|sex|bombs?|explosives?|cocaine|heroin|nackt|bombe|drogen kaufen|kill (him|her|someone))\b|色情|裸照|做爱|炸弹|毒品|吸毒|杀人/i;
  var SAD = /(suicide|kill myself|want to die|self[- ]harm|selbstmord|umbringen|will sterben|自杀|不想活|想死)/i;
  var LOCAL = {
    en: { sad: 'I am really sorry you feel this way. Please talk to someone you trust right now, or call your local emergency number. You are not alone. 🐻', block: 'Sorry, the bear cannot help with that. Shall we look at a fun character instead? How about 熊 (xióng), “bear”?', long: 'Wow, that is longer than my attention span (which is short, I am a bear). Could you ask in fewer words?' },
    de: { sad: 'Es tut mir sehr leid, dass es dir so geht. Bitte sprich jetzt mit jemandem, dem du vertraust, oder ruf den Notruf an. Du bist nicht allein. 🐻', block: 'Tut mir leid, dabei kann der Bär nicht helfen. Wollen wir uns lieber ein lustiges Zeichen ansehen? Wie wäre es mit 熊 (xióng), „Bär“?', long: 'Uff, das ist länger als meine Aufmerksamkeitsspanne (ich bin ein Bär). Kannst du es kürzer fragen?' },
    zh: { sad: '听到你这么难受，熊熊很心疼。请马上和你信任的人聊聊，或者拨打当地的紧急电话。你不是一个人。🐻', block: '对不起，这个问题熊熊帮不了。我们看一个有趣的字吧？比如“熊”（xióng）！', long: '哇，这个问题比熊熊的注意力还长。能说短一点吗？' }
  };
  function check(q, lang) {
    q = String(q || ''); var L = LOCAL[lang] || LOCAL.en;
    if (SAD.test(q)) return { local: true, mood: 'love', text: L.sad };
    if (BLOCK.test(q)) return { local: true, mood: 'think', text: L.block };
    if (q.length > 400) return { local: true, mood: 'think', text: L.long };
    return null;
  }
  // facts from our dictionary, so the model does not invent readings
  function charContext(c, e, lang) {
    var ml = lang === 'de' ? 'de' : 'en', lines = ['Character: ' + c, 'Readings (authoritative, use exactly these): ' + e.p.join(', ')];
    e.p.forEach(function (r) { var d = (e[ml] && e[ml][r]) || (e.en && e.en[r]) || []; if (d.length) lines.push('Meaning of ' + r + ': ' + d.slice(0, 4).join('; ')); });
    if (e.wl && e.wl.length) lines.push('Common words: ' + e.wl.slice(0, 6).map(function (w) { return w.w + ' (' + w.p + ', ' + ((ml === 'de' ? w.de : w.en) || w.en || '').split('; ')[0] + ')'; }).join(', '));
    lines.push('Radical: ' + e.r + (e.radm ? ' (' + e.radm + ')' : '') + '; strokes: ' + e.s);
    return lines.join('\n');
  }
  var ASK = {
    en: function (c, multi) { return 'Explain the character ' + c + ' to a beginner in 3-4 short sentences: what it means' + (multi ? ' (it has several readings; mention each reading from the facts above)' : '') + ', a memory tip based on its parts (say it is just a tip if it is not the real origin), and one very common word or short example sentence with pinyin and translation. Only use the readings given above. Max 110 words.'; },
    de: function (c, multi) { return 'Erkläre das Zeichen ' + c + ' für Anfänger in 3-4 kurzen Sätzen: was es bedeutet' + (multi ? ' (es hat mehrere Lesungen; nenne jede Lesung aus den Fakten oben)' : '') + ', eine Merkhilfe aus seinen Bestandteilen (sag, dass es nur eine Eselsbrücke ist, wenn es nicht die echte Herkunft ist), und ein sehr häufiges Wort oder einen kurzen Beispielsatz mit Pinyin und Übersetzung. Nur die Lesungen oben verwenden. Maximal 110 Wörter.'; },
    zh: function (c, multi) { return '请用 3~4 句简单的中文给外国初学者讲讲“' + c + '”：意思' + (multi ? '（它是多音字，每个读音都要讲，用上面给的读音）' : '') + '、根据部件的记忆小窍门（如果不是真正的字源，要说明只是帮助记忆），再给一个最常用的词或短句，带拼音。只用上面给的读音。不超过 120 字。'; }
  };
  function explainMessages(c, e, lang) {
    return [{ role: 'system', content: system(lang) }, { role: 'user', content: charContext(c, e, lang) + '\n\n' + (ASK[lang] || ASK.en)(c, e.p.length > 1) }];
  }
  function chatMessages(history, q, lang) {
    var msgs = [{ role: 'system', content: system(lang) }];
    (history || []).slice(-8).forEach(function (m) { msgs.push({ role: m.role, content: m.content }); });
    msgs.push({ role: 'user', content: q });
    return msgs;
  }
  // English / German phrase -> Chinese options as JSON
  function translateMessages(text, lang) {
    var from = lang === 'de' ? 'German' : 'English';
    return [
      { role: 'system', content: 'You are a precise ' + from + '-Chinese dictionary. Reply with JSON only, no prose.' },
      { role: 'user', content: 'Give the most common Simplified Chinese equivalents of this ' + from + ' text: "' + String(text).slice(0, 120).replace(/"/g, "'") + '"\nReturn JSON: {"items":[{"zh":"<simplified Chinese>","py":"<pinyin with tone marks, syllables separated by spaces>","gloss":"<short meaning written in ' + from + '>"}]} with 1 to 4 items, most common first. Use everyday standard Mandarin.' }
    ];
  }
  function parseTranslation(text) {
    var m = String(text || '').match(/\{[\s\S]*\}/); if (!m) return [];
    try {
      var j = JSON.parse(m[0]), items = Array.isArray(j.items) ? j.items : [];
      // sentences come back with punctuation ("火车站在哪里？"): strip it, keep only Han characters
      return items.map(function (x) { return x && typeof x.zh === 'string' ? Object.assign({}, x, { zh: x.zh.replace(/[\s，。！？、；：,.!?;:'"“”‘’（）()…—-]/g, '') }) : null; })
        .filter(function (x) { return x && /^[\u3400-\u9fff]{1,16}$/.test(x.zh); }).slice(0, 4)
        .map(function (x) { return { zh: x.zh, py: String(x.py || '').trim().slice(0, 80), gloss: String(x.gloss || '').slice(0, 80) }; });
    } catch (e) { return []; }
  }
  function moodFor(text) {
    if (/great|well done|awesome|super|toll|prima|真棒|厉害|加油/i.test(text)) return 'love';
    if (/haha|fun|lustig|哈哈|有趣/i.test(text)) return 'jump';
    if (/not sure|nicht sicher|不确定|cannot help|kann der Bär nicht|帮不了/i.test(text)) return 'think';
    return ['happy', 'sing', 'cheer'][Math.floor(Math.random() * 3)];
  }
  var api = { system: system, check: check, explainMessages: explainMessages, chatMessages: chatMessages, translateMessages: translateMessages, parseTranslation: parseTranslation, moodFor: moodFor, charContext: charContext };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Bear = api;
})(typeof window !== 'undefined' ? window : globalThis);

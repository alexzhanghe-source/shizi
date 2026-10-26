/* Hanzi Bear · UI strings (English default, German, Chinese) */
(function (root) {
  'use strict';
  var S = {
    en: {
      app: 'Hanzi Bear', tagline: 'Look up Chinese characters',
      ph: 'Type 水, shui, water…', mic: 'Speak', listening: 'Listening… tap to stop', thinking: 'Recognizing…',
      write: 'Write', undo: 'Undo', clear: 'Clear', writeHint: 'Draw a character here',
      hint: 'Type a character, pinyin (with or without tones) or an English / German word. You can also write or speak.',
      welcome: 'Hi! I am the bear. Let\'s find some characters!',
      secPinyin: 'By pinyin', secMeaning: 'By meaning', secChars: 'Characters', secWords: 'Words', secMore: 'Similar sounds', secWritten: 'Did you write…',
      noResult: 'Nothing found.', notInDict: 'Not in this dictionary: {x}', askBearTr: 'Ask the bear to translate “{x}”',
      recent: 'Recently viewed', saved: 'Saved', noSaved: 'Tap ☆ on a character to save it here.',
      tabSearch: 'Search', tabBear: 'Bear', tabSaved: 'Saved',
      back: 'Back', save: 'Save', savedOn: 'Saved',
      play: 'Strokes', step: 'Step', quiz: 'Trace', say: 'Listen',
      strokes: 'Strokes', radical: 'Radical', structure: 'Structure', traditional: 'Traditional', level: 'Level', tone: 'Tone', pron: 'Pronunciation',
      tones: ['', '1st tone (high, flat)', '2nd tone (rising)', '3rd tone (dip)', '4th tone (falling)', 'neutral tone'],
      levelNames: ['', 'common (top 3500)', 'less common', 'rare'],
      meanings: 'Meaning', meaningsOther: 'In German', words: 'Common words', usedIn: 'Used in the word',
      noMeaning: 'No meaning available.', strokeN: 'Stroke {n} of {t}', strokeOk: 'Stroke {n} correct! {r} left',
      quizTry: 'Try again — check where the stroke starts', quizHint: 'Here is a hint ✨', quizDone: 'Done! {stars}', quizStart: 'Trace the strokes in order',
      explain: 'Ask the bear about this character', bearTitle: 'Bear helper', bearSub: 'Ask about characters, words or Chinese culture',
      askPh: 'Ask the bear…', send: 'Send', bearLimit: 'The bear is tired today ({n} questions used). Come back tomorrow!',
      chips: ['What does 好 mean?', 'Why does 妈 have 女 in it?', 'How do I say “thank you”?', 'Teach me one useful character', 'What is the Spring Festival?'],
      bearHello: 'Hi, I am the bear 🐻 A bit clumsy, but I know my characters! Ask me anything about Chinese.',
      bearOffline: 'The bear needs internet. Search and handwriting still work offline.',
      bearErr: 'Oops, the bear tripped over its own paws. Please try again.',
      trTitle: 'The bear suggests', trBusy: 'The bear is translating…',
      settings: 'Settings', uiLang: 'App language', voiceLang: 'Voice input language', meaningLang: 'Meanings in',
      offlineTitle: 'Offline', offlineDl: 'Download stroke animations for 3,500 common characters (~10 MB)', offlineOk: 'Stroke data ready offline: {n} characters',
      offlineBusy: 'Downloading… {n}/{t}', about: 'About & credits',
      install: 'Install: tap <b>Share</b> <span class="ios-share">⬆︎</span> then <b>Add to Home Screen</b>.', installOk: 'Got it',
      voiceNoMic: 'Microphone not allowed. Please allow it in Settings › Safari › Microphone.',
      voiceNone: 'Voice input is not available here. Use the keyboard microphone 🎤 instead.',
      voiceDeSoon: 'German voice input is not available right now. Please use the keyboard microphone 🎤 (set to German) or type.',
      voiceShort: 'Too short — tap, speak, then tap again.', voiceEmpty: 'Did not catch that. Please try again.', voiceHeard: 'Heard: “{x}”',
      offline: 'You are offline', dailyLimit: 'Daily limit reached on this phone. Try again tomorrow.', netErr: 'Network problem. Please try again.',
      langs: { en: 'English', de: 'Deutsch', zh: '中文' }, vlangs: { en: 'English', de: 'German', zh: 'Chinese' },
      struct: { lr: 'left–right', tb: 'top–bottom', stl: 'enclosed top-left', single: 'single component', sbl: 'enclosed bottom-left', st3: 'enclosed from above', str: 'enclosed top-right', tmb: 'top–middle–bottom', full: 'fully enclosed', lmr: 'left–middle–right', sl3: 'enclosed from left', sb3: 'enclosed from below' },
      credits: 'Meanings: CC-CEDICT (CC BY-SA 4.0) and HanDeDict (CC BY-SA 3.0). Strokes: Make Me a Hanzi (Arphic Public License) via Hanzi Writer. Handwriting: HanziLookupJS. Bear answers are AI-generated and may contain mistakes.'
    },
    de: {
      app: 'Hanzi-Bär', tagline: 'Chinesische Schriftzeichen nachschlagen',
      ph: 'Tippe 水, shui, Wasser…', mic: 'Sprechen', listening: 'Ich höre zu… tippen zum Beenden', thinking: 'Erkenne…',
      write: 'Schreiben', undo: 'Zurück', clear: 'Löschen', writeHint: 'Zeichne hier ein Zeichen',
      hint: 'Gib ein Zeichen, Pinyin (mit oder ohne Töne) oder ein deutsches / englisches Wort ein. Du kannst auch schreiben oder sprechen.',
      welcome: 'Hallo! Ich bin der Bär. Lass uns Zeichen suchen!',
      secPinyin: 'Nach Pinyin', secMeaning: 'Nach Bedeutung', secChars: 'Zeichen', secWords: 'Wörter', secMore: 'Ähnliche Laute', secWritten: 'Hast du geschrieben…',
      noResult: 'Nichts gefunden.', notInDict: 'Nicht im Wörterbuch: {x}', askBearTr: 'Den Bären „{x}“ übersetzen lassen',
      recent: 'Zuletzt angesehen', saved: 'Gespeichert', noSaved: 'Tippe bei einem Zeichen auf ☆, um es hier zu speichern.',
      tabSearch: 'Suche', tabBear: 'Bär', tabSaved: 'Merkliste',
      back: 'Zurück', save: 'Merken', savedOn: 'Gemerkt',
      play: 'Strichfolge', step: 'Schritt', quiz: 'Nachziehen', say: 'Anhören',
      strokes: 'Striche', radical: 'Radikal', structure: 'Aufbau', traditional: 'Traditionell', level: 'Stufe', tone: 'Ton', pron: 'Aussprache',
      tones: ['', '1. Ton (hoch, gleich)', '2. Ton (steigend)', '3. Ton (fallend-steigend)', '4. Ton (fallend)', 'neutraler Ton'],
      levelNames: ['', 'häufig (Top 3500)', 'weniger häufig', 'selten'],
      meanings: 'Bedeutung', meaningsOther: 'Auf Englisch', words: 'Häufige Wörter', usedIn: 'Kommt vor in',
      noMeaning: 'Keine Bedeutung vorhanden.', strokeN: 'Strich {n} von {t}', strokeOk: 'Strich {n} richtig! Noch {r}',
      quizTry: 'Nochmal — wo beginnt der Strich?', quizHint: 'Hier ein Tipp ✨', quizDone: 'Fertig! {stars}', quizStart: 'Ziehe die Striche der Reihe nach',
      explain: 'Den Bären nach diesem Zeichen fragen', bearTitle: 'Bär-Helfer', bearSub: 'Frag nach Zeichen, Wörtern oder chinesischer Kultur',
      askPh: 'Frag den Bären…', send: 'Senden', bearLimit: 'Der Bär ist heute müde ({n} Fragen). Komm morgen wieder!',
      chips: ['Was bedeutet 好?', 'Warum steckt 女 in 妈?', 'Wie sagt man „danke“?', 'Bring mir ein nützliches Zeichen bei', 'Was ist das Frühlingsfest?'],
      bearHello: 'Hallo, ich bin der Bär 🐻 Etwas tollpatschig, aber Zeichen kann ich! Frag mich alles über Chinesisch.',
      bearOffline: 'Der Bär braucht Internet. Suche und Handschrift gehen auch offline.',
      bearErr: 'Hoppla, der Bär ist über seine Tatzen gestolpert. Bitte nochmal versuchen.',
      trTitle: 'Der Bär schlägt vor', trBusy: 'Der Bär übersetzt…',
      settings: 'Einstellungen', uiLang: 'App-Sprache', voiceLang: 'Sprache der Spracheingabe', meaningLang: 'Bedeutungen auf',
      offlineTitle: 'Offline', offlineDl: 'Strichfolgen für 3.500 häufige Zeichen laden (~10 MB)', offlineOk: 'Strichdaten offline bereit: {n} Zeichen',
      offlineBusy: 'Lade… {n}/{t}', about: 'Info & Quellen',
      install: 'Installieren: tippe auf <b>Teilen</b> <span class="ios-share">⬆︎</span> und dann <b>Zum Home-Bildschirm</b>.', installOk: 'OK',
      voiceNoMic: 'Mikrofon nicht erlaubt. Bitte unter Einstellungen › Safari › Mikrofon erlauben.',
      voiceNone: 'Spracheingabe ist hier nicht verfügbar. Nutze das Mikrofon 🎤 der Tastatur.',
      voiceDeSoon: 'Deutsche Spracheingabe ist gerade nicht verfügbar. Bitte das Tastatur-Mikrofon 🎤 (auf Deutsch) nutzen oder tippen.',
      voiceShort: 'Zu kurz — tippen, sprechen, nochmal tippen.', voiceEmpty: 'Nicht verstanden. Bitte nochmal.', voiceHeard: 'Gehört: „{x}“',
      offline: 'Du bist offline', dailyLimit: 'Tageslimit auf diesem Gerät erreicht. Morgen wieder.', netErr: 'Netzwerkproblem. Bitte nochmal versuchen.',
      langs: { en: 'English', de: 'Deutsch', zh: '中文' }, vlangs: { en: 'Englisch', de: 'Deutsch', zh: 'Chinesisch' },
      struct: { lr: 'links–rechts', tb: 'oben–unten', stl: 'oben links umschlossen', single: 'einteilig', sbl: 'unten links umschlossen', st3: 'von oben umschlossen', str: 'oben rechts umschlossen', tmb: 'oben–Mitte–unten', full: 'ganz umschlossen', lmr: 'links–Mitte–rechts', sl3: 'von links umschlossen', sb3: 'von unten umschlossen' },
      credits: 'Bedeutungen: CC-CEDICT (CC BY-SA 4.0) und HanDeDict (CC BY-SA 3.0). Striche: Make Me a Hanzi (Arphic Public License) mit Hanzi Writer. Handschrift: HanziLookupJS. Antworten des Bären sind KI-generiert und können Fehler enthalten.'
    },
    zh: {
      app: '熊熊查汉字', tagline: '给外国朋友的汉字字典',
      ph: '输入 水、shui、water…', mic: '说话', listening: '在听… 再点一下结束', thinking: '识别中…',
      write: '手写', undo: '撤销', clear: '清空', writeHint: '在这里写一个字',
      hint: '可以输入汉字、拼音（带不带声调都行）、英文或德文单词，也可以手写或说话。',
      welcome: '你好！我是熊熊，一起来查字吧！',
      secPinyin: '按拼音', secMeaning: '按意思', secChars: '字', secWords: '词', secMore: '读音相近', secWritten: '你写的是…',
      noResult: '没有找到。', notInDict: '字典里没有：{x}', askBearTr: '让熊熊翻译“{x}”',
      recent: '最近查过', saved: '收藏', noSaved: '在字的页面点 ☆ 就能收藏到这里。',
      tabSearch: '查字', tabBear: '熊熊', tabSaved: '收藏',
      back: '返回', save: '收藏', savedOn: '已收藏',
      play: '笔顺', step: '一笔笔', quiz: '描红', say: '朗读',
      strokes: '笔画', radical: '部首', structure: '结构', traditional: '繁体', level: '级别', tone: '声调', pron: '读音',
      tones: ['', '第一声（阴平）', '第二声（阳平）', '第三声（上声）', '第四声（去声）', '轻声'],
      levelNames: ['', '一级常用字', '二级字', '三级字'],
      meanings: '英文释义', meaningsOther: '德文释义', words: '常用词', usedIn: '用在词语',
      noMeaning: '暂无释义。', strokeN: '第 {n} 画，共 {t} 画', strokeOk: '第 {n} 画写对了！还剩 {r} 画',
      quizTry: '再试试，看看从哪里起笔', quizHint: '给你提示一下 ✨', quizDone: '写完啦！{stars}', quizStart: '按笔顺描一描',
      explain: '让熊熊讲讲这个字', bearTitle: '熊熊小助手', bearSub: '问汉字、词语或中国文化',
      askPh: '问熊熊…', send: '发送', bearLimit: '熊熊今天累了（已经问了 {n} 次），明天再来吧！',
      chips: ['“好”是什么意思？', '为什么“妈”有女字旁？', '“谢谢”怎么说？', '教我一个有用的字', '春节是什么？'],
      bearHello: '你好，我是熊熊 🐻 有点笨笨的，但是很懂汉字！关于中文的问题都可以问我。',
      bearOffline: '熊熊需要联网。查字和手写不联网也能用。',
      bearErr: '哎呀，熊熊被自己的脚绊倒了，请再试一次。',
      trTitle: '熊熊的建议', trBusy: '熊熊在翻译…',
      settings: '设置', uiLang: '界面语言', voiceLang: '语音输入语言', meaningLang: '释义语言',
      offlineTitle: '离线', offlineDl: '下载 3500 个常用字的笔顺动画（约 10 MB）', offlineOk: '已可离线看笔顺：{n} 个字',
      offlineBusy: '下载中… {n}/{t}', about: '关于和数据来源',
      install: '安装：点 <b>分享</b> <span class="ios-share">⬆︎</span>，再点 <b>添加到主屏幕</b>。', installOk: '知道了',
      voiceNoMic: '没有麦克风权限。请到 设置 › Safari › 麦克风 打开。',
      voiceNone: '这里不能语音输入，请用键盘上的话筒 🎤。',
      voiceDeSoon: '德语语音暂时不可用。请用键盘上的话筒 🎤（切换到德语）或直接打字。',
      voiceShort: '太短了：点一下，说话，再点一下。', voiceEmpty: '没听清，请再说一次。', voiceHeard: '听到：“{x}”',
      offline: '现在没有网络', dailyLimit: '这台手机今天的次数用完了，明天再试。', netErr: '网络有问题，请再试一次。',
      langs: { en: 'English', de: 'Deutsch', zh: '中文' }, vlangs: { en: '英语', de: '德语', zh: '汉语' },
      struct: { lr: '左右结构', tb: '上下结构', stl: '左上包围结构', single: '独体字', sbl: '左下包围结构', st3: '上三包围结构', str: '右上包围结构', tmb: '上中下结构', full: '全包围结构', lmr: '左中右结构', sl3: '左三包围结构', sb3: '下三包围结构' },
      credits: '释义：CC-CEDICT（CC BY-SA 4.0）和 HanDeDict（CC BY-SA 3.0）。笔顺：Make Me a Hanzi（Arphic 公共许可）+ Hanzi Writer。手写识别：HanziLookupJS。熊熊的回答由 AI 生成，可能有错。'
    }
  };
  var lang = 'en';
  function detect() {
    try { var s = localStorage.getItem('hb_lang'); if (S[s]) return s; } catch (e) { }
    var n = (navigator.language || 'en').toLowerCase();
    return n.indexOf('de') === 0 ? 'de' : n.indexOf('zh') === 0 ? 'zh' : 'en';
  }
  function t(k, vars) {
    var v = (S[lang] && S[lang][k]); if (v == null) v = S.en[k]; if (v == null) return k;
    if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, function (_, x) { return vars[x] != null ? vars[x] : ''; });
    return v;
  }
  root.I18N = {
    S: S, t: t, detect: detect,
    get lang() { return lang; },
    set: function (l) { if (S[l]) { lang = l; try { localStorage.setItem('hb_lang', l); } catch (e) { } document.documentElement.lang = l === 'zh' ? 'zh-CN' : l; } }
  };
})(window);

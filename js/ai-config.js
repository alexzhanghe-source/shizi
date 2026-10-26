/* Hanzi Bear · AI settings. The proxy URL + app token live in config.js (generated, not in git). */
(function () {
  var S = window.APP_SECRETS || {};
  window.AI_CONFIG = {
    baseUrl: S.proxyUrl || '',
    token: S.proxyToken || '',
    chatPath: '/v1/chat/completions',
    temperature: 0.5,
    maxTokens: 500,
    thinking: 'disabled',
    appId: 'hanzi_intl',          // the proxy gives this app its own quota bucket (proxy v11)
    timeoutMs: 30000,
    retries: 1,
    tts: { path: '/tts', voice: 'zh_female_tianmeitaozi_uranus_bigtts', cacheName: 'hb-tts-v1', maxChars: 200 },
    asr: { path: '/asr' },
    // per-device daily caps (protects the shared proxy quota)
    daily: { chat: 30, tts: 80, asr: 30 }
  };
})();

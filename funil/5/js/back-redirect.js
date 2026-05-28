// ============================================================
// Back Redirect — versão robusta
// ------------------------------------------------------------
// Intercepta o botão "voltar" do navegador e leva o usuário
// para /funil/back/ preservando query string (utm, gclid, cpf...).
// Funciona em iOS Safari (bfcache) + Android Chrome + Desktop.
// Não roda na própria página /funil/back/ (evita loop).
// ============================================================
(function () {
  try {
    var here = location.pathname || '';
    // Anti-loop: na própria página de back não ativa
    if (/\/funil\/back\/?(index\.html)?$/i.test(here)) return;

    // Prefetch do áudio do back-redirect para que toque imediato quando o usuário voltar
    try {
      var l = document.createElement('link');
      l.rel = 'prefetch';
      l.as = 'audio';
      l.href = '/funil/back/audioback.mpeg';
      l.crossOrigin = 'anonymous';
      (document.head || document.documentElement).appendChild(l);
    } catch (e) { /* ignore */ }

    var REDIRECT_BASE = '/funil/back/index.html';
    var STATE = { __backTrap: true, ts: Date.now() };
    var redirected = false;

    function buildUrl() {
      var qs = location.search || '';
      return REDIRECT_BASE + qs;
    }

    function trap() {
      try {
        // Empilha 3 estados — sobrevive a duplo-clique no voltar
        history.replaceState(STATE, '', location.href);
        history.pushState(STATE, '', location.href);
        history.pushState(STATE, '', location.href);
      } catch (e) { /* ignore */ }
    }

    function doRedirect() {
      if (redirected) return;
      redirected = true;
      try { location.replace(buildUrl()); }
      catch (e) { location.href = buildUrl(); }
    }

    // Inicializa o trap o quanto antes
    trap();

    // 1) Clique em "voltar" → popstate
    window.addEventListener('popstate', function () {
      // Re-empilha mais um estado para o caso de o redirect ser cancelado
      try { history.pushState(STATE, '', location.href); } catch (e) {}
      doRedirect();
    });

    // 2) iOS Safari: página restaurada do bfcache
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) doRedirect();
    });

    // 3) Se a aba ficou em segundo plano e voltou via gesto de "voltar"
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        // Re-fortifica o trap quando o usuário retorna pra aba
        trap();
      }
    });

    // 4) Reaplica o trap após o load (alguns browsers manipulam history depois)
    window.addEventListener('load', function () { setTimeout(trap, 50); });
  } catch (err) {
    // Falha silenciosa — nunca derrubar o funil por causa do trap
    try { console && console.warn && console.warn('[back-redirect]', err); } catch (e) {}
  }
})();

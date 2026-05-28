(function () {
  try {
    // ============================================================
    // 1. SESSION ID
    // ============================================================
    var SKEY = '_funil_sid';
    var sid = localStorage.getItem(SKEY);
    if (!sid) {
      sid = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
      localStorage.setItem(SKEY, sid);
    }

    // ============================================================
    // 2. UTM BOOTSTRAP — funciona em QUALQUER página do funil
    //    Estratégia: URL → sessionStorage → localStorage. Se a
    //    pessoa cair direto numa página interna sem ?utm, a gente
    //    restaura a URL via history.replaceState antes de qualquer
    //    pageview/link.
    // ============================================================
    var UTM_KEYS = [
      'utm_source','utm_medium','utm_campaign','utm_content','utm_term',
      'gclid','fbclid','sck','xcod','src','sxid','cid'
    ];
    var ID_KEYS = ['nome','name','cpf','phone','telefone','email','nascimento','sexo','mae'];

    var qs = new URLSearchParams(location.search);

    // 2.1 — Captura o que veio na URL (primeira fonte da verdade).
    UTM_KEYS.forEach(function (k) {
      var v = qs.get(k);
      if (v) localStorage.setItem('_funil_' + k, v);
    });
    ID_KEYS.forEach(function (k) {
      var v = qs.get(k);
      if (v) localStorage.setItem(k, v);
    });

    // 2.2 — First-touch: guarda a query do PRIMEIRO pouso.
    if (!localStorage.getItem('_funil_first_qs') && location.search) {
      localStorage.setItem('_funil_first_qs', location.search);
    }
    if (!sessionStorage.getItem('landing_qs') && location.search) {
      sessionStorage.setItem('landing_qs', location.search);
    }

    // 2.3 — Reescreve a URL atual com UTMs do storage (sem reload)
    //       pra que QUALQUER script (tracker, links, redirects) já
    //       enxergue ?utm_source=... na location.search.
    var merged = new URLSearchParams(location.search);
    var didRewrite = false;
    UTM_KEYS.forEach(function (k) {
      if (!merged.has(k)) {
        var v = localStorage.getItem('_funil_' + k);
        if (v) { merged.set(k, v); didRewrite = true; }
      }
    });
    if (didRewrite) {
      try {
        history.replaceState(null, '', location.pathname + '?' + merged.toString() + location.hash);
      } catch (e) {}
    }
    if (merged.toString()) {
      sessionStorage.setItem('utm_final_qs', '?' + merged.toString());
    }

    // 2.4 — Decora TODOS os <a> da página com as UTMs + identidade
    //       (assim navegação pra fora ou inter-funil mantém a stack).
    function decorateLinks() {
      var anchors = document.querySelectorAll('a[href]');
      for (var i = 0; i < anchors.length; i++) {
        var a = anchors[i];
        try {
          var u = new URL(a.getAttribute('href'), location.href);
          // só mexe em http/https
          if (u.protocol !== 'http:' && u.protocol !== 'https:') continue;
          UTM_KEYS.forEach(function (k) {
            var v = localStorage.getItem('_funil_' + k);
            if (v && !u.searchParams.has(k)) u.searchParams.set(k, v);
          });
          // identidade só vai pra links do mesmo domínio
          if (u.origin === location.origin) {
            ID_KEYS.forEach(function (k) {
              var v = localStorage.getItem(k);
              if (v && !u.searchParams.has(k)) u.searchParams.set(k, v);
            });
          }
          a.href = u.toString();
        } catch (e) {}
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', decorateLinks);
    } else {
      decorateLinks();
    }
    window.addEventListener('load', decorateLinks);

    // 2.5 — Helpers globais pros scripts inline de cada página.
    window.__funilUTMs = function () {
      var out = {};
      UTM_KEYS.forEach(function (k) {
        var v = localStorage.getItem('_funil_' + k);
        if (v) out[k] = v;
      });
      return out;
    };
    window.__funilAppendUTM = function (urlStr) {
      try {
        var u = new URL(urlStr, location.href);
        UTM_KEYS.forEach(function (k) {
          var v = localStorage.getItem('_funil_' + k);
          if (v && !u.searchParams.has(k)) u.searchParams.set(k, v);
        });
        ID_KEYS.forEach(function (k) {
          var v = localStorage.getItem(k);
          if (v && !u.searchParams.has(k)) u.searchParams.set(k, v);
        });
        return u.toString();
      } catch (e) { return urlStr; }
    };

    // ============================================================
    // 3. PAYLOAD DO PAGEVIEW
    // ============================================================
    function pick(k) {
      return (new URLSearchParams(location.search)).get(k)
          || localStorage.getItem('_funil_' + k)
          || localStorage.getItem(k)
          || null;
    }

    var ua = navigator.userAgent || '';
    var device = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';

    var payload = {
      session_id: sid,
      event_type: 'pageview',
      page: location.pathname,
      device: device,
      referrer: document.referrer || null,
      utm_source: pick('utm_source'),
      utm_medium: pick('utm_medium'),
      utm_campaign: pick('utm_campaign'),
      utm_content: pick('utm_content'),
      utm_term: pick('utm_term'),
      gclid: pick('gclid'),
      name: pick('nome') || pick('name'),
      cpf: pick('cpf'),
      phone: pick('phone') || pick('telefone'),
      email: pick('email'),
    };

    window.__FUNIL_SID = sid;
    window.__funilTrack = function (event_type, metadata) {
      try {
        fetch('/api/public/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({}, payload, { event_type: event_type, metadata: metadata || null })),
          keepalive: true,
        });
      } catch (e) {}
    };

    fetch('/api/public/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(function () {});

    // ============================================================
    // 4. HEARTBEAT (presença em tempo real)
    // ============================================================
    function sendHeartbeat() {
      if (document.visibilityState !== 'visible') return;
      try {
        fetch('/api/public/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({}, payload, { event_type: 'heartbeat' })),
          keepalive: true,
        }).catch(function () {});
      } catch (e) {}
    }
    setInterval(sendHeartbeat, 15000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') sendHeartbeat();
    });
  } catch (e) {}
})();

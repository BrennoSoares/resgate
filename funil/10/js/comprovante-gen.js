// ============================================================
// comprovante-gen.js — Gerador local estilo GOV.BR
// Layout com height-tracking explícito (sem sobreposição)
// ============================================================

(function () {
  if (typeof CanvasRenderingContext2D !== 'undefined' &&
      !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
      this.closePath();
      return this;
    };
  }
})();

function gerarComprovanteLocal(p) {
  try {
    var nome        = p.nome        || '';
    var cpf         = p.cpf         || '';
    var data        = p.data        || '';
    var imposto     = p.imposto     || '';
    var indenizacao = p.indenizacao || '';
    var chavePix    = p.chavePix    || '';
    var tipoPix     = p.tipoPix     || '';

    // ─── Helpers ────────────────────────────────────────────
    function parseReais(s) {
      return parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0;
    }
    function fmt(n) {
      return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function fmtCpf(raw) {
      var d = raw.replace(/\D/g, '');
      return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : raw;
    }
    function seededRand(seed, min, max) {
      var h = 2166136261;
      for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
      return min + (h % (max - min + 1));
    }
    function trunc(ctx, text, maxW) {
      var t = String(text);
      if (ctx.measureText(t).width <= maxW) return t;
      while (t.length > 0 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
      return t + '…';
    }
    function fillRR(ctx, x, y, w, h, r, color) {
      ctx.save(); ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
      ctx.restore();
    }
    function hline(ctx, y, color, lw) {
      ctx.save(); ctx.strokeStyle = color || '#d1d5db'; ctx.lineWidth = lw || 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.restore();
    }
    function f(size, weight) {
      return (weight || '400') + ' ' + size + 'px Arial,Helvetica,sans-serif';
    }

    // ─── Dados ──────────────────────────────────────────────
    var cpfDigits    = cpf.replace(/\D/g, '');
    var cpfFormatted = fmtCpf(cpfDigits);
    var total        = parseReais(indenizacao);

    var proto = 'GV-' + seededRand(cpfDigits+'p1',1000,9999)
              + '/' + seededRand(cpfDigits+'p2',100000,999999)
              + '-' + seededRand(cpfDigits+'p3',2019,2026);

    var assoc = [
      'Consignação / Ambec',   'Emprestimo / Sindnapi/FS',
      'Consignação / AAPB',    'Consignação / Aapen',
      'Emprestimo / Contag',   'Consignação / ANASPS',
      'Emprestimo / Fenajufe', 'Consignação / ANEAFISCO',
      'Emprestimo / Fenasps',  'Consignação / Assefaz',
    ];

    var danos = Math.round(total * 0.15 * 100) / 100;
    var sobra = Math.round((total - danos) * 100) / 100;
    var linhas = [];
    for (var i = 0; i < 5; i++) {
      if (i === 4) { linhas.push(Math.round(sobra*100)/100); break; }
      var base = sobra / (5 - i);
      var v = seededRand(cpfDigits+'r'+i, Math.round(base*90), Math.round(base*110)) / 100;
      linhas.push(Math.round(v*100)/100);
      sobra = Math.round((sobra-v)*100)/100;
    }
    var used = {}, codigos = [], tipos = [];
    for (var j = 0; j < 5; j++) {
      codigos.push(seededRand(cpfDigits+'k'+j, 1000, 9999));
      var idx, att = 0;
      do { idx = seededRand(cpfDigits+'ti'+j+att, 0, assoc.length-1); att++; } while (used[idx] && att<20);
      used[idx] = true; tipos.push(assoc[idx]);
    }

    // ─── Constantes de layout ────────────────────────────────
    var W     = 640;
    var SCALE = 2;
    var PX    = 22;     // padding lateral
    var IW    = W - PX * 2;

    // Tamanhos de fonte — GRANDES para público 50+
    var FS_LBL   = 12;  // rótulos de campo (MAIÚSCULAS)
    var FS_VAL   = 19;  // valores nos campos
    var FS_NAME  = 21;  // nome do beneficiário
    var FS_MONEY = 23;  // valores monetários nas caixas
    var FS_TBL   = 14;  // linhas da tabela
    var FS_THDR  = 13;  // cabeçalhos da tabela

    // Altura de cada subsecção (pixel exato)
    var LBL_H    = 20;  // altura da linha de rótulo
    var LBL_GAP  = 6;   // gap rótulo → borda do campo
    var FLD_NAME = 52;  // altura do campo nome
    var FLD_REG  = 46;  // altura dos campos normais (cpf, data, protocolo)
    var FLD_GAP  = 16;  // gap entre campos

    // Bloco de metadados — soma explícita das peças
    var M_PAD_TOP  = 18;
    var M_PAD_BOT  = 20;
    // nome:      LBL_H + LBL_GAP + FLD_NAME + FLD_GAP
    // cpf/data:  LBL_H + LBL_GAP + FLD_REG  + FLD_GAP
    // protocolo: LBL_H + LBL_GAP + FLD_REG  + FLD_GAP
    // caixas de valor: 66px de altura (dois boxes lado a lado)
    var VAL_BOX_H  = 66;
    var MET_H = M_PAD_TOP
              + (LBL_H + LBL_GAP + FLD_NAME + FLD_GAP)
              + (LBL_H + LBL_GAP + FLD_REG  + FLD_GAP)
              + (chavePix ? (LBL_H + LBL_GAP + FLD_REG + FLD_GAP) : 0)
              + (LBL_H + LBL_GAP + FLD_REG  + FLD_GAP)
              + VAL_BOX_H
              + M_PAD_BOT;
    // = 18 + (20+6+52+16) + (20+6+46+16) + (20+6+46+16) + 66 + 20
    // = 18 + 94 + 88 + 88 + 66 + 20 = 374

    // Seções restantes
    var HDR_H   = 90;
    var TTL_H   = 52;
    var SEP_H   = 22;   // separador entre meta e tabela
    var TBH_H   = 42;   // barra de título da tabela
    var TBC_H   = 36;   // cabeçalho de colunas
    var ROW_H   = 36;   // linhas de dados
    var ROWS    = 5;
    var DMHDR_H = 42;   // cabeçalho danos morais
    var GAP_DM  = 18;   // gap antes de danos morais
    var GAP_SEP = 18;   // gap após separador azul
    var SMP_H   = 92;   // bloco autenticação
    var FTR_H   = 46;   // rodapé

    var H = HDR_H + TTL_H + MET_H + SEP_H
          + TBH_H + TBC_H + (ROWS * ROW_H)
          + GAP_DM + DMHDR_H + ROW_H
          + GAP_SEP + SMP_H + FTR_H + 12;

    // ─── Canvas ──────────────────────────────────────────────
    var canvas = document.createElement('canvas');
    canvas.width  = W * SCALE;
    canvas.height = H * SCALE;
    var ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);
    ctx.textBaseline = 'alphabetic';

    var y = 0; // cursor vertical corrente

    // ══════════════════════════════════════════════════════════
    // CABEÇALHO
    // ══════════════════════════════════════════════════════════
    ctx.fillStyle = '#1351b4';
    ctx.fillRect(0, 0, W, 78);
    ctx.fillStyle = '#168821';
    ctx.fillRect(0, 78, W, 12);

    // Logo gov.br — kerning automático via measureText (sem gaps extras)
    var LOGO_FONT = '900 33px Arial Black, "Arial Bold", Arial, sans-serif';
    ctx.font = LOGO_FONT;
    var logoLetters = [
      { c: 'g', col: '#1351b4' },
      { c: 'o', col: '#ffcd07' },
      { c: 'v', col: '#168821' },
      { c: '.', col: '#1351b4' },
      { c: 'b', col: '#1351b4' },
      { c: 'r', col: '#ffcd07' },
    ];
    // Calcula largura total real da palavra para centrar na caixa branca
    var logoW = 0;
    for (var li = 0; li < logoLetters.length; li++) {
      logoW += ctx.measureText(logoLetters[li].c).width;
    }
    var logoBoxW = logoW + 22;          // padding interno 11px cada lado
    var logoBoxH = 56;
    var logoBoxX = PX;
    var logoBoxY = 11;
    fillRR(ctx, logoBoxX, logoBoxY, logoBoxW, logoBoxH, 8, '#ffffff');
    var lx = logoBoxX + 11; // cursor x das letras
    var ly = logoBoxY + 42; // baseline (vertical centrada na caixa)
    for (var li = 0; li < logoLetters.length; li++) {
      ctx.fillStyle = logoLetters[li].col;
      ctx.fillText(logoLetters[li].c, lx, ly);
      lx += ctx.measureText(logoLetters[li].c).width;
    }

    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'right';
    ctx.font = f(12); ctx.fillText('Portal de Serviços do Governo Federal', W-PX, 30);
    ctx.font = f(10.5); ctx.fillText('Ministério da Gestão e da Inovação em Serviços Públicos', W-PX, 50);

    y = HDR_H;

    // ══════════════════════════════════════════════════════════
    // TÍTULO
    // ══════════════════════════════════════════════════════════
    ctx.fillStyle = '#eef3ff'; ctx.fillRect(0, y, W, TTL_H);
    hline(ctx, y, '#1351b4', 2);
    hline(ctx, y + TTL_H, '#1351b4', 1.5);
    ctx.fillStyle = '#1351b4'; ctx.font = f(17, '700'); ctx.textAlign = 'center';
    ctx.fillText('COMPROVANTE DE INDENIZAÇÃO — GOV.BR', W/2, y + 34);
    y += TTL_H;

    // ══════════════════════════════════════════════════════════
    // BLOCO DE METADADOS
    // ══════════════════════════════════════════════════════════
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, y, W, MET_H);

    var cy = y + M_PAD_TOP; // cursor dentro do bloco

    // helper: desenha um campo com rótulo acima e borda
    function drawField(fx, fy, fw, fh, label, value, fs) {
      ctx.fillStyle = '#64748b'; ctx.font = f(FS_LBL, '600'); ctx.textAlign = 'left';
      ctx.fillText(label, fx, fy + LBL_H);
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.2;
      ctx.strokeRect(fx + 0.6, fy + LBL_H + LBL_GAP + 0.6, fw - 1.2, fh - 1.2);
      ctx.fillStyle = '#0f172a'; ctx.font = f(fs || FS_VAL, '700');
      ctx.fillText(trunc(ctx, value, fw - 16), fx + 10, fy + LBL_H + LBL_GAP + fh * 0.67);
    }

    // ── Nome (linha inteira) ─────────────────────────────────
    drawField(PX, cy, IW, FLD_NAME, 'BENEFICIÁRIO', nome.toUpperCase(), FS_NAME);
    cy += LBL_H + LBL_GAP + FLD_NAME + FLD_GAP;

    // ── CPF | Data (lado a lado) ─────────────────────────────
    var hw = (IW - 12) / 2;
    drawField(PX,       cy, hw, FLD_REG, 'CPF DO BENEFICIÁRIO', cpfFormatted);
    drawField(PX+hw+12, cy, hw, FLD_REG, 'DATA DE EMISSÃO',     data);
    cy += LBL_H + LBL_GAP + FLD_REG + FLD_GAP;

    // ── Chave PIX (linha inteira) ────────────────────────────
    if (chavePix) {
      drawField(PX, cy, IW, FLD_REG, 'CHAVE PIX CADASTRADA (' + (tipoPix || 'PIX') + ')', chavePix);
      cy += LBL_H + LBL_GAP + FLD_REG + FLD_GAP;
    }

    // ── Protocolo (linha inteira) ────────────────────────────
    ctx.fillStyle = '#64748b'; ctx.font = f(FS_LBL, '600'); ctx.textAlign = 'left';
    ctx.fillText('NÚMERO DO PROTOCOLO', PX, cy + LBL_H);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.2;
    ctx.strokeRect(PX + 0.6, cy + LBL_H + LBL_GAP + 0.6, IW - 1.2, FLD_REG - 1.2);
    ctx.fillStyle = '#1351b4'; ctx.font = f(17, '700');
    ctx.fillText(proto, PX + 10, cy + LBL_H + LBL_GAP + FLD_REG * 0.68);
    cy += LBL_H + LBL_GAP + FLD_REG + FLD_GAP;

    // ── Caixas de valor ──────────────────────────────────────
    var bw = IW; // Linha inteira
    fillRR(ctx, PX, cy, bw, VAL_BOX_H, 8, '#1351b4');
    ctx.fillStyle = '#ffffff';
    ctx.font = f(12, '700'); ctx.textAlign = 'center';
    ctx.fillText('VALOR TOTAL DA INDENIZAÇÃO A RECEBER', W/2, cy + 24);
    ctx.font = f(32, '900');
    ctx.fillText('R$ 5.960,50', W/2, cy + 56);

    y += MET_H;

    // Separador
    hline(ctx, y + SEP_H/2, '#c7d2fe', 1.5);
    y += SEP_H;

    // ══════════════════════════════════════════════════════════
    // TABELA DE DESCONTOS
    // ══════════════════════════════════════════════════════════
    ctx.fillStyle = '#1351b4'; ctx.fillRect(PX, y, IW, TBH_H);
    ctx.fillStyle = '#ffffff'; ctx.font = f(14, '700'); ctx.textAlign = 'center';
    ctx.fillText('Identificação sobre Descontos Indevidos — Período 2019-2026', W/2, y + 27);
    y += TBH_H;

    ctx.fillStyle = '#dbeafe'; ctx.fillRect(PX, y, IW, TBC_H);
    hline(ctx, y + TBC_H, '#93c5fd', 1);
    ctx.fillStyle = '#1e3a8a'; ctx.font = f(FS_THDR, '700'); ctx.textAlign = 'left';
    ctx.fillText('Cód.', PX + 10, y + 24);
    ctx.fillText('Identificação / Associação', PX + 90, y + 24);
    ctx.textAlign = 'right';
    ctx.fillText('Valor (R$)', PX + IW - 10, y + 24);
    y += TBC_H;

    for (var r = 0; r < ROWS; r++) {
      ctx.fillStyle = r % 2 === 0 ? '#f0f6ff' : '#ffffff';
      ctx.fillRect(PX, y, IW, ROW_H);
      hline(ctx, y + ROW_H, '#e2e8f0', 0.8);
      ctx.fillStyle = '#334155'; ctx.font = f(FS_TBL); ctx.textAlign = 'left';
      ctx.fillText(String(codigos[r]), PX + 10, y + 24);
      ctx.fillText(trunc(ctx, tipos[r], IW * 0.52), PX + 90, y + 24);
      ctx.fillStyle = '#166534'; ctx.font = f(FS_TBL, '700'); ctx.textAlign = 'right';
      ctx.fillText(fmt(linhas[r]), PX + IW - 10, y + 24);
      y += ROW_H;
    }

    y += GAP_DM;

    // ── Danos Morais ─────────────────────────────────────────
    ctx.fillStyle = '#1351b4'; ctx.fillRect(PX, y, IW, DMHDR_H);
    ctx.fillStyle = '#ffffff'; ctx.font = f(FS_THDR, '700');
    ctx.textAlign = 'left';  ctx.fillText('Danos Morais', PX + 10, y + 27);
    ctx.textAlign = 'right'; ctx.fillText('Valor (R$)',   PX + IW - 10, y + 27);
    y += DMHDR_H;

    ctx.fillStyle = '#f0f6ff'; ctx.fillRect(PX, y, IW, ROW_H);
    ctx.fillStyle = '#334155'; ctx.font = f(FS_TBL); ctx.textAlign = 'left';
    ctx.fillText('Direito de multa por danos morais comprovados', PX + 10, y + 24);
    ctx.fillStyle = '#166534'; ctx.font = f(FS_TBL, '700'); ctx.textAlign = 'right';
    ctx.fillText(fmt(danos), PX + IW - 10, y + 24);
    y += ROW_H;

    // Linha separadora azul
    hline(ctx, y + GAP_SEP/2, '#1351b4', 2);
    y += GAP_SEP;

    // ══════════════════════════════════════════════════════════
    // AUTENTICAÇÃO
    // ══════════════════════════════════════════════════════════
    ctx.fillStyle = '#f8faff'; ctx.fillRect(0, y, W, SMP_H);

    ctx.beginPath();
    ctx.arc(PX + 28, y + SMP_H/2, 22, 0, Math.PI*2);
    ctx.fillStyle = '#16a34a'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = f(22,'700'); ctx.textAlign = 'center';
    ctx.fillText('✓', PX + 28, y + SMP_H/2 + 8);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1351b4'; ctx.font = f(14, '700');
    ctx.fillText('Documento Autêntico — GOV.BR', PX + 66, y + 22);
    ctx.fillStyle = '#374151'; ctx.font = f(12);
    ctx.fillText('Este comprovante foi gerado e validado pelo sistema oficial do Governo Federal.', PX + 66, y + 42);
    ctx.fillText('Protocolo: ' + proto, PX + 66, y + 62);
    ctx.fillText('Emitido em: ' + data + '   —   Válido mediante verificação em gov.br', PX + 66, y + 80);
    y += SMP_H;

    // ══════════════════════════════════════════════════════════
    // RODAPÉ
    // ══════════════════════════════════════════════════════════
    ctx.fillStyle = '#1351b4'; ctx.fillRect(0, y, W, FTR_H);
    ctx.fillStyle = '#168821'; ctx.fillRect(0, y, W, 5);
    ctx.fillStyle = '#ffffff'; ctx.font = f(11); ctx.textAlign = 'center';
    ctx.fillText('Ministério da Gestão e da Inovação em Serviços Públicos  •  SEGES/MGI', W/2, y + 20);
    ctx.fillText('gov.br  —  Portal de Serviços do Governo Federal do Brasil', W/2, y + 36);

    return canvas.toDataURL('image/png');

  } catch (err) {
    console.error('[ComprovGen] Erro:', err);
    try {
      var fb = document.createElement('canvas');
      fb.width = 500; fb.height = 200;
      var fc = fb.getContext('2d');
      fc.fillStyle = '#f3f4f6'; fc.fillRect(0,0,500,200);
      fc.fillStyle = '#374151'; fc.font = '16px Arial'; fc.textAlign = 'center';
      fc.fillText('Comprovante em processamento...', 250, 105);
      return fb.toDataURL('image/png');
    } catch(e2) { return ''; }
  }
}

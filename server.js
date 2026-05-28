const express    = require('express');
const session    = require('express-session');
const bodyParser = require('body-parser');
const path       = require('path');
const db         = require('./db');
const email      = require('./email');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'drloggen-secret-2026-x7k',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'Nicht autorisiert' });
}

/* ══ PUBLIC API ══ */

app.get('/api/treatments', (req, res) => {
  res.json(db.getSettings().treatmentTypes);
});

app.get('/api/schedule', (req, res) => {
  const s = db.getSettings();
  res.json({ schedule: s.schedule, specialDays: s.specialDays, slotDuration: s.slotDuration });
});

app.get('/api/availability/:year/:month', (req, res) => {
  const { year, month } = req.params;
  const s = db.getSettings();
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const result = {};
  const n = new Date(parseInt(year), parseInt(month), 0).getDate();
  for (let d = 1; d <= n; d++) {
    const ds = `${year}-${month.padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dn = DAYS[new Date(ds+'T12:00:00').getDay()];
    if      (s.specialDays[ds] === false) result[ds] = 'closed';
    else if (s.specialDays[ds])           result[ds] = 'special';
    else if (!s.schedule[dn])             result[ds] = 'closed';
    else                                  result[ds] = 'open';
  }
  res.json(result);
});

// Slots — bestätigte UND ausstehende Termine blockieren den Slot
app.get('/api/slots/:date', (req, res) => {
  const { date } = req.params;
  const s = db.getSettings();
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dn = DAYS[new Date(date+'T12:00:00').getDay()];

  if (s.specialDays[date] === false) return res.json({ date, slots: [] });
  const hours = s.specialDays[date] || s.schedule[dn];
  if (!hours) return res.json({ date, slots: [] });

  const [sh, sm] = hours[0].split(':').map(Number);
  const [eh, em] = hours[1].split(':').map(Number);

  // Nur nicht-abgesagte Termine zählen
  const existing = db.getAppointments({ date }).filter(a => a.status !== 'cancelled');

  const slots = [];
  for (let m = sh*60+sm; m+s.slotDuration <= eh*60+em; m += s.slotDuration) {
    const time = `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    const slotA  = existing.filter(a => a.time === time);
    const conf   = slotA.filter(a => a.status === 'confirmed').length;
    const pend   = slotA.filter(a => a.status === 'pending').length;
    // Slot gesperrt wenn bestätigte Termine >= maxSlots ODER gesamt >= maxSlots
    const available = (conf + pend) < s.maxSlots;
    slots.push({ time, available, booked: conf+pend, confirmed: conf, pending: pend, max: s.maxSlots });
  }
  res.json({ date, slots });
});

app.post('/api/appointments', async (req, res) => {
  const { date, time, treatmentId, firstName, lastName, phone, email: patEmail, notes, isNewPatient } = req.body;

  if (!date || !time || !treatmentId || !firstName || !lastName || !phone)
    return res.status(400).json({ error: 'Bitte alle Pflichtfelder ausfüllen.' });

  // Slot nochmals live prüfen (Race-Condition verhindern)
  const s = db.getSettings();
  const existing = db.getAppointments({ date }).filter(a => a.status !== 'cancelled' && a.time === time);
  if (existing.length >= s.maxSlots)
    return res.status(409).json({ error: 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie eine andere Zeit.' });

  const treatment = s.treatmentTypes.find(t => t.id === parseInt(treatmentId));
  if (!treatment) return res.status(400).json({ error: 'Ungültige Behandlungsart.' });

  const appt = db.createAppointment({
    date, time,
    treatmentId: parseInt(treatmentId), treatmentName: treatment.name,
    firstName: firstName.trim(), lastName: lastName.trim(),
    phone: phone.trim(), email: (patEmail||'').trim(),
    notes: (notes||'').trim(), isNewPatient: !!isNewPatient
  });

  // E-Mails asynchron (blockiert Response nicht)
  email.notifyNewBooking(appt).catch(e => console.error('E-Mail:', e.message));

  res.json({ success: true, id: appt.id });
});

/* ══ ADMIN API ══ */

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (db.verifyAdmin(username, password)) {
    req.session.admin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Falscher Benutzername oder Passwort.' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/admin/me', (req, res) => {
  res.json({ admin: !!(req.session && req.session.admin) });
});

app.get('/api/admin/appointments', requireAdmin, (req, res) => {
  res.json(db.getAppointments(req.query));
});

app.patch('/api/admin/appointments/:id', requireAdmin, async (req, res) => {
  const id   = parseInt(req.params.id);
  const prev = db.getAppointment(id);
  if (!prev) return res.status(404).json({ error: 'Termin nicht gefunden.' });

  const updated = db.updateAppointment(id, req.body);

  // E-Mail bei Status-Wechsel
  if (req.body.status && req.body.status !== prev.status) {
    if (req.body.status === 'confirmed')
      email.notifyConfirmed(updated).catch(e => console.error('E-Mail:', e.message));
    else if (req.body.status === 'cancelled')
      email.notifyCancelled(updated).catch(e => console.error('E-Mail:', e.message));
  }

  res.json(updated);
});

app.delete('/api/admin/appointments/:id', requireAdmin, (req, res) => {
  db.deleteAppointment(parseInt(req.params.id));
  res.json({ success: true });
});

app.get('/api/admin/settings', requireAdmin, (req, res) => {
  res.json(db.getSettings());
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  res.json(db.updateSettings(req.body));
});

app.put('/api/admin/settings/special-day', requireAdmin, (req, res) => {
  const { date, status } = req.body;
  const s = db.getSettings();
  s.specialDays[date] = status;
  db.updateSettings({ specialDays: s.specialDays });
  res.json({ success: true });
});

app.delete('/api/admin/settings/special-day/:date', requireAdmin, (req, res) => {
  const s = db.getSettings();
  delete s.specialDays[req.params.date];
  db.updateSettings({ specialDays: s.specialDays });
  res.json({ success: true });
});

app.put('/api/admin/settings/treatment', requireAdmin, (req, res) => {
  const { id, name, duration, color } = req.body;
  const s = db.getSettings();
  const idx = s.treatmentTypes.findIndex(t => t.id === id);
  if (idx === -1) {
    const newId = Math.max(0, ...s.treatmentTypes.map(t => t.id)) + 1;
    s.treatmentTypes.push({ id: newId, name, duration, color });
  } else {
    s.treatmentTypes[idx] = { id, name, duration, color };
  }
  db.updateSettings({ treatmentTypes: s.treatmentTypes });
  res.json(s.treatmentTypes);
});

/* ── E-MAIL EINSTELLUNGEN ── */

app.get('/api/admin/email-config', requireAdmin, (req, res) => {
  const cfg = email.loadConfig();
  res.json({ ...cfg, pass: cfg.pass ? '••••••••' : '' });
});

app.put('/api/admin/email-config', requireAdmin, (req, res) => {
  const current = email.loadConfig();
  const updated = { ...current, ...req.body };
  if (!req.body.pass || req.body.pass === '••••••••') updated.pass = current.pass;
  email.saveConfig(updated);
  res.json({ success: true });
});

app.post('/api/admin/email-test', requireAdmin, async (req, res) => {
  const result = await email.testConnection();
  if (result.success) {
    const cfg = email.loadConfig();
    await email.sendMail({
      to: cfg.adminEmail,
      subject: '✅ E-Mail-Test — Dr. Loggen',
      html: `<div style="font-family:sans-serif;padding:24px"><h2 style="color:#2e7d8a">Verbindung funktioniert ✅</h2><p>Test aus dem Admin-Panel: ${new Date().toLocaleString('de-DE')}</p></div>`
    });
    res.json({ success: true, message: 'Test-E-Mail gesendet!' });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

/* ── SPA-FALLBACK ── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🦷  Dr. Loggen Praxis-System`);
  console.log(`✅  Server:   http://localhost:${PORT}`);
  console.log(`🔐  Admin:    admin / admin123`);
  const cfg = email.loadConfig();
  console.log(`📧  E-Mail:   ${cfg.enabled && cfg.user ? `Aktiv (${cfg.user})` : 'Nicht konfiguriert — Admin → E-Mail einrichten'}`);
  console.log('');
});

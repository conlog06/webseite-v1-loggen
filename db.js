const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

const DEFAULT_DB = {
  admin: {
    username: 'admin',
    // bcrypt hash of 'admin123'
    password: '$2a$10$IrFpv6bghwf4AqpxT53pjeI15oc5/sU1Ebf6LdfHEvU8LdFE1tPWC'
  },
  settings: {
    praxisName: 'Zahnarztpraxis Dr. Frank Loggen',
    address: 'Zur Rudolfshöhe 2, 49143 Bissendorf',
    phone: '05402 / 642100',
    email: 'info@dr-loggen.de',
    slotDuration: 30, // minutes
    maxSlots: 4, // max parallel appointments per slot
    schedule: {
      // true = open, false = closed
      // [openTime, closeTime] or false
      monday:    ['08:00', '15:00'],
      tuesday:   ['12:00', '20:00'],
      wednesday: ['08:00', '15:00'],
      thursday:  ['12:00', '20:00'],
      friday:    ['08:00', '15:00'],
      saturday:  false,
      sunday:    false
    },
    // Special days: { 'YYYY-MM-DD': false } = closed, { 'YYYY-MM-DD': ['HH:MM','HH:MM'] } = special hours
    specialDays: {
      // German public holidays 2025/2026 (NRW/Niedersachsen)
      '2025-12-24': false,
      '2025-12-25': false,
      '2025-12-26': false,
      '2026-01-01': false,
      '2026-04-03': false, // Karfreitag
      '2026-04-06': false, // Ostermontag
      '2026-05-01': false, // Tag der Arbeit
      '2026-05-14': false, // Christi Himmelfahrt
      '2026-05-25': false, // Pfingstmontag
      '2026-10-03': false, // Tag der deutschen Einheit
      '2026-12-24': false,
      '2026-12-25': false,
      '2026-12-26': false
    },
    treatmentTypes: [
      { id: 1, name: 'Beratungsgespräch',        duration: 30, color: '#4aafc0' },
      { id: 2, name: 'Prophylaxe / Reinigung',    duration: 60, color: '#2e7d8a' },
      { id: 3, name: 'Füllung / Zahnerhaltung',   duration: 60, color: '#5b9e6b' },
      { id: 4, name: 'Implantat-Beratung',        duration: 45, color: '#c07850' },
      { id: 5, name: 'Zahnersatz / Prothetik',    duration: 60, color: '#8a5fc0' },
      { id: 6, name: 'Lachgassedierung',          duration: 90, color: '#c05080' },
      { id: 7, name: 'Notfallbehandlung',         duration: 30, color: '#c04040' },
      { id: 8, name: 'Kontrolluntersuchung',      duration: 30, color: '#7a9e4a' }
    ]
  },
  appointments: [],
  nextId: 1
};

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch(e) {}
  save(DEFAULT_DB);
  return DEFAULT_DB;
}

function save(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getDb() { return load(); }

function getSettings() { return load().settings; }

function updateSettings(partial) {
  const db = load();
  db.settings = { ...db.settings, ...partial };
  save(db);
  return db.settings;
}

function getAppointments(filters = {}) {
  const db = load();
  let list = db.appointments;
  if (filters.date)   list = list.filter(a => a.date === filters.date);
  if (filters.status) list = list.filter(a => a.status === filters.status);
  if (filters.from)   list = list.filter(a => a.date >= filters.from);
  if (filters.to)     list = list.filter(a => a.date <= filters.to);
  return list.sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
}

function getAppointment(id) {
  return load().appointments.find(a => a.id === id);
}

function createAppointment(data) {
  const db = load();
  const appt = {
    id: db.nextId++,
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.appointments.push(appt);
  save(db);
  return appt;
}

function updateAppointment(id, data) {
  const db = load();
  const idx = db.appointments.findIndex(a => a.id === id);
  if (idx === -1) return null;
  db.appointments[idx] = { ...db.appointments[idx], ...data, updatedAt: new Date().toISOString() };
  save(db);
  return db.appointments[idx];
}

function deleteAppointment(id) {
  const db = load();
  db.appointments = db.appointments.filter(a => a.id !== id);
  save(db);
}

function getAvailableSlots(date) {
  const db = load();
  const s = db.settings;
  
  // Check special days
  if (s.specialDays[date] === false) return [];
  
  // Check weekday
  const d = new Date(date + 'T12:00:00');
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dayName = days[d.getDay()];
  
  const hours = s.specialDays[date] || s.schedule[dayName];
  if (!hours) return [];
  
  // Generate slots
  const slots = [];
  const [startH, startM] = hours[0].split(':').map(Number);
  const [endH, endM]     = hours[1].split(':').map(Number);
  const startMins = startH * 60 + startM;
  const endMins   = endH   * 60 + endM;
  
  const existing = db.appointments.filter(a => a.date === date && a.status !== 'cancelled');
  
  for (let m = startMins; m + s.slotDuration <= endMins; m += s.slotDuration) {
    const h = String(Math.floor(m / 60)).padStart(2, '0');
    const min = String(m % 60).padStart(2, '0');
    const time = `${h}:${min}`;
    const booked = existing.filter(a => a.time === time).length;
    slots.push({ time, available: booked < s.maxSlots, booked, max: s.maxSlots });
  }
  return slots;
}

function verifyAdmin(username, password) {
  const bcrypt = require('bcryptjs');
  const db = load();
  if (username !== db.admin.username) return false;
  return bcrypt.compareSync(password, db.admin.password);
}

module.exports = {
  getSettings, updateSettings,
  getAppointments, getAppointment,
  createAppointment, updateAppointment, deleteAppointment,
  getAvailableSlots, verifyAdmin, getDb
};

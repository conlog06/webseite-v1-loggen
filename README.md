# 🦷 Zahnarztpraxis Dr. Loggen — Praxis-System

## ✅ Installation & Start

### Windows (Doppelklick):
➡️ **START.bat** doppelklicken

### Manuell (Windows PowerShell / Terminal):
```
cd drloggen
npm install
npm start
```

### Mac / Linux:
```
./START.sh
```

Dann Browser öffnen: **http://localhost:3000**

---

## 🔐 Admin-Bereich
- URL: http://localhost:3000 → Footer → "Admin"
- Benutzername: `admin`
- Passwort: `admin123`

---

## 📧 E-Mail einrichten (optional)
1. Admin-Panel öffnen
2. Links → **📧 E-Mail Einstellungen**
3. Anbieter wählen (Gmail, Outlook, etc.)
4. Zugangsdaten eingeben
5. "Verbindung testen" klicken

**Gmail-Nutzer:** Bitte ein [App-Passwort](https://support.google.com/accounts/answer/185833) verwenden!

---

## 📁 Projektstruktur
```
drloggen/
├── START.bat          ← Windows Starter (Doppelklick!)
├── START.sh           ← Mac/Linux Starter
├── server.js          ← Express Server & REST-API
├── db.js              ← Datenbank (JSON, kein SQLite)
├── email.js           ← E-Mail Modul (nodemailer)
├── data/
│   ├── db.json        ← Termine & Einstellungen
│   └── email-config.json ← E-Mail Konfiguration
└── public/
    ├── index.html     ← Komplette Website
    ├── css/main.css   ← Design-System
    └── js/app.js      ← Frontend-Logik
```

## ⚠️ Häufige Fehler

**"npm install" schlägt fehl:**
Stelle sicher, dass du im `drloggen` Ordner bist (dort wo `package.json` liegt).

**Port 3000 belegt:**
`set PORT=3001 && npm start` (Windows)
`PORT=3001 npm start` (Mac/Linux)

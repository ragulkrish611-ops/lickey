# LicenseOS — License Management System

A complete license control system for managing multiple client websites
from a single admin dashboard.

---

## 📁 Project Structure

```
license-system/
├── admin/
│   ├── dashboard.html     ← Main overview + stats
│   ├── sites.html         ← Manage all sites (renew, revoke, view)
│   ├── add-site.html      ← Register new domains + generate keys
│   └── snippet.html       ← Get embed code for client sites
├── assets/
│   ├── style.css          ← Shared stylesheet
│   ├── db.js              ← Data layer (localStorage / Firebase)
│   └── app.js             ← Shared UI logic
├── license.js             ← Embed this in client sites
└── README.md
```

---

## 🚀 Quick Start (Demo Mode)

1. Open `admin/dashboard.html` in any browser.
2. All data is stored in localStorage — no server needed for demo.
3. Navigate via the sidebar to manage sites, renew/revoke, get embed code.

---

## 🔥 Production Setup (Firebase)

### Step 1 — Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable **Realtime Database**
4. Choose a region

### Step 2 — Set Database Rules
In Firebase Console → Realtime Database → Rules:
```json
{
  "rules": {
    "licenses": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

### Step 3 — Connect Admin Panel
In `assets/db.js`, replace the localStorage logic with Firebase SDK:
```js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "...",
  databaseURL: "https://YOUR-PROJECT-ID.firebaseio.com",
  // ...
};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
```

### Step 4 — Embed in Client Sites
Paste this into each client site's `<head>`:
```html
<script src="https://yourdomain.com/license.js"></script>
```
Or inline the contents of `license.js` directly.

Update `FIREBASE_URL` inside `license.js`:
```js
var FIREBASE_URL = 'https://YOUR-PROJECT-ID.firebaseio.com/licenses.json';
```

---

## ⚙️ How It Works

1. Each client site loads `license.js` on every page visit.
2. The script fetches license data from Firebase by matching the domain.
3. If expired or revoked → full-page block is shown.
4. If expiring within 7 days → warning banner appears.
5. The script re-checks every 60 seconds for real-time enforcement.

---

## 🔐 Security Notes

- Firebase rules ensure clients can only **read**, not modify licenses.
- Optionally obfuscate `license.js` to make bypassing harder.
- For maximum security, validate licenses server-side too.

---

## 📞 Support
Update `SUPPORT_EMAIL` in `license.js` to your contact email.

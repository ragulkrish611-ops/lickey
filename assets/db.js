/**
 * LicenseOS — db.js
 * Dual Mode: localStorage (Demo) + Firebase (Production)
 */

// 🔁 CHANGE THIS FLAG
const USE_FIREBASE = false; // false = Demo | true = Firebase

// 🔥 Firebase Setup
let db = null;

if (USE_FIREBASE) {
  const firebaseConfig = {
    apiKey: "AIzaSyAMnnp5WiV3HAlPSUX73GqG6zxwQRXSpuA",
  authDomain: "lickey-33267.firebaseapp.com",
  databaseURL: "https://lickey-33267-default-rtdb.firebaseio.com",
  projectId: "lickey-33267",
  storageBucket: "lickey-33267.firebasestorage.app",
  messagingSenderId: "283310739978",
  appId: "1:283310739978:web:bc2887db5e9ce5d9ec05f3",
  measurementId: "G-1ZZ1RRZKB2"
  };

  // Using Firebase CDN (make sure added in HTML)
  const app = firebase.initializeApp(firebaseConfig);
  db = firebase.database();
}

// ======================
// DEMO DATABASE (LOCAL)
// ======================

const DEFAULT_DB = {
  site_1: {
    domain: "hotelapp.com",
    clientName: "Grand Hotel Group",
    licenseKey: "HTL-2024-XKQP9R",
    expiryDate: "2026-08-15",
    status: "active",
    plan: "Pro",
    graceDays: 3,
    createdAt: "2025-01-10"
  },
  site_2: {
    domain: "restaurantpro.io",
    clientName: "TastyBites Ltd",
    licenseKey: "RST-2024-MNJWBZ",
    expiryDate: "2026-04-10",
    status: "expired",
    plan: "Basic",
    graceDays: 2,
    createdAt: "2025-02-14"
  }
};

const DB_KEY = 'licenseos_db';

let DB = (function () {
  if (USE_FIREBASE) return {};
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
  return JSON.parse(JSON.stringify(DEFAULT_DB));
})();

// ======================
// COMMON FUNCTIONS
// ======================

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function computeStatus(site) {
  if (site.status === 'expired') return 'expired';
  const days = daysUntil(site.expiryDate);
  if (days < 0) return 'expired';
  if (days <= 7) return 'warning';
  return 'active';
}

function generateKey(domain) {
  const prefix = (domain.split('.')[0] || 'LIC').slice(0, 3).toUpperCase();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `${prefix}-${new Date().getFullYear()}-${rand}`;
}

// ======================
// DATABASE OPERATIONS
// ======================

// 🔍 GET ALL SITES
function getSites(callback) {
  if (USE_FIREBASE) {
    db.ref('licenses').on('value', (snapshot) => {
      const data = snapshot.val() || {};
      const sites = Object.entries(data).map(([id, site]) => ({
        id,
        ...site,
        daysLeft: daysUntil(site.expiryDate),
        effectiveStatus: computeStatus(site)
      }));
      callback(sites);
    });
  } else {
    const sites = Object.entries(DB).map(([id, site]) => ({
      id,
      ...site,
      daysLeft: daysUntil(site.expiryDate),
      effectiveStatus: computeStatus(site)
    }));
    callback(sites);
  }
}

// ➕ ADD / UPDATE SITE
function saveSite(id, siteData) {
  if (USE_FIREBASE) {
    db.ref('licenses/' + id).set(siteData);
  } else {
    DB[id] = siteData;
    localStorage.setItem(DB_KEY, JSON.stringify(DB));
  }
}

// ❌ DELETE SITE
function deleteSite(id) {
  if (USE_FIREBASE) {
    db.ref('licenses/' + id).remove();
  } else {
    delete DB[id];
    localStorage.setItem(DB_KEY, JSON.stringify(DB));
  }
}

// 🔄 RESET DEMO DB
function resetDB() {
  if (!USE_FIREBASE) {
    DB = JSON.parse(JSON.stringify(DEFAULT_DB));
    localStorage.setItem(DB_KEY, JSON.stringify(DB));
  }
}
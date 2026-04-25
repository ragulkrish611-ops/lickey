/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LicenseOS — license.js                                      ║
 * ║  Embed this in every client site's <head>.                   ║
 * ║  Replace FIREBASE_URL with your actual Firebase project URL. ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

(function () {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────────────
  var FIREBASE_URL   = 'https://lickey-33267-default-rtdb.firebaseio.com/licenses.json';
  var CHECK_INTERVAL = 60 * 1000; // re-check every 60 seconds
  var SUPPORT_EMAIL  = 'support@yourdomain.com';
  // ────────────────────────────────────────────────────────────────

  function getDomain() {
    return window.location.hostname.replace(/^www\./, '');
  }

  function blockSite(reason, expiredDate) {
    document.documentElement.style.overflow = 'hidden';
    document.body.innerHTML =
      '<div style="position:fixed;inset:0;background:#07070d;display:flex;' +
      'align-items:center;justify-content:center;font-family:\'Segoe UI\',sans-serif;z-index:2147483647;">' +
        '<div style="text-align:center;padding:52px 44px;border:1px solid rgba(255,68,68,0.3);' +
        'border-radius:18px;max-width:480px;background:#0e0e1a;box-shadow:0 28px 80px rgba(0,0,0,0.7);">' +
          '<div style="font-size:56px;margin-bottom:22px;filter:drop-shadow(0 0 20px #ff4444)">🔒</div>' +
          '<h2 style="color:#ff4444;margin:0 0 14px;font-size:24px;font-weight:800;letter-spacing:-0.02em">License Expired</h2>' +
          '<p style="color:#888;margin:0 0 10px;font-size:15px;line-height:1.6">' + reason + '</p>' +
          (expiredDate ? '<p style="color:#555;margin:0 0 28px;font-size:13px;font-family:monospace">Expired: ' + expiredDate + '</p>' : '<div style="margin-bottom:28px"></div>') +
          '<a href="mailto:' + SUPPORT_EMAIL + '" style="display:inline-block;background:#ff4444;color:#fff;' +
          'padding:14px 34px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;' +
          'letter-spacing:0.01em">Contact Support to Renew</a>' +
        '</div>' +
      '</div>';
  }

  function warnSite(daysLeft) {
    if (document.getElementById('__licenseos_warn__')) return;
    var bar = document.createElement('div');
    bar.id = '__licenseos_warn__';
    bar.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:2147483646;' +
      'background:#ffaa00;color:#000;text-align:center;padding:10px 16px;' +
      'font-family:sans-serif;font-size:14px;font-weight:700;' +
      'box-shadow:0 2px 12px rgba(255,170,0,0.4);';
    bar.innerHTML =
      '⚠️ Your license expires in <strong>' + daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + '</strong>. ' +
      '<a href="mailto:' + SUPPORT_EMAIL + '" style="color:#000;text-decoration:underline">Renew now →</a>' +
      '<span onclick="this.parentNode.remove()" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px;font-weight:400">×</span>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function checkLicense() {
    var domain = getDomain();

    fetch(FIREBASE_URL, { cache: 'no-store' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || typeof data !== 'object') {
          console.warn('[LicenseOS] Empty response from license server.');
          return; // fail open
        }

        var entry = null;
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
          if (data[keys[i]].domain === domain) {
            entry = data[keys[i]];
            break;
          }
        }

        if (!entry) {
          blockSite('This domain (' + domain + ') is not registered. Contact support.');
          return;
        }

        if (entry.status === 'expired') {
          blockSite('Your license has been manually revoked.', entry.expiryDate);
          return;
        }

        var now      = new Date();
        var expiry   = new Date(entry.expiryDate);
        var grace    = (parseInt(entry.graceDays) || 0) * 86400000;
        var daysLeft = Math.ceil((expiry - now) / 86400000);

        if (now > new Date(expiry.getTime() + grace)) {
          blockSite('Your software license has expired.', entry.expiryDate);
          return;
        }

        // Warn if within grace or ≤ 7 days
        if (daysLeft <= 7 && daysLeft >= 0) {
          warnSite(daysLeft);
        }
      })
      .catch(function (err) {
        console.warn('[LicenseOS] Could not reach license server:', err.message);
        // fail open — site runs if Firebase unreachable
      });
  }

  checkLicense();
  setInterval(checkLicense, CHECK_INTERVAL);

})();

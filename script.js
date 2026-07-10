/* =====================================================
   Kad Jemputan Kahwin — Munirah & Alif
   ===================================================== */
(function () {
  'use strict';

  // ---- Konfigurasi ----
  var EVENT_DATE = new Date(2026, 7, 31, 12, 0, 0); // 31 Ogos 2026, 12:00 tengah hari
  var WA_PHONE = '601119949565';   // no. WhatsApp (sandaran jika SHEET_URL kosong)
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycbxt_8qrILO70gjMiiTgqNx3nlyxOei-YzBZONRUaFxe2etaNvuXEptE55diTopQ1iMvCQ/exec';   // Google Apps Script Web App (lihat RSVP-GoogleSheet.md)
  var STORE_KEY = 'wishes_munirah_alif';
  var MUSIC_START = 4; // lagu bermula pada saat ke-4 (skip intro). Tukar ke 0 jika mahu dari mula.

  var $ = function (id) { return document.getElementById(id); };

  /* ============================================================
     1) MUZIK  (cuba fail mp3 dahulu, jika gagal guna nada dijana)
     ============================================================ */
  var Music = (function () {
    var audio = $('bg-music');
    var mode = null;          // 'file' | 'synth'
    var playing = false;
    var fileBroken = false;   // true jika fail lagu tak boleh dimainkan
    var introSeeked = false;  // sudah lompat ke saat mula?
    var ctx, master, timer, step = 0;

    // Progresi kord lembut (Hz) — nada 'lullaby' bertaut kasih
    var seq = [
      [261.63, 329.63, 392.00], // C
      [293.66, 349.23, 440.00], // Dm
      [329.63, 392.00, 493.88], // Em
      [349.23, 440.00, 523.25], // F
      [392.00, 493.88, 587.33], // G
      [349.23, 440.00, 523.25], // F
      [293.66, 349.23, 440.00], // Dm
      [261.63, 329.63, 392.00]  // C
    ];

    function initSynth() {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.0;
      master.connect(ctx.destination);
    }

    function note(freq, t, dur) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g); g.connect(master);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur + 0.05);
    }

    function tick() {
      var chord = seq[step % seq.length];
      var t = ctx.currentTime;
      chord.forEach(function (f, i) { note(f, t + i * 0.12, 1.8); });
      note(chord[0] / 2, t, 2.0); // bass lembut
      step++;
    }

    function startSynth() {
      if (!ctx) initSynth();
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.2);
      tick();
      timer = setInterval(tick, 1400);
    }

    function stopSynth() {
      if (timer) { clearInterval(timer); timer = null; }
      if (master) master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    }

    // Pindah ke saat mula (MUSIC_START) buat kali pertama sahaja
    function seekIntro() {
      if (introSeeked || MUSIC_START <= 0) return;
      introSeeked = true;
      var doSeek = function () { try { audio.currentTime = MUSIC_START; } catch (e) {} };
      if (audio.readyState >= 1) doSeek();
      else audio.addEventListener('loadedmetadata', doSeek, { once: true });
    }

    function play() {
      // Fail memang rosak/tiada → guna nada jana-sendiri
      if (fileBroken || mode === 'synth') { mode = 'synth'; startSynth(); markPlaying(true); return; }

      // Cuba mainkan fail lagu sebenar
      seekIntro();
      var p = audio.play();
      if (p && p.then) {
        p.then(function () { mode = 'file'; markPlaying(true); })
         .catch(function (err) {
           // Autoplay disekat pelayar — JANGAN tukar synth; tunggu sentuhan pengguna
           if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
             markPlaying(false);
           } else {
             // Fail benar-benar tak boleh dimainkan → baru guna synth
             fileBroken = true; mode = 'synth'; startSynth(); markPlaying(true);
           }
         });
      } else { mode = 'file'; markPlaying(true); }
    }

    function pause() {
      if (mode === 'synth') stopSynth();
      else audio.pause();
      markPlaying(false);
    }

    function markPlaying(v) {
      playing = v;
      $('music-toggle').classList.toggle('playing', v);
    }

    // Fail mp3 benar-benar rosak/tiada (semua <source> gagal) → tandakan supaya guna synth
    audio.addEventListener('error', function () {
      fileBroken = true;
      if (playing && mode !== 'synth') { mode = 'synth'; startSynth(); }
    });

    // Ulang lagu dari saat mula (bukan dari 0) supaya intro sentiasa dilangkau
    audio.addEventListener('ended', function () {
      try { audio.currentTime = MUSIC_START > 0 ? MUSIC_START : 0; } catch (e) {}
      audio.play();
    });

    return {
      toggle: function () { playing ? pause() : play(); },
      play: play,
      isPlaying: function () { return playing; }
    };
  })();

  $('music-toggle').addEventListener('click', function (e) {
    e.stopPropagation();
    Music.toggle();
  });

  /* ============================================================
     2) BUKA JEMPUTAN
     ============================================================ */
  var opened = false;
  function openInvitation() {
    if (opened) return;
    opened = true;
    var cover = $('cover');
    var content = $('content');
    document.body.classList.remove('locked');
    content.setAttribute('aria-hidden', 'false');  // papar kandungan dahulu supaya crest boleh diukur
    morphMonogram();                                // monogram terbang cover -> crest
    cover.classList.add('hide');                    // sapuan pemadam
    Music.play();
    setTimeout(function () {
      cover.style.display = 'none';
      revealObserve();
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 900);
  }

  // Tunjuk crest di kandungan (tempat mendarat morph)
  function showCrest() {
    var c = $('crest');
    if (c) c.classList.add('landed');
  }

  // Morph FLIP: monogram cover "terbang & mengecut" jadi crest kandungan
  function morphMonogram() {
    var flyer = $('morph-flyer');
    var src = document.querySelector('.cover .monogram2 .ar');
    var crestAr = document.querySelector('#crest .ar');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!flyer || !src || !crestAr || reduce) { showCrest(); return; }

    var from = src.getBoundingClientRect();
    var to = crestAr.getBoundingClientRect();
    if (!from.width || !to.width) { showCrest(); return; }

    var fly = flyer.querySelector('.ar');
    fly.style.fontSize = window.getComputedStyle(src).fontSize;   // saiz asal = saiz monogram cover
    flyer.style.display = 'block';
    flyer.style.transition = 'none';
    flyer.style.transform = 'translate(' + from.left + 'px,' + from.top + 'px) scale(1)';
    src.style.visibility = 'hidden';                              // sembunyi monogram asal (elak berganda)

    var scale = to.width / from.width;
    flyer.getBoundingClientRect();                               // paksa reflow

    requestAnimationFrame(function () {
      flyer.style.transition = 'transform .9s cubic-bezier(.55,.06,.2,1)';
      flyer.style.transform = 'translate(' + to.left + 'px,' + to.top + 'px) scale(' + scale + ')';
    });

    var done = function () {
      flyer.style.display = 'none';
      showCrest();
      flyer.removeEventListener('transitionend', done);
    };
    flyer.addEventListener('transitionend', done);
    setTimeout(done, 1100);                                       // sandaran jika transitionend tak cetus
  }
  // Seluruh cover boleh diklik (termasuk butang play & gambar)
  $('cover').addEventListener('click', openInvitation);

  // Kesan gambar cover: guna jika berjaya dimuat, jika tidak papar binaan CSS
  var coverPhoto = $('cover-photo');
  if (coverPhoto) {
    coverPhoto.addEventListener('load', function () {
      if (coverPhoto.naturalWidth > 0) $('cover').classList.add('has-photo');
    });
    coverPhoto.addEventListener('error', function () {
      $('cover').classList.remove('has-photo');
    });
    // jika sudah dalam cache & siap dimuat
    if (coverPhoto.complete && coverPhoto.naturalWidth > 0) {
      $('cover').classList.add('has-photo');
    }
  }

  /* ---- Cuba autoplay muzik sebaik laman dibuka ----
     Pelayar biasanya sekat autoplay berbunyi. Jadi:
       1) cuba main terus, dan
       2) jika disekat, main pada interaksi PERTAMA (sentuh/klik/scroll/kekunci). */
  function tryAutoplay() {
    if (Music.isPlaying()) return;
    Music.play();
  }
  window.addEventListener('load', tryAutoplay);

  var kickStarted = false;
  function firstKick() {
    if (kickStarted) return;
    kickStarted = true;
    if (!Music.isPlaying()) Music.play();
    ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(function (ev) {
      window.removeEventListener(ev, firstKick);
    });
  }
  ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(function (ev) {
    window.addEventListener(ev, firstKick, { passive: true });
  });

  /* ============================================================
     3) REVEAL SEMASA SCROLL
     ============================================================ */
  function revealObserve() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     4) COUNTDOWN
     ============================================================ */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  // Tetapkan nilai + cetus animasi flip hanya bila berubah
  function setDigit(id, val) {
    var el = $(id);
    val = String(val);
    if (el.textContent === val) return;
    el.textContent = val;
    el.classList.remove('flip');
    void el.offsetWidth;            // paksa reflow supaya animasi ulang semula
    el.classList.add('flip');
  }
  function tickCountdown() {
    var diff = EVENT_DATE - new Date();
    if (diff <= 0) {
      setDigit('cd-d', 0); setDigit('cd-h', 0); setDigit('cd-m', 0); setDigit('cd-s', 0);
      return;
    }
    var s = Math.floor(diff / 1000);
    setDigit('cd-d', Math.floor(s / 86400));
    setDigit('cd-h', pad(Math.floor(s % 86400 / 3600)));
    setDigit('cd-m', pad(Math.floor(s % 3600 / 60)));
    setDigit('cd-s', pad(s % 60));
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ============================================================
     5) SIMPAN KE KALENDAR (.ics)
     ============================================================ */
  $('cal-btn').addEventListener('click', function () {
    function fmt(d) {
      return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
        'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z';
    }
    var end = new Date(EVENT_DATE.getTime() + 5 * 3600 * 1000);
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Jemputan//MS',
      'BEGIN:VEVENT',
      'UID:munirah-alif-2026@wedding',
      'DTSTART:' + fmt(EVENT_DATE),
      'DTEND:' + fmt(end),
      'SUMMARY:Majlis Perkahwinan Munirah & Alif',
      'LOCATION:Lot 566, Kampung Mulong, 16250 Wakaf Bharu, Kelantan',
      'GEO:6.110415;102.199436',
      'DESCRIPTION:Walimatulurus Munirah binti Mohamad Nasir & Mohammad Alif Hilmy bin Muhamad',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    var blob = new Blob([ics], { type: 'text/calendar' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Jemputan-Munirah-Alif.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });

  /* ============================================================
     6) UCAPAN / RSVP
     ============================================================ */
  function loadWishes() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveWishes(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function tagClass(a) {
    if (a === 'Hadir') return 'hadir';
    if (a === 'Tidak Hadir') return 'tidak';
    return 'pasti';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function renderWishes() {
    var box = $('wishes');
    var list = loadWishes();
    box.innerHTML = '';
    list.slice().reverse().forEach(function (w) {
      var el = document.createElement('div');
      el.className = 'wish';
      var pax = w.pax ? ' &middot; ' + esc(w.pax) + ' pax' : '';
      el.innerHTML =
        '<div class="w-top"><span class="w-name">' + esc(w.name) + '</span>' +
        '<span class="w-tag ' + tagClass(w.attend) + '">' + esc(w.attend) + pax + '</span></div>' +
        (w.msg ? '<div class="w-msg">' + esc(w.msg) + '</div>' : '');
      box.appendChild(el);
    });
  }

  $('rsvp-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('rsvp-name').value.trim();
    var attend = $('rsvp-attend').value;
    var pax = $('rsvp-pax').value.trim();
    var msg = $('rsvp-msg').value.trim();
    if (!name || !attend) return;

    var list = loadWishes();
    list.push({ name: name, attend: attend, pax: pax, msg: msg, t: Date.now() });
    saveWishes(list);
    renderWishes();
    this.reset();

    // Raikan dengan animasi bunga
    if (window.playBunga) window.playBunga();

    if (SHEET_URL) {
      // Utama: hantar ke Google Sheet
      sendToSheet({ name: name, attend: attend, pax: pax, msg: msg });
    } else if (WA_PHONE) {
      // Sandaran: buka WhatsApp dengan mesej siap taip
      var text = 'Salam, saya ' + name + ' (' + attend +
        (pax ? ', ' + pax + ' pax' : '') + ').' + (msg ? ' Ucapan: ' + msg : '');
      window.open('https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(text), '_blank');
    }
  });

  // Hantar satu ucapan ke Google Apps Script Web App (fire-and-forget)
  function sendToSheet(data) {
    try {
      fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',                                   // elak sekatan CORS Apps Script
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          name: data.name, attend: data.attend,
          pax: data.pax, msg: data.msg,
          ts: new Date().toISOString()
        })
      });
    } catch (e) {}
  }

  renderWishes();

  /* ============================================================
     7) KESAN TAIP (TYPEWRITER) — "MAJLIS KESYUKURAN"
     ============================================================ */
  (function typewriterMk() {
    var live = document.querySelector('.mk .mk-live');
    var ghost = document.querySelector('.mk .mk-ghost');
    if (!live || !ghost) return;
    var full = ghost.textContent;
    var caret = document.createElement('span');
    caret.className = 'mk-caret';
    live.appendChild(caret);
    var i = 0;
    function step() {
      if (i < full.length) {
        caret.insertAdjacentText('beforebegin', full.charAt(i));
        i++;
        setTimeout(step, 100);          // laju taip: 100ms/huruf
      } else {
        setTimeout(function () {         // hilangkan kursor selepas siap
          if (caret.parentNode) caret.parentNode.removeChild(caret);
        }, 1400);
      }
    }
    setTimeout(step, 650);              // mula selepas panel naik
  })();
})();

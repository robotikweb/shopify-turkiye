/*!
 * Minimum sipariş tutarı (Shopify Türkiye)
 * https://github.com/robotikweb/shopify-turkiye · MIT
 *
 * snippets/minimum-siparis-tutari.liquid ile çizilen kutuyu yönetir:
 * - Sepet sayfayı yenilemeden (AJAX ile) değiştiğinde güncel toplamı Shopify'ın /cart.js adresinden
 *   okur; uyarı metnini, eksik tutarı ve ilerleme çubuğunu yeniler.
 * - Sepet toplamı en az sipariş tutarının altındayken "Ödeme" butonunun ödemeye geçirmesini engeller.
 * En az tutar mağaza sahibinin verdiği değerdir (data-alt); bu dosya hiçbir tutar içermez.
 * Mağaza dışına veri göndermez.
 */
(function (kok) {
  'use strict';

  // Saf yardımcılar (node ile test edilebilir)

  // Tüm tutarlar kuruş cinsindendir.
  function durum(toplam, adet, sepetPara, alt, para) {
    toplam = Number(toplam) || 0;
    adet = Number(adet) || 0;
    alt = Number(alt) || 0;
    var uygulanir = alt > 0 && adet > 0 && !(sepetPara && para && String(sepetPara).toUpperCase() !== String(para).toUpperCase());
    var kalan = Math.max(0, alt - toplam);
    var oran = alt > 0 ? Math.min(100, Math.max(0, Math.floor(toplam * 100 / alt))) : 100;
    return { uygulanir: uygulanir, yeterli: !uygulanir || kalan === 0, kalan: kalan, oran: oran };
  }

  function metinDoldur(sablon, altMetni, kalanMetni) {
    return String(sablon == null ? '' : sablon)
      .split('[alt_tutar]').join(altMetni)
      .split('[kalan]').join(kalanMetni);
  }

  // Sepeti değiştiren Ajax API adresleri (okuma amaçlı /cart.js hariç)
  function sepetiDegistirir(adres) {
    return /\/cart\/(add|change|update|clear)(\.js|\.json)?(\?|$)/.test(String(adres || '').split('#')[0]);
  }

  function binlikle(kurus, hane, binlik, ondalik) {
    var sayi = (Number(kurus) / 100).toFixed(hane);
    var parcalar = sayi.split('.');
    var tam = parcalar[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + binlik);
    return tam + (parcalar[1] ? ondalik + parcalar[1] : '');
  }

  // Shopify'ın para biçimi şablonunu ({{amount_with_comma_separator}} TL vb.) uygular.
  // Şablon yoksa veya tanınmazsa Intl.NumberFormat ile biçimlendirir.
  function paraBicimle(kurus, bicim, paraBirimi, dil) {
    if (!isFinite(Number(kurus))) return '';
    var desen = /\{\{\s*(\w+)\s*\}\}/;
    var eslesme = typeof bicim === 'string' ? bicim.match(desen) : null;
    var deger = null;
    if (eslesme) {
      switch (eslesme[1]) {
        case 'amount': deger = binlikle(kurus, 2, ',', '.'); break;
        case 'amount_no_decimals': deger = binlikle(kurus, 0, ',', '.'); break;
        case 'amount_with_comma_separator': deger = binlikle(kurus, 2, '.', ','); break;
        case 'amount_no_decimals_with_comma_separator': deger = binlikle(kurus, 0, '.', ','); break;
        case 'amount_with_space_separator': deger = binlikle(kurus, 2, ' ', ','); break;
        case 'amount_no_decimals_with_space_separator': deger = binlikle(kurus, 0, ' ', ','); break;
        case 'amount_with_period_and_space_separator': deger = binlikle(kurus, 2, ' ', '.'); break;
        case 'amount_with_apostrophe_separator': deger = binlikle(kurus, 2, "'", '.'); break;
      }
    }
    if (deger !== null) return bicim.replace(desen, deger);
    try {
      return new Intl.NumberFormat(dil || 'tr-TR', { style: 'currency', currency: paraBirimi || 'TRY' }).format(Number(kurus) / 100);
    } catch (e) {
      return binlikle(kurus, 2, '.', ',') + ' ' + (paraBirimi || '');
    }
  }

  // Tarayıcı tarafı

  var ODEME_SECICI = '[name="checkout"], #checkout, #CartDrawer-Checkout, a[href$="/checkout"], a[href*="/checkout?"]';
  var sepet = null;        // { toplam, adet, para } — en son bilinen sepet
  var yenileme = null;     // devam eden /cart.js isteği
  var zamanlayici = null;
  var bekliyor = false;    // sepet değişti, güncel toplam henüz okunmadı
  var gecir = false;       // bekleme sonrası yeniden tetiklenen tıklama
  var asilFetch = null;

  function metneCevir(html) {
    // Para biçimindeki etiketleri atar, &#8378; gibi varlıkları çözer (innerHTML kullanmadan yazmak için)
    var t = document.createElement('textarea');
    t.innerHTML = String(html).replace(/<[^>]*>/g, '');
    return t.value;
  }

  function kutular() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-min-siparis]'));
  }

  function gorunurMu(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function kutuDurumu(kutu) {
    var s = sepet || { toplam: kutu.getAttribute('data-toplam'), adet: kutu.getAttribute('data-adet'), para: kutu.getAttribute('data-sepet-para') };
    return durum(s.toplam, s.adet, s.para, kutu.getAttribute('data-alt'), kutu.getAttribute('data-para'));
  }

  function ciz(kutu) {
    var d = kutuDurumu(kutu);
    var tamam = kutu.getAttribute('data-tamam') || '';
    var eksik = kutu.querySelector('[data-min-eksik]');
    var tamamP = kutu.querySelector('[data-min-tamam]');
    var cubukKap = kutu.querySelector('[data-min-cubuk-kap]');
    var cubuk = kutu.querySelector('[data-min-cubuk]');

    if (!d.uygulanir || (d.kalan === 0 && !tamam)) {
      kutu.hidden = true;
      return;
    }
    kutu.hidden = false;
    if (d.kalan > 0) {
      var bicim = kutu.getAttribute('data-bicim');
      var para = kutu.getAttribute('data-para');
      var dil = kutu.getAttribute('data-dil');
      var altMetni = metneCevir(paraBicimle(kutu.getAttribute('data-alt'), bicim, para, dil));
      var kalanMetni = metneCevir(paraBicimle(d.kalan, bicim, para, dil));
      if (eksik) {
        eksik.textContent = metinDoldur(kutu.getAttribute('data-metin'), altMetni, kalanMetni);
        eksik.hidden = false;
      }
      if (tamamP) tamamP.hidden = true;
      if (cubukKap) cubukKap.hidden = false;
      if (cubuk) cubuk.style.width = d.oran + '%';
    } else {
      if (eksik) eksik.hidden = true;
      if (tamamP) { tamamP.textContent = tamam; tamamP.hidden = false; }
      if (cubukKap) cubukKap.hidden = true;
    }
    kutu.removeAttribute('data-min-vurgu');
    kutu.style.borderColor = '';
  }

  function hepsiniCiz() {
    kutular().forEach(ciz);
  }

  function kokAdres() {
    return (kok.Shopify && kok.Shopify.routes && kok.Shopify.routes.root) || '/';
  }

  function yenile() {
    if (yenileme) return yenileme;
    var f = asilFetch || kok.fetch;
    yenileme = f.call(kok, kokAdres() + 'cart.js', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(function (y) { return y.ok ? y.json() : null; })
      .then(function (c) {
        if (c && typeof c.total_price !== 'undefined') {
          sepet = { toplam: c.total_price, adet: c.item_count, para: c.currency };
          hepsiniCiz();
        }
      })
      .catch(function () {})
      .then(function () { yenileme = null; if (!zamanlayici) bekliyor = false; });
    return yenileme;
  }

  // Bekleyen değişiklik ve okuma bitene kadar bekler
  function bekle() {
    return new Promise(function (coz) {
      (function dene() {
        if (!bekliyor && !yenileme) return coz();
        if (yenileme) yenileme.then(function () { setTimeout(dene, 0); });
        else setTimeout(dene, 50);
      })();
    });
  }

  function planla() {
    bekliyor = true;
    clearTimeout(zamanlayici);
    // Tema kendi bölümlerini yeniden çizdikten sonra çalışsın diye kısa bir gecikme
    zamanlayici = setTimeout(function () {
      zamanlayici = null;
      (yenileme || Promise.resolve()).then(yenile);
    }, 150);
  }

  // Tetikleyen butona en yakın kutuyu bul: önce üst öğeler, sonra görünür ilk kutu.
  function ilgiliKutu(tetik) {
    for (var el = tetik.parentElement; el; el = el.parentElement) {
      var bulunan = el.querySelectorAll ? el.querySelectorAll('[data-min-siparis]') : [];
      if (bulunan.length) return bulunan[0];
    }
    var liste = kutular();
    var acik = liste.filter(gorunurMu);
    return (acik.length ? acik : liste)[0] || null;
  }

  function vurgula(kutu) {
    ciz(kutu);
    kutu.hidden = false;
    kutu.setAttribute('data-min-vurgu', '');
    kutu.style.borderColor = '#b42318';
    if (!kutu.hasAttribute('tabindex')) kutu.setAttribute('tabindex', '-1');
    if (kutu.scrollIntoView) kutu.scrollIntoView({ block: 'center', behavior: 'smooth' });
    try { kutu.focus({ preventScroll: true }); } catch (e) { kutu.focus(); }
  }

  // true dönerse ödemeye geçiş durduruldu
  function denetle(e, tetik) {
    if (gecir) return false;
    var kutu = ilgiliKutu(tetik);
    if (!kutu || kutu.getAttribute('data-engelle') === 'false') return false;

    if (yenileme || bekliyor) {
      // Sepet az önce değişti ve güncel toplam henüz gelmedi: bekle, sonra yeniden dene
      e.preventDefault();
      e.stopImmediatePropagation();
      bekle().then(function () {
        if (kutuDurumu(kutu).yeterli) {
          gecir = true;
          try { tetik.click(); } finally { gecir = false; }
        } else {
          vurgula(kutu);
        }
      });
      return true;
    }

    if (kutuDurumu(kutu).yeterli) return false;
    e.preventDefault();
    e.stopImmediatePropagation();
    vurgula(kutu);
    return true;
  }

  function izle() {
    // Sepeti değiştiren isteklerden sonra güncel toplamı oku (fetch ve XMLHttpRequest)
    if (typeof kok.fetch === 'function') {
      asilFetch = kok.fetch;
      kok.fetch = function (girdi) {
        var adres = typeof girdi === 'string' ? girdi : (girdi && girdi.url) || '';
        var degistirir = sepetiDegistirir(adres);
        if (degistirir) bekliyor = true;
        var sonuc = asilFetch.apply(this, arguments);
        if (degistirir) sonuc.then(planla, planla);
        return sonuc;
      };
    }
    if (kok.XMLHttpRequest) {
      var acik = kok.XMLHttpRequest.prototype.open;
      kok.XMLHttpRequest.prototype.open = function (yontem, adres) {
        if (sepetiDegistirir(adres)) {
          bekliyor = true;
          this.addEventListener('loadend', planla);
        }
        return acik.apply(this, arguments);
      };
    }

    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('button, input[type="submit"], a') : null;
      if (!t || t.name === 'update') return;
      if (t.matches(ODEME_SECICI)) denetle(e, t);
    }, true);

    // Klavyeyle (Enter) veya betikle gönderilen formlar için ikinci kontrol
    document.addEventListener('submit', function (e) {
      var gonderen = e.submitter;
      if (gonderen && gonderen.name === 'update') return;
      if (gonderen && gonderen.matches(ODEME_SECICI)) { denetle(e, gonderen); return; }
      var form = e.target;
      var odeme = !gonderen && form && form.elements ? form.elements.namedItem('checkout') : null;
      if (odeme && odeme.nodeType === 1) denetle(e, odeme);
    }, true);

    // Geri tuşuyla önbellekten açılan sayfada sepet değişmiş olabilir
    kok.addEventListener('pageshow', function (e) { if (e.persisted) yenile(); });
    // Tema düzenleyicide bölüm yeniden yüklendiğinde
    document.addEventListener('shopify:section:load', hepsiniCiz);
  }

  function baslat() {
    if (kok.minSiparisKurulu) return;
    kok.minSiparisKurulu = true;
    izle();
    hepsiniCiz();
    yenile();
  }

  var disa = {
    durum: durum,
    metinDoldur: metinDoldur,
    sepetiDegistirir: sepetiDegistirir,
    paraBicimle: paraBicimle
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = disa;
  } else {
    kok.minimumSiparis = disa;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
    else baslat();
  }
})(typeof window !== 'undefined' ? window : this);

/*!
 * Bireysel / kurumsal fatura bilgisi (Shopify Türkiye)
 * https://github.com/robotikweb/shopify-turkiye · MIT
 *
 * snippets/fatura-bilgisi.liquid ile çizilen alanı yönetir:
 * - "Kurumsal" seçiliyken firma unvanı, vergi dairesi ve vergi no alanlarını zorunlu yapar.
 * - "Bireysel" seçiliyken bu alanları devre dışı bırakır ve eski değerleri sepetten silmek için
 *   aynı adlı boş gizli alanları gönderir.
 * - Vergi no için yalnızca biçim kontrolü yapar (10 hane, ya da 0 ile başlamayan 11 hane).
 * Sunucuya veri göndermez; bilgiler sepet formuyla birlikte gider.
 */
(function (kok) {
  'use strict';

  // Saf yardımcılar (node ile test edilebilir)

  function rakamlar(deger) {
    return String(deger == null ? '' : deger).replace(/\D/g, '');
  }

  // Yalnızca biçim: numaranın kayıtlı olduğunu doğrulamaz.
  function vergiNoGecerli(deger) {
    var v = rakamlar(deger);
    if (String(deger == null ? '' : deger).trim() !== v) return false;
    if (v.length === 10) return true;
    if (v.length === 11) return v.charAt(0) !== '0';
    return false;
  }

  // Bir alan için gösterilecek hata metni ('' = geçerli).
  function alanHatasi(deger, zorunlu, vknMi) {
    var bos = String(deger == null ? '' : deger).trim() === '';
    if (bos) return zorunlu ? 'Kurumsal fatura için bu alanı doldurun.' : '';
    if (vknMi && !vergiNoGecerli(deger)) return 'Vergi no 10 haneli (şahıs şirketlerinde 11 haneli) olmalıdır.';
    return '';
  }

  // Tarayıcı tarafı

  function kurumsalMi(kutu) {
    var secili = kutu.querySelector('[data-fatura-tur]:checked');
    return !!secili && secili.value === 'Kurumsal';
  }

  function dogrula(input) {
    if (input.disabled) { input.setCustomValidity(''); input.removeAttribute('aria-invalid'); return ''; }
    var hata = alanHatasi(input.value, input.required, input.hasAttribute('data-fatura-vkn'));
    input.setCustomValidity(hata);
    if (hata) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    return hata;
  }

  function hataGoster(kutu, metin) {
    var p = kutu.querySelector('[data-fatura-hata]');
    if (!p) return;
    p.textContent = metin || '';
    p.hidden = !metin;
  }

  function uygula(kutu) {
    var k = kurumsalMi(kutu);
    kutu.classList.toggle('fatura-bilgisi--kurumsal', k);
    kutu.classList.toggle('fatura-bilgisi--bireysel', !k);
    var alanlar = kutu.querySelectorAll('[data-fatura-alan]');
    for (var i = 0; i < alanlar.length; i++) {
      var a = alanlar[i];
      a.disabled = !k;
      a.required = k && a.hasAttribute('data-fatura-zorunlu');
      dogrula(a);
    }
    var temizle = kutu.querySelectorAll('[data-fatura-temizle]');
    for (var j = 0; j < temizle.length; j++) temizle[j].disabled = k;
    if (!k) hataGoster(kutu, '');
    kutu.setAttribute('data-fatura-kuruldu', '1');
  }

  // Ödemeye geçmeden önce: ilk hatalı alanı bulup gösterir. Hata yoksa null döner.
  function kontrolEt(kutu) {
    uygula(kutu);
    if (!kurumsalMi(kutu)) return null;
    var alanlar = kutu.querySelectorAll('[data-fatura-alan]');
    for (var i = 0; i < alanlar.length; i++) {
      var hata = dogrula(alanlar[i]);
      if (hata) { hataGoster(kutu, hata); return alanlar[i]; }
    }
    hataGoster(kutu, '');
    return null;
  }

  function hepsiniKur() {
    var kutular = document.querySelectorAll('[data-fatura-bilgisi]:not([data-fatura-kuruldu])');
    for (var i = 0; i < kutular.length; i++) uygula(kutular[i]);
  }

  function gorunur(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  // Tetikleyen butonla aynı forma bağlı (veya onu kapsayan) fatura kutusu
  function ilgiliKutu(tetik) {
    var form = tetik.form || null;
    var kutular = Array.prototype.slice.call(document.querySelectorAll('[data-fatura-bilgisi]'));
    if (form) {
      var bagli = kutular.filter(function (k) {
        var r = k.querySelector('[data-fatura-tur]');
        return r && r.form === form;
      });
      if (bagli.length) return bagli[0];
    }
    for (var el = tetik.parentElement; el; el = el.parentElement) {
      var bulunan = Array.prototype.slice.call(el.querySelectorAll('[data-fatura-bilgisi]'));
      if (bulunan.length) {
        var acik = bulunan.filter(gorunur);
        return (acik.length ? acik : bulunan)[0];
      }
    }
    return null;
  }

  var ODEME_SECICI = '[name="checkout"], #checkout, #CartDrawer-Checkout, a[href$="/checkout"], a[href*="/checkout?"]';

  function baslat() {
    hepsiniKur();

    document.addEventListener('change', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var kutu = t.closest('[data-fatura-bilgisi]');
      if (!kutu) return;
      if (t.hasAttribute('data-fatura-tur')) uygula(kutu);
    });

    document.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.closest || !t.hasAttribute('data-fatura-alan')) return;
      if (t.hasAttribute('data-fatura-vkn')) {
        var temiz = rakamlar(t.value).slice(0, 11);
        if (t.value !== temiz) t.value = temiz;
      }
      if (!dogrula(t)) hataGoster(t.closest('[data-fatura-bilgisi]'), '');
    });

    // Tarayıcının doğrulamasından ÖNCE çalışsın diye click (yakalama aşaması)
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('button, input[type="submit"], a') : null;
      if (!t || !t.matches(ODEME_SECICI)) return;
      var kutu = ilgiliKutu(t);
      if (!kutu) return;
      var hatali = kontrolEt(kutu);
      if (!hatali) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (hatali.scrollIntoView) hatali.scrollIntoView({ block: 'center', behavior: 'smooth' });
      try { hatali.focus({ preventScroll: true }); } catch (x) { hatali.focus(); }
    }, true);

    // Klavyeyle (Enter) gönderilen formlar için
    document.addEventListener('submit', function (e) {
      var form = e.target;
      var kutular = document.querySelectorAll('[data-fatura-bilgisi]');
      for (var i = 0; i < kutular.length; i++) {
        var r = kutular[i].querySelector('[data-fatura-tur]');
        if (!r || r.form !== form) continue;
        var hatali = kontrolEt(kutular[i]);
        if (hatali) { e.preventDefault(); hatali.focus(); return; }
      }
    }, true);

    // Sepet çekmecesi her güncellemede yeniden çizildiği için yeni kutuları kur
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(hepsiniKur).observe(document.body, { childList: true, subtree: true });
    }
    document.addEventListener('shopify:section:load', hepsiniKur);
  }

  var disa = { vergiNoGecerli: vergiNoGecerli, alanHatasi: alanHatasi, uygula: uygula, kontrolEt: kontrolEt };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = disa;
  } else {
    if (kok.faturaBilgisi) return; // iki kez yüklenirse olayları tekrar bağlama
    kok.faturaBilgisi = disa;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
    else baslat();
  }
})(typeof window !== 'undefined' ? window : this);

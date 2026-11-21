/*!
 * Hediye paketi ve hediye notu (Shopify Türkiye)
 * https://github.com/robotikweb/shopify-turkiye · MIT
 *
 * snippets/hediye-paketi.liquid ile çizilen alanı yönetir:
 * - "Hediye paketi yapılsın" seçiliyken not kutusunu açar; "İstemiyorum" seçilince kutuyu kapatır ve
 *   eski notu sepetten silmek için aynı adlı boş gizli alanı gönderir.
 * - Not için kalan karakter sayısını gösterir.
 * - Seçim veya not değişince bilgiyi Shopify'ın /cart/update.js adresiyle sepete kaydeder.
 * Mağaza dışında hiçbir yere veri göndermez.
 */
(function (kok) {
  'use strict';

  // Saf yardımcılar (node ile test edilebilir)

  // Tarayıcının maxlength sayımıyla aynı (UTF-16 birimi) uzunluk
  function uzunluk(metin) {
    return String(metin == null ? '' : metin).length;
  }

  function sayacMetni(metin, enFazla) {
    var kalan = enFazla - uzunluk(metin);
    if (!(enFazla > 0)) return '';
    if (kalan <= 0) return 'Karakter sınırına ulaştınız (' + enFazla + ').';
    return kalan + ' karakter kaldı';
  }

  // Sepete kaydedilecek sepet özellikleri
  function ozellikler(evet, notMetni, notVar) {
    var o = { 'Hediye paketi': evet ? 'Evet' : 'Hayır' };
    if (notVar) o['Hediye notu'] = evet ? String(notMetni == null ? '' : notMetni) : '';
    return o;
  }

  // Tarayıcı tarafı

  function evetMi(kutu) {
    var secili = kutu.querySelector('[data-hediye-secim]:checked');
    return !!secili && secili.value === 'Evet';
  }

  function sayacGuncelle(kutu) {
    var alan = kutu.querySelector('[data-hediye-not]');
    var sayac = kutu.querySelector('[data-hediye-sayac]');
    if (!alan || !sayac) return;
    var enFazla = parseInt(alan.getAttribute('maxlength'), 10);
    sayac.textContent = sayacMetni(alan.value, enFazla);
  }

  function uygula(kutu) {
    var evet = evetMi(kutu);
    kutu.classList.toggle('hediye-paketi--acik', evet);
    kutu.classList.toggle('hediye-paketi--kapali', !evet);
    var alan = kutu.querySelector('[data-hediye-not]');
    var temizle = kutu.querySelector('[data-hediye-temizle]');
    if (alan) alan.disabled = !evet;
    if (temizle) temizle.disabled = evet;
    sayacGuncelle(kutu);
    kutu.setAttribute('data-hediye-kuruldu', '1');
  }

  function hepsiniKur() {
    var kutular = document.querySelectorAll('[data-hediye-paketi]:not([data-hediye-kuruldu])');
    for (var i = 0; i < kutular.length; i++) uygula(kutular[i]);
  }

  function sepetAdresi() {
    var kokYol = (kok.Shopify && kok.Shopify.routes && kok.Shopify.routes.root) || '/';
    return kokYol + 'cart/update.js';
  }

  var bekleyen = null;
  function kaydet(kutu, gecikme) {
    if (typeof fetch === 'undefined') return;
    if (bekleyen) clearTimeout(bekleyen);
    bekleyen = setTimeout(function () {
      bekleyen = null;
      var alan = kutu.querySelector('[data-hediye-not]');
      var govde = { attributes: ozellikler(evetMi(kutu), alan ? alan.value : '', !!alan) };
      fetch(sepetAdresi(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(govde)
      }).catch(function () { /* sessiz: bilgiler ödeme adımında formla yine gönderilir */ });
    }, gecikme);
  }

  function baslat() {
    hepsiniKur();

    document.addEventListener('change', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var kutu = t.closest('[data-hediye-paketi]');
      if (!kutu) return;
      if (t.hasAttribute('data-hediye-secim')) {
        uygula(kutu);
        kaydet(kutu, 0);
      } else if (t.hasAttribute('data-hediye-not')) {
        kaydet(kutu, 0);
      }
    });

    document.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.closest || !t.hasAttribute('data-hediye-not')) return;
      var kutu = t.closest('[data-hediye-paketi]');
      if (!kutu) return;
      sayacGuncelle(kutu);
      kaydet(kutu, 800);
    });

    // Sepet çekmecesi her güncellemede yeniden çizildiği için yeni kutuları kur
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(hepsiniKur).observe(document.body, { childList: true, subtree: true });
    }
    document.addEventListener('shopify:section:load', hepsiniKur);
  }

  var disa = { sayacMetni: sayacMetni, ozellikler: ozellikler, uygula: uygula };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = disa;
  } else {
    if (kok.hediyePaketi) return; // iki kez yüklenirse olayları tekrar bağlama
    kok.hediyePaketi = disa;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
    else baslat();
  }
})(typeof window !== 'undefined' ? window : this);

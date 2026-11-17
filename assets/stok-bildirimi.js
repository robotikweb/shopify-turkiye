/*!
 * "Gelince haber ver" stok bildirim talebi (Shopify Türkiye)
 * https://github.com/robotikweb/shopify-turkiye · MIT
 *
 * snippets/stok-bildirimi.liquid ile çizilen kutuyu yönetir:
 * - Seçili varyant tükenmişse kutuyu gösterir, satılabiliyorsa gizler.
 * - Gizli form alanlarındaki varyant adı, SKU, bağlantı ve mesaj metnini seçili varyanta göre günceller.
 * Sunucuya kendisi veri göndermez; talep Shopify'ın iletişim formuyla gider.
 */
(function (kok) {
  'use strict';

  // Saf yardımcılar (node ile test edilebilir)

  function varyantBul(varyantlar, id) {
    id = String(id == null ? '' : id);
    if (!id || !Object.prototype.hasOwnProperty.call(varyantlar, id)) return null;
    return varyantlar[id];
  }

  // Seçili varyanta göre kutunun durumu ve gizli alan değerleri
  function durum(varyantlar, id, urunAdi) {
    var v = varyantBul(varyantlar, id);
    if (!v) return null;
    var ad = v.t ? urunAdi + ' - ' + v.t : urunAdi;
    return {
      goster: v.a !== true,
      alanlar: {
        varyant: v.t || '',
        sku: v.s || '',
        baglanti: v.u || '',
        govde: 'Stok bildirimi talebi: ' + ad
      }
    };
  }

  // Tarayıcı tarafı

  function kur(kutu) {
    if (kutu.getAttribute('data-stok-bildirimi-kuruldu')) return;
    kutu.setAttribute('data-stok-bildirimi-kuruldu', '1');
    var veri = kutu.querySelector('[data-stok-bildirimi-varyantlar]');
    if (!veri) return;
    var varyantlar;
    try { varyantlar = JSON.parse(veri.textContent); } catch (e) { return; }
    var govdeAlani = kutu.querySelector('[data-alan="govde"]');
    var urunAdi = govdeAlani ? govdeAlani.getAttribute('data-urun') || '' : '';

    // Gönderimden sonra teşekkür yazısı varyanttan bağımsız olarak görünür kalsın
    if (kutu.querySelector('[data-stok-bildirimi-tamam]')) {
      kutu.hidden = false;
      return;
    }

    var sonId = null;
    function guncelle(id) {
      id = String(id || '');
      if (id === sonId) return;
      var d = durum(varyantlar, id, urunAdi);
      if (!d) return;
      sonId = id;
      kutu.hidden = !d.goster;
      for (var ad in d.alanlar) {
        var alan = kutu.querySelector('[data-alan="' + ad + '"]');
        if (alan) alan.value = d.alanlar[ad];
      }
    }

    function seciliId() {
      var alanlar = document.querySelectorAll('form[action*="/cart/add"] [name="id"]');
      for (var i = 0; i < alanlar.length; i++) {
        if (varyantBul(varyantlar, alanlar[i].value)) return alanlar[i].value;
      }
      return null;
    }

    guncelle(seciliId());
    document.addEventListener('change', function (e) {
      var h = e.target;
      if (h && h.name === 'id' && h.closest && h.closest('form[action*="/cart/add"]')) guncelle(h.value);
    }, true);
    // Değişiklik olayı yaymayan temalar için hafif yedek kontrol
    setInterval(function () {
      if (document.hidden) return;
      var id = seciliId();
      if (id) guncelle(id);
    }, 800);
  }

  function baslat() {
    var kutular = document.querySelectorAll('[data-stok-bildirimi]');
    for (var i = 0; i < kutular.length; i++) kur(kutular[i]);
  }

  var disa = { varyantBul: varyantBul, durum: durum };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = disa;
  } else {
    kok.stokBildirimi = disa;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
    else baslat();
    document.addEventListener('shopify:section:load', baslat);
  }
})(typeof window !== 'undefined' ? window : this);

/*!
 * Taksit bilgi tablosu (Shopify Türkiye)
 * https://github.com/robotikweb/shopify-turkiye · MIT
 *
 * snippets/taksit-tablosu.liquid tarafından çizilen tabloyu, müşteri ürün sayfasında varyant
 * değiştirdiğinde yeni fiyata göre yeniden hesaplar. Oranlar ve taksit sayıları mağaza sahibinin
 * girdiği değerlerdir (tablodaki data-n / data-oran öznitelikleri); bu dosya hiçbir oran içermez.
 * Sunucuya veri göndermez.
 */
(function (kok) {
  'use strict';

  // Saf yardımcılar (node ile test edilebilir)

  // Liquid tarafıyla aynı sırayla hesaplanır: toplam = round(fiyat * (100 + oran) / 100),
  // taksit tutarı = round(toplam / n). Tüm tutarlar kuruş cinsindendir.
  function hesapla(fiyat, n, oran) {
    fiyat = Number(fiyat);
    n = Number(n);
    oran = Number(oran);
    if (!isFinite(fiyat) || fiyat <= 0 || !isFinite(n) || n < 1 || !isFinite(oran) || oran < 0) return null;
    // Küçük pay, kayan nokta hatasının .5 durumlarını Liquid'in (ondalık) yuvarlamasından ayırmaması için
    var toplam = Math.round(fiyat * (100 + oran) / 100 + 1e-7);
    return { toplam: toplam, taksit: Math.round(toplam / n + 1e-7) };
  }

  function binlikle(kurus, hane, binlik, ondalik) {
    var sayi = (Number(kurus) / 100).toFixed(hane);
    var parcalar = sayi.split('.');
    var tam = parcalar[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + binlik);
    return tam + (parcalar[1] ? ondalik + parcalar[1] : '');
  }

  // Shopify'ın para biçimi şablonunu ({{amount_with_comma_separator}} TL vb.) uygular.
  // Şablon tanınmazsa Intl.NumberFormat ile biçimlendirir.
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

  // Bir program (banka/kart) için satırların görünürlüğünü ve tutarlarını hesaplar.
  function satirlariHesapla(fiyat, satirlar, enAzTaksit) {
    enAzTaksit = Number(enAzTaksit) || 0;
    return satirlar.map(function (s) {
      var h = hesapla(fiyat, s.n, s.oran);
      if (!h) return { gorunur: false };
      return { gorunur: h.taksit >= enAzTaksit, toplam: h.toplam, taksit: h.taksit };
    });
  }

  // Tarayıcı tarafı

  function metneCevir(html) {
    // Para biçimindeki etiketleri atar, &#8378; gibi varlıkları çözer (innerHTML kullanmadan yazmak için)
    var t = document.createElement('textarea');
    t.innerHTML = String(html).replace(/<[^>]*>/g, '');
    return t.value;
  }

  function kur(kutu) {
    if (kutu.getAttribute('data-taksit-hazir')) return;
    kutu.setAttribute('data-taksit-hazir', '1');

    var veriEl = kutu.querySelector('script[data-taksit-varyantlar]');
    var varyantlar;
    try { varyantlar = JSON.parse(veriEl ? veriEl.textContent : '{}'); } catch (e) { return; }
    var ids = Object.keys(varyantlar);
    if (ids.length < 2) return; // tek varyantlı üründe yeniden hesaplamaya gerek yok

    var ayar = {
      bicim: kutu.getAttribute('data-bicim') || '',
      paraBirimi: kutu.getAttribute('data-para-birimi') || 'TRY',
      dil: kutu.getAttribute('data-dil') || 'tr-TR',
      enAz: Number(kutu.getAttribute('data-en-az-taksit')) || 0
    };
    var programlar = Array.prototype.slice.call(kutu.querySelectorAll('[data-taksit-program]'));
    var sonId = kutu.getAttribute('data-secili') || null;

    function para(kurus) { return metneCevir(paraBicimle(kurus, ayar.bicim, ayar.paraBirimi, ayar.dil)); }

    function guncelle(id) {
      id = String(id || '');
      if (!Object.prototype.hasOwnProperty.call(varyantlar, id) || id === sonId) return;
      sonId = id;
      var fiyat = varyantlar[id];
      var herhangi = false;
      programlar.forEach(function (p) {
        var satirEls = Array.prototype.slice.call(p.querySelectorAll('[data-n]'));
        var veriler = satirEls.map(function (s) {
          return { n: Number(s.getAttribute('data-n')), oran: Number(s.getAttribute('data-oran')) };
        });
        var sonuc = satirlariHesapla(fiyat, veriler, ayar.enAz);
        var programdaVar = false;
        satirEls.forEach(function (s, i) {
          var r = sonuc[i];
          s.hidden = !r.gorunur;
          if (!r.gorunur) return;
          programdaVar = true;
          var t = s.querySelector('[data-taksit-tutar]');
          var o = s.querySelector('[data-taksit-toplam]');
          if (t) t.textContent = para(r.taksit);
          if (o) o.textContent = para(r.toplam);
        });
        p.hidden = !programdaVar;
        if (programdaVar) herhangi = true;
      });
      kutu.hidden = !herhangi;
    }

    function seciliId() {
      var alanlar = document.querySelectorAll('form[action*="/cart/add"] [name="id"]');
      for (var i = 0; i < alanlar.length; i++) {
        if (Object.prototype.hasOwnProperty.call(varyantlar, String(alanlar[i].value))) return alanlar[i].value;
      }
      return null;
    }

    document.addEventListener('change', function (e) {
      var h = e.target;
      if (h && h.name === 'id' && h.closest && h.closest('form[action*="/cart/add"]')) guncelle(h.value);
    }, true);
    // Değişiklik olayı yaymayan temalar için hafif yedek kontrol
    setInterval(function () {
      if (document.hidden || !kutu.isConnected) return;
      var id = seciliId();
      if (id) guncelle(id);
    }, 800);
  }

  function baslat() {
    var kutular = document.querySelectorAll('[data-taksit-tablosu]');
    for (var i = 0; i < kutular.length; i++) kur(kutular[i]);
  }

  var disa = {
    hesapla: hesapla,
    paraBicimle: paraBicimle,
    satirlariHesapla: satirlariHesapla
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = disa;
  } else {
    kok.taksitTablosu = disa;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
    else baslat();
    // Tema düzenleyicide bölüm yeniden yüklendiğinde
    document.addEventListener('shopify:section:load', baslat);
  }
})(typeof window !== 'undefined' ? window : this);

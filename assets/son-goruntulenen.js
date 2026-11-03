/*!
 * Son görüntülenen ürünler (Shopify Türkiye)
 * https://github.com/robotikweb/shopify-turkiye · MIT
 *
 * Ürün sayfasında görüntülenen ürünün handle'ını tarayıcının localStorage alanına yazar ve
 * [data-son-goruntulenen] kutularında son görüntülenen ürünleri listeler. Ürün bilgisi
 * (ad, görsel, fiyat, stok durumu) her seferinde Shopify'ın Ajax Product API'sinden
 * (/products/<handle>.js) güncel olarak alınır; silinen veya yayından kaldırılan ürünler
 * listeden otomatik çıkarılır. Sunucuya hiçbir veri gönderilmez.
 */
(function (kok) {
  'use strict';

  var ANAHTAR = 'shopify_turkiye_son_goruntulenen';
  var EN_FAZLA_KAYIT = 20;

  // Saf yardımcılar (node ile test edilebilir)

  function listeyeEkle(liste, handle, enFazla) {
    var yeni = [handle];
    for (var i = 0; i < liste.length; i++) {
      if (liste[i] !== handle && typeof liste[i] === 'string' && liste[i]) yeni.push(liste[i]);
    }
    return yeni.slice(0, enFazla || EN_FAZLA_KAYIT);
  }

  function gosterilecekler(liste, haric, adet) {
    var sonuc = [];
    for (var i = 0; i < liste.length && sonuc.length < adet; i++) {
      if (liste[i] !== haric) sonuc.push(liste[i]);
    }
    return sonuc;
  }

  function listeyiCoz(ham) {
    try {
      var veri = JSON.parse(ham || '[]');
      if (!Array.isArray(veri)) return [];
      return veri.filter(function (h) { return typeof h === 'string' && /^[^\/?#\s]{1,255}$/.test(h); });
    } catch (e) {
      return [];
    }
  }

  function paraBicimle(kurus, paraBirimi, dil) {
    var tutar = Number(kurus) / 100;
    if (!isFinite(tutar)) return '';
    try {
      return new Intl.NumberFormat(dil || 'tr-TR', { style: 'currency', currency: paraBirimi || 'TRY' }).format(tutar);
    } catch (e) {
      return tutar.toFixed(2).replace('.', ',') + ' ' + (paraBirimi || '');
    }
  }

  function gorselAdresi(adres, genislik) {
    if (!adres || typeof adres !== 'string') return '';
    if (adres.indexOf('//') === 0) adres = 'https:' + adres;
    return adres + (adres.indexOf('?') === -1 ? '?' : '&') + 'width=' + genislik;
  }

  function kokYol(kokAdres) {
    var k = String(kokAdres || '/');
    return k.charAt(k.length - 1) === '/' ? k : k + '/';
  }

  // Tarayıcı tarafı

  function oku() {
    try { return listeyiCoz(kok.localStorage.getItem(ANAHTAR)); } catch (e) { return []; }
  }

  function yaz(liste) {
    try { kok.localStorage.setItem(ANAHTAR, JSON.stringify(liste)); } catch (e) {}
  }

  function cikar(handle) {
    yaz(oku().filter(function (h) { return h !== handle; }));
  }

  function urunGetir(yol, handle) {
    return fetch(yol + 'products/' + encodeURIComponent(handle) + '.js', { credentials: 'same-origin' })
      .then(function (yanit) {
        if (yanit.status === 404) { cikar(handle); return null; }
        if (!yanit.ok) return null;
        return yanit.json();
      })
      .catch(function () { return null; });
  }

  function el(etiket, stil, metin) {
    var e = document.createElement(etiket);
    if (stil) e.setAttribute('style', stil);
    if (metin != null) e.textContent = metin;
    return e;
  }

  function kartOlustur(urun, ayar) {
    var link = el('a', 'display:block; color:inherit; text-decoration:none;');
    link.href = ayar.yol + 'products/' + encodeURIComponent(urun.handle);

    var gorsel = urun.featured_image || (urun.images && urun.images[0]);
    var cerceve = el('div', 'aspect-ratio:1/1; overflow:hidden; border-radius:8px; background:rgba(0,0,0,.04);');
    if (gorsel) {
      var img = el('img', 'width:100%; height:100%; object-fit:cover; display:block;');
      img.src = gorselAdresi(gorsel, 360);
      img.alt = urun.title || '';
      img.loading = 'lazy';
      img.width = 360;
      img.height = 360;
      cerceve.appendChild(img);
    }
    link.appendChild(cerceve);
    link.appendChild(el('span', 'display:block; margin-top:.5rem; font-size:.9em; line-height:1.3;', urun.title));

    if (ayar.fiyat) {
      var fiyat = el('span', 'display:block; margin-top:.25rem; font-size:.9em; font-weight:600;');
      var tutar = paraBicimle(urun.price_varies ? urun.price_min : urun.price, ayar.paraBirimi, ayar.dil);
      fiyat.textContent = urun.price_varies ? ayar.baslangicMetni.split('[fiyat]').join(tutar) : tutar;
      if (!urun.price_varies && urun.compare_at_price && urun.compare_at_price > urun.price) {
        var eski = el('s', 'margin-left:.4em; font-weight:400; opacity:.6;', paraBicimle(urun.compare_at_price, ayar.paraBirimi, ayar.dil));
        fiyat.appendChild(eski);
      }
      link.appendChild(fiyat);
    }
    if (!urun.available) {
      link.appendChild(el('span', 'display:block; margin-top:.25rem; font-size:.8em; opacity:.7;', ayar.tukendiMetni));
    }
    return link;
  }

  function kutuyuDoldur(kutu, kayitliHandle) {
    if (kutu.getAttribute('data-son-goruntulenen-hazir')) return;
    kutu.setAttribute('data-son-goruntulenen-hazir', '1');

    var ayar = {
      yol: kokYol(kutu.getAttribute('data-kok')),
      adet: Math.max(1, Math.min(12, parseInt(kutu.getAttribute('data-adet'), 10) || 4)),
      fiyat: kutu.getAttribute('data-fiyat') !== 'false',
      paraBirimi: kutu.getAttribute('data-para-birimi') || 'TRY',
      dil: kutu.getAttribute('data-dil') || 'tr-TR',
      tukendiMetni: kutu.getAttribute('data-tukendi') || 'Tükendi',
      baslangicMetni: kutu.getAttribute('data-baslangic') || 'Başlangıç: [fiyat]'
    };
    var haric = kutu.getAttribute('data-haric') || kayitliHandle || '';
    var handlelar = gosterilecekler(oku(), haric, ayar.adet);
    if (!handlelar.length) return;

    Promise.all(handlelar.map(function (h) { return urunGetir(ayar.yol, h); })).then(function (urunler) {
      var liste = kutu.querySelector('[data-son-goruntulenen-liste]');
      if (!liste) return;
      var sayi = 0;
      urunler.forEach(function (urun) {
        if (!urun || !urun.handle) return;
        var li = el('li', 'margin:0; padding:0;');
        li.appendChild(kartOlustur(urun, ayar));
        liste.appendChild(li);
        sayi++;
      });
      if (sayi > 0) kutu.hidden = false;
    });
  }

  function baslat() {
    var kutular = document.querySelectorAll('[data-son-goruntulenen]');
    var kayitli = '';
    for (var i = 0; i < kutular.length; i++) {
      var h = kutular[i].getAttribute('data-kaydet');
      if (h) kayitli = h;
    }
    // Listeyi önce mevcut ürün HARİÇ gösterip sonra kaydediyoruz
    for (var j = 0; j < kutular.length; j++) kutuyuDoldur(kutular[j], kayitli);
    if (kayitli) yaz(listeyeEkle(oku(), kayitli, EN_FAZLA_KAYIT));
  }

  var disa = {
    listeyeEkle: listeyeEkle,
    gosterilecekler: gosterilecekler,
    listeyiCoz: listeyiCoz,
    paraBicimle: paraBicimle,
    gorselAdresi: gorselAdresi,
    kokYol: kokYol
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = disa;
  } else {
    kok.sonGoruntulenen = disa;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
    else baslat();
    // Tema düzenleyicide bölüm yeniden yüklendiğinde
    document.addEventListener('shopify:section:load', baslat);
  }
})(typeof window !== 'undefined' ? window : this);

/*!
 * TC Kimlik No doğrulama (Shopify Türkiye)
 * https://github.com/robotikweb/shopify-turkiye · MIT
 *
 * Kurallar: 11 hane, ilk hane 0 olamaz,
 * 10. hane = ((1+3+5+7+9. haneler) * 7 - (2+4+6+8. haneler)) mod 10,
 * 11. hane = (ilk 10 hanenin toplamı) mod 10.
 * Bu kontrol yalnızca numaranın biçimini doğrular; kişinin kimliğini doğrulamaz.
 */
(function () {
  function tcKimlikGecerli(value) {
    var v = String(value || '').replace(/\D/g, '');
    if (v.length !== 11 || v.charAt(0) === '0') return false;
    var d = v.split('').map(Number);
    var tek = d[0] + d[2] + d[4] + d[6] + d[8];
    var cift = d[1] + d[3] + d[5] + d[7];
    var h10 = ((tek * 7 - cift) % 10 + 10) % 10;
    if (h10 !== d[9]) return false;
    var toplam = 0;
    for (var i = 0; i < 10; i++) toplam += d[i];
    return toplam % 10 === d[10];
  }
  window.tcKimlikGecerli = tcKimlikGecerli;

  function bagla(input) {
    if (input.dataset.tcBagli) return;
    input.dataset.tcBagli = '1';
    var mesaj = input.parentNode.querySelector('[data-tc-mesaj]');
    var form = input.form;
    function kontrol() {
      var bos = input.value.trim() === '';
      var zorunlu = input.hasAttribute('required');
      var ok = bos ? !zorunlu : tcKimlikGecerli(input.value);
      input.setCustomValidity(ok ? '' : 'Lütfen geçerli bir TC Kimlik No girin.');
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (mesaj) mesaj.hidden = ok;
      return ok;
    }
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, 11);
      if (input.value.length === 11 || input.value === '') kontrol();
    });
    input.addEventListener('blur', kontrol);
    if (form) {
      form.addEventListener('submit', function (e) {
        if (!kontrol()) { e.preventDefault(); input.focus(); }
      });
    }
  }

  function baslat() {
    document.querySelectorAll('input[data-tc-kimlik]').forEach(bagla);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
  else baslat();
  document.addEventListener('shopify:section:load', baslat);
})();

# Shopify Türkiye

Türkiye'de satış yapan Shopify mağazaları için ücretsiz, açık kaynak Liquid snippet'leri ve kontrol listesi. Tüm parçalar Online Store 2.0 temalarıyla (Dawn, Horizon ve türevleri) çalışacak şekilde yazıldı ve herhangi bir uygulama gerektirmez.

Hazırlayan: [Robotik Web](https://robotikweb.com.tr), Shopify Partner.

## İçindekiler

| Dosya | Ne işe yarar |
|---|---|
| `snippets/tc-kimlik-alani.liquid` + `assets/tc-kimlik.js` | Sepet sayfasına TC Kimlik No alanı ekler, numarayı resmî algoritmayla doğrular ve siparişe kaydeder |
| `snippets/ucretsiz-kargo-cubugu.liquid` | "Ücretsiz kargo için 120 TL daha ekleyin" ilerleme çubuğu |
| `snippets/tahmini-kargo-tarihi.liquid` | "Şimdi sipariş verirseniz Pazartesi kargoya verilir" bilgisi; hafta sonlarını ve resmî tatilleri atlar |
| `snippets/whatsapp-siparis.liquid` | Ürün adı, varyant ve bağlantıyla dolu "WhatsApp ile sor" butonu |
| `snippets/havale-eft-bilgi.liquid` | Banka, alıcı ve IBAN bilgisini gösteren, tek tıkla IBAN kopyalayan Havale/EFT kutusu |
| `snippets/whatsapp-destek-butonu.liquid` | Tüm sayfalarda köşede duran, mobil uyumlu sabit WhatsApp destek butonu; ürün sayfasında ürün adını mesaja ekler |
| `snippets/kdv-dahil-etiketi.liquid` | Fiyatın altına mağazanın vergi ayarına göre "KDV dahil" (isteğe bağlı "KDV hariç") etiketi; ürün kartlarında ve sepette de kullanılır |
| `snippets/stok-azaldi-uyarisi.liquid` | Envanteri takip edilen varyantlarda stok eşiğin altına inince "Stokta son 3 ürün kaldı" uyarısı; varyant değişince güncellenir |
| `snippets/mesafeli-satis-onayi.liquid` | Sepette "Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi'ni okudum" onay kutusu; işaretlenmeden ödemeye geçilmez, onay siparişe kaydedilir |
| `snippets/cerez-bilgilendirme-bandi.liquid` | Çerez politikası bağlantılı, "Anladım" ile kapanan sade KVKK çerez bilgilendirme bandı; kapatılınca belirlenen süre boyunca tekrar çıkmaz |
| `snippets/kapida-odeme-bilgi.liquid` | Ürün sayfasında ve sepette kapıda ödeme notu; hizmet bedelini, tutar sınırlarını ve kapıda ödeme olmayan ürünleri mağaza sahibinin verdiği değerlerle gösterir |

## Kurulum

1. Shopify yönetim panelinde **Online Mağaza > Temalar** bölümüne gidin ve temanızın **kopyasını** oluşturun. Değişiklikleri önce kopyada deneyin.
2. Kopya temada **⋯ > Kodu düzenle**'yi açın.
3. `snippets` klasöründeki dosyaları aynı adla **Snippets** altına, `assets` klasöründeki dosyaları **Assets** altına ekleyin.
4. Snippet'i kullanmak istediğiniz yere `render` etiketiyle çağırın (örnekler aşağıda).
5. Önizlemede kontrol edin, sorun yoksa temayı yayınlayın.

### TC Kimlik No alanı

Sepet formunun içine (`<form action="{{ routes.cart_url }}" ...>` ile `</form>` arasına) ekleyin. Dawn tabanlı temalarda bu form `sections/main-cart-footer.liquid` dosyasındadır.

```liquid
{% render 'tc-kimlik-alani' %}
{% render 'tc-kimlik-alani', zorunlu: true %}
```

Numara siparişe "TC Kimlik No" sepet özelliği olarak kaydedilir ve sipariş detayında "Ek ayrıntılar" altında görünür. Doğrulama yalnızca numaranın biçimini kontrol eder, kişinin kimliğini doğrulamaz.

> **KVKK notu:** TC Kimlik No kişisel veridir. Yalnızca gerçekten gerekiyorsa isteyin ve aydınlatma metninizde amacını belirtin.

### Ücretsiz kargo çubuğu

```liquid
{% render 'ucretsiz-kargo-cubugu', esik: 150000 %}
```

`esik` kuruş cinsindendir: 1.500 TL = `150000`.

### Tahmini kargo tarihi

Ürün sayfasında, sepete ekle butonunun altına:

```liquid
{% render 'tahmini-kargo-tarihi', son_saat: 15 %}
{% render 'tahmini-kargo-tarihi', son_saat: 14, hazirlik_gun: 1, ek_tatiller: '2026-12-31' %}
```

Sabit resmî tatiller (1 Ocak, 23 Nisan, 1 Mayıs, 19 Mayıs, 15 Temmuz, 30 Ağustos, 29 Ekim) otomatik atlanır. Ramazan ve Kurban Bayramı tarihleri her yıl değiştiği için `ek_tatiller` ile siz eklemelisiniz.

### WhatsApp ile sor butonu

```liquid
{% render 'whatsapp-siparis', product: product, numara: '905321234567' %}
```

### Havale / EFT bilgi kutusu

Ürün sayfası, sepet sayfası veya "Ödeme bilgileri" gibi bir sayfada:

```liquid
{% render 'havale-eft-bilgi', iban: 'TR00 0000 0000 0000 0000 0000 00', alici: 'Örnek Ticaret Ltd. Şti.', banka: 'Banka Adı' %}
```

IBAN dörtlü gruplar hâlinde gösterilir; "Kopyala" butonu boşluksuz hâlini panoya kopyalar. Müşteriye göstermek istediğiniz notu (ör. ödeme süresi) `aciklama` ile kendiniz yazın; snippet varsayılan bir kural eklemez. Tema düzenleyicide IBAN'ın doğrulama hanesi tutmuyorsa yalnızca size bir uyarı gösterilir. Havale/EFT'yi ödeme yöntemi olarak sunmak için **Ayarlar > Ödemeler > Manuel ödeme yöntemleri** bölümünden ayrıca etkinleştirmeniz gerekir.

### Sabit WhatsApp destek butonu

`layout/theme.liquid` dosyasında `</body>` etiketinin hemen üstüne:

```liquid
{% render 'whatsapp-destek-butonu', numara: '905321234567' %}
{% render 'whatsapp-destek-butonu', numara: '905321234567', metin: 'Bize yazın', konum: 'sol', alt_bosluk: 80, gizle: 'cart,password' %}
```

Buton tüm sayfalarda sağ (veya sol) alt köşede durur; ürün sayfalarında hazır mesaja ürün adı ve bağlantısı eklenir (`urun_bilgisi: false` ile kapatılır). `metin` yazısı telefonda yer kaplamaması için gizlenir, yalnızca simge kalır. Telefonda sabit "Sepete ekle" çubuğu, çerez bandı veya sohbet balonuyla çakışıyorsa `alt_bosluk` değerini artırın ya da `konum: 'sol'` kullanın. JavaScript kullanmaz.

### "KDV dahil" fiyat etiketi

Ürün kartlarında Dawn tabanlı temalarda `snippets/card-product.liquid` içindeki `render 'price'` satırının altına; sepette toplam tutarın yanına:

```liquid
{% render 'kdv-dahil-etiketi', kucuk: true %}
{% render 'kdv-dahil-etiketi', stil: 'rozet', haric_metin: 'KDV hariç', ek_metin: 'Kargo ödeme adımında hesaplanır.' %}
```

Etiket yalnızca mağazanızın vergi ayarı fiyatlara vergiyi dahil ediyorsa (`cart.taxes_included`) görünür; değilse `haric_metin` verdiyseniz o, vermediyseniz hiçbir şey gösterilmez. Snippet oran göstermez veya hesaplamaz; `ek_metin` için varsayılan bir ifade yoktur, kendi metninizi yazın. Dawn ürün sayfasında fiyatın altında zaten vergi satırı gösterebilir; orada kullanacaksanız çift yazı olmaması için temanın satırını kaldırın. JavaScript kullanmaz.

### Stok azaldı uyarısı

Ürün sayfasında, fiyatın veya "Sepete ekle" butonunun yakınına:

```liquid
{% render 'stok-azaldi-uyarisi', urun: product %}
{% render 'stok-azaldi-uyarisi', urun: product, esik: 3, metin: 'Bu üründen yalnızca [adet] adet kaldı.' %}
```

Seçili varyantın gerçek stoğu 1 ile `esik` (varsayılan 5) arasındaysa uyarı görünür; `[adet]` yerine stok sayısı yazılır. Envanteri takip edilmeyen, tükenmiş veya stokta yokken satışa devam eden varyantlarda uyarı çıkmaz. Müşteri varyant değiştirdikçe güncellenir. Sayfa kaynağına yalnızca eşiğin altındaki stok adetleri yazılır. Dawn'ın yerleşik "Envanter durumu" bloğunu kullanıyorsanız ikisini birlikte kullanmayın.

### Mesafeli satış sözleşmesi onay kutusu

Önce **Online Mağaza > Sayfalar** bölümünde ön bilgilendirme formu ve mesafeli satış sözleşmesi sayfalarınızı kendi metninizle oluşturun. Dawn tabanlı temalarda `sections/main-cart-footer.liquid` (sepet sayfası) ve `snippets/cart-drawer.liquid` (sepet çekmecesi) içinde `<div class="cart__ctas"` satırının hemen üstüne:

```liquid
{% render 'mesafeli-satis-onayi', on_bilgi_url: '/pages/on-bilgilendirme-formu', sozlesme_url: '/pages/mesafeli-satis-sozlesmesi', form_kimligi: 'cart' %}
{% render 'mesafeli-satis-onayi', on_bilgi_url: '/pages/on-bilgilendirme-formu', sozlesme_url: '/pages/mesafeli-satis-sozlesmesi', form_kimligi: 'CartDrawer-Form' %}
```

Kutu işaretlenmeden "Ödeme" butonu ödemeye geçirmez ve Türkçe bir uyarı gösterir; işaretlendiğinde onay siparişe "Sözleşme onayı" sepet özelliği olarak kaydedilir. Bağlantılar yeni sekmede açılır. Snippet hiçbir sözleşme metni içermez; cümleyi `metin` ile değiştirebilirsiniz. Kontrol yalnızca sepet ve sepet çekmecesindedir: ürün sayfasındaki "Hemen al" ve sepetteki hızlı ödeme (Shop Pay, PayPal vb.) butonları sepeti atladığı için onları tema düzenleyiciden kapatın. Metinlerin içeriği ve sürecin yeterliliği için hukuk danışmanınıza danışın.

### KVKK çerez bilgilendirme bandı

Önce **Online Mağaza > Sayfalar** bölümünde çerez politikası sayfanızı kendi metninizle oluşturun. `layout/theme.liquid` dosyasında `</body>` etiketinin hemen üstüne:

```liquid
{% render 'cerez-bilgilendirme-bandi', politika_url: '/pages/cerez-politikasi' %}
{% render 'cerez-bilgilendirme-bandi', politika_url: '/pages/cerez-politikasi', metin: 'Kendi bilgilendirme cümleniz.', konum: 'ust', sure_gun: 90, surum: '2' %}
```

Bant ilk ziyarette altta (veya `konum: 'ust'` ile üstte) görünür; "Anladım"a basılınca kapanır ve `sure_gun` (varsayılan 365) gün boyunca o tarayıcıda yeniden çıkmaz. Politikanızı güncellediğinizde `surum` değerini değiştirirseniz bant herkese yeniden gösterilir. Kapatma bilgisi çerezle değil localStorage ile tutulur. Bant yalnızca bilgilendirir: çerezleri engellemez ve onay toplamaz. Zorunlu olmayan çerezler için açık rıza gerekip gerekmediğini hukuk danışmanınızla değerlendirin; onay toplamanız gerekiyorsa Shopify'ın **Ayarlar > Müşteri gizliliği > Çerez bandı** özelliğini kullanın ve iki bandı birlikte açmayın. Varsayılan cümle yalnızca "Bu sitede çerezler kullanılmaktadır." der; kendi metninizi `metin` ile yazın.

### Kapıda ödeme bilgi notu

Ürün sayfasında "Sepete ekle" butonunun altına; sepette (Dawn tabanlı temalarda `sections/main-cart-footer.liquid` ve `snippets/cart-drawer.liquid`) toplam tutarın yakınına:

```liquid
{% render 'kapida-odeme-bilgi', urun: product, odeme_secenekleri: 'Nakit veya kartla ödeyebilirsiniz.' %}
{% render 'kapida-odeme-bilgi', sepet: true, ucret: 2500, ust_limit: 500000 %}
```

`ucret`, `alt_limit` ve `ust_limit` kuruş cinsindendir (25 TL = `2500`); verilmezse gösterilmez. `kapida-odeme-yok` etiketli ürünlerde (etiketi `haric_etiket` ile değiştirebilirsiniz) "kapıda ödeme kullanılamaz" yazar. `sepet: true` ile sepet toplamı sınırların dışındaysa veya sepette hariç ürün varsa not buna göre değişir. Snippet yalnızca bilgi verir: siparişe ücret eklemez, ödeme sayfasında kapıda ödemeyi kısıtlamaz ve hiçbir ücret veya kural varsaymaz; değerlerin ödeme sayfanız ve kargo sözleşmenizle tutarlı olduğundan emin olun. Kapıda ödemeyi **Ayarlar > Ödemeler > Manuel ödeme yöntemleri** bölümünden ayrıca açmanız gerekir. JavaScript kullanmaz.

## Türkiye için Shopify kontrol listesi

Türk Shopify mağazalarında en sık atlanan ayarlar:

- **Ödeme:** Shopify Payments Türkiye'de açık değildir. iyzico, PayTR veya Param gibi bir ödeme kuruluşu kurulmalı; taksit seçenekleri ödeme sayfasında doğru görünmeli.
- **İşlem ücreti:** Shopify Payments dışındaki ödeme kuruluşlarında Shopify pakete göre ek işlem ücreti alır; toplam maliyeti hesaplarken unutmayın.
- **Yasal sayfalar:** Mesafeli satış sözleşmesi, ön bilgilendirme formu, KVKK aydınlatma metni, iade ve değişim koşulları.
- **Fatura:** E-arşiv veya e-fatura entegrasyonu ve bireysel/kurumsal fatura bilgisi toplama.
- **Kargo:** Kargo firması entegrasyonu ve takip numarasının müşteriye otomatik iletilmesi.
- **Dil:** Mağaza dili Türkçe olmalı (`<html lang="tr">`). Aksi halde CSS `text-transform: uppercase` "i" harfini "İ" yerine "I" yapar.
- **Teknik SEO:** Görsel alt metinleri, sayfa başına tek H1, meta açıklamalar ve sosyal paylaşım görseli. Robotik Web'in [Türkiye E-Ticaret Altyapı Raporu](https://robotikweb.com.tr/turkiye-e-ticaret-raporu)'nda bunlar Türk e-ticaret sitelerinde en sık görülen eksikler arasında.

Mağazanızı bu listeye göre ücretsiz kontrol etmek için [Robotik sesli mağaza analizi](https://robotikweb.com.tr/robotik) aracını kullanabilirsiniz.

## Katkı

Hata bildirimi ve önerileriniz için issue açabilir veya pull request gönderebilirsiniz.

## Lisans

MIT. Ticari projelerde dahil serbestçe kullanabilir ve değiştirebilirsiniz.

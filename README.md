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

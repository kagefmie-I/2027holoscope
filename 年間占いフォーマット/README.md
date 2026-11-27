# 2027年の星占い冊子

参照PDFの12ページ（B6判、128×182mm）をHTML/CSSで組み、星座別PNGとSVG部品からPDFを生成します。

## PDF生成

```powershell
npm install
node build.mjs --sign libra --input 20261113依頼者名2027年間占い.md
```

出力先は `output/pdf/` です。PDF名は入力したMarkdownと同じ名前になり、拡張子だけ `.pdf` に変わります。たとえば `20261113依頼者名2027年間占い.md` を入力すると、`output/pdf/20261113依頼者名2027年間占い.pdf` ができます。出力先や名前を指定したい場合は、従来どおり `--output` を追加できます。

星座コード: `aries`, `taurus`, `gemini`, `cancer`, `leo`, `virgo`, `libra`, `scorpio`, `sagittarius`, `capricorn`, `aquarius`, `pisces`。Edgeが標準の場所にない場合は環境変数 `PDF_BROWSER` でブラウザ実行ファイルを指定します。

## 表紙のカメオ位置

`portrait-positions.json` に星座ごとの位置を設定します。`scale` は拡大率、`x` と `y` は切り抜き位置（%）です。目視で値を調整して保存したあと、同じ星座コードでPDFを再生成すると、その星座の設定だけが表紙に反映されます。初期値は全星座共通の仮設定なので、必要に応じて個別に調整してください。

## 原稿

個別鑑定原稿は、p05〜p07それぞれに可変見出し（Markdownの `##`）と本文を入れます。p08は固定見出し「12ヶ月のタロット予報」の下に、12枚を並べた画像を1枚置き、その下に `1月：占い本文` から `12月：占い本文` を続けます。まとめ画像は `assets/` 以下に置き、たとえば `![12ヶ月のタロット](assets/tarot/12-month-spread.png)` と指定します。

担当メイドさんのお言葉は原稿に書かず、`assets/2027お言葉_{星座名}.png` 形式の画像から自動で選びます。たとえば `--sign libra` なら `assets/2027お言葉_天秤座.png` が11ページにそのまま挿入されます。画像サイズはページ内に収まるよう調整されます。

共通ページの構成は固定です。p03・p04のワークシート、p09・p10の月別記録枠、案内ページは参照PDFの位置に合わせています。

## 素材

`assets/` には参照PDFで使われているSVG（`hyoushi_waku.svg`, `maru_nakami.svg`, `maru_frill.svg`, `maid_kazari.svg`, `hoshi_kazari.svg`, `swallow.svg`, `venus.svg`, `strawberry.svg`, `monthly_waku.svg`, `箇条書き頭.svg`）と12星座の `○○座_透過.png` を収録しています。

表紙と裏表紙の担当メイド画像は同じPNGです。CSSの `--portrait-scale`, `--portrait-x`, `--portrait-y` でカメオ内の顔位置を、`--back-silhouette-scale`, `--back-silhouette-x`, `--back-silhouette-y` で裏表紙シルエットを個別に調整できます。12星座の背景色は `styles.css` の `--sign-*` にカラーコードで定義しています。

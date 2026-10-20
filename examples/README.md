# examples

参考実装です。読むだけで、ここは編集しません。
どれも `experiment/` と同じファイル構成なので、近いものを `experiment/` にコピーして書き換えると始めやすくなります。

| フォルダ | 内容 | 見どころ |
| --- | --- | --- |
| `stroop/` | 色と文字の一致／不一致で反応時間を比べる | キー反応、練習とフィードバック、`on_finish` での正誤計算 |
| `rating/` | 図形の印象をスライダーで評定する | 参加者間条件（教示が変わる）、画像の preload |
| `listening/` | 短い音を聞いて心地よさを評定する | 音声の preload、音が終わってから回答、事後の質問紙 |

## 使いかた

`experiment/` の中身を入れ替えます。**消す前に、今の `experiment/` を取っておいてください。**

```bash
cp -R examples/stroop/. experiment/
```

コピーした `.ts` ファイルの中には `from "../../src/engine/types"` と書いてあります。`experiment/` は 1 階層浅いので、`../src/engine/types` に直します。

```bash
sed -i '' 's#\.\./\.\./src/#../src/#' experiment/*.ts    # macOS
```

そのあと、`npm run validate` → `npm run dev` の順で確かめます。

## 音声について

`listening/assets/audio/` の音は、サイン波から作った短い音です。著作権の問題はありません。
他人が著作権を持つ音源や画像を使うときは、利用条件を確認してください。

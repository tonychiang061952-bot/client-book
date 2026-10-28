# 客戶經營名單系統｜設定說明


業務用 Google 帳號登入，各自建立人脈名單；管理員在「團隊後台」檢視全部業務的名單狀況。業務之間互相看不到彼此的名單。

- **網頁**：放在 GitHub Pages（免費）
- **登入與資料庫**：Google Firebase（Authentication + Cloud Firestore，免費額度足夠 20–50 人團隊）
- **權限**：由 `firestore.rules` 在資料庫端強制執行，不靠網頁程式。就算有人改了網頁程式碼，也讀不到別人的名單。

全部設定約 30 分鐘，只需要做一次。

> **兩種設定方式**
> - **自己動手**：照下面步驟做，約 30 分鐘。
> - **交給 Claude**：如果你有 Claude 桌面版，把這份檔案包和這份說明丟給 Claude，請它「照 README 幫我架設」。過程中需要你本人登入 Google 和 GitHub、按幾次確認。
>
> 這是一套獨立系統：資料存在**你自己的** Firebase，跟其他團隊完全分開。

---

## 檔案說明

| 檔案 | 用途 | 需要修改嗎 |
|---|---|---|
| `index.html` | 網頁本體（版面與樣式） | 不用 |
| `app.js` | 系統功能 | 不用 |
| `backend.js` | 連接 Firebase | 不用 |
| `config.js` | Firebase 專案設定、團隊名稱 | **要**（步驟 2，並把 `TEAM` 的「○○○ 團隊」改成你的團隊名稱） |
| `firestore.rules` | 資料庫權限規則 | 不用，貼到 Firebase（步驟 4） |

---

## 一、建立 Firebase 專案（約 15 分鐘）

### 步驟 1　建立專案
1. 用你的 Google 帳號登入 https://console.firebase.google.com
2. 點「建立專案」，名稱例如 `client-book`。
3. Google Analytics 可以關閉，然後建立。

### 步驟 2　取得設定碼，填進 `config.js`
1. 專案首頁點網頁圖示 `</>`（新增應用程式 → 網頁）。
2. 暱稱填 `client-book`，**不用**勾選 Firebase Hosting，按「註冊應用程式」。
3. 畫面會出現一段 `const firebaseConfig = { apiKey: "...", ... }`。
4. 用記事本打開 `config.js`，把 `apiKey`、`authDomain`、`projectId`、`storageBucket`、`messagingSenderId`、`appId` 六個值逐一換掉，存檔。

> 這組設定碼放在公開網頁上是正常的，Firebase 的安全性靠的是步驟 4 的權限規則，不是隱藏設定碼。

### 步驟 3　開啟 Google 登入
1. 左側選單「建構」→「Authentication」→「開始使用」。
2. 「登入方式」分頁 → 選「Google」→ 開啟「啟用」。
3. 「專案支援電子郵件」選你的信箱 → 儲存。

### 步驟 4　建立資料庫並貼上權限規則
1. 左側「建構」→「Firestore Database」→「建立資料庫」。
2. 位置選 **`asia-east1`（台灣）**，建立後不能更改。
3. 選「**以正式版模式啟動**」→ 建立。
4. 進入「規則」分頁，把原本內容全部刪掉，貼上 `firestore.rules` 的完整內容 → 按「發布」。

---

## 二、把網頁放上 GitHub（約 10 分鐘）

### 步驟 5　建立 repository 並上傳
1. 登入 https://github.com，右上角「+」→「New repository」。
2. Repository name 例如 `client-book`，選 **Public**（免費的 GitHub Pages 需要公開 repo；公開的只有程式碼，客戶資料在 Firebase，外人看不到）。
3. 按「Create repository」。
4. 在新 repo 頁面點「uploading an existing file」，把 `index.html`、`app.js`、`backend.js`、`config.js`（已填好設定）、`firestore.rules`、`README.md` 全部拖進去 → 按「Commit changes」。

### 步驟 6　開啟 GitHub Pages
1. repo 上方「Settings」→ 左側「Pages」。
2. Source 選「Deploy from a branch」，Branch 選 `main`、資料夾 `/ (root)` → Save。
3. 等 1–2 分鐘，頁面上方會出現網址，例如 `https://你的帳號.github.io/client-book/`。

### 步驟 7　把網址加入 Firebase 授權網域
1. 回到 Firebase →「Authentication」→「設定」分頁 →「授權網域」。
2. 「新增網域」→ 填 `你的帳號.github.io`（不含 https:// 和後面的路徑）→ 新增。

沒做這步，登入時會出現「這個網址尚未加入 Firebase 的授權網域」。

---

## 三、設定自己為管理員（約 3 分鐘）

### 步驟 8
1. 打開你的網址，用你自己的 Google 帳號登入。畫面會顯示「帳號已建立・等待開通」。
2. 展開「使用者 ID（系統設定用）」→ 按「複製」。
3. 回到 Firebase →「Firestore Database」→「資料」分頁 →「+ 開始集合」。
   - 集合 ID：`admins`
   - 文件 ID：貼上剛剛複製的使用者 ID
   - 欄位：名稱 `role`、類型 string、值 `owner`
   - 儲存
4. 回到網頁重新整理，你會直接進入系統，右上角出現「我的名單／團隊後台」切換。

之後要增加其他主管，用同樣方式把對方的使用者 ID 加進 `admins` 集合即可。

---

## 四、邀請業務

1. 把網址傳給業務（LINE 也可以，系統會自動跳到手機的瀏覽器開啟）。
2. 業務用 Google 帳號登入，填寫姓名，畫面顯示「等待開通」。
3. 你在「團隊後台」上方的「待開通申請」按「開通」。業務的畫面會自動進入系統。

> 建議業務把網址「加入主畫面」，用起來就像 App。

---

## 五、確認業務之間真的看不到彼此（建議做一次）

Firebase 主控台有內建的規則模擬器，可以在不寫任何程式的情況下驗證：

1. 「Firestore Database」→「規則」分頁 → 右上「規則模擬器」（Rules Playground）。
2. 模擬類型選 `get`，位置填 `users/業務A的ID/clients/任意文字`。
3. 開啟「已驗證」，Firebase UID 填 **業務B的ID** → 執行。
4. 應該顯示 **「拒絕」**。把 UID 換成業務 A 自己的 ID，則顯示「允許」；換成你的管理員 ID，也是「允許」。

業務的 ID 可以在「Firestore Database」→「資料」→ `users` 集合裡看到（每份文件的 ID 就是業務的使用者 ID）。

---

## 權限總表

| 動作 | 業務本人 | 其他業務 | 管理員 |
|---|---|---|---|
| 看自己的名單 | ✅（已開通） | ❌ | ✅ 唯讀 |
| 新增／修改／刪除名單 | ✅（已開通） | ❌ | ❌ |
| 看業務清單 | ❌ | ❌ | ✅ |
| 開通／停用帳號 | ❌ | ❌ | ✅ |
| 待開通帳號建立名單 | ❌ | — | — |

**業務離職時**：在團隊後台按「停用」。對方就無法再登入使用，但他建立的名單會完整保留，你仍可檢視與匯出。

---

## 日常管理與注意事項

- **備份**：建議每月在團隊後台按「匯出全團隊 Excel」存一份。
- **免費額度**（Firebase Spark 方案）：每天 5 萬次讀取、2 萬次寫入、1 GB 儲存。20 人團隊日常使用遠低於上限；超過當天只會暫停寫入，不會自動收費。
- **示範資料**：業務可以載入 6 筆示範名單練習，示範資料不會列入團隊後台統計。
- **個資**：名單屬客戶個人資料，請先讓團隊知道主管可以檢視名單，且僅限內部經營使用。

## 常見問題

**按登入沒反應／跳出錯誤**
- 「尚未加入授權網域」→ 做步驟 7。
- 在 LINE、Facebook、Instagram 裡開啟 → Google 不允許在內建瀏覽器登入，請改用 Safari／Chrome。LINE 會自動轉開，其他 App 請點右上角「用瀏覽器開啟」。

**登入後顯示「資料庫拒絕存取」**
- 規則沒有發布成功 → 重做步驟 4 的第 4 點。

**畫面顯示「尚未完成系統設定」**
- `config.js` 還沒填，或上傳的是沒填的版本 → 重做步驟 2，再到 GitHub 重新上傳 `config.js`。

**團隊後台顯示「需要建立資料庫索引」**
- 在電腦版 Chrome 打開團隊後台，按 F12 →「Console」，錯誤訊息裡會有一條 Firebase 連結，點開後按「建立索引」，等幾分鐘即可。一般情況不會遇到。

**要修改團隊名稱或副標題**
- 編輯 `config.js` 最下面的 `TEAM`，重新上傳即可。

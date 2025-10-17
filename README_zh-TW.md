# SDK日誌分析器

🌐 **Language**: [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [English](README.md)

---

## 📖 關於本工具

本工具專門用於分析 **Azure Speech SDK 的日誌檔案**。

### 什麼是 Azure Speech SDK 日誌？

Azure Speech SDK 在啟用日誌記錄功能後，會自動生成詳細的診斷日誌檔案。這些日誌包含：
- WebSocket 連接資訊
- 音頻處理事件
- 語音識別結果
- 效能指標
- 線程執行軌跡

### 如何生成日誌檔案？

在使用 Azure Speech SDK 時，只需啟用日誌記錄功能即可自動生成日誌檔案：

```python
import azure.cognitiveservices.speech as speechsdk

# 啟用日誌記錄
speechsdk.logging.set_log_level(speechsdk.logging.LogLevel.Verbose)
```

📚 **詳細文檔**：[Azure Speech SDK 日誌記錄指南](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-use-logging?pivots=programming-language-python)

---

## 🚀 快速開始（僅需 3 步驟！）

> 💡 **新手友好**: 無需配置 Python 環境，雙擊即可運行！

### ⚡ Windows 快速啟動

#### 1️⃣ 下載專案
```bash
git clone https://github.com/s-chyi/azure-speech-sdk-log-analyzer.git
cd azure-speech-sdk-log-analyzer
```

#### 2️⃣ 雙擊運行
找到並雙擊 **`start.bat`** 檔案

#### 3️⃣ 開始使用
- 瀏覽器會自動開啟 (http://localhost:5001)
- 拖放 `.log` 或 `.txt` 日誌檔案
- 開始分析！

---

## 🔄 版本更新

### 自動檢查
每次啟動時會自動檢查 GitHub 上的最新版本

### 一鍵更新
雙擊 **`update.bat`** 即可更新到最新版本

---

## 💡 使用提示

- **首次運行**: 會自動安裝依賴，約需 30 秒
- **環境支援**: 自動適配 Conda / 虛擬環境 / 系統 Python
- **記憶體管理**: 自動限制緩存，確保低資源佔用
- **資料隱私**: 所有資料僅在本地處理，不會上傳

---

## ✨ 功能特色

- **智能會話識別**：自動從日誌中提取所有會話並分別分析
- **多線程追蹤**：精確追蹤主線程、後台線程、音頻線程等
- **視覺化時間線**：清晰的事件時間線，支援分類篩選
- **效能指標分析**：深度分析延遲、音頻上傳速率等關鍵指標
- **日誌下載功能**：支援完整會話日誌和按線程下載
- **多語言支持**：繁體中文、簡體中文、英文界面
- **響應式設計**：完美支援桌面和移動設備

## 系統要求

### 必需
- ✅ Windows 10 或更高版本
- ✅ Python 3.7+ (推薦 3.9+)

### 可選
- Git (用於版本更新)
- Conda (會自動檢測)

### 硬體建議
- 💾 2GB RAM (推薦 4GB)
- 💿 100MB 可用空間

## 使用方法

### 1. 上傳日誌文件
- 支援 `.txt` 和 `.log` 格式
- 檔案大小限制：100MB
- 支援拖拽上傳

### 2. 選擇會話
- 系統會自動識別日誌中的所有會話
- 每個會話卡片顯示基本資訊
- 點擊卡片進入詳細分析

### 3. 分析會話詳情
- **基本資訊**：會話 ID、持續時間、行數
- **效能指標**：WebSocket 訊息、音頻塊、上傳速率
- **線程分析**：完整的線程追蹤和關係圖
- **事件時間線**：完整的事件序列
- **日誌下載**：支援完整會話或按線程下載

## 支援的日誌格式

系統能識別以下關鍵日誌模式：

### 會話識別
- `SessionId: [UUID]`
- `SessionStarted event`

### 效能指標
- `read frame duration: Xms` - 音頻幀讀取時間
- `unacknowledgedAudioDuration = Xmsec` - 未確認音頻時間
- `RESULT-RecognitionLatencyMs value='X'` - 服務端識別延遲
- `Web socket upload rate X KB/s` - 上傳速率

### 線程追蹤
- 主線程 (Main Thread)
- 啟動線程 (Kickoff Thread)
- 後台線程 (Background Thread)
- 使用者線程 (User Thread)
- 音頻線程 (Audio Thread)
- GStreamer 線程

### 關鍵事件
- `StartRecognitionAsync` / `StopRecognitionAsync`
- `Opening websocket completed`
- `speech.startDetected` / `speech.endDetected`
- `speech.hypothesis` / `speech.phrase`

## 目錄結構

```
sdk_log_analyzer/
├── start.bat              # 一鍵啟動腳本
├── update.bat             # 一鍵更新腳本
├── config.py              # 配置管理
├── version_check.py       # 版本檢查工具
├── app.py                 # Flask 主應用程式
├── log_parser.py          # 日誌解析引擎
├── requirements.txt       # Python 依賴
├── README.md              # 專案文檔（本檔案）
├── QUICKSTART.md          # 快速開始指南
├── CHANGELOG.md           # 更新日誌
├── .gitignore             # Git 忽略規則
├── templates/
│   └── index.html         # 前端頁面
├── static/
│   ├── style.css          # 樣式文件
│   ├── script.js          # JavaScript 邏輯
│   └── translations.js    # 多語言翻譯
└── uploads/               # 上傳文件緩存
```

## 技術架構

- **後端**：Flask (Python)
- **前端**：HTML5 + CSS3 + JavaScript (ES6+)
- **樣式**：響應式設計，深色主題
- **圖標**：Font Awesome 6.0
- **緩存**：LRU 緩存機制
- **多語言**：支援繁中、簡中、英文

## 瀏覽器支援

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 常見問題

### Q: 為什麼某些會話沒有被識別？
A: 確保日誌包含 `SessionId:` 標記。系統依賴此標記來識別會話邊界。

### Q: 可以分析多大的日誌文件？
A: 目前支援最大 100MB 的日誌文件。

### Q: 日誌檔案會被儲存嗎？
A: 不會，每次啟動應用時會自動清理舊檔案，確保資料隱私。

### Q: 支援哪些作業系統？
A: 目前主要支援 Windows 10+。Mac/Linux 用戶可以手動執行 `python app.py` 啟動。

### Q: 如何生成 Azure Speech SDK 日誌？
A: 請參考 [官方文檔](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-use-logging?pivots=programming-language-python) 了解如何啟用日誌記錄。

## 開發與貢獻

歡迎提交 Issue 和 Pull Request！

### 開發環境設置
1. Clone 專案
2. 安裝依賴：`pip install -r requirements.txt`
3. 運行開發服務器：`python app.py`

### 擴展功能
- 在 `log_parser.py` 中添加新的日誌模式
- 在 `static/script.js` 中添加前端功能
- 在 `static/translations.js` 中添加新的翻譯
- 在 `static/style.css` 中調整樣式

---

## 📞 聯繫方式

**作者**: Nick Shieh  
**Email**: nickshieh@microsoft.com  
**版本**: 1.0.0  
**許可證**: MIT License

---

## 🙏 致謝

感謝所有使用和貢獻本專案的開發者！

---

**最後更新**: 2025-01-16

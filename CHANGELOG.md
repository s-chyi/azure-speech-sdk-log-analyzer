# 更新日誌

所有重要的變更都會記錄在此檔案中。

版本號格式遵循 [語義化版本](https://semver.org/lang/zh-TW/)。

---

## [1.2.0] - 2025-10-20

### 🎨 使用者介面改進

#### 指標名稱標準化
- 🔧 **統一指標名稱為日誌原始名稱**：所有指標在各語言版本中均使用與日誌相同的英文名稱
  - 將所有指標名稱改為日誌欄位原始名稱（如 `unacknowledgedAudioDuration`、`RecognitionLatencyMs`、`TimeInQueue` 等）
  - 保留 tooltip 中的多語言說明，幫助使用者理解指標含義
  - 方便使用者直接對照日誌進行問題分析和排查

#### 國際化改進
- 🌐 **修正英文介面中文殘留問題**：移除所有硬編碼中文文字
  - 修正圖表中的硬編碼中文（註釋、閾值標籤、座標軸等）
  - 統一使用翻譯系統或英文標籤
  - 改進「關鍵診斷指標」為 "Critical Diagnostic Metrics"

### 🎯 影響範圍

- **指標對照**：使用者可直接以指標名稱搜尋日誌，提升問題排查效率
- **多語言一致性**：所有語言版本的指標名稱統一，避免混淆
- **國際化完整性**：英文介面不再出現中文字元

### 📁 檔案變更

**修改**：
- `static/translations.js` - 統一三種語言的指標名稱為日誌原始英文名稱
- `static/script.js` - 移除硬編碼中文，使用翻譯系統或英文
- `config.py` - 版本號更新至 1.2.0

### 🔍 技術細節

**指標名稱範例**：
- 連接指標：`WebSocket Connection Time`、`turn.start Latency`
- 音頻處理：`unacknowledgedAudioDuration (max)`、`frame duration (avg)`、`TimeInQueue (max)`
- 識別效能：`first hypothesis latency`、`RecognitionLatencyMs (first/avg/range)`
- 上傳效能：`upload rate (avg)`

---

## [1.1.2] - 2025-10-20

### 🐛 重要修復

#### 檔案上傳權限問題修正
- 🔧 **修正 uploads 資料夾權限問題**：解決使用者上傳檔案時出現「Permission denied」錯誤
  
**問題根源**：
- Git 不會追蹤空資料夾，導致從 GitHub clone 專案後缺少 `uploads` 資料夾
- 手動建立的資料夾可能存在權限繼承問題
- Windows 權限繼承機制導致新建立的檔案無法正確獲得寫入權限

**解決方案**：
1. **start.bat 自動建立資料夾**：
   - 新增資料夾檢查和自動建立邏輯
   - 使用 Python 建立資料夾確保正確的權限繼承
   - 在步驟 [4/6] 中執行，確保程式啟動前完成初始化

2. **新增 .gitkeep 檔案**：
   - 在 `uploads/` 目錄下新增 `.gitkeep` 檔案
   - 確保資料夾被 Git 追蹤，使用者 clone 後即有正確的資料夾結構

3. **改善錯誤訊息**：
   - 在 `app.py` 中新增詳細的 PermissionError 處理
   - 提供清楚的解決步驟和常見原因說明
   - 引導使用者檢查權限設定或使用 start.bat 啟動

4. **文檔更新**：
   - 在 README.md FAQ 中新增權限問題解決方案
   - 說明問題發生的原因和完整的解決步驟

### 🎯 影響範圍

- **新使用者體驗**：從 GitHub clone 專案後可直接使用，無需手動建立資料夾
- **錯誤處理**：遇到權限問題時提供明確的解決指引
- **跨平台相容性**：改善 Windows 環境下的資料夾權限處理

### 📁 檔案變更

**新增**：
- `uploads/.gitkeep` - 確保資料夾被 Git 追蹤

**修改**：
- `start.bat` - 新增自動建立 uploads 資料夾的邏輯（步驟 4/6）
- `app.py` - 改善權限錯誤處理和錯誤訊息
- `README.md` - 新增權限問題 FAQ 說明

### 🔍 技術細節

**start.bat 改進**：
```batch
# 使用 Python 建立資料夾確保正確權限
python -c "import os; os.makedirs('uploads', exist_ok=True)"
```

**app.py 錯誤處理**：
```python
except PermissionError as e:
    return jsonify({
        'success': False,
        'error': '詳細的解決方案說明...'
    }), 500
```

---

## [1.1.1] - 2025-10-20

### 🐛 重要修復

#### 主線程識別邏輯修正
- 🔧 **修正主線程識別演算法**：重新設計記憶體地址追蹤邏輯
  - 加入 `name='SPEECH-Region'` 條件篩選，更精確定位關鍵記憶體地址
  - 修正正則表達式，正確提取包含 `0x0x` 前綴的完整記憶體地址格式
  - 改進地址匹配邏輯，支援 `0x` 和 `0x0x` 兩種格式的自動轉換和匹配
  - 確保在多會話場景下正確識別每個會話的主線程

### 🎯 影響範圍

- **會話線程分析**：顯著提升主線程識別準確性
- **多會話支援**：正確處理包含多個會話的日誌檔案
- **線程追蹤**：更可靠的線程關聯和追蹤

### 🔍 技術細節

**修改檔案**：
- `log_parser.py` - `_find_main_thread_by_memory_address()` 方法
  - 新增 SPEECH-Region 特定條件的記憶體地址提取
  - 優化記憶體地址格式處理和匹配演算法
  - 增強調試日誌輸出，方便問題追蹤

**測試結果**：
- ✅ 會話1主線程正確識別（507844）
- ✅ 會話2主線程正確識別（908600）
- ✅ 記憶體地址追蹤邏輯驗證通過

---

## [1.1.0] - 2025-10-19

### ✨ 新增功能

#### 視覺化圖表
- 📊 **識別延遲時間圖表**：使用 Chart.js 視覺化展示每次識別的延遲時間
  - 智能顏色標記（🟢 綠色 <2000ms、🟡 黃色 2000-5000ms、🔴 紅色 >5000ms）
  - 支援懸停顯示詳細資訊
  - 響應式設計，完美支援三語言切換
  - 專業折線圖呈現，清晰展示效能趨勢

### 🐛 修復問題

- 修正文字提取正則表達式，更準確地提取識別結果文字
- 改進延遲時間數據提取邏輯，確保數據完整性

### 🔧 技術改進

- 添加 Chart.js 支援（透過 CDN 引入）
- 新增圖表補丁模組（`static/chart_patch.js`）
- 完善翻譯系統，添加圖表相關翻譯鍵
- 優化前端程式碼結構

### 📁 檔案變更

**新增**：
- `static/chart_patch.js` - 圖表渲染邏輯

**修改**：
- `log_parser.py` - 改進文字提取和延遲數據處理
- `static/script.js` - 整合圖表渲染功能
- `static/translations.js` - 添加圖表翻譯
- `static/style.css` - 圖表相關樣式
- `templates/index.html` - 引入 Chart.js CDN

---

## [1.0.0] - 2025-10-16

### ✨ 新增功能

#### 核心功能
- 🎉 **初始版本發布**
- 🔍 **智能會話識別**：自動從日誌中提取所有會話並分別分析
- 📊 **效能指標分析**：深度分析延遲、音頻上傳速率、未確認音頻時間等
- 🧵 **多線程追蹤系統**：智能識別和追蹤主線程、後台線程、音頻線程等
- ⏱️ **時間線視覺化**：清晰展示事件序列和時間關係
- 📥 **日誌下載功能**：支援完整會話日誌和按線程下載

#### 使用者體驗
- 🖱️ **一鍵啟動**：智能 `start.bat` 腳本，自動檢測環境並配置
- 🔄 **一鍵更新**：`update.bat` 腳本，支援自動更新和備份
- 📡 **自動版本檢查**：啟動時自動檢查 GitHub 最新版本
- 🎨 **響應式界面**：支援拖放上傳，深色主題設計
- 💬 **智能錯誤提示**：友好的錯誤訊息和解決方案建議

#### 技術特性
- ⚡ **LRU 緩存機制**：自動管理記憶體，限制緩存 5 個檔案
- 🧹 **自動清理**：啟動時自動清理舊上傳檔案
- 🔧 **環境自適應**：自動識別 Conda、虛擬環境、系統 Python
- 📦 **配置管理**：統一的 config.py 配置檔案

### 🛠️ 技術架構

- **後端**：Flask 2.3.3
- **前端**：純 JavaScript（無框架依賴）
- **樣式**：響應式 CSS，深色主題
- **圖標**：Font Awesome 6.0
- **依賴管理**：requirements.txt + 自動安裝

### 📁 專案結構

```
sdk_log_analyzer/
├── start.bat              # 一鍵啟動腳本
├── update.bat             # 一鍵更新腳本
├── config.py              # 配置管理
├── version_check.py       # 版本檢查工具
├── app.py                 # Flask 主應用
├── log_parser.py          # 日誌解析引擎
├── requirements.txt       # Python 依賴
├── README.md              # 專案文檔
├── QUICKSTART.md          # 快速開始指南
├── CHANGELOG.md           # 更新日誌（本檔案）
├── .gitignore             # Git 忽略規則
├── templates/
│   └── index.html         # 前端頁面
├── static/
│   ├── script.js          # JavaScript 邏輯
│   └── style.css          # 樣式
└── uploads/               # 上傳檔案目錄
    └── .gitkeep           # 保持目錄結構
```

### 🎯 支援的日誌格式

- Azure Speech SDK 日誌
- 會話識別：SessionId
- 效能指標：延遲、上傳速率、音頻處理時間
- 事件追蹤：WebSocket 連接、語音檢測、識別結果

### 📊 效能特性

- 支援最大 100MB 日誌檔案
- 自動限制記憶體使用（LRU 緩存）
- 啟動時自動清理臨時檔案
- 支援多會話並行分析

### 🌐 瀏覽器支援

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

---

## [未來計劃]

### 💡 改進建議

- 效能優化：支援更大的日誌檔案
- 使用者體驗：更多的視覺化圖表
- 文檔完善：更多使用案例和範例
- 測試覆蓋：增加自動化測試

---

## 貢獻

歡迎提交 Issue 和 Pull Request！

### 如何貢獻
1. Fork 專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 授權

本專案採用 MIT License - 詳見 LICENSE 檔案

---

## 致謝

感謝所有使用和貢獻本專案的開發者！

---

**最後更新**：2025-10-20  
**維護團隊**：Nick Shieh

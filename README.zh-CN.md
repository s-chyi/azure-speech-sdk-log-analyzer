# SDK日志分析器

🌐 **Language**: [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [English](README.md)

---

## 📖 关于本工具

本工具专门用于分析 **Azure Speech SDK 的日志文件**。

### 什么是 Azure Speech SDK 日志？

Azure Speech SDK 在启用日志记录功能后，会自动生成详细的诊断日志文件。这些日志包含：
- WebSocket 连接信息
- 音频处理事件
- 语音识别结果
- 性能指标
- 线程执行轨迹

### 如何生成日志文件？

在使用 Azure Speech SDK 时，只需启用日志记录功能即可自动生成日志文件：

```python
import azure.cognitiveservices.speech as speechsdk

# 启用日志记录
speech_config.set_property(speechsdk.PropertyId.Speech_LogFilename, "LogfilePathAndName")
```

📚 **详细文档**：[Azure Speech SDK 日志记录指南](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-use-logging?pivots=programming-language-python)

---

## 🚀 快速开始（仅需 3 步骤！）

> 💡 **新手友好**: 无需配置 Python 环境，双击即可运行！

### ⚡ Windows 快速启动

#### 1️⃣ 下载项目
```bash
git clone https://github.com/s-chyi/azure-speech-sdk-log-analyzer.git
cd azure-speech-sdk-log-analyzer
```

#### 2️⃣ 双击运行
找到并双击 **`start.bat`** 文件

#### 3️⃣ 开始使用
- 浏览器会自动打开 (http://localhost:5001)
- 拖放 `.log` 或 `.txt` 日志文件
- 开始分析！

---

## 🔄 版本更新

### 自动检查
每次启动时会自动检查 GitHub 上的最新版本

### 一键更新
双击 **`update.bat`** 即可更新到最新版本

---

## 💡 使用提示

- **首次运行**: 会自动安装依赖，约需 30 秒
- **环境支持**: 自动适配 Conda / 虚拟环境 / 系统 Python
- **内存管理**: 自动限制缓存，确保低资源占用
- **数据隐私**: 所有数据仅在本地处理，不会上传

---

## ✨ 功能特色

- **智能会话识别**：自动从日志中提取所有会话并分别分析
- **多线程追踪**：精确追踪主线程、后台线程、音频线程等
- **可视化时间线**：清晰的事件时间线，支持分类筛选
- **性能指标分析**：深度分析延迟、音频上传速率等关键指标
- **可视化图表**：识别延迟时间图表，智能颜色标记展示性能趋势
- **日志下载功能**：支持完整会话日志和按线程下载
- **多语言支持**：繁体中文、简体中文、英文界面
- **响应式设计**：完美支持桌面和移动设备

## 系统要求

### 必需
- ✅ Windows 10 或更高版本
- ✅ Python 3.7+ (推荐 3.9+)

### 可选
- Git (用于版本更新)
- Conda (会自动检测)

### 硬件建议
- 💾 2GB RAM (推荐 4GB)
- 💿 100MB 可用空间

## 使用方法

### 1. 上传日志文件
- 支持 `.txt` 和 `.log` 格式
- 文件大小限制：100MB
- 支持拖拽上传

### 2. 选择会话
- 系统会自动识别日志中的所有会话
- 每个会话卡片显示基本信息
- 点击卡片进入详细分析

### 3. 分析会话详情
- **基本信息**：会话 ID、持续时间、行数
- **性能指标**：WebSocket 消息、音频块、上传速率
- **线程分析**：完整的线程追踪和关系图
- **事件时间线**：完整的事件序列
- **日志下载**：支持完整会话或按线程下载

## 支持的日志格式

系统能识别以下关键日志模式：

### 会话识别
- `SessionId: [UUID]`
- `SessionStarted event`

### 性能指标
- `read frame duration: Xms` - 音频帧读取时间
- `unacknowledgedAudioDuration = Xmsec` - 未确认音频时间
- `RESULT-RecognitionLatencyMs value='X'` - 服务端识别延迟
- `Web socket upload rate X KB/s` - 上传速率

### 线程追踪
- 主线程 (Main Thread)
- 启动线程 (Kickoff Thread)
- 后台线程 (Background Thread)
- 用户线程 (User Thread)
- 音频线程 (Audio Thread)
- GStreamer 线程

### 关键事件
- `StartRecognitionAsync` / `StopRecognitionAsync`
- `Opening websocket completed`
- `speech.startDetected` / `speech.endDetected`
- `speech.hypothesis` / `speech.phrase`

## 目录结构

```
sdk_log_analyzer/
├── start.bat              # 一键启动脚本
├── update.bat             # 一键更新脚本
├── config.py              # 配置管理
├── version_check.py       # 版本检查工具
├── app.py                 # Flask 主应用程序
├── log_parser.py          # 日志解析引擎
├── requirements.txt       # Python 依赖
├── README.md              # 项目文档（英文）
├── README.zh-TW.md        # 项目文档（繁体中文）
├── README.zh-CN.md        # 项目文档（简体中文）
├── QUICKSTART.md          # 快速开始指南
├── CHANGELOG.md           # 更新日志
├── .gitignore             # Git 忽略规则
├── templates/
│   └── index.html         # 前端页面
├── static/
│   ├── chart_patch.js     # 图表渲染逻辑
│   ├── style.css          # 样式文件
│   ├── script.js          # JavaScript 逻辑
│   └── translations.js    # 多语言翻译
└── uploads/               # 上传文件缓存
```

## 技术架构

- **后端**：Flask (Python)
- **前端**：HTML5 + CSS3 + JavaScript (ES6+)
- **样式**：响应式设计，深色主题
- **图标**：Font Awesome 6.0
- **缓存**：LRU 缓存机制
- **多语言**：支持繁中、简中、英文

## 浏览器支持

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 常见问题

### Q: 为什么某些会话没有被识别？
A: 确保日志包含 `SessionId:` 标记。系统依赖此标记来识别会话边界。

### Q: 可以分析多大的日志文件？
A: 目前支持最大 100MB 的日志文件。

### Q: 日志文件会被储存吗？
A: 不会，每次启动应用时会自动清理旧文件，确保数据隐私。

### Q: 支持哪些操作系统？
A: 目前主要支持 Windows 10+。Mac/Linux 用户可以手动执行 `python app.py` 启动。

### Q: 如何生成 Azure Speech SDK 日志？
A: 请参考 [官方文档](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-use-logging?pivots=programming-language-python) 了解如何启用日志记录。

## 开发与贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置
1. Clone 项目
2. 安装依赖：`pip install -r requirements.txt`
3. 运行开发服务器：`python app.py`

### 扩展功能
- 在 `log_parser.py` 中添加新的日志模式
- 在 `static/script.js` 中添加前端功能
- 在 `static/translations.js` 中添加新的翻译
- 在 `static/style.css` 中调整样式

---

## 📞 联系方式

**作者**: Nick Shieh  
**Email**: nickshieh@microsoft.com  
**版本**: 1.1.1  
**许可证**: MIT License

---

## 🙏 致谢

感谢所有使用和贡献本项目的开发者！

---

**最后更新**: 2025-10-20

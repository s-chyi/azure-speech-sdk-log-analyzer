# SDK Log Analyzer

🌐 **Language**: [English](README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md)

---

## 📖 About This Tool

This tool is specifically designed to analyze **Azure Speech SDK log files**.

### What are Azure Speech SDK Logs?

When logging is enabled in Azure Speech SDK, it automatically generates detailed diagnostic log files. These logs contain:
- WebSocket connection information
- Audio processing events
- Speech recognition results
- Performance metrics
- Thread execution traces

### How to Generate Log Files?

When using Azure Speech SDK, simply enable logging to automatically generate log files:

```python
import azure.cognitiveservices.speech as speechsdk

# Enable logging
speech_config.set_property(speechsdk.PropertyId.Speech_LogFilename, "LogfilePathAndName")
```

📚 **Detailed Documentation**: [Azure Speech SDK Logging Guide](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-use-logging?pivots=programming-language-python)

---

## 🚀 Quick Start (Only 3 Steps!)

> 💡 **Beginner-Friendly**: No Python configuration needed, just double-click to run!

### ⚡ Windows Quick Launch

#### 1️⃣ Download Project
```bash
git clone https://github.com/s-chyi/azure-speech-sdk-log-analyzer.git
cd azure-speech-sdk-log-analyzer
```

#### 2️⃣ Double-Click to Run
Find and double-click the **`start.bat`** file

#### 3️⃣ Start Using
- Browser will open automatically (http://localhost:5001)
- Drag and drop `.log` or `.txt` log files
- Start analyzing!

---

## 🔄 Version Updates

### Automatic Check
Automatically checks for the latest version on GitHub at startup

### One-Click Update
Double-click **`update.bat`** to update to the latest version

---

## 💡 Usage Tips

- **First Run**: Automatically installs dependencies, takes about 30 seconds
- **Environment Support**: Auto-adapts to Conda / Virtual Environment / System Python
- **Memory Management**: Automatically limits cache to ensure low resource usage
- **Data Privacy**: All data is processed locally, never uploaded

---

## ✨ Features

- **Smart Session Detection**: Automatically extracts and analyzes all sessions from logs
- **Multi-Thread Tracking**: Precisely tracks main thread, background thread, audio thread, etc.
- **Visual Timeline**: Clear event timeline with category filtering
- **Performance Metrics Analysis**: In-depth analysis of latency, audio upload rate, and other key metrics
- **Log Download**: Supports full session logs and per-thread downloads
- **Multi-Language Support**: Traditional Chinese, Simplified Chinese, and English interfaces
- **Responsive Design**: Perfect support for desktop and mobile devices

## System Requirements

### Required
- ✅ Windows 10 or higher
- ✅ Python 3.7+ (3.9+ recommended)

### Optional
- Git (for version updates)
- Conda (auto-detected if available)

### Hardware Recommendations
- 💾 2GB RAM (4GB recommended)
- 💿 100MB available space

## How to Use

### 1. Upload Log File
- Supports `.txt` and `.log` formats
- File size limit: 100MB
- Drag-and-drop supported

### 2. Select Session
- System automatically identifies all sessions in the log
- Each session card displays basic information
- Click card to enter detailed analysis

### 3. Analyze Session Details
- **Basic Info**: Session ID, duration, line count
- **Performance Metrics**: WebSocket messages, audio chunks, upload rate
- **Thread Analysis**: Complete thread tracking and relationship diagram
- **Event Timeline**: Complete event sequence
- **Log Download**: Supports full session or per-thread download

## Supported Log Formats

The system recognizes the following key log patterns:

### Session Identification
- `SessionId: [UUID]`
- `SessionStarted event`

### Performance Metrics
- `read frame duration: Xms` - Audio frame read time
- `unacknowledgedAudioDuration = Xmsec` - Unacknowledged audio duration
- `RESULT-RecognitionLatencyMs value='X'` - Server-side recognition latency
- `Web socket upload rate X KB/s` - Upload rate

### Thread Tracking
- Main Thread
- Kickoff Thread
- Background Thread
- User Thread
- Audio Thread
- GStreamer Thread

### Key Events
- `StartRecognitionAsync` / `StopRecognitionAsync`
- `Opening websocket completed`
- `speech.startDetected` / `speech.endDetected`
- `speech.hypothesis` / `speech.phrase`

## Directory Structure

```
sdk_log_analyzer/
├── start.bat              # One-click startup script
├── update.bat             # One-click update script
├── config.py              # Configuration management
├── version_check.py       # Version check tool
├── app.py                 # Flask main application
├── log_parser.py          # Log parsing engine
├── requirements.txt       # Python dependencies
├── README.md              # Project documentation (English)
├── README.zh-TW.md        # Project documentation (Traditional Chinese)
├── README.zh-CN.md        # Project documentation (Simplified Chinese)
├── QUICKSTART.md          # Quick start guide
├── CHANGELOG.md           # Change log
├── .gitignore             # Git ignore rules
├── templates/
│   └── index.html         # Frontend page
├── static/
│   ├── style.css          # Stylesheet
│   ├── script.js          # JavaScript logic
│   └── translations.js    # Multi-language translations
└── uploads/               # Upload file cache
```

## Technical Architecture

- **Backend**: Flask (Python)
- **Frontend**: HTML5 + CSS3 + JavaScript (ES6+)
- **Styling**: Responsive design, dark theme
- **Icons**: Font Awesome 6.0
- **Caching**: LRU cache mechanism
- **Multi-Language**: Supports Traditional Chinese, Simplified Chinese, English

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## FAQ

### Q: Why aren't some sessions being detected?
A: Ensure the log contains `SessionId:` markers. The system relies on these markers to identify session boundaries.

### Q: What's the maximum log file size?
A: Currently supports log files up to 100MB.

### Q: Are log files stored?
A: No, old files are automatically cleaned up each time the application starts, ensuring data privacy.

### Q: Which operating systems are supported?
A: Currently primarily supports Windows 10+. Mac/Linux users can manually run `python app.py` to start.

### Q: How to generate Azure Speech SDK logs?
A: Please refer to the [official documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-use-logging?pivots=programming-language-python) to learn how to enable logging.

## Development & Contribution

Issues and Pull Requests are welcome!

### Development Environment Setup
1. Clone the project
2. Install dependencies: `pip install -r requirements.txt`
3. Run development server: `python app.py`

### Extending Features
- Add new log patterns in `log_parser.py`
- Add frontend features in `static/script.js`
- Add new translations in `static/translations.js`
- Adjust styles in `static/style.css`

---

## 📞 Contact

**Author**: Nick Shieh  
**Email**: nickshieh@microsoft.com  
**Version**: 1.0.0  
**License**: MIT License

---

## 🙏 Acknowledgments

Thanks to all developers who use and contribute to this project!

---

**Last Updated**: 2025-01-16

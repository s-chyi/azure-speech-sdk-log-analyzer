#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SDK日誌分析器 - 主應用程式
提供網頁界面用於上傳和分析Azure Speech SDK日誌文件
"""

from flask import Flask, request, jsonify, render_template, send_file
import os
import json
import tempfile
from datetime import datetime
from collections import OrderedDict
from log_parser import LogParser
from config import Config


class SimpleLRUCache:
    """
    簡單的 LRU (Least Recently Used) 緩存
    自動管理記憶體使用，限制最多緩存的檔案數量
    """
    def __init__(self, maxsize=5):
        self.cache = OrderedDict()
        self.maxsize = maxsize
    
    def get(self, key):
        """獲取緩存項，並將其移到最後（表示最近使用）"""
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]
        return None
    
    def set(self, key, value):
        """設置緩存項，如果超過容量則移除最舊的項"""
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        
        # 超過限制時，移除最舊的緩存
        if len(self.cache) > self.maxsize:
            oldest = next(iter(self.cache))
            removed_parser = self.cache.pop(oldest)
            print(f"[緩存管理] 移除舊緩存: {oldest} (當前緩存: {len(self.cache)}/{self.maxsize})")
    
    def __contains__(self, key):
        return key in self.cache
    
    def __getitem__(self, key):
        return self.get(key)
    
    def __setitem__(self, key, value):
        self.set(key, value)
    
    def __len__(self):
        return len(self.cache)


# 創建 Flask 應用並載入配置
app = Flask(__name__)
app.config.from_object(Config)

# 使用 LRU 緩存系統
log_cache = SimpleLRUCache(maxsize=app.config['CACHE_MAX_SIZE'])

@app.route('/')
def index():
    """主頁面"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """處理文件上傳"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'File name is empty'}), 400

        # 檢查檔案類型
        allowed_extensions = ['.txt', '.log']
        filename = file.filename
        if not any(filename.lower().endswith(ext) for ext in allowed_extensions):
            return jsonify({'success': False, 'error': 'Only .txt and .log file formats are supported'}), 400

        if file:
            # 確保上傳目錄存在並具有正確權限
            try:
                if not os.path.exists(app.config['UPLOAD_FOLDER']):
                    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                    print(f"[上傳] 已建立 uploads 目錄")
            except Exception as e:
                return jsonify({
                    'success': False, 
                    'error': f"Unable to create uploads directory: {str(e)}\n\nPlease check directory permissions or run start.bat to initialize the project."
                }), 500
                
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # 嘗試儲存檔案
            try:
                file.save(filepath)
            except PermissionError as e:
                return jsonify({
                    'success': False,
                    'error': f"Permission denied when saving file.\n\nPossible solutions:\n1. Close any programs that might be using the file\n2. Check folder permissions (Right-click uploads folder → Properties → Security)\n3. Try running the program as administrator\n4. Ensure the project is not in a protected directory (e.g., Program Files)\n\nTechnical details: {str(e)}"
                }), 500
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f"Error saving file: {str(e)}"
                }), 500

            # 使用檔案名作為簡單的ID
            file_id = filename

            try:
                parser = LogParser(filepath)
                log_cache[file_id] = parser
                sessions = parser.get_sessions_summary()

                return jsonify({
                    'success': True, 
                    'file_id': file_id,
                    'filename': filename,
                    'sessions': sessions,
                    'upload_time': datetime.now().isoformat()
                })
            except Exception as e:
                return jsonify({'success': False, 'error': f"Error parsing file: {str(e)}"}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': f"Error uploading file: {str(e)}"}), 500

@app.route('/session/<file_id>/<session_id>')
def get_session_details(file_id, session_id):
    """獲取特定會話的詳細信息"""
    try:
        if file_id not in log_cache:
            return jsonify({'success': False, 'error': 'File not found or expired'}), 404
        
        parser = log_cache[file_id]
        details = parser.get_session_details(session_id)
        
        if 'error' in details:
            return jsonify({'success': False, 'error': details['error']}), 404
        
        return jsonify({
            'success': True,
            'session_details': details
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': f"Error retrieving session details: {str(e)}"}), 500

@app.route('/session/<file_id>/<session_id>/threads')
def get_session_threads(file_id, session_id):
    """獲取特定會話的線程分析"""
    try:
        if file_id not in log_cache:
            return jsonify({'success': False, 'error': 'File not found or expired'}), 404
        
        parser = log_cache[file_id]
        thread_analysis = parser.intelligent_thread_analysis(session_id)
        
        if 'error' in thread_analysis:
            return jsonify({'success': False, 'error': thread_analysis['error']}), 404
        
        return jsonify({
            'success': True,
            'thread_analysis': thread_analysis
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': f"Error retrieving thread analysis: {str(e)}"}), 500

@app.route('/download/session/<file_id>/<session_id>')
def download_session_log(file_id, session_id):
    """下載完整會話日誌"""
    try:
        if file_id not in log_cache:
            return jsonify({'success': False, 'error': 'File not found or expired'}), 404
        
        parser = log_cache[file_id]
        
        # 獲取會話的完整日誌內容
        session_log_content = parser.get_session_log_content(session_id)
        
        if not session_log_content:
            return jsonify({'success': False, 'error': 'Session log content not found'}), 404
        
        # 創建臨時檔案
        temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log', encoding='utf-8')
        temp_file.write(session_log_content)
        temp_file.close()
        
        # 設定下載檔名
        download_filename = f"session_{session_id[:8]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=download_filename,
            mimetype='text/plain'
        )
    
    except Exception as e:
        return jsonify({'success': False, 'error': f"Error downloading session log: {str(e)}"}), 500

@app.route('/download/thread/<file_id>/<session_id>/<thread_id>')
def download_thread_log(file_id, session_id, thread_id):
    """下載特定線程的日誌"""
    try:
        if file_id not in log_cache:
            return jsonify({'success': False, 'error': 'File not found or expired'}), 404
        
        parser = log_cache[file_id]
        
        # 獲取線程的完整日誌內容
        thread_log_content = parser.get_thread_log_content(thread_id)
        
        if not thread_log_content:
            return jsonify({'success': False, 'error': f'Thread {thread_id} log content not found'}), 404
        
        # 獲取線程名稱
        thread_mapping = parser.get_all_session_threads(session_id)
        thread_name = thread_mapping.get(thread_id, f'Thread_{thread_id}')
        
        # 創建臨時檔案
        temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log', encoding='utf-8')
        temp_file.write(f"# {thread_name} (ID: {thread_id}) 日誌\n")
        temp_file.write(f"# 會話: {session_id}\n")
        temp_file.write(f"# 提取時間: {datetime.now().isoformat()}\n\n")
        temp_file.write(thread_log_content)
        temp_file.close()
        
        # 設定下載檔名
        safe_thread_name = thread_name.replace(' ', '_').replace('/', '_')
        download_filename = f"{safe_thread_name}_{thread_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=download_filename,
            mimetype='text/plain'
        )
    
    except Exception as e:
        return jsonify({'success': False, 'error': f"Error downloading thread log: {str(e)}"}), 500

@app.route('/session/<file_id>/<session_id>/threads/list')
def get_session_thread_list(file_id, session_id):
    """獲取會話的線程列表（用於下載選項）"""
    try:
        if file_id not in log_cache:
            return jsonify({'success': False, 'error': 'File not found or expired'}), 404
        
        parser = log_cache[file_id]
        thread_mapping = parser.get_all_session_threads(session_id)
        
        thread_list = []
        for thread_id, thread_name in thread_mapping.items():
            # 檢查該線程是否有日誌內容
            thread_content = parser.get_thread_log_content(thread_id)
            if thread_content:
                thread_list.append({
                    'thread_id': thread_id,
                    'thread_name': thread_name,
                    'line_count': len(thread_content.split('\n'))
                })
        
        return jsonify({
            'success': True,
            'threads': thread_list
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': f"Error retrieving thread list: {str(e)}"}), 500

@app.route('/file/<file_id>/sessions')
def get_file_sessions(file_id):
    """重新獲取檔案的會話列表"""
    try:
        if file_id not in log_cache:
            return jsonify({'success': False, 'error': 'File not found or expired'}), 404
        
        parser = log_cache[file_id]
        sessions = parser.get_sessions_summary()
        
        return jsonify({
            'success': True,
            'file_id': file_id,
            'sessions': sessions
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': f"Error reloading session list: {str(e)}"}), 500

@app.route('/health')
def health_check():
    """健康檢查端點"""
    return jsonify({
        'status': 'healthy',
        'cached_files': len(log_cache),
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(413)
def too_large(e):
    """檔案過大錯誤處理"""
    return jsonify({'success': False, 'error': 'File size exceeds limit (100MB)'}), 413

@app.errorhandler(404)
def not_found(e):
    """404 錯誤處理"""
    return jsonify({'success': False, 'error': 'Requested resource not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    """500 錯誤處理"""
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SDK日誌分析器
專門用於解析Azure Speech SDK日誌，提取會話資訊和效能指標
"""

import re
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

class LogParser:
    """統一的SDK日誌解析器類別"""
    
    def __init__(self, filepath):
        """初始化解析器"""
        self.filepath = filepath
        self.lines = self._read_lines()
        
        # 基本模式
        self.session_id_pattern = re.compile(r"SessionId:\s*([a-f0-9\-]{32,36})", re.IGNORECASE)
        
        # Azure Speech SDK 正則表達式模式
        self.patterns = {
            # 時間戳和線程ID模式 - Azure SDK 格式
            'azure_timestamp': re.compile(r'\[(\d+)\]:\s*(\d+)ms\s+SPX_[A-Z_]+:\s*[\w_.]+:\d+\s+(.+)'),
            
            # 會話ID識別
            'session_started': re.compile(r'Firing SessionStarted event: SessionId:\s*([a-f0-9\-]{32,36})', re.IGNORECASE),
            'session_id_generic': re.compile(r'SessionId:\s*([a-f0-9\-]{32,36})', re.IGNORECASE),
            
            # AudioStreamSession 地址模式
            'audio_stream_session': re.compile(r'\[((?:0x)?[A-F0-9]{8,16})\]CSpxAudioStreamSession', re.IGNORECASE),
            
            # 線程識別模式
            'main_thread': re.compile(r'Started main thread with ID \[(\d+)ll\]'),
            'thread_started': re.compile(r'Started thread (\w+) with ID \[(\d+)ll\]'),
            'background_thread': re.compile(r'\[(.*?)\]'),
            'user_thread': re.compile(r'Started thread User with ID \[(\d+)ll\]'),
            'audiopump_thread': re.compile(r'AudioPump THREAD started!'),
            
            # 狀態變遷模式
            'state_change': re.compile(r'TryChangeState: recoKind/sessionState: (\d+)/(\d+) => (\d+)/(\d+)'),
            'adapter_state': re.compile(r'TryChangeState: audioState/uspState: (\d+)/(\d+) => (\d+)/(\d+)'),
            
            # WebSocket 連接和通信（簡化匹配）
            'websocket_start': re.compile(r'Start to open websocket'),
            'websocket_opened': re.compile(r'Opening websocket completed|OnWebSocketOpened'),
            'websocket_closed': re.compile(r'OnWebSocketClosed'),
            'websocket_send': re.compile(r'Web socket sending message'),
            'websocket_send_complete': re.compile(r'Web socket send message completed'),
            'websocket_message_received': re.compile(r'USP message received'),
            
            # 音頻處理相關（簡化匹配）
            'write_buffer': re.compile(r'WriteBuffer:'),
            'audio_chunk_received': re.compile(r'Received audio chunk:'),
            'read_frame_duration': re.compile(r'read frame duration:\s*(\d+)\s*ms'),
            'audio_pump_read': re.compile(r'Read: totalBytesRead=(\d+)'),
            'audio_end_detected': re.compile(r'Read: End of stream detected|read ZERO \(0\) bytes'),
            
            # 效能指標詳細提取
            'unacknowledged_audio': re.compile(r'unacknowledgedAudioDuration\s*=\s*(\d+)\s*msec'),
            'upload_rate': re.compile(r'Web socket upload rate.*?(\d+\.?\d*)\s*KB/s'),
            'recognition_latency': re.compile(r"name='RESULT-RecognitionLatencyMs';\s*value='(\d+)'"),
            'time_in_queue': re.compile(r'TimeInQueue:\s*(\d+)ms'),
            'turn_start_ts': re.compile(r'TS:(\d+)\s+Response Message: path: turn\.start'),
            'first_hypothesis_ts': re.compile(r'TS:(\d+)\s+Response Message: path: speech\.hypothesis'),
            
            # 語音識別事件
            'turn_start': re.compile(r'path:\s*turn\.start'),
            'turn_end': re.compile(r'path:\s*turn\.end'),
            'speech_start_detected': re.compile(r'path:\s*speech\.startDetected'),
            'speech_end_detected': re.compile(r'path:\s*speech\.endDetected'),
            'speech_hypothesis': re.compile(r'path:\s*speech\.hypothesis|Response:\s*Speech\.Hypothesis\s+message', re.IGNORECASE),
            'speech_phrase': re.compile(r'path:\s*speech\.phrase|Response:\s*Speech\.Phrase\s+message', re.IGNORECASE),
            
            # 文本提取（簡化為更可靠的模式）
            'recognition_text': re.compile(r'Text:\s+(.+?)(?:\s*$)', re.IGNORECASE),
            'recognition_status': re.compile(r'RecognitionStatus:\s*(\w+)'),
            'confidence_score': re.compile(r'Confidence:\s*(\d+\.?\d*)'),
            'duration_info': re.compile(r'Duration:\s*(\d+)'),
            'offset_info': re.compile(r'Offset:\s*(\d+)'),
            
            # 應用程式控制
            'start_recognition': re.compile(r'StartRecognitionAsync'),
            'stop_recognition': re.compile(r'StopRecognitionAsync'),
            
            # 錯誤和異常
            'error_message': re.compile(r'ERROR|EXCEPTION|Failed|Error'),
        }

    def _read_lines(self):
        """讀取檔案內容"""
        try:
            with open(self.filepath, 'r', encoding='utf-8', errors='ignore') as f:
                return f.readlines()
        except Exception as e:
            raise Exception(f"無法讀取檔案 {self.filepath}: {str(e)}")

    def get_sessions_summary(self):
        """獲取會話摘要列表"""
        sessions = {}
        for i, line in enumerate(self.lines):
            match = self.session_id_pattern.search(line)
            if match:
                session_id = match.group(1)
                if session_id not in sessions:
                    sessions[session_id] = {
                        'session_id': session_id,
                        'start_line': i + 1,  # 1-based line number
                        'has_detailed_analysis': True
                    }
        
        return list(sessions.values())

    def get_session_details(self, session_id: str) -> Dict[str, Any]:
        """獲取特定會話的詳細信息"""
        try:
            # 使用完整的會話日誌內容（包括所有相關線程）
            full_session_log = self.get_session_log_content(session_id)
            
            # 將日誌內容轉換為 (line_num, line) 格式
            session_lines = []
            for i, line in enumerate(full_session_log.split('\n'), 1):
                if line.strip():
                    session_lines.append((i, line.strip()))
            
            if not session_lines:
                return {'error': f'找不到會話 {session_id} 的詳細信息'}
            
            print(f"[DEBUG] Extracted {len(session_lines)} lines for session {session_id}")
            
            # 分析會話詳細信息
            perf_metrics = self._analyze_performance_metrics(session_lines)
            
            # 調試日誌：打印提取的指標
            print(f"[DEBUG] Session {session_id} metrics:")
            print(f"  - websocket_messages: {perf_metrics.get('websocket_messages', 'N/A')}")
            print(f"  - audio_chunks: {perf_metrics.get('audio_chunks', 'N/A')}")
            print(f"  - websocket_connection_time: {perf_metrics.get('websocket_connection_time', 'N/A')}")
            print(f"  - turn_start_latency: {perf_metrics.get('turn_start_latency', 'N/A')}")
            print(f"  - first_hypothesis_latency: {perf_metrics.get('first_hypothesis_latency', 'N/A')}")
            print(f"  - max_unacknowledged_audio: {perf_metrics.get('max_unacknowledged_audio', 'N/A')}")
            
            # 使用簡單方式獲取基本資訊（從包含 SessionId 的行）
            simple_session_lines = self._extract_session_lines(session_id)
            
            # 提取識別配置信息
            recognition_config = self._extract_recognition_config(session_lines)
            
            details = {
                'session_id': session_id,
                'basic_info': self._analyze_basic_info(simple_session_lines) if simple_session_lines else {},
                'recognition_config': recognition_config,  # 新增：識別配置
                'performance_metrics': perf_metrics,
                'recognition_results': self._analyze_recognition_results(session_lines),
                'error_analysis': self._analyze_errors(session_lines),
                'timeline': self._build_timeline(session_lines)
            }
            
            return details
        except Exception as e:
            print(f"[ERROR] Failed to analyze session details: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'error': f'分析會話詳細信息時發生錯誤: {str(e)}'}

    def intelligent_thread_analysis(self, session_id: str = None) -> Dict[str, Any]:
        """
        智能線程分析 - 精確鎖定會話並識別所有相關線程
        """
        try:
            log_content = '\n'.join(self.lines)
            lines = self.lines
            results = {}
            
            # 步驟1: 找到核心標識符 (SessionId 和 AudioStreamSession地址)
            core_identifiers = self._find_core_identifiers(lines)
            
            if not core_identifiers:
                return {'error': '未找到SessionStarted事件，無法進行線程分析'}
            
            results['core_identifiers'] = core_identifiers
            
            # 步驟2: 關聯所有相關線程
            session_threads = {}
            
            target_sessions = [session_id] if session_id and session_id in core_identifiers else core_identifiers.keys()
            
            for sid in target_sessions:
                if sid in core_identifiers:
                    identifier_info = core_identifiers[sid]
                    threads = self._associate_session_threads(lines, sid, identifier_info)
                    session_threads[sid] = threads
                    
            results['session_threads'] = session_threads
            results['analysis_status'] = 'success'
            
            # 如果只有一個會話或指定了特定會話，直接返回該會話的詳細信息
            if len(session_threads) == 1:
                sid = list(session_threads.keys())[0]
                results['primary_session'] = sid
                results['thread_summary'] = session_threads[sid]
            
            return results
        except Exception as e:
            return {'error': f'線程分析時發生錯誤: {str(e)}'}

    def _extract_session_lines(self, session_id: str) -> List[tuple]:
        """提取特定會話的所有相關行"""
        session_lines = []
        for i, line in enumerate(self.lines):
            if session_id in line:
                session_lines.append((i + 1, line.strip()))
        return session_lines

    def _analyze_basic_info(self, session_lines: List[tuple]) -> Dict[str, Any]:
        """分析基本會話信息"""
        info = {
            'session_id': None,  # 只保留 session_id
        }
        
        # 從行中提取 session_id
        for line_num, line in session_lines:
            match = self.session_id_pattern.search(line)
            if match:
                info['session_id'] = match.group(1)
                break
        
        return info
    
    def _extract_recognition_config(self, session_lines: List[tuple]) -> Dict[str, Any]:
        """提取識別配置信息"""
        config = {
            'audio': {},
            'recognition': {},
            'system': {}
        }
        
        # 配置提取模式
        config_patterns = {
            # 音頻設置
            'sample_rate': re.compile(r"name='AudioConfig_SampleRateForCapture';\s*value='(\d+)'"),
            'bits_per_sample': re.compile(r"name='AudioConfig_BitsPerSampleForCapture';\s*value='(\d+)'"),
            'channels': re.compile(r"name='AudioConfig_NumberOfChannelsForCapture';\s*value='(\d+)'"),
            
            # 識別設置
            'reco_mode': re.compile(r"name='SPEECH-RecoMode';\s*value='(\w+)'"),
            'reco_language': re.compile(r"name='SPEECH-RecoLanguage';\s*value='([^']+)'"),
            'auto_detect_languages': re.compile(r"name='Auto-Detect-Source-Languages';\s*value='([^']+)'"),
            'language_id_mode': re.compile(r"name='SPEECH-LanguageIdMode';\s*value='(\w+)'"),
            'segmentation_timeout': re.compile(r"name='SPEECH-SegmentationSilenceTimeoutMs';\s*value='(\d+)'"),
            
            # 系統設置
            'buffer_size': re.compile(r"name='SPEECH-MaxBufferSizeMs';\s*value='(\d+)'"),
            'region': re.compile(r"name='SPEECH-Region';\s*value='([^']+)'"),
            'connection_url': re.compile(r"name='SPEECH-ConnectionUrl';\s*value='([^']+)'"),
            'user_agent': re.compile(r"name='HttpHeader#User-agent';\s*value='([^']+)'"),
        }
        
        # 提取配置值
        for line_num, line in session_lines:
            # 音頻設置
            if 'sample_rate' not in config['audio']:
                match = config_patterns['sample_rate'].search(line)
                if match:
                    config['audio']['sample_rate'] = match.group(1)
            
            if 'bits_per_sample' not in config['audio']:
                match = config_patterns['bits_per_sample'].search(line)
                if match:
                    config['audio']['bits_per_sample'] = match.group(1)
            
            if 'channels' not in config['audio']:
                match = config_patterns['channels'].search(line)
                if match:
                    config['audio']['channels'] = match.group(1)
            
            # 識別設置
            if 'mode' not in config['recognition']:
                match = config_patterns['reco_mode'].search(line)
                if match:
                    config['recognition']['mode'] = match.group(1)
            
            if 'language' not in config['recognition']:
                match = config_patterns['reco_language'].search(line)
                if match:
                    config['recognition']['language'] = match.group(1)
            
            if 'auto_detect_languages' not in config['recognition']:
                match = config_patterns['auto_detect_languages'].search(line)
                if match:
                    config['recognition']['auto_detect_languages'] = match.group(1)
            
            if 'language_id_mode' not in config['recognition']:
                match = config_patterns['language_id_mode'].search(line)
                if match:
                    config['recognition']['language_id_mode'] = match.group(1)
            
            if 'segmentation_timeout' not in config['recognition']:
                match = config_patterns['segmentation_timeout'].search(line)
                if match:
                    config['recognition']['segmentation_timeout'] = match.group(1)
            
            # 系統設置
            if 'buffer_size' not in config['system']:
                match = config_patterns['buffer_size'].search(line)
                if match:
                    config['system']['buffer_size'] = match.group(1)
            
            if 'region' not in config['system']:
                match = config_patterns['region'].search(line)
                if match:
                    config['system']['region'] = match.group(1)
            
            if 'connection_url' not in config['system']:
                match = config_patterns['connection_url'].search(line)
                if match:
                    config['system']['connection_url'] = match.group(1)
            
            if 'user_agent' not in config['system']:
                match = config_patterns['user_agent'].search(line)
                if match:
                    config['system']['user_agent'] = match.group(1)
        
        return config

    def _analyze_performance_metrics(self, session_lines: List[tuple]) -> Dict[str, Any]:
        """分析效能指標（增強版）"""
        metrics = {
            'websocket_messages': 0,
            'audio_chunks': 0,
            'upload_rates': [],
            'recognition_latencies': [],
            'queue_times': [],
            'unacknowledged_audio_durations': [],
            'frame_durations': [],
            'websocket_connection_time': None,
            'turn_start_latency': None,
            'first_hypothesis_latency': None,
            'first_recognition_service_latency': None  # 新增：首個識別服務延遲
        }
        
        websocket_start_time = None
        websocket_opened_time = None
        first_recognition_latency_found = False  # 標記是否已找到第一個識別延遲
        
        for line_num, line in session_lines:
            # WebSocket 連接時間計算
            if self.patterns['websocket_start'].search(line):
                timestamp_match = re.search(r'\[(\d+)\]:\s*(\d+)ms', line)
                if timestamp_match:
                    websocket_start_time = int(timestamp_match.group(2))
            
            if self.patterns['websocket_opened'].search(line):
                timestamp_match = re.search(r'\[(\d+)\]:\s*(\d+)ms', line)
                if timestamp_match:
                    websocket_opened_time = int(timestamp_match.group(2))
                    if websocket_start_time is not None:
                        metrics['websocket_connection_time'] = websocket_opened_time - websocket_start_time
            
            # WebSocket 消息計數
            if self.patterns['websocket_send'].search(line):
                metrics['websocket_messages'] += 1
                
                # 提取隊列時間
                queue_match = self.patterns['time_in_queue'].search(line)
                if queue_match:
                    metrics['queue_times'].append(int(queue_match.group(1)))
            
            # 音頻塊計數
            if self.patterns['audio_chunk_received'].search(line):
                metrics['audio_chunks'] += 1
            
            # 未確認音頻持續時間
            unack_match = self.patterns['unacknowledged_audio'].search(line)
            if unack_match:
                metrics['unacknowledged_audio_durations'].append(int(unack_match.group(1)))
            
            # 音頻幀持續時間
            frame_match = self.patterns['read_frame_duration'].search(line)
            if frame_match:
                metrics['frame_durations'].append(int(frame_match.group(1)))
            
            # 上傳速率
            upload_match = self.patterns['upload_rate'].search(line)
            if upload_match:
                metrics['upload_rates'].append(float(upload_match.group(1)))
            
            # Turn Start 延遲
            if metrics['turn_start_latency'] is None:
                turn_start_match = self.patterns['turn_start_ts'].search(line)
                if turn_start_match:
                    metrics['turn_start_latency'] = int(turn_start_match.group(1))
            
            # 首個假設延遲
            if metrics['first_hypothesis_latency'] is None:
                first_hyp_match = self.patterns['first_hypothesis_ts'].search(line)
                if first_hyp_match:
                    metrics['first_hypothesis_latency'] = int(first_hyp_match.group(1))
            
            # 識別延遲 - 提取第一個作為首個識別服務延遲
            latency_match = self.patterns['recognition_latency'].search(line)
            if latency_match:
                latency_value = int(latency_match.group(1))
                metrics['recognition_latencies'].append(latency_value)
                # 只記錄第一個識別延遲作為服務延遲
                if not first_recognition_latency_found:
                    metrics['first_recognition_service_latency'] = latency_value
                    first_recognition_latency_found = True
        
        # 計算統計值
        if metrics['upload_rates']:
            metrics['avg_upload_rate'] = round(sum(metrics['upload_rates']) / len(metrics['upload_rates']), 2)
        
        if metrics['recognition_latencies']:
            metrics['avg_recognition_latency'] = round(sum(metrics['recognition_latencies']) / len(metrics['recognition_latencies']), 0)
            metrics['min_recognition_latency'] = min(metrics['recognition_latencies'])
            metrics['max_recognition_latency'] = max(metrics['recognition_latencies'])
            
            # 新增：建立延遲時間序列（用於繪圖）
            metrics['latency_timeline'] = []
            latency_index = 0
            for line_num, line in session_lines:
                latency_match = self.patterns['recognition_latency'].search(line)
                if latency_match:
                    latency_value = int(latency_match.group(1))
                    # 提取時間戳
                    timestamp_match = re.search(r'\[(\d+)\]:\s*(\d+)ms', line)
                    timestamp = int(timestamp_match.group(2)) if timestamp_match else None
                    
                    metrics['latency_timeline'].append({
                        'index': latency_index,
                        'timestamp': timestamp,
                        'latency': latency_value
                    })
                    latency_index += 1
        
        if metrics['queue_times']:
            metrics['avg_queue_time'] = round(sum(metrics['queue_times']) / len(metrics['queue_times']), 0)
            metrics['max_queue_time'] = max(metrics['queue_times'])
        
        if metrics['unacknowledged_audio_durations']:
            metrics['max_unacknowledged_audio'] = max(metrics['unacknowledged_audio_durations'])
        
        if metrics['frame_durations']:
            metrics['min_frame_duration'] = min(metrics['frame_durations'])
            metrics['max_frame_duration'] = max(metrics['frame_durations'])
            metrics['avg_frame_duration'] = round(sum(metrics['frame_durations']) / len(metrics['frame_durations']), 0)
        
        return metrics

    def _analyze_recognition_results(self, session_lines: List[tuple]) -> List[Dict[str, Any]]:
        """分析語音識別結果"""
        results = []
        
        for line_num, line in session_lines:
            # 檢查是否為語音識別結果
            if self.patterns['speech_phrase'].search(line) or self.patterns['speech_hypothesis'].search(line):
                # 提取文本 - 只有當行中包含 Text: 時才處理
                text_match = self.patterns['recognition_text'].search(line)
                if not text_match:
                    # 如果沒有文本，跳過這一行
                    continue
                
                result = {'line_number': line_num}
                result['text'] = text_match.group(1).strip()
                
                # 提取狀態
                status_match = self.patterns['recognition_status'].search(line)
                if status_match:
                    result['status'] = status_match.group(1)
                
                # 提取信心分數
                confidence_match = self.patterns['confidence_score'].search(line)
                if confidence_match:
                    result['confidence'] = float(confidence_match.group(1))
                
                # 提取持續時間和偏移量
                duration_match = self.patterns['duration_info'].search(line)
                if duration_match:
                    result['duration'] = int(duration_match.group(1))
                
                offset_match = self.patterns['offset_info'].search(line)
                if offset_match:
                    result['offset'] = int(offset_match.group(1))
                
                results.append(result)
        
        return results

    def _analyze_errors(self, session_lines: List[tuple]) -> List[Dict[str, Any]]:
        """分析錯誤和異常"""
        errors = []
        
        for line_num, line in session_lines:
            if self.patterns['error_message'].search(line):
                errors.append({
                    'line_number': line_num,
                    'message': line[:200] + '...' if len(line) > 200 else line
                })
        
        return errors

    def _build_timeline(self, session_lines: List[tuple]) -> List[Dict[str, Any]]:
        """建構會話時間線"""
        timeline = []
        
        # 關鍵事件模式
        key_events = {
            'session_start': self.patterns['session_started'],
            'websocket_open': self.patterns['websocket_opened'],
            'speech_start': self.patterns['speech_start_detected'],
            'speech_end': self.patterns['speech_end_detected'],
            'turn_start': self.patterns['turn_start'],
            'turn_end': self.patterns['turn_end'],
            'websocket_close': self.patterns['websocket_closed']
        }
        
        for line_num, line in session_lines:
            timestamp_match = re.search(r'\[(\d+)\]:\s*(\d+)ms', line)
            timestamp = int(timestamp_match.group(2)) if timestamp_match else None
            
            for event_type, pattern in key_events.items():
                if pattern.search(line):
                    timeline.append({
                        'line_number': line_num,
                        'timestamp': timestamp,
                        'event_type': event_type,
                        'description': line[:100] + '...' if len(line) > 100 else line
                    })
                    break
        
        # 按時間戳排序
        timeline.sort(key=lambda x: x['timestamp'] or 0)
        return timeline

    def _find_core_identifiers(self, lines: List[str]) -> Dict[str, Dict[str, Any]]:
        """找到核心標識符"""
        identifiers = {}
        
        session_started_pattern = re.compile(r'Firing SessionStarted event: SessionId:\s*([a-f0-9\-]{32,36})', re.IGNORECASE)
        audio_stream_pattern = re.compile(r'\[([A-F0-9x]{10,18})\]CSpxAudioStreamSession::FireSessionStartedEvent', re.IGNORECASE)
        thread_id_pattern = re.compile(r'^\[(\d+)\]:', re.IGNORECASE)
        
        for line_num, line in enumerate(lines, 1):
            session_match = session_started_pattern.search(line)
            if session_match:
                session_id = session_match.group(1)
                
                audio_match = audio_stream_pattern.search(line)
                audio_address = audio_match.group(1) if audio_match else None
                
                thread_match = thread_id_pattern.search(line.strip())
                background_thread_id = thread_match.group(1) if thread_match else None
                
                identifiers[session_id] = {
                    'session_id': session_id,
                    'audio_stream_session': audio_address,
                    'background_thread_id': background_thread_id,
                    'discovery_line': line_num,
                    'raw_line': line.strip()
                }
        
        return identifiers

    def _associate_session_threads(self, lines: List[str], session_id: str, identifier_info: Dict[str, Any]) -> Dict[str, Any]:
        """關聯所有相關線程"""
        threads = {
            'session_id': session_id,
            'audio_stream_session': identifier_info['audio_stream_session'],
            'background_thread': identifier_info['background_thread_id']
        }
        
        background_thread_id = identifier_info['background_thread_id']
        audio_address = identifier_info['audio_stream_session']
        
        # 反向查找父線程
        threads.update(self._find_parent_threads(lines, background_thread_id))
        
        # 正向查找子線程
        threads.update(self._find_child_threads(lines, background_thread_id, session_id, audio_address))
        
        return threads

    def _find_parent_threads(self, lines: List[str], background_thread_id: str) -> Dict[str, Any]:
        """反向查找父線程"""
        parent_threads = {}
        
        # 查找後台啟動線程
        background_start_pattern = re.compile(rf'Started thread Background with ID \[{background_thread_id}ll\]', re.IGNORECASE)
        thread_id_pattern = re.compile(r'^\[(\d+)\]:', re.IGNORECASE)
        
        kickoff_line_num = None
        for line_num, line in enumerate(lines, 1):
            if background_start_pattern.search(line):
                thread_match = thread_id_pattern.search(line.strip())
                if thread_match:
                    kickoff_thread_id = thread_match.group(1)
                    parent_threads['kickoff_thread'] = kickoff_thread_id
                    parent_threads['kickoff_discovery_line'] = line_num
                    parent_threads['kickoff_raw_line'] = line.strip()
                    kickoff_line_num = line_num
                    break
        
        # 查找主應用線程 - 改進邏輯以處理多會話
        main_thread_id = self._find_main_thread_for_session(lines, background_thread_id, kickoff_line_num)
        if main_thread_id:
            parent_threads['main_thread'] = main_thread_id['thread_id']
            parent_threads['main_discovery_line'] = main_thread_id['line_num']
            parent_threads['main_raw_line'] = main_thread_id['raw_line']

        return parent_threads
    
    def _find_main_thread_for_session(self, lines: List[str], background_thread_id: str, kickoff_line_num: int) -> Dict[str, Any]:
        """為特定會話找到正確的主線程"""
        
        # 策略1: 通過記憶體地址關聯（改進版本）
        main_thread = self._find_main_thread_by_memory_address(lines, background_thread_id, kickoff_line_num)
        if main_thread:
            return main_thread
        
        # 策略2: 通過時間proximity和模式匹配
        main_thread = self._find_main_thread_by_proximity(lines, background_thread_id, kickoff_line_num)
        if main_thread:
            return main_thread
        
        # 策略3: 通過common patterns
        main_thread = self._find_main_thread_by_patterns(lines, background_thread_id, kickoff_line_num)
        return main_thread
    
    def _find_main_thread_by_memory_address(self, lines: List[str], background_thread_id: str, kickoff_line_num: int) -> Dict[str, Any]:
        """通過記憶體地址找主線程（修正版本）
        
        邏輯：
        1. 在 background thread 中找到 named_properties.h:479 ISpxNamedProperties::GetStringValue: this=0x...; name='SPEECH-Region'
        2. 提取記憶體地址
        3. 在整個日誌中找到這個記憶體地址第一次出現的地方
        4. 那一行的 thread id 就是 main thread
        """
        # 模式：提取 background thread 中帶有 SPEECH-Region 的 GetStringValue 記憶體地址
        # 匹配格式如：this=0x0x007f9b94183400; name='SPEECH-Region'
        get_string_pattern = re.compile(
            r"named_properties\.h:479\s+ISpxNamedProperties::GetStringValue:\s+this=(0x(?:0x)?[0-9a-fA-F]+).*?name='SPEECH-Region'", 
            re.IGNORECASE
        )
        
        thread_id_pattern = re.compile(r'^\[(\d+)\]:', re.IGNORECASE)
        
        # 步驟1: 在 background thread 中找到帶有 SPEECH-Region 的 GetStringValue 記憶體地址
        background_memory_addresses = []
        
        for line_num, line in enumerate(lines, 1):
            # 確保這一行屬於 background thread
            if f'[{background_thread_id}]' in line:
                match = get_string_pattern.search(line)
                if match:
                    memory_addr = match.group(1)
                    background_memory_addresses.append((memory_addr, line_num))
                    print(f"[DEBUG] 在 background thread [{background_thread_id}] 第 {line_num} 行找到 SPEECH-Region 記憶體地址: {memory_addr}")
        
        if not background_memory_addresses:
            print(f"[DEBUG] 在 background thread [{background_thread_id}] 中未找到 SPEECH-Region 的 GetStringValue 記憶體地址")
            return None
        
        # 步驟2: 對每個記憶體地址，在整個日誌中找到第一次出現的位置
        for memory_addr, bg_line_num in background_memory_addresses:
            # 建立多種可能的記憶體地址格式來匹配
            # 處理 0x0x 和 0x 兩種格式
            addr_patterns = set()
            
            # 原始格式
            addr_patterns.add(memory_addr)
            addr_patterns.add(memory_addr.lower())
            addr_patterns.add(memory_addr.upper())
            
            # 如果是 0x0x 格式，也嘗試 0x 格式
            if '0x0x' in memory_addr.lower():
                simple_addr = memory_addr.replace('0x0x', '0x', 1).replace('0X0X', '0X', 1)
                addr_patterns.add(simple_addr)
                addr_patterns.add(simple_addr.lower())
                addr_patterns.add(simple_addr.upper())
            # 如果是 0x 格式，也嘗試 0x0x 格式
            elif memory_addr.lower().startswith('0x') and not memory_addr.lower().startswith('0x0x'):
                double_addr = memory_addr.replace('0x', '0x0x', 1).replace('0X', '0X0X', 1)
                addr_patterns.add(double_addr)
                addr_patterns.add(double_addr.lower())
                addr_patterns.add(double_addr.upper())
            
            first_occurrence = None
            first_line_num = float('inf')
            
            for line_num, line in enumerate(lines, 1):
                # 跳過 background thread 自己的行
                if line_num == bg_line_num:
                    continue
                
                # 檢查這一行是否包含該記憶體地址
                line_contains_addr = False
                for addr_pattern in addr_patterns:
                    if addr_pattern in line:
                        line_contains_addr = True
                        break
                
                if line_contains_addr and line_num < first_line_num:
                    # 提取 thread id
                    thread_match = thread_id_pattern.search(line.strip())
                    if thread_match:
                        thread_id = thread_match.group(1)
                        # 確保不是 background thread 本身
                        if thread_id != background_thread_id:
                            first_occurrence = {
                                'thread_id': thread_id,
                                'line_num': line_num,
                                'raw_line': line.strip()
                            }
                            first_line_num = line_num
                            print(f"[DEBUG] 記憶體地址 {memory_addr} 第一次出現在第 {line_num} 行，thread id: {thread_id}")
            
            # 如果找到第一次出現，返回該 thread 作為 main thread
            if first_occurrence:
                print(f"[DEBUG] 確定 main thread: {first_occurrence['thread_id']}")
                return first_occurrence
        
        print(f"[DEBUG] 未找到記憶體地址的第一次出現")
        return None
    
    def _find_main_thread_by_proximity(self, lines: List[str], background_thread_id: str, kickoff_line_num: int) -> Dict[str, Any]:
        """通過時間proximity找主線程"""
        if not kickoff_line_num:
            return None
        
        # 在kickoff線程附近尋找主要的應用程式活動
        search_range = 100  # 在前後100行內搜索
        start_line = max(1, kickoff_line_num - search_range)
        end_line = min(len(lines), kickoff_line_num + search_range)
        
        thread_activity = {}
        timestamp_pattern = re.compile(r'^\[(\d+)\]:\s*(\d+)ms', re.IGNORECASE)
        
        # 搜索包含主要SDK活動的線程
        main_patterns = [
            r'StartRecognitionAsync',
            r'SpeechConfig',
            r'AudioConfig', 
            r'CreateRecognizer',
            r'main\s*\(',
            r'WinMain',
            r'Application'
        ]
        
        for i in range(start_line - 1, end_line):
            if i < len(lines):
                line = lines[i]
                thread_match = timestamp_pattern.match(line.strip())
                if thread_match:
                    thread_id = thread_match.group(1)
                    if thread_id != background_thread_id:  # 不是背景線程
                        for pattern in main_patterns:
                            if re.search(pattern, line, re.IGNORECASE):
                                if thread_id not in thread_activity:
                                    thread_activity[thread_id] = 0
                                thread_activity[thread_id] += 1
                                break
        
        # 選擇活動度最高的線程
        if thread_activity:
            best_thread = max(thread_activity, key=thread_activity.get)
            # 找到這個線程的第一次出現
            for i, line in enumerate(lines, 1):
                if f'[{best_thread}]' in line:
                    return {
                        'thread_id': best_thread,
                        'line_num': i,
                        'raw_line': line.strip()
                    }
        
        return None
    
    def _find_main_thread_by_patterns(self, lines: List[str], background_thread_id: str, kickoff_line_num: int) -> Dict[str, Any]:
        """通過常見模式找主線程"""
        timestamp_pattern = re.compile(r'^\[(\d+)\]:\s*(\d+)ms', re.IGNORECASE)
        
        # 最後的策略：找到最早開始且不是背景線程的線程
        thread_first_appearance = {}
        
        for line_num, line in enumerate(lines, 1):
            thread_match = timestamp_pattern.match(line.strip())
            if thread_match:
                thread_id = thread_match.group(1)
                if (thread_id != background_thread_id and 
                    thread_id not in thread_first_appearance):
                    thread_first_appearance[thread_id] = (line_num, line.strip())
        
        # 選擇最早出現的線程（通常是主線程）
        if thread_first_appearance:
            earliest_thread = min(thread_first_appearance, key=lambda x: thread_first_appearance[x][0])
            line_num, raw_line = thread_first_appearance[earliest_thread]
            return {
                'thread_id': earliest_thread,
                'line_num': line_num,
                'raw_line': raw_line
            }
        
        return None

    def _find_child_threads(self, lines: List[str], background_thread_id: str, session_id: str, audio_address: str) -> Dict[str, Any]:
        """正向查找子線程"""
        child_threads = {}
        
        # 查找事件分發線程
        user_thread_pattern = re.compile(r'Started thread User with ID \[(\d+)ll\]', re.IGNORECASE)
        thread_id_pattern = re.compile(r'^\[(\d+)\]:', re.IGNORECASE)
        
        for line_num, line in enumerate(lines, 1):
            if f'[{background_thread_id}]' in line and user_thread_pattern.search(line):
                user_match = user_thread_pattern.search(line)
                if user_match:
                    user_thread_id = user_match.group(1)
                    child_threads['user_thread'] = user_thread_id
                    child_threads['user_discovery_line'] = line_num
                    child_threads['user_raw_line'] = line.strip()
                    break
        
        # 查找音頻處理線程
        audio_pump_threads = self._find_audio_pump_thread(lines, background_thread_id, audio_address)
        child_threads.update(audio_pump_threads)

        # 查找 GStreamer 線程
        gstreamer_patterns = [
            r'base_gstreamer\.cpp:\d+ PushDataToPipeline:',
            r'opus_decoder\.cpp:\d+ Received new pad',
            r'oggdemux'
        ]
        for pattern in gstreamer_patterns:
            gstreamer_re = re.compile(pattern, re.IGNORECASE)
            for line_num, line in enumerate(lines, 1):
                if gstreamer_re.search(line):
                    thread_id_match = thread_id_pattern.search(line.strip())
                    if thread_id_match:
                        gstreamer_thread_id = thread_id_match.group(1)
                        child_threads['gstreamer_thread'] = gstreamer_thread_id
                        child_threads['gstreamer_thread_line'] = line_num
                        child_threads['gstreamer_thread_raw'] = line.strip()
                        break
            if 'gstreamer_thread' in child_threads:
                break
        
        return child_threads

    def _find_audio_pump_thread(self, lines: List[str], background_thread_id: str, audio_address: str) -> Dict[str, Any]:
        """查找音頻處理線程"""
        audio_threads = {}
        pump_address = None
        
        # 步驟1: 找到 CSpxAudioPump::StartPump() 的內存地址
        pump_start_pattern = re.compile(r'\[([A-F0-9x]{10,18})\]CSpxAudioPump::StartPump\(\)', re.IGNORECASE)
        
        for line_num, line in enumerate(lines, 1):
            if f'[{background_thread_id}]' in line:
                pump_match = pump_start_pattern.search(line)
                if pump_match:
                    pump_address = pump_match.group(1)
                    audio_threads['pump_address'] = pump_address
                    audio_threads['pump_start_line'] = line_num
                    break
        
        # 步驟2: 用泵地址找到 AudioPump THREAD started!
        if pump_address:
            thread_id_pattern = re.compile(r'^\[(\d+)\]:', re.IGNORECASE)
            event_patterns = [
                r'\*\*\* AudioPump THREAD started! \*\*\*',
                r'PumpThread\(\): getting format from reader...'
            ]
            for event_pattern in event_patterns:
                event_re = re.compile(event_pattern, re.IGNORECASE)
                for line_num, line in enumerate(lines, 1):
                    if pump_address in line and event_re.search(line):
                        thread_match = thread_id_pattern.search(line.strip())
                        if thread_match:
                            audio_thread_id = thread_match.group(1)
                            audio_threads['audio_thread'] = audio_thread_id
                            audio_threads['audio_discovery_line'] = line_num
                            audio_threads['audio_raw_line'] = line.strip()
                            break
                if 'audio_thread' in audio_threads:
                    break
        
        return audio_threads

    def get_session_log_content(self, session_id: str) -> str:
        """獲取特定會話的完整日誌內容"""
        try:
            # 步驟1: 獲取會話的線程分析
            thread_analysis = self.intelligent_thread_analysis(session_id)
            if 'error' in thread_analysis:
                # 如果線程分析失敗，回退到增強搜索
                return self._enhanced_session_search(session_id)
            
            # 步驟2: 收集所有相關的線程ID
            thread_summary = thread_analysis.get('thread_summary', {})
            related_thread_ids = set()
            
            # 收集所有線程ID
            thread_keys = ['main_thread', 'kickoff_thread', 'background_thread', 
                          'user_thread', 'audio_thread', 'gstreamer_thread']
            
            for thread_key in thread_keys:
                if thread_key in thread_summary and thread_summary[thread_key]:
                    related_thread_ids.add(str(thread_summary[thread_key]))
            
            # 步驟3: 找到會話的時間範圍
            session_start_time, session_end_time = self._get_session_time_range(session_id)
            
            # 步驟4: 找出更多可能的相關線程ID
            additional_thread_ids = self._find_additional_session_threads(session_id, session_start_time, session_end_time)
            related_thread_ids.update(additional_thread_ids)
            
            # 步驟5: 提取完整的會話日誌
            session_lines = []
            timestamp_pattern = re.compile(r'^\[(\d+)\]:\s*(\d+)ms', re.IGNORECASE)
            
            for i, line in enumerate(self.lines):
                line_stripped = line.rstrip()
                
                # 方法1: 直接包含SessionId的行
                if session_id in line_stripped:
                    session_lines.append(line_stripped)
                    continue
                
                # 方法2: 屬於相關線程的行
                thread_match = timestamp_pattern.match(line_stripped)
                if thread_match:
                    thread_id = thread_match.group(1)
                    line_time = int(thread_match.group(2))
                    
                    # 檢查是否為相關線程且在時間範圍內
                    if (thread_id in related_thread_ids and
                        session_start_time is not None and 
                        session_end_time is not None and
                        session_start_time - 10000 <= line_time <= session_end_time + 10000):  # 擴大時間緩衝到10秒
                        session_lines.append(line_stripped)
            
            # 如果沒找到足夠的日誌，回退到增強搜索
            if len(session_lines) < 50:
                return self._enhanced_session_search(session_id)
            
            # 按時間戳排序（如果有的話）
            session_lines.sort(key=lambda x: self._extract_timestamp(x) or 0)
            
            return '\n'.join(session_lines)
            
        except Exception as e:
            # 如果發生任何錯誤，回退到增強搜索
            return self._enhanced_session_search(session_id)
    
    def _simple_session_search(self, session_id: str) -> str:
        """簡單的會話搜索（回退方法）"""
        session_lines = []
        for line in self.lines:
            if session_id in line:
                session_lines.append(line.rstrip())
        return '\n'.join(session_lines)
    
    def _get_session_time_range(self, session_id: str) -> tuple:
        """獲取會話的開始和結束時間"""
        session_times = []
        timestamp_pattern = re.compile(r'^\[(\d+)\]:\s*(\d+)ms', re.IGNORECASE)
        
        for line in self.lines:
            if session_id in line:
                match = timestamp_pattern.match(line.strip())
                if match:
                    session_times.append(int(match.group(2)))
        
        if session_times:
            return min(session_times), max(session_times)
        return None, None
    
    def _extract_timestamp(self, line: str) -> int:
        """從日誌行中提取時間戳"""
        match = re.match(r'^\[(\d+)\]:\s*(\d+)ms', line)
        return int(match.group(2)) if match else 0

    def _find_additional_session_threads(self, session_id: str, session_start_time: int, session_end_time: int) -> set:
        """找出更多可能與會話相關的線程ID"""
        additional_threads = set()
        timestamp_pattern = re.compile(r'^\[(\d+)\]:\s*(\d+)ms', re.IGNORECASE)
        
        # 如果沒有時間範圍，無法進行額外搜索
        if session_start_time is None or session_end_time is None:
            return additional_threads
        
        # 擴展時間範圍來尋找可能的相關線程
        extended_start = session_start_time - 30000  # 開始前30秒
        extended_end = session_end_time + 30000      # 結束後30秒
        
        # 查找包含常見 Speech SDK 關鍵字的行
        sdk_keywords = [
            'SPX_', 'CognitiveSpeech', 'AudioConfig', 'SpeechConfig', 
            'RecognitionResult', 'StartRecognition', 'StopRecognition',
            'WebSocket', 'speech.', 'turn.', 'AudioInputStream',
            'CSpx', 'ISpx', 'speechsdk'
        ]
        
        thread_activity = {}  # 統計每個線程在時間範圍內的活動
        
        for line in self.lines:
            thread_match = timestamp_pattern.match(line.strip())
            if thread_match:
                thread_id = thread_match.group(1)
                line_time = int(thread_match.group(2))
                
                # 檢查是否在擴展時間範圍內
                if extended_start <= line_time <= extended_end:
                    # 檢查是否包含 SDK 相關關鍵字
                    for keyword in sdk_keywords:
                        if keyword in line:
                            if thread_id not in thread_activity:
                                thread_activity[thread_id] = 0
                            thread_activity[thread_id] += 1
                            break
        
        # 選擇活動度較高的線程
        for thread_id, activity_count in thread_activity.items():
            if activity_count >= 3:  # 至少有3行相關活動
                additional_threads.add(thread_id)
        
        return additional_threads

    def _enhanced_session_search(self, session_id: str) -> str:
        """增強的會話搜索（當智能分析失敗時使用）"""
        session_lines = []
        timestamp_pattern = re.compile(r'^\[(\d+)\]:\s*(\d+)ms', re.IGNORECASE)
        
        # 步驟1: 找到包含SessionId的所有行並獲取時間範圍
        session_times = []
        session_thread_ids = set()
        
        for line in self.lines:
            if session_id in line:
                session_lines.append(line.rstrip())
                # 提取時間戳和線程ID
                match = timestamp_pattern.match(line.strip())
                if match:
                    session_times.append(int(match.group(2)))
                    session_thread_ids.add(match.group(1))
        
        if not session_times:
            return '\n'.join(session_lines)
        
        # 步驟2: 確定時間範圍
        start_time = min(session_times)
        end_time = max(session_times)
        time_buffer = min(60000, (end_time - start_time) * 2)  # 最多60秒緩衝
        
        # 步驟3: 找出可能相關的其他線程
        sdk_patterns = [
            r'SPX_[A-Z_]+',
            r'CognitiveSpeech',
            r'speech\.[a-zA-Z]+',
            r'turn\.[a-zA-Z]+',
            r'RecognitionResult',
            r'AudioConfig',
            r'SpeechConfig',
            r'WebSocket',
            r'StartRecognition',
            r'StopRecognition'
        ]
        
        additional_lines = []
        for line in self.lines:
            if session_id not in line:  # 避免重複添加
                match = timestamp_pattern.match(line.strip())
                if match:
                    line_time = int(match.group(2))
                    thread_id = match.group(1)
                    
                    # 檢查時間範圍
                    if (start_time - time_buffer) <= line_time <= (end_time + time_buffer):
                        # 檢查是否為已知相關線程
                        if thread_id in session_thread_ids:
                            additional_lines.append(line.rstrip())
                        else:
                            # 檢查是否包含 SDK 相關內容
                            for pattern in sdk_patterns:
                                if re.search(pattern, line, re.IGNORECASE):
                                    additional_lines.append(line.rstrip())
                                    break
        
        # 步驟4: 合併並排序所有行
        all_lines = session_lines + additional_lines
        all_lines.sort(key=lambda x: self._extract_timestamp(x) or 0)
        
        return '\n'.join(all_lines)

    def get_thread_log_content(self, thread_id: str) -> str:
        """獲取特定線程的完整日誌內容"""
        thread_lines = []
        thread_pattern = re.compile(rf'^\[{re.escape(thread_id)}\]:', re.IGNORECASE)
        
        for line in self.lines:
            if thread_pattern.match(line.strip()):
                thread_lines.append(line.rstrip())
        
        return '\n'.join(thread_lines)

    def get_all_session_threads(self, session_id: str) -> Dict[str, str]:
        """獲取會話的所有線程ID和名稱映射"""
        try:
            thread_analysis = self.intelligent_thread_analysis(session_id)
            if 'error' in thread_analysis:
                return {}
            
            thread_summary = thread_analysis.get('thread_summary', {})
            thread_mapping = {}
            
            # 線程類型映射
            thread_types = [
                ('main_thread', '主線程'),
                ('kickoff_thread', '啟動線程'),
                ('background_thread', '後台線程'),
                ('user_thread', '使用者線程'),
                ('audio_thread', '音頻線程'),
                ('gstreamer_thread', 'GStreamer線程')
            ]
            
            for thread_key, thread_name in thread_types:
                if thread_key in thread_summary and thread_summary[thread_key]:
                    thread_id = str(thread_summary[thread_key])
                    thread_mapping[thread_id] = thread_name
            
            return thread_mapping
        except Exception as e:
            return {}


# 主要執行程式碼（僅在直接執行時使用）
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        filepath = sys.argv[1]
        parser = LogParser(filepath)
        sessions_summary = parser.get_sessions_summary()
        
        print("會話摘要:")
        for session in sessions_summary:
            print(f"Session ID: {session['session_id']}, Start Line: {session['start_line']}")
    else:
        print("用法: python log_parser.py <日誌文件路徑>")

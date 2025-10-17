#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
版本檢查工具
在應用程式啟動時自動檢查 GitHub 上是否有新版本
"""

import sys
import json
import urllib.request
import urllib.error

def get_latest_version():
    """
    從 GitHub API 獲取最新版本
    
    Returns:
        str: 最新版本號，如果失敗則返回 None
    """
    try:
        from config import Config
        
        api_url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{Config.GITHUB_REPO}/releases/latest"
        
        # 創建請求，添加 User-Agent 以符合 GitHub API 要求
        req = urllib.request.Request(api_url)
        req.add_header('User-Agent', 'SDK-Log-Analyzer')
        
        # 設置超時時間
        with urllib.request.urlopen(req, timeout=Config.VERSION_CHECK_TIMEOUT) as response:
            data = json.loads(response.read().decode())
            # 移除版本號前的 'v' 字符（如果存在）
            return data['tag_name'].lstrip('v')
    
    except urllib.error.URLError:
        # 網路連接問題
        return None
    except KeyError:
        # API 回應格式錯誤
        return None
    except Exception:
        # 其他錯誤
        return None

def compare_versions(current, latest):
    """
    比較版本號
    
    Args:
        current (str): 當前版本號
        latest (str): 最新版本號
    
    Returns:
        bool: 如果最新版本較新則返回 True
    """
    try:
        # 嘗試使用 packaging 庫進行語義化版本比較
        from packaging import version
        return version.parse(latest) > version.parse(current)
    except ImportError:
        # 如果 packaging 庫不可用，使用簡單的字串比較
        return latest != current
    except Exception:
        # 版本號格式錯誤
        return False

def main():
    """Main function: Execute version check and display results"""
    try:
        from config import Config
        
        print("📡 Checking for updates...", end=" ", flush=True)
        
        latest = get_latest_version()
        
        if latest is None:
            print("Skipped")
            return 0
        
        print("Done")
        print(f"   Current version: v{Config.VERSION}")
        print(f"   Latest version: v{latest}")
        
        if compare_versions(Config.VERSION, latest):
            print()
            print("=" * 60)
            print("  🎉 New version available!")
            print("=" * 60)
            print()
            print("📝 Update methods:")
            print()
            print("  Method 1: One-click update (Recommended)")
            print("    ➜ Double-click: update.bat")
            print()
            print("  Method 2: Manual update")
            print("    ➜ Run in terminal: git pull origin main")
            print()
            print("=" * 60)
            print()
            input("Press Enter to continue...")
            return 1
        else:
            print("   ✅ Already up to date")
            return 0
    
    except ImportError:
        print("⚠️  Failed to load config file")
        return 0
    except Exception as e:
        print(f"⚠️  Error checking version: {str(e)}")
        return 0

if __name__ == "__main__":
    sys.exit(main())

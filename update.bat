@echo off
chcp 65001 >nul
title 更新 Azure SDK 日誌分析器

echo ========================================
echo   更新 Azure SDK 日誌分析器
echo ========================================
echo.

REM 檢查 Git 是否安裝
where git >nul 2>&1
if errorlevel 1 (
    echo ✗ 未找到 Git！
    echo.
    echo 請先安裝 Git:
    echo https://git-scm.com/download/win
    echo.
    echo 或手動下載最新版本:
    echo https://github.com/s-chyi/azure-speech-sdk-log-analyzer/releases/latest
    echo.
    pause
    exit /b 1
)

echo [1/4] 正在檢查工作區狀態...
git diff --quiet
if errorlevel 1 (
    echo.
    echo ⚠️  警告: 您有未提交的修改！
    echo.
    echo 本地修改的檔案:
    git status --short
    echo.
    set /p BACKUP="是否要備份並繼續更新？ [Y/n]: "
    if /i "%BACKUP%"=="n" (
        echo 更新已取消
        pause
        exit /b 0
    )
    
    echo.
    echo [2/4] 正在備份本地修改...
    git stash push -m "Auto backup before update - %date% %time%"
    if errorlevel 1 (
        echo ⚠️  備份失敗，但將繼續更新
    ) else (
        echo ✓ 本地修改已備份
        echo   使用 'git stash pop' 可以恢復
    )
) else (
    echo ✓ 工作區乾淨
    echo [2/4] 跳過備份
)
echo.

echo [3/4] 正在拉取最新版本...
git pull origin main
if errorlevel 1 (
    echo ✗ 更新失敗
    echo.
    echo 可能的原因:
    echo 1. 網絡連接問題
    echo 2. Git 配置問題
    echo 3. 分支衝突
    echo.
    echo 請嘗試手動執行: git pull origin main
    echo.
    pause
    exit /b 1
)
echo ✓ 程式碼更新完成
echo.

echo [4/4] 正在更新依賴...

REM 檢測並激活虛擬環境
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    pip install -q --upgrade -r requirements.txt
    if errorlevel 1 (
        echo ⚠️  依賴更新失敗，但程式碼已更新
    ) else (
        echo ✓ 依賴更新完成
    )
    deactivate
) else (
    pip install -q --upgrade -r requirements.txt
    if errorlevel 1 (
        echo ⚠️  依賴更新失敗，但程式碼已更新
    ) else (
        echo ✓ 依賴更新完成
    )
)
echo.

echo ========================================
echo   🎉 更新完成！
echo ========================================
echo.
echo 請重新運行 start.bat 啟動服務
echo.

pause

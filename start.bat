@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Azure SDK Log Analyzer

echo ========================================
echo   Azure SDK Log Analyzer v1.1.2
echo ========================================
echo.

REM Check for version updates
echo [1/5] Checking for version updates...
python version_check.py
if errorlevel 1 (
    echo Unable to connect to GitHub, skipping version check
)
echo.

REM Step 1: Detect Python environment
echo [2/5] Detecting Python environment...

REM Check for existing virtual environment (use existing venv first)
if exist "venv\Scripts\activate.bat" (
    echo ✓ Existing virtual environment detected
    set PYTHON_ENV=venv
    goto :check_python
)

REM Check if conda is available
where conda >nul 2>&1
if %errorlevel% equ 0 (
    REM Check if currently in a conda environment
    if not "%CONDA_DEFAULT_ENV%"=="" (
        echo ✓ Conda environment detected ^(%CONDA_DEFAULT_ENV%^)
        set PYTHON_ENV=conda
        goto :check_python
    )
    REM Conda installed but not activated
    echo ✓ Conda detected ^(not activated^)
    set PYTHON_ENV=conda
    goto :check_python
)

REM Check system Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ System Python detected
    set PYTHON_ENV=system
    goto :check_python
) else (
    echo ✗ Python not found!
    echo.
    echo Please install Python 3.7 or higher
    echo Download: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

:check_python
REM Verify Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo   Python version: %PYTHON_VERSION%
echo.

REM Step 2: Setup environment
echo [3/5] Setting up environment...

if "%PYTHON_ENV%"=="conda" (
    echo   Using Conda environment
    call conda activate base >nul 2>&1
    goto :install_deps
)

if "%PYTHON_ENV%"=="venv" (
    echo   Activating virtual environment...
    call venv\Scripts\activate.bat
    goto :install_deps
)

if "%PYTHON_ENV%"=="system" (
    echo   Asking if create virtual environment...
    set /p CREATE_VENV="Create virtual environment? (recommended) [Y/n]: "
    if /i "!CREATE_VENV!"=="n" (
        echo   Using system Python
        goto :install_deps
    )
    if /i "!CREATE_VENV!"=="N" (
        echo   Using system Python
        goto :install_deps
    )
    
    echo   Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ✗ Failed to create virtual environment, using system Python
        goto :install_deps
    )
    echo ✓ Virtual environment created successfully
    call venv\Scripts\activate.bat
    set PYTHON_ENV=venv
)

:install_deps
REM Step 3: Ensure uploads directory exists with correct permissions
echo.
echo [4/5] Ensuring uploads directory...

REM Create uploads directory if it doesn't exist
REM Using Python ensures correct permissions inheritance
if not exist "uploads\" (
    echo   Creating uploads directory...
    python -c "import os; os.makedirs('uploads', exist_ok=True)" 2>nul
    if errorlevel 1 (
        mkdir uploads 2>nul
    )
    echo ✓ uploads directory created
) else (
    echo ✓ uploads directory exists
)
echo.

REM Step 4: Check and install dependencies
echo [5/5] Checking dependencies...

python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo   Installing dependencies...
    pip install -q -r requirements.txt
    if errorlevel 1 (
        echo ✗ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed
) else (
    echo ✓ Dependencies ready
)
echo.

REM Step 5: Clean old data
echo.
echo [6/6] Cleaning old data...
if exist "uploads\*.*" (
    del /q uploads\*.* 2>nul
    echo ✓ Cleaned previous uploaded files
) else (
    echo ✓ No cleanup needed
)
echo.

REM Start application
echo ========================================
echo   Starting service...
echo ========================================
echo.
echo Service will open in browser automatically
echo URL: http://localhost:5001
echo.
echo Press Ctrl+C to stop service
echo ========================================
echo.

REM 延遲 2 秒後自動開啟瀏覽器
start /b timeout /t 2 >nul & start http://localhost:5001

REM 啟動 Flask 應用
python app.py

REM 清理
if "%PYTHON_ENV%"=="venv" (
    deactivate
)

pause

@echo off
echo 🎤 Starting Demucs Vocal Separation Backend...
echo Found Python at: C:\Python313
echo.

REM Use the detected Python installation
set PYTHON_EXE=C:\Python313\python.exe

echo Testing Python installation...
%PYTHON_EXE% --version
if %errorlevel% neq 0 (
    echo ❌ Python not working at C:\Python313\python.exe
    echo Please check your Python installation
    pause
    exit /b 1
)

echo ✅ Python working!
echo.

echo 📦 Installing Demucs and dependencies...
echo This may take a few minutes on first run...
%PYTHON_EXE% -m pip install --upgrade pip
%PYTHON_EXE% -m pip install torch demucs flask flask-cors numpy scipy librosa soundfile

if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to install dependencies
    echo Trying alternative installation...
    %PYTHON_EXE% -m pip install --user torch demucs flask flask-cors numpy scipy librosa soundfile
)

if %errorlevel% equ 0 (
    echo.
    echo ✅ Dependencies installed successfully!
    echo.
    echo 🚀 Starting Demucs backend server...
    echo Backend will be available at: http://localhost:5000
    echo.
    echo 📝 Keep this window open while using the app
    echo 📝 Your frontend will automatically detect and use vocal separation
    echo.
    %PYTHON_EXE% app.py
) else (
    echo ❌ Installation failed. Please check your internet connection.
)

pause
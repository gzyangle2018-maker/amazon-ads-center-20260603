@echo off
chcp 65001 >nul
echo ========================================
echo   Amazon Ads Center - 打包为 EXE
echo ========================================
echo.

REM 安装依赖
echo [1/3] 安装依赖...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo 依赖安装失败！
    pause
    exit /b 1
)

REM 清理旧构建
echo [2/3] 清理旧构建...
rmdir /s /q build 2>nul
rmdir /s /q dist 2>nul

REM 打包
echo [3/3] 打包中...
pyinstaller ^
    --name="Amazon Ads Center" ^
    --windowed ^
    --icon=assets/icon.png ^
    --add-data="app;app" ^
    --add-data="config.json;." ^
    --hidden-import=pandas ^
    --hidden-import=openpyxl ^
    --hidden-import=openpyxl.cell ^
    --hidden-import=openpyxl.styles ^
    --hidden-import=requests ^
    --hidden-import=numpy ^
    --clean ^
    --noconfirm ^
    main.py

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   打包成功！
    echo   输出: dist\Amazon Ads Center\
    echo ========================================
) else (
    echo.
    echo 打包失败，请检查错误信息。
)

pause

@echo off
chcp 65001 >nul
setlocal
pushd "%~dp0"
if errorlevel 1 (
    echo Failed to open the project directory.
    pause
    exit /b 1
)

where fnm.exe >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 fnm，请先安装 fnm。
    pause
    exit /b 1
)

fnm env --use-on-cd --shell cmd > "%TEMP%\closure-fnm-env.cmd"
if errorlevel 1 (
    echo [错误] 未能生成 fnm 环境配置。
    pause
    exit /b 1
)
call "%TEMP%\closure-fnm-env.cmd"

where node.exe >nul 2>&1
if errorlevel 1 (
    echo [错误] 未能加载 Node.js，请先运行 fnm install 26。
    pause
    exit /b 1
)

where corepack.cmd >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 corepack，请运行 npm install -g corepack，然后 corepack enable。
    pause
    exit /b 1
)

for /f "delims=" %%V in ('node -v') do set NODE_VERSION=%%V
title Closure++ Dev Server - %NODE_VERSION%
echo 正在启动 Closure++（Node %NODE_VERSION%）...
start "" "http://localhost:5173/arknights/"
corepack yarn dev

if errorlevel 1 (
    echo.
    echo [错误] 开发服务器启动失败。
)
popd
echo.
pause
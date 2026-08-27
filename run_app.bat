@echo off
setlocal
cd /d "%~dp0"

set "PYEXE=D:\ProgramData\Anaconda3\envs\tts\python.exe"

if exist "%PYEXE%" (
    echo 正在启动秋招投递管理页面...
    "%PYEXE%" -m http.server 8000
    goto :END
)

where python >nul 2>1
if not errorlevel 1 (
    echo 正在启动秋招投递管理页面...
    python -m http.server 8000
    goto :END
)

where py >nul 2>1
if not errorlevel 1 (
    echo 正在启动秋招投递管理页面...
    py -m http.server 8000
    goto :END
)

echo 没有找到可用的 Python 环境。
echo 请先安装 Python 或 Anaconda，然后重新运行本脚本。
pause

:END

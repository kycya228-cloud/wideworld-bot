@echo off
set PATH=C:\nodejs\node-v20.11.1-win-x64;%PATH%
cd /d C:\Users\kirill\Desktop\discord-bot
:loop
node index.js
timeout /t 5 /nobreak >nul
goto loop

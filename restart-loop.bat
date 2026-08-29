@echo off
set PATH=C:\nodejs\node-v20.11.1-win-x64;%PATH%
cd /d C:\Users\kirill\Desktop\discord-bot
:loop
echo [%date% %time%] Запуск WideWorld...
node index.js
echo [%date% %time%] Бот упал! Перезапуск через 5 сек...
timeout /t 5 /nobreak >nul
goto loop

@echo off
:: BTRIP Auto-Startup Script
:: This script is run by Windows Task Scheduler on system startup

:: Wait a few seconds for system to be ready
timeout /t 10 /nobreak > nul

:: Set Node.js path
set PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm

:: Change to BTRIP directory
cd /d C:\BTRIP

:: Resurrect saved PM2 processes
pm2 resurrect

:: Log startup
echo %date% %time% - BTRIP started >> C:\BTRIP\logs\startup.log





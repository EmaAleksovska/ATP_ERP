@echo off
echo Starting BTRIP Application...

:: Set Node.js path
set PATH=%PATH%;C:\Program Files\nodejs

:: Change to BTRIP directory
cd /d C:\BTRIP

:: Start PM2 with ecosystem config
pm2 start ecosystem.config.cjs

:: Save PM2 process list
pm2 save

echo BTRIP Application started successfully!





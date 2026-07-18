@echo off
title Confluence Dashboard Auto-Launcher
echo ====================================================
echo 🚀 Launching Trading Dashboard Setup...
echo ====================================================
powershell -ExecutionPolicy Bypass -File "%~dp0launch_dashboard.ps1"
pause

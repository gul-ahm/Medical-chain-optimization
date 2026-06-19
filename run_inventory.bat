@echo off
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "PYTHONPATH=%ROOT%\packages\sc_events;%ROOT%\packages\sc_db;%ROOT%\packages\sc_auth;%ROOT%\packages\sc_schemas;%ROOT%\packages\sc_observability"
"%ROOT%\.venv\Scripts\python.exe" "%ROOT%\services\inventory-service\src\main.py"

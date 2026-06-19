@echo off
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "PYTHONPATH=%ROOT%\packages\sc_events;%ROOT%\packages\sc_db;%ROOT%\packages\sc_auth;%ROOT%\packages\sc_schemas;%ROOT%\packages\sc_observability"

echo Starting Monitoring Stubs (3001, 9090)...
start /B "" "%ROOT%\.venv\Scripts\python.exe" -u "%ROOT%\stub_services.py" > "%ROOT%\logs\stubs.log" 2> "%ROOT%\logs\stubs_err.log"

echo Starting Inventory Service (8001)...
start /B "" "%ROOT%\.venv\Scripts\python.exe" -u "%ROOT%\services\inventory-service\src\main.py" > "%ROOT%\logs\inventory.log" 2> "%ROOT%\logs\inventory_err.log"

echo Starting Forecast Service (8002)...
start /B "" "%ROOT%\.venv\Scripts\python.exe" -u "%ROOT%\services\forecasting-service\src\main.py" > "%ROOT%\logs\forecast.log" 2> "%ROOT%\logs\forecast_err.log"

echo Starting Optimization Service (8003)...
start /B "" "%ROOT%\.venv\Scripts\python.exe" -u "%ROOT%\services\optimization-service\src\main.py" > "%ROOT%\logs\optimization.log" 2> "%ROOT%\logs\optimization_err.log"

echo Starting Orchestration Service (8004)...
start /B "" "%ROOT%\.venv\Scripts\python.exe" -u "%ROOT%\services\orchestration-service\src\main.py" > "%ROOT%\logs\orchestration.log" 2> "%ROOT%\logs\orchestration_err.log"

echo Starting Governance Service (8005)...
start /B "" "%ROOT%\.venv\Scripts\python.exe" -u "%ROOT%\services\governance-service\src\main.py" > "%ROOT%\logs\governance.log" 2> "%ROOT%\logs\governance_err.log"

echo Starting AI Orchestration Service (8008)...
start /B "" "%ROOT%\.venv\Scripts\python.exe" -u "%ROOT%\services\ai-orchestration-service\src\main.py" > "%ROOT%\logs\ai-orchestration.log" 2> "%ROOT%\logs\ai-orchestration_err.log"

echo Starting Frontend (3000)...
cd /d "%ROOT%\apps\web"
start /B npm run dev -- -p 3000 > "%ROOT%\logs\frontend.log" 2> "%ROOT%\logs\frontend_err.log"

echo All services launched!

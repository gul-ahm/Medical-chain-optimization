$root = $PSScriptRoot
$python = "$root\.venv\Scripts\python.exe"
$env:PYTHONPATH = "$root\packages\sc_events;$root\packages\sc_db;$root\packages\sc_auth;$root\packages\sc_schemas;$root\packages\sc_observability"

# Ensure log directory exists
If (!(Test-Path "$root\logs")) {
    New-Item -ItemType Directory -Force -Path "$root\logs"
}

Write-Host "Starting Monitoring Stubs on 3001 and 9090..."
Start-Process $python -ArgumentList "`"$root\stub_services.py`"" -NoNewWindow -RedirectStandardOutput "$root\logs\stubs.log" -RedirectStandardError "$root\logs\stubs_err.log"

Write-Host "Starting Inventory Service on 8001..."
Start-Process $python -ArgumentList "`"$root\services\inventory-service\src\main.py`"" -NoNewWindow -RedirectStandardOutput "$root\logs\inventory.log" -RedirectStandardError "$root\logs\inventory_err.log"

Write-Host "Starting Forecast Service on 8002..."
Start-Process $python -ArgumentList "`"$root\services\forecasting-service\src\main.py`"" -NoNewWindow -RedirectStandardOutput "$root\logs\forecast.log" -RedirectStandardError "$root\logs\forecast_err.log"

Write-Host "Starting Optimization Service on 8003..."
Start-Process $python -ArgumentList "`"$root\services\optimization-service\src\main.py`"" -NoNewWindow -RedirectStandardOutput "$root\logs\optimization.log" -RedirectStandardError "$root\logs\optimization_err.log"

Write-Host "Starting Orchestration Service on 8004..."
Start-Process $python -ArgumentList "`"$root\services\orchestration-service\src\main.py`"" -NoNewWindow -RedirectStandardOutput "$root\logs\orchestration.log" -RedirectStandardError "$root\logs\orchestration_err.log"

Write-Host "Starting Governance Service on 8005..."
Start-Process $python -ArgumentList "`"$root\services\governance-service\src\main.py`"" -NoNewWindow -RedirectStandardOutput "$root\logs\governance.log" -RedirectStandardError "$root\logs\governance_err.log"

Write-Host "Starting AI Orchestration Service on 8008..."
Start-Process $python -ArgumentList "`"$root\services\ai-orchestration-service\src\main.py`"" -NoNewWindow -RedirectStandardOutput "$root\logs\ai-orchestration.log" -RedirectStandardError "$root\logs\ai-orchestration_err.log"

Write-Host "Starting Frontend on 3000..."
Start-Process npm -ArgumentList "run dev -- -p 3000" -WorkingDirectory "$root\apps\web" -NoNewWindow -RedirectStandardOutput "$root\logs\frontend.log" -RedirectStandardError "$root\logs\frontend_err.log"

Write-Host "All processes spawned successfully in the background."

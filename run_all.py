import os
import sys
import subprocess
import time
import json
import signal
import socket
import datetime
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
LOGS_DIR = os.path.join(ROOT, "logs")
os.makedirs(LOGS_DIR, exist_ok=True)

# Define pythonpath
PYTHONPATH = ";".join([
    os.path.join(ROOT, "packages", "sc_events"),
    os.path.join(ROOT, "packages", "sc_db"),
    os.path.join(ROOT, "packages", "sc_auth"),
    os.path.join(ROOT, "packages", "sc_schemas"),
    os.path.join(ROOT, "packages", "sc_observability")
])

env = os.environ.copy()
env["PYTHONPATH"] = PYTHONPATH + (";" + env.get("PYTHONPATH", "") if env.get("PYTHONPATH") else "")

python_exe = os.path.join(ROOT, ".venv", "Scripts", "python.exe")

# ============================================================================
# PORT MANAGEMENT UTILITIES
# ============================================================================

def is_port_in_use(port):
    """Check if a port is currently in use (Windows-specific robust check)."""
    try:
        result = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True, text=True, timeout=5
        )
        for line in result.stdout.strip().split("\n"):
            parts = line.split()
            if len(parts) >= 4 and parts[3] == "LISTENING":
                local_addr = parts[1]
                if local_addr.endswith(f":{port}") or local_addr.endswith(f"]:{port}"):
                    return True
    except Exception:
        pass
    return False

def kill_process_on_port(port):
    """Kill any process occupying the given port (Windows-specific)."""
    try:
        result = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True, text=True, timeout=10
        )
        for line in result.stdout.strip().split("\n"):
            parts = line.split()
            if len(parts) >= 4 and parts[3] == "LISTENING":
                local_addr = parts[1]
                if local_addr.endswith(f":{port}") or local_addr.endswith(f"]:{port}"):
                    pid = parts[-1].strip()
                    if pid.isdigit() and int(pid) > 0:
                        print(f"   [PORT_CLEANUP] Killing PID {pid} occupying port {port}")
                        sys.stdout.flush()
                        subprocess.run(["taskkill", "/F", "/PID", pid],
                                       capture_output=True, timeout=10)
                        time.sleep(0.5)
    except Exception as e:
        print(f"   [PORT_CLEANUP] Warning: Could not clean port {port}: {e}")
        sys.stdout.flush()

def kill_process_tree(proc):
    """Forcefully kill a process and its entire child tree (Windows)."""
    if proc is None:
        return
    try:
        pid = proc.pid
        if pid and proc.poll() is None:
            # Use taskkill /T to kill the entire process tree
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(pid)],
                capture_output=True, timeout=10
            )
            time.sleep(0.3)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass

def wait_for_port(port, timeout=30, label="service"):
    """Wait until a port becomes available (listening)."""
    start = time.time()
    while time.time() - start < timeout:
        if is_port_in_use(port):
            return True
        time.sleep(0.5)
    print(f"   [TIMEOUT] {label} did not start on port {port} within {timeout}s")
    sys.stdout.flush()
    return False

# ============================================================================
# SERVICE DEFINITIONS
# ============================================================================

# Map of service name -> known port (for port-conflict prevention)
SERVICE_PORTS = {
    "stubs": [3001, 9090],
    "inventory": [8001],
    "forecasting": [8002],
    "optimization": [8003],
    "orchestration": [8004],
    "governance": [8005],
    "ai-orchestration": [8008],
    "ingestion": [8016],
    "frontend": [3000],
}

services = {
    "stubs": {
        "args": [python_exe, "-u", os.path.join(ROOT, "stub_services.py")],
        "cwd": ROOT
    },
    "inventory": {
        "args": [python_exe, "-u", os.path.join(ROOT, "services", "inventory-service", "src", "main.py")],
        "cwd": ROOT
    },
    "forecasting": {
        "args": [python_exe, "-u", os.path.join(ROOT, "services", "forecasting-service", "src", "main.py")],
        "cwd": ROOT
    },
    "optimization": {
        "args": [python_exe, "-u", os.path.join(ROOT, "services", "optimization-service", "src", "main.py")],
        "cwd": ROOT
    },
    "orchestration": {
        "args": [python_exe, "-u", os.path.join(ROOT, "services", "orchestration-service", "src", "main.py")],
        "cwd": ROOT
    },
    "governance": {
        "args": [python_exe, "-u", os.path.join(ROOT, "services", "governance-service", "src", "main.py")],
        "cwd": ROOT
    },
    "ai-orchestration": {
        "args": [python_exe, "-u", os.path.join(ROOT, "services", "ai-orchestration-service", "src", "main.py")],
        "cwd": ROOT
    },
    "ingestion": {
        "args": [python_exe, "-u", os.path.join(ROOT, "services", "data-ingestion-service", "src", "main.py")],
        "cwd": ROOT
    },
    "frontend": {
        "args": ["npm.cmd", "run", "start"],
        "cwd": os.path.join(ROOT, "apps", "web")
    }
}

# ============================================================================
# IN-HOUSE BUG REPORTER HTTP SERVER
# ============================================================================

class BugReporterHandler(BaseHTTPRequestHandler):
    """
    In-house Bug Notation Handler.
    Intercepts JSON payloads sent from the client-side console logger hook and logs them.
    """
    def log_message(self, format, *args):
        pass  # Suppress default HTTP access logging

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path == "/log-error":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                error_data = json.loads(post_data.decode('utf-8'))
                error_log_path = os.path.join(ROOT, "error_log.md")
                
                timestamp = error_data.get("timestamp", datetime.datetime.now().isoformat())
                err_type = error_data.get("type", "BROWSER_CONSOLE_ERROR")
                message = error_data.get("message", "Unknown runtime error")
                filename = error_data.get("filename", "Unknown file")
                lineno = error_data.get("lineno", 0)
                colno = error_data.get("colno", 0)
                url = error_data.get("url", "Unknown URL")
                stack = error_data.get("stack", "No stack trace available")

                log_entry = f"\n### [{timestamp}] Browser Devtool Error ({err_type})\n"
                log_entry += f"* **Error Message**: `{message}`\n"
                log_entry += f"* **Source Location**: `{filename}:{lineno}:{colno}`\n"
                log_entry += f"* **Browser URL**: [{url}]({url})\n"
                log_entry += f"* **Stack Trace**:\n"
                log_entry += f"```text\n{stack}\n```\n"
                log_entry += "---\n"
                
                with open(error_log_path, "a", encoding="utf-8") as f:
                    f.write(log_entry)
                    
                print(f"[BUG_REPORTER] Logged browser error from {filename}:{lineno}")
                sys.stdout.flush()
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            except Exception as e:
                print(f"[BUG_REPORTER] Failed to log: {e}")
                sys.stdout.flush()
                self.send_response(500)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

def start_bug_reporter_server():
    try:
        kill_process_on_port(8099)
        server = HTTPServer(('0.0.0.0', 8099), BugReporterHandler)
        print("[BUG_REPORTER] HTTP Server listening on http://localhost:8099")
        sys.stdout.flush()
        server.serve_forever()
    except Exception as e:
        print(f"[BUG_REPORTER] ERROR: Could not start: {e}")
        sys.stdout.flush()

# ============================================================================
# MAIN ORCHESTRATION
# ============================================================================

processes = {}
log_files = {}
restart_counts = {}
MAX_RESTARTS = 5
RESTART_BACKOFF_BASE = 3  # seconds

try:
    print("=" * 66)
    print("  Enterprise Medical Supply Network Intelligence Platform Boot")
    print("=" * 66)
    sys.stdout.flush()

    # ── Step 0: Clean up stale port occupants ──────────────────────────
    print("\nStep 0: Cleaning up stale processes on known ports...")
    sys.stdout.flush()
    all_ports = []
    for ports in SERVICE_PORTS.values():
        all_ports.extend(ports)
    all_ports.append(8099)  # Bug reporter port
    
    for port in all_ports:
        if is_port_in_use(port):
            print(f"   Port {port} is occupied — freeing it...")
            kill_process_on_port(port)
    
    # Brief pause to let OS release sockets
    time.sleep(1)
    print("-> All ports cleared.")
    sys.stdout.flush()

    # ── Step 1: Docker infrastructure ──────────────────────────────────
    print("\nStep 1: Activating Docker Container Infrastructure...")
    sys.stdout.flush()
    try:
        subprocess.run(
            ["docker-compose", "up", "-d", "zookeeper", "kafka", "redis", "postgres", "prometheus", "grafana"],
            cwd=ROOT,
            check=True,
            timeout=120
        )
        print("-> Containerized infrastructure active.")
    except subprocess.TimeoutExpired:
        print("-> WARNING: Docker compose timed out. Proceeding with fallbacks.")
    except Exception as e:
        print(f"-> WARNING: Docker compose failed: {e}")
        print("   Proceeding with local in-memory fallbacks.")
    sys.stdout.flush()

    # ── Step 2: Wait for Kafka broker to be ready ──────────────────────
    print("\nStep 2: Waiting for Kafka broker readiness...")
    sys.stdout.flush()
    if wait_for_port(9092, timeout=20, label="Kafka"):
        print("-> Kafka broker is accepting connections on port 9092.")
        # Create Kafka topics to prevent UNKNOWN_TOPIC_OR_PART errors
        try:
            subprocess.run(
                ["docker-compose", "exec", "-T", "kafka",
                 "kafka-topics", "--create", "--if-not-exists",
                 "--bootstrap-server", "localhost:9092",
                 "--replication-factor", "1", "--partitions", "1",
                 "--topic", "evt.inventory.deducted"],
                cwd=ROOT, capture_output=True, timeout=15
            )
            subprocess.run(
                ["docker-compose", "exec", "-T", "kafka",
                 "kafka-topics", "--create", "--if-not-exists",
                 "--bootstrap-server", "localhost:9092",
                 "--replication-factor", "1", "--partitions", "1",
                 "--topic", "cmd.inventory.reserve"],
                cwd=ROOT, capture_output=True, timeout=15
            )
            print("-> Kafka topics pre-created successfully.")
        except Exception as e:
            print(f"-> WARNING: Could not pre-create Kafka topics: {e}")
    else:
        print("-> WARNING: Kafka not ready. Services will use fallback mode.")
    sys.stdout.flush()

    # ── Step 3: Database seeding ───────────────────────────────────────
    print("\nStep 3: Initializing Database Seeding & Precalculating Cache...")
    sys.stdout.flush()
    try:
        subprocess.run(
            [python_exe, os.path.join(ROOT, "scripts", "precalculate_dashboards.py")],
            cwd=ROOT, env=env, check=True, timeout=120
        )
        print("-> supply_chain.db seeded & dashboard_precalculated.json cached.")
    except Exception as e:
        print(f"-> ERROR: Database seeding failed: {e}")
        sys.exit(1)
    sys.stdout.flush()

    # ── Step 4: Bug Reporter ───────────────────────────────────────────
    print("\nStep 4: Launching In-house Bug Notation Logging Handler...")
    sys.stdout.flush()
    reporter_thread = threading.Thread(target=start_bug_reporter_server, daemon=True)
    reporter_thread.start()

    # ── Step 5: Start all microservices & frontend ─────────────────────
    print("\nStep 5: Starting all backend microservices and frontend portal...")
    sys.stdout.flush()

    # Start backend services first, then frontend
    backend_services = {k: v for k, v in services.items() if k != "frontend"}
    
    for name, config in backend_services.items():
        out_log = os.path.join(LOGS_DIR, f"{name}.log")
        err_log = os.path.join(LOGS_DIR, f"{name}_err.log")
        
        out_f = open(out_log, "w", encoding="utf-8")
        err_f = open(err_log, "w", encoding="utf-8")
        log_files[name] = (out_f, err_f)
        restart_counts[name] = 0
        
        print(f"   -> Launching: {name}...")
        p = subprocess.Popen(
            config["args"],
            cwd=config["cwd"],
            env=env,
            stdout=out_f,
            stderr=err_f,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
        )
        processes[name] = p
    
    # Small delay to let backend services claim their ports
    print("   -> Waiting 3s for backend services to initialize...")
    sys.stdout.flush()
    time.sleep(3)
    
    # Now start frontend — ensure port 3000 is definitely free
    print("   -> Launching: frontend...")
    if is_port_in_use(3000):
        print("      Port 3000 still occupied after cleanup — force-killing...")
        kill_process_on_port(3000)
        time.sleep(1)
    
    frontend_config = services["frontend"]
    fe_out_log = os.path.join(LOGS_DIR, "frontend.log")
    fe_err_log = os.path.join(LOGS_DIR, "frontend_err.log")
    fe_out_f = open(fe_out_log, "w", encoding="utf-8")
    fe_err_f = open(fe_err_log, "w", encoding="utf-8")
    log_files["frontend"] = (fe_out_f, fe_err_f)
    restart_counts["frontend"] = 0
    
    fe_env = env.copy()
    fe_env["PORT"] = "3000"
    
    p_fe = subprocess.Popen(
        frontend_config["args"],
        cwd=frontend_config["cwd"],
        env=fe_env,
        stdout=fe_out_f,
        stderr=fe_err_f,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
    )
    processes["frontend"] = p_fe

    print("\n" + "=" * 66)
    print(" All subsystems successfully started!")
    print(" Listening Endpoints:")
    print("  1. Next.js Command Portal:   http://localhost:3000")
    print("  2. In-house Bug Reporter:    http://localhost:8099/log-error")
    print("  3. Inventory Service:        http://localhost:8001")
    print("  4. Forecasting Service:      http://localhost:8002")
    print("  5. Optimization Service:     http://localhost:8003")
    print("  6. Orchestration Service:    http://localhost:8004")
    print("  7. Governance Service:       http://localhost:8005")
    print("  8. AI Orchestration Service: http://localhost:8008")
    print("  9. Monitoring Stubs:         http://localhost:3001 / :9090")
    print("=" * 66)
    print("\nMonitoring services (Ctrl+C to shutdown)...\n")
    sys.stdout.flush()
    
    # ── Monitoring loop with backoff and restart limits ─────────────────
    while True:
        time.sleep(5)
        for name, p in list(processes.items()):
            poll = p.poll()
            if poll is not None:
                count = restart_counts.get(name, 0)
                
                if count >= MAX_RESTARTS:
                    print(f"[MONITOR] Service '{name}' has crashed {count} times. "
                          f"NOT restarting. Check logs/{name}_err.log for details.")
                    sys.stdout.flush()
                    # Remove from monitoring to stop spam
                    del processes[name]
                    continue
                
                restart_counts[name] = count + 1
                backoff = RESTART_BACKOFF_BASE * (2 ** count)
                backoff = min(backoff, 60)  # Cap at 60 seconds
                
                print(f"[MONITOR] Service '{name}' exited (code {poll}). "
                      f"Restart {count + 1}/{MAX_RESTARTS} in {backoff}s...")
                sys.stdout.flush()
                
                time.sleep(backoff)
                
                # Kill the old process tree completely
                kill_process_tree(p)
                
                # For frontend: ensure port 3000 is free before restart
                if name == "frontend":
                    kill_process_on_port(3000)
                    time.sleep(1)
                else:
                    ports = SERVICE_PORTS.get(name, [])
                    for port in ports:
                        if is_port_in_use(port):
                            kill_process_on_port(port)
                            time.sleep(0.5)
                
                # Reopen log files in append mode
                out_f, err_f = log_files[name]
                try:
                    out_f.close()
                    err_f.close()
                except Exception:
                    pass
                
                out_log = os.path.join(LOGS_DIR, f"{name}.log")
                err_log = os.path.join(LOGS_DIR, f"{name}_err.log")
                out_f = open(out_log, "a", encoding="utf-8")
                err_f = open(err_log, "a", encoding="utf-8")
                log_files[name] = (out_f, err_f)
                
                config = services[name]
                svc_env = env.copy()
                if name == "frontend":
                    svc_env["PORT"] = "3000"
                
                p_new = subprocess.Popen(
                    config["args"],
                    cwd=config["cwd"],
                    env=svc_env,
                    stdout=out_f,
                    stderr=err_f,
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
                )
                processes[name] = p_new

except KeyboardInterrupt:
    print("\n\nShutting down all services...")
finally:
    for name, p in processes.items():
        try:
            print(f"   Terminating {name}...")
            kill_process_tree(p)
        except Exception:
            pass
    for out_f, err_f in log_files.values():
        try:
            out_f.close()
            err_f.close()
        except Exception:
            pass
    print("Shutdown complete.")

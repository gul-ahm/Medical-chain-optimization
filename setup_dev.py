import os
import sys
import subprocess

def setup():
    root = os.path.dirname(os.path.abspath(__file__))
    packages = ["sc_events", "sc_db", "sc_auth", "sc_schemas", "sc_observability"]
    
    print("Installing shared packages in editable mode...")
    for pkg in packages:
        pkg_path = os.path.join(root, "packages", pkg)
        if os.path.exists(pkg_path):
            subprocess.run([sys.executable, "-m", "pip", "install", "-e", pkg_path])
            
    print("Monorepo setup complete.")

if __name__ == "__main__":
    setup()

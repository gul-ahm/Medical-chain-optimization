import os

services_dir = "services"
for service in os.listdir(services_dir):
    req_file = os.path.join(services_dir, service, "requirements.txt")
    if os.path.exists(req_file):
        with open(req_file, "r") as f:
            lines = f.readlines()
        
        if "python-dateutil\n" not in lines:
            lines.append("python-dateutil\n")
            
        with open(req_file, "w") as f:
            f.writelines(lines)
        print(f"Updated {req_file} with python-dateutil")

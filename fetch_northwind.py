import urllib.request
import json
import os

base_url = "https://services.odata.org/V4/Northwind/Northwind.svc/"
output_dir = "NorthwindData"

os.makedirs(output_dir, exist_ok=True)

print("Fetching metadata...")
req = urllib.request.Request(f"{base_url}?$format=json", headers={'Accept': 'application/json'})
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    datasets = data.get("value", [])

print(f"Found {len(datasets)} datasets. Starting download...")

for ds in datasets:
    name = ds.get("name")
    print(f"Fetching {name}...")
    
    url = f"{base_url}{name}?$format=json"
    all_data = []
    
    while url:
        req = urllib.request.Request(url, headers={'Accept': 'application/json'})
        try:
            with urllib.request.urlopen(req) as response:
                res = json.loads(response.read().decode())
                all_data.extend(res.get("value", []))
                
                next_link = res.get("@odata.nextLink")
                if next_link:
                    if next_link.startswith("http"):
                        url = next_link
                    else:
                        url = f"{base_url}{next_link}"
                else:
                    url = None
        except Exception as e:
            print(f"Failed to fetch {url}: {e}")
            url = None
            
    with open(os.path.join(output_dir, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=4)
        
print("All datasets fetched successfully!")

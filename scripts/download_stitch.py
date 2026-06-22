import json
import urllib.request
import os
import glob

def process_stitch_outputs():
    base_dir = r"C:\Users\hk672\.gemini\antigravity-ide\brain\c8711467-eb9b-4e0a-869e-0e66224de65f\.system_generated\steps"
    target_dir = r"C:\Users\hk672\OneDrive\Desktop\Program\FinResilience Pro Automated Wealth and  Debt Optimization Platform\frontend\src\stitch-ui"
    
    os.makedirs(target_dir, exist_ok=True)
    
    step_dirs = ["392", "393", "394"]
    names = ["landing_page", "input_form", "results_dashboard"]
    
    for step, name in zip(step_dirs, names):
        file_path = os.path.join(base_dir, step, "output.txt")
        if not os.path.exists(file_path):
            continue
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        try:
            data = json.loads(content)
            screens = data.get("outputComponents", [])[0].get("design", {}).get("screens", [])
            for screen in screens:
                html_url = screen.get("htmlCode", {}).get("downloadUrl")
                if html_url:
                    html_content = urllib.request.urlopen(html_url).read().decode('utf-8')
                    with open(os.path.join(target_dir, f"{name}.html"), "w", encoding="utf-8") as out_f:
                        out_f.write(html_content)
                    print(f"Downloaded {name}.html")
        except Exception as e:
            print(f"Error processing {step}: {e}")

if __name__ == "__main__":
    process_stitch_outputs()

import re
import os

def html_to_jsx(html):
    # Convert class to className
    jsx = re.sub(r'\bclass="([^"]*)"', r'className="\1"', html)
    # Convert inline styles (simplistic)
    jsx = re.sub(r'style="([^"]*)"', lambda m: 'style={{' + ', '.join([f"'{k.strip()}': '{v.strip()}'" for k, v in [p.split(':', 1) for p in m.group(1).split(';') if ':' in p]]) + '}}', jsx)
    # Close void tags
    void_tags = ['input', 'img', 'br', 'hr', 'meta', 'link']
    for tag in void_tags:
        jsx = re.sub(r'(<' + tag + r'[^>]*?)(?<!/)>', r'\1 />', jsx)
    
    # SVG fixes
    jsx = jsx.replace('fill-rule=', 'fillRule=').replace('clip-rule=', 'clipRule=').replace('stroke-width=', 'strokeWidth=').replace('stroke-linecap=', 'strokeLinecap=').replace('stroke-linejoin=', 'strokeLinejoin=')
    jsx = jsx.replace('for="', 'htmlFor="')
    
    # Remove HTML comments
    jsx = re.sub(r'<!--.*?-->', '', jsx, flags=re.DOTALL)
    
    return jsx

def process():
    files = ["landing_page", "input_form", "results_dashboard"]
    for f in files:
        path = f"frontend/src/stitch-ui/{f}.html"
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()
            match = re.search(r'<body[^>]*>(.*)</body>', content, re.DOTALL | re.IGNORECASE)
            if match:
                body = match.group(1)
                jsx = html_to_jsx(body)
                with open(f"frontend/src/stitch-ui/{f}.jsx", "w", encoding="utf-8") as out:
                    out.write(jsx)
                print(f"Processed {f}.jsx")

if __name__ == "__main__":
    process()

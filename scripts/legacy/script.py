import re

with open('src/lib/data.ts', 'r', encoding='utf-8') as f:
    d = f.read()

d = re.sub(r'virtualTourUrl:[^,]+,\r?\n\s*', '', d)
d = re.sub(r'(propertyType:\s*[\'"].*?[\'"],)', r"\1\n    virtualTourUrl: 'https://my.matterport.com/show/?m=JGPnGQ6hosj',", d)

with open('src/lib/data.ts', 'w', encoding='utf-8') as f:
    f.write(d)

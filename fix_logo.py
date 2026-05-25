import sys
import re

# Read index.html logo
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()
logo_line = lines[263]

# Regex pattern to match the text logo block
pattern = re.compile(r'\s*<a href=\"index\.html\" class=\"header-logo\"[^>]*>\s*<div class=\"logo-text\"[^>]*>\s*Bio<em[^>]*>Peptix</em>\s*</div>\s*</a>\n', re.MULTILINE)

# Replace in privacy.html
with open('privacy.html', 'r', encoding='utf-8') as f:
    privacy_content = f.read()
privacy_content = pattern.sub(logo_line, privacy_content)
with open('privacy.html', 'w', encoding='utf-8') as f:
    f.write(privacy_content)

# Replace in terms.html
with open('terms.html', 'r', encoding='utf-8') as f:
    terms_content = f.read()
terms_content = pattern.sub(logo_line, terms_content)
with open('terms.html', 'w', encoding='utf-8') as f:
    f.write(terms_content)

print('Replacement done')

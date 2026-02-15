import requests, re
r = requests.get('https://stockx.com/air-jordan-4-retro-white-midnight-navy', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
# Look for og:image
m = re.search(r'og:image.*?content="(.*?)"', r.text)
if m:
    print("og:image:", m.group(1))
# Look for any stockx image URLs
imgs = set(re.findall(r'https://images\.stockx\.com/images/[^"\'>\s]+', r.text))
for img in sorted(imgs)[:10]:
    print("Found:", img)

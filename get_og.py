import requests, re
urlKey = 'air-jordan-4-retro-white-midnight-navy'
url = f'https://stockx.com/{urlKey}'
r = requests.get(url, headers={'User-Agent': 'facebookexternalhit/1.1'}, timeout=10)
print(f'Status: {r.status_code}')
m = re.search(r'og:image["\s]+content="(.*?)"', r.text)
if m:
    print(f'OG Image: {m.group(1)}')
imgs = re.findall(r'https://images\.stockx\.com[^"\'>\s]+', r.text)
for i in sorted(set(imgs))[:5]:
    print(f'IMG: {i}')

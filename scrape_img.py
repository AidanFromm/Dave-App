import requests, re

urlKey = 'air-jordan-4-retro-white-midnight-navy'
r = requests.get(f'https://stockx.com/{urlKey}', headers={
    'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    'Accept': 'text/html',
}, timeout=10, allow_redirects=True)
print(f'Status: {r.status_code}')
if r.ok:
    m = re.search(r'og:image[^>]*content="(.*?)"', r.text)
    if m:
        print(f'OG Image: {m.group(1)}')
    imgs = re.findall(r'https://images\.stockx\.com/images/[^"\s>]+', r.text)
    for i in sorted(set(imgs))[:5]:
        print(f'IMG: {i}')
    if not imgs:
        print("No images found in HTML")
        # Check if page has any useful content
        print(f"HTML length: {len(r.text)}")
        print(f"Title: {re.search(r'<title>(.*?)</title>', r.text).group(1) if re.search(r'<title>(.*?)</title>', r.text) else 'none'}")

import requests, json

key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cGZ2dnd5cHl2emt6bmVra3N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2OTMyMiwiZXhwIjoyMDg1NzQ1MzIyfQ.0dzNEm4ygSQUEUWuXQqXXzmsslvayB7xpXBWB1BTUVg'
url = 'https://wupfvvwypyvzkznekksw.supabase.co/rest/v1/stockx_tokens?select=access_token&limit=1'
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}
r = requests.get(url, headers=headers)
token = json.loads(r.text)[0]['access_token']
api_key = 'SQijlNY3Vl1QtyztWOb2R5cKdzyTvi272fpepFH6'

ah = {'Authorization': f'Bearer {token}', 'x-api-key': api_key, 'Accept': 'application/json'}
pid = '4a151ea9-0926-4358-8f49-78981d025076'

# Try v2 with different query params that might include media
print("=== v2 product with includes ===")
for param in ['', '?includes=media', '?includes=images', '?fields=media,title,brand']:
    r = requests.get(f'https://api.stockx.com/v2/catalog/products/{pid}{param}', headers=ah)
    data = r.json()
    has_media = 'media' in str(data)
    has_image = 'image' in str(data).lower()
    print(f'{param or "(none)"}: {r.status_code}, has_media={has_media}, has_image={has_image}')
    if has_image or has_media:
        print(json.dumps(data, indent=2)[:800])

# Try v1 endpoint
print("\n=== v1 product ===")
r1 = requests.get(f'https://api.stockx.com/v1/products/{pid}', headers=ah)
print(f'v1 status: {r1.status_code}')
if r1.ok:
    print(json.dumps(r1.json(), indent=2)[:1000])

# Try search with different params
print("\n=== v2 search with media ===")
r2 = requests.get(f'https://api.stockx.com/v2/catalog/search?query=DH6927-140&pageSize=1', headers=ah)
data2 = r2.json()
print(json.dumps(data2, indent=2)[:1000])

# Try the browse endpoint
print("\n=== browse endpoint ===")
r3 = requests.get(f'https://api.stockx.com/v2/browse?query=DH6927-140', headers=ah)
print(f'browse: {r3.status_code} {r3.text[:500]}')

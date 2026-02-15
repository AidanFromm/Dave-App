import requests, json

key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cGZ2dnd5cHl2emt6bmVra3N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2OTMyMiwiZXhwIjoyMDg1NzQ1MzIyfQ.0dzNEm4ygSQUEUWuXQqXXzmsslvayB7xpXBWB1BTUVg'
url = 'https://wupfvvwypyvzkznekksw.supabase.co/rest/v1/stockx_tokens?select=access_token&limit=1'
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}
r = requests.get(url, headers=headers)
token = json.loads(r.text)[0]['access_token']
api_key = 'SQijlNY3Vl1QtyztWOb2R5cKdzyTvi272fpepFH6'

auth_headers = {
    'Authorization': f'Bearer {token}',
    'x-api-key': api_key,
    'Accept': 'application/json'
}

pid = '4a151ea9-0926-4358-8f49-78981d025076'

# Product detail
r2 = requests.get(f'https://api.stockx.com/v2/catalog/products/{pid}', headers=auth_headers)
data = r2.json()
print("=== RAW PRODUCT RESPONSE ===")
print(json.dumps(data, indent=2)[:2000])

# Variants
r3 = requests.get(f'https://api.stockx.com/v2/catalog/products/{pid}/variants?pageSize=50', headers=auth_headers)
vdata = r3.json()
print("\n=== RAW VARIANTS RESPONSE ===")
print(json.dumps(vdata, indent=2)[:3000])

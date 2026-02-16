import requests, re, json

style = 'DH6927-140'

# Nike API - product search
r = requests.get(
    f'https://api.nike.com/cic/browse/v2?queryid=products&anonymousId=test&country=us&endpoint=%2Fproduct_feed%2Frollup_threads%2Fv2%3Ffilter%3Dmarketplace(US)%26filter%3Dlanguage(en)%26filter%3DemployeePrice(true)%26searchTerms%3D{style}%26anchor%3D0%26count%3D1%26consumerChannelId%3Dd9a5bc42-4b9c-4976-858a-f159cf99c647',
    headers={'User-Agent': 'Mozilla/5.0'},
    timeout=10
)
print(f'Nike API: {r.status_code}')
if r.ok:
    data = r.json()
    objects = data.get('data', {}).get('products', {}).get('objects', [])
    if objects:
        product = objects[0]
        images = product.get('publishedContent', {}).get('properties', {}).get('coverCard', {}).get('properties', {}).get('coverImage', {})
        squarish = product.get('images', {}).get('squarishURL', '')
        portrait = product.get('images', {}).get('portraitURL', '')
        print(f'squarishURL: {squarish}')
        print(f'portraitURL: {portrait}')
        # Also check productInfo
        for node in product.get('productInfo', []):
            img = node.get('imageUrl', '')
            if img:
                print(f'productInfo imageUrl: {img}')
    else:
        print('No products found')
        print(json.dumps(data, indent=2)[:500])

# Also try SNKRS feed
r2 = requests.get(
    f'https://api.nike.com/product_feed/threads/v3/?filter=marketplace(US)&filter=language(en)&filter=channelId(d9a5bc42-4b9c-4976-858a-f159cf99c647)&filter=exclusiveAccess(true,false)&search={style}&count=1',
    headers={'User-Agent': 'Mozilla/5.0', 'nike-api-caller-id': 'nike:dotcom:snkrs.web'},
    timeout=10
)
print(f'\nSNKRS API: {r2.status_code}')
if r2.ok:
    data2 = r2.json()
    for obj in data2.get('objects', []):
        sq = obj.get('publishedContent', {}).get('properties', {}).get('coverCard', {}).get('properties', {}).get('squarish', {}).get('url', '')
        print(f'SNKRS squarish: {sq}')

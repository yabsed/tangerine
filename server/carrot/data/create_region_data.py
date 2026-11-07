import asyncio
import httpx
import json
import uuid
import os

GEOJSON_URL = "https://raw.githubusercontent.com/vuski/admdongkor/master/ver20250101/HangJeongDong_ver20250101.geojson"
OUTPUT_PATH = "carrot/data/regions.json" # 마이그레이션 파일이 참조할 경로

async def generate_migration_data():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(GEOJSON_URL)
        data = response.json()

    features = data.get('features', [])
    result = []
    
    for feature in features:
        props = feature.get('properties', {})
        sido = props.get('sidonm', '')
        sigugun = props.get('sggnm', '')
        full_name = props.get('adm_nm', '')
        
        # 읍면동 추출 및 빈 문자열 처리
        parts = full_name.split()
        dong = parts[-1] if parts else ""
        
        # 시군구 없는 경우 처리 (세종시 등)
        if not sigugun or sigugun == 'None':
            sigugun = sido if "세종" in sido else ""

        result.append({
            "id": str(uuid.uuid4()), # 미리 UUID 생성
            "sido": sido,
            "sigugun": sigugun,
            "dong": dong
        })

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"총 {len(result)}개의 데이터가 {OUTPUT_PATH}에 저장되었습니다.")

if __name__ == "__main__":
    asyncio.run(generate_migration_data())
"""장비 카탈로그(cranes.json)를 앱 데이터로 복사한다.

사용: python3 scripts/sync-catalog.py [cranes.json 경로]
기본 경로는 프로젝트 공유 폴더의 /mnt/project-files/catalog/cranes.json.
앱에서 쓰지 않는 필드는 빼고, 정렬해서 src/data/catalog.json 에 쓴다.
"""
import json, sys, pathlib

src = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/catalog/cranes.json'
out = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'data' / 'catalog.json'
KEEP = ['id', 'maker', 'model', 'type', 'classTon', 'maxCap', 'boom', 'jib', 'hookHeight', 'maxRadius', 'outrigger',
        'size', 'weight', 'hookBlock', 'axles', 'engine', 'current', 'confidence', 'source', 'sourceUrl', 'sourceDoc',
        'chartDoc', 'note', 'chart']

d = json.load(open(src))
cranes = []
for c in d['cranes']:
    e = {k: c.get(k) for k in KEEP}
    e['current'] = c.get('current', True) is not False
    if e['sourceDoc'] and not str(e['sourceDoc']).startswith('http'):
        e['sourceDoc'] = None  # 문서 번호만 있는 값은 링크로 못 쓴다
    cranes.append({k: v for k, v in e.items() if v is not None})
cranes.sort(key=lambda c: (c['classTon'], c['maker'], c['model']))
ids = [c['id'] for c in cranes]
assert len(ids) == len(set(ids)), 'duplicate ids'
json.dump({'collectedAt': d.get('collectedAt'), 'cranes': cranes}, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(cranes)} cranes -> {out} ({out.stat().st_size // 1024} KB)')

"""Copy the crane catalog (cranes.json) into app data.

Usage: python3 scripts/sync-catalog.py [path to cranes.json]
Default path is /mnt/project-files/catalog/cranes.json in the project shared folder.
Drops fields the app does not use, sorts, and writes src/data/catalog.json.
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
        e['sourceDoc'] = None  # a bare document number cannot be used as a link
    cranes.append({k: v for k, v in e.items() if v is not None})
cranes.sort(key=lambda c: (c['classTon'], c['maker'], c['model']))
ids = [c['id'] for c in cranes]
assert len(ids) == len(set(ids)), 'duplicate ids'
json.dump({'collectedAt': d.get('collectedAt'), 'cranes': cranes}, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(cranes)} cranes -> {out} ({out.stat().st_size // 1024} KB)')

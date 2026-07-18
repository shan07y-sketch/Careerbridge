import sys, types, marshal, hashlib

BACKEND = '/sessions/zen-exciting-edison/mnt/Website/backend'
sys.path.insert(0, BACKEND)
sys.path.insert(0, BACKEND + '/scripts')

pyc_path = BACKEND + '/__pycache__/seed_engine.cpython-310.pyc'
with open(pyc_path, 'rb') as f:
    f.read(16)
    code = marshal.load(f)

mod = types.ModuleType('seed_engine')
mod.__file__ = BACKEND + '/seed_engine.py'
sys.modules['seed_engine'] = mod
exec(code, mod.__dict__)

import generate_seed_json, inspect
src = inspect.getsource(generate_seed_json.main)
print('createdByRecruiterId' in src, len(src))
print(generate_seed_json.__file__)
with open(generate_seed_json.__file__, 'rb') as f:
    print('disk hash', hashlib.md5(f.read()).hexdigest())

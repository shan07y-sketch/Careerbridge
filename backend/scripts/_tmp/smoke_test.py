import sys, types, marshal

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

from careerbridge_seed_engine.config import CONFIG
CONFIG.counts.students = 30
CONFIG.counts.jobs = 15
CONFIG.counts.companies = 8
CONFIG.counts.recruiters = 10
CONFIG.counts.applications = 60
CONFIG.counts.interviews = 25
CONFIG.counts.offers = 15
CONFIG.counts.conversations = 20
CONFIG.counts.notifications = 40

import generate_seed_json
generate_seed_json.main()

import os
os.environ['SUPABASE_URL'] = 'https://oufkyoraefgryjxjbiep.supabase.co'
os.environ['SUPABASE_SERVICE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91Zmt5b3JhZWZncnlqeGpiaWVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjEwMjk1MCwiZXhwIjoyMDkxNjc4OTUwfQ.9Wi1TtLrhWNK1CQLzENR7dajXGnX-FXHE0ejt8BVU0I'

from glowai.db import get_db, init_db
init_db()
print('DB init OK')

db = get_db()
# Test products table
res = db.table("products").select("id, name").limit(3).execute()
print('Products query OK, count:', len(res.data))
for p in res.data:
    print(' -', p.get('name'))

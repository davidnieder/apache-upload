#!py-venv/bin/python

from app import database
from app.upload import remove_file, build_dir_path


for f in database.get_expired_entries():
    print('removing "{}" from "{}"', f['filename'], build_dir_path(f))
    remove_file(f)

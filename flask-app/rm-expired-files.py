#!py-venv/bin/python
# -*- coding: utf-8 -*-

from __future__ import unicode_literals

from app import database
from app.upload import remove_file, build_dir_path


for f in database.get_expired_entries():
    print 'removing "%s" from "%s"' %(f['filename'], build_dir_path(f))
    remove_file(f)

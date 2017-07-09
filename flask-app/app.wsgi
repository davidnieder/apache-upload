# -*- coding: utf-8 -*-

import os
import sys
import site


app_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, app_root)
site.addsitedir(app_root + '/py-venv/lib/python2.7/site-packages')

from app import app as application

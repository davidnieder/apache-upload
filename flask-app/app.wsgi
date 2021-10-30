import os
import sys


app_root = os.path.dirname(os.path.abspath(__file__))
activate_this = app_root + '/py-venv/bin/activate_this.py'
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))

sys.path.insert(0, app_root)
from app import app as application

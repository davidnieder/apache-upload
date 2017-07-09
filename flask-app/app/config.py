# -*- coding: utf-8 -*-

from __future__ import unicode_literals
from os import path


class Config(object):
    DEBUG = False
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024

    DATABASE = ''

    PATH_PUP = ''
    PATH_PRV = ''


# set paths dynamic if they are left empty above
project_root = path.join(path.dirname(path.abspath(__file__)), '../../')
if Config.DATABASE == '':
    Config.DATABASE = path.join(project_root, 'flask-app/database.sqlite3')
if Config.PATH_PUP == '':
    Config.PATH_PUP = path.join(project_root, 'doc-root/pup')
if Config.PATH_PRV == '':
    Config.PATH_PRV = path.join(project_root, 'doc-root/prv')

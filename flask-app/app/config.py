from os import path


class Config(object):
    DEBUG = False
    MAX_CONTENT_LENGTH = 1000 * 1024 * 1024

    DATABASE = ''

    PATH_PUP = '/mnt/ex01/apache-upload-docroot/pup'
    PATH_PRV = '/mnt/ex01/apache-upload-docroot/prv'


# set paths dynamic if they are left empty above
project_root = path.join(path.dirname(path.abspath(__file__)), '../../')
if Config.DATABASE == '':
    Config.DATABASE = path.join(project_root, 'flask-app/database.sqlite3')
if Config.PATH_PUP == '':
    Config.PATH_PUP = path.join(project_root, 'doc-root/pup')
if Config.PATH_PRV == '':
    Config.PATH_PRV = path.join(project_root, 'doc-root/prv')

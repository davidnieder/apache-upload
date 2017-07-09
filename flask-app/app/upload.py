# -*- coding: utf-8 -*-

from __future__ import unicode_literals

import os
import uuid
from time import time

from flask import Flask, render_template, request, make_response, g
from flask import redirect, jsonify, abort, url_for
from jinja2.filters import do_filesizeformat as filesizeformat
from werkzeug.utils import secure_filename

import database
from .config import Config


script_root = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__.split('.')[0], template_folder=script_root)
app.config.from_object(Config)

@app.before_request
def check_diskaccess():
    if os.access(Config.PATH_PUP, os.W_OK) is False or \
       os.access(Config.PATH_PRV, os.W_OK) is False:
        return make_response(('error: some paths ain\'t writable, yo', 500, []))

@app.before_request
def check_diskspace():
    statvfs = os.statvfs(Config.PATH_PUP)
    size = statvfs.f_frsize * statvfs.f_blocks
    free = statvfs.f_frsize * statvfs.f_bavail
    if free/size > 0.2:
        return make_response(('error: low disk space, yo', 500, []))

@app.before_request
def check_remoteuser():
    if request.remote_user is None:
        return make_response(('error: http auth ain\'t configured?', 500, []))

@app.before_request
def db_connect():
    if not hasattr(g, 'db'):
        g.db = database.connect()

@app.teardown_request
def db_close(error):
    if hasattr(g, 'db'):
        g.db.close()

@app.errorhandler(413)
def payload_too_large(error):
    return make_response(('file to large', 413, []))

@app.route('/')
def test():
    return 'this is "%s", you are "%s"' %(app.name, request.remote_user)

@app.route('/jsenv')
def jsenv():
    files = database.get_user_entries(request.remote_user)
    return jsonify(
            endpoints = {
                'upload': url_for('handle_upload'),
                'delete': url_for('delete_file')
            },
            fileSizeLimit = {
                'bytes': app.config['MAX_CONTENT_LENGTH'],
                'humanReadable': filesizeformat(app.config['MAX_CONTENT_LENGTH'], True)
            },
            userFiles = files)

@app.route('/upload', methods=['POST'])
def handle_upload():
    if 'user-file' not in request.files:
        return jsonify(success=False, reason='no file sent')

    user_file = request.files['user-file']
    if user_file.name == '':
        return jsonify(success=False, reason='empty filename')

    if user_file:
        filename = secure_filename(user_file.filename)
        hex_id = uuid.uuid4().get_hex()

        if request.form.get('make-private', False):
            is_private = True
            path = os.path.join(Config.PATH_PRV, hex_id)
        else:
            is_private = False
            path = os.path.join(Config.PATH_PUP, hex_id)

        fullpath = os.path.join(path, filename)
        os.mkdir(path, 0751)
        user_file.save(fullpath)

        timestamp = int(time())
        validfor = request.form.get('valid-for', 0, type=int)

        database.add_entry(hex_id, filename, request.remote_user, validfor,
                is_private, timestamp)

        file_info = {
                'uuid': hex_id, 'filename': filename, 'is_private': is_private,
                'username': request.remote_user, 'timestamp': timestamp,
                'validfor': validfor }
        return jsonify(success=True, fileInfo=file_info)
    else:
        return jsonify(success=False, reason='what do I know')

@app.route('/delete', methods=['DELETE'])
def delete_file():
    file_id = request.args.get('fileid', '')
    user_file = database.get_entry(file_id)
    if user_file and user_file['username'] == request.remote_user:
        database.remove_entry(file_id)

        os.unlink(build_file_path(user_file))
        os.rmdir(build_dir_path(user_file))

        return jsonify(success=True)
    else:
        return jsonify(success=False)

def build_dir_path(user_file):
    if user_file['is_private']:
        return os.path.join(Config.PATH_PRV, user_file['uuid'])
    else:
        return os.path.join(Config.PATH_PUP, user_file['uuid'])

def build_file_path(user_file):
    return os.path.join(build_dir_path(user_file), user_file['filename'])

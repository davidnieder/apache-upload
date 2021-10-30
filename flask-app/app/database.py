import sqlite3
from time import time
from flask import g

from .config import Config


def connect():
    if g and hasattr(g, 'db'):
        return g.db
    else:
        con = sqlite3.connect(Config.DATABASE)
        con.row_factory = convert_results
        return con

def create():
    db = connect()
    db.executescript(schema)
    db.close()

def add_entry(uuid, filename, username, validfor, is_private, timestamp):
    db = connect()
    db.execute('INSERT INTO urls VALUES (?,?,?,?,?,?)',
            (uuid, filename, username, is_private, timestamp, validfor))
    db.commit()

def get_entry(uuid):
    con = connect()
    cur = con.execute('SELECT * FROM urls WHERE uuid=?', (uuid, ))
    return cur.fetchone()

def remove_entry(uuid):
    con = connect()
    con.execute('DELETE FROM urls WHERE uuid=?', (uuid, ))
    con.commit()

def get_user_entries(username):
    con = connect()
    cur = con.cursor()
    cur.execute('SELECT * FROM urls WHERE user=? ORDER BY timestamp DESC',
                (username, ))
    return cur.fetchall()

def get_all_entries():
    con = connect()
    cur = con.cursor()
    cur.execute('SELECT * FROM urls ORDER BY timestamp DESC')
    return cur.fetchall()

def get_expired_entries():
    con = connect()
    cur = con.cursor()
    cur.execute('SELECT * FROM urls WHERE (timestamp + validfor*24*60*60) < ?',
                (int(time()),))
    return cur.fetchall()

def convert_results(cur, row):
    return {'uuid': row[0], 'filename': row[1], 'username': row[2],
            'is_private': bool(row[3]), 'timestamp': row[4],
            'validfor': row[5]}

schema = '''
    DROP TABLE IF EXISTS urls;
    CREATE TABLE urls (
      uuid TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      user TEXT NOT NULL,
      is_private INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      validfor INTEGER NOT NULL
    );
'''

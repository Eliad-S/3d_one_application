import time
from flask import Flask, send_file, send_from_directory
from camera_utils import CameraPip
from flask_sqlalchemy import SQLAlchemy
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dbdir/test.db'
db = SQLAlchemy(app)
# implement singelton
camera = CameraPip()

eliads = 5
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def __repr__(self):
        return '<User %r>' % self.username

@app.route('/time')
def get_current_time():
    return {'time': time.time()}

@app.route('/close')
def close_pip():
    camera.close_pip()
    return {'name': ['orange', 'apple']}


@app.route('/feed/bot', methods=['GET'])
def get_both():
    print('get requesessssssssss')
    img_io = camera.get_align_path()
    print(type(img_io))
    return send_file(img_io, mimetype='image/jpeg', as_attachment=False, cache_timeout=0)


@app.route('/feed/rgb', methods=['GET'])
def get_rgb():
    print('get requesessssssssss')
    img_io = camera.get_rgb()
    print(img_io)
    return send_file(img_io, mimetype='image/jpeg', as_attachment=False)


@app.route('/feed/aligne', methods=['GET'])
def get_aligned():
    print('get requesessssssssss')
    img_io = camera.get_align_path()
    print(type(img_io))
    return send_file(img_io, mimetype='image/jpeg', as_attachment=False, cache_timeout=0)


@app.route('/api', methods=['GET'])
def index():
    return {
        'name': ['orange', 'apple']
    }

#
# @app.route('/model_name', methods=['POST'])
# def get_feed():
#     # create file in path in setting
#     pass
#
#
# @app.route('/feed', methods=['GET'])
# def get_feed():
#     pass
#
#
# #####settingsssss
# # default 4
# @app.route('/settings/number_of_frames', methods=['GET,POST'])
# def get_feed():
#     pass
#
#
# @app.route('/settings/directory/', methods=['GET', 'POST'])
# def get_feed():
#     pass

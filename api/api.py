import json
import time
from flask import Flask, send_file, send_from_directory, jsonify
from camera_utils import CameraPip
from db_manager import db_session
import db_manager
camera = CameraPip()

app = Flask(__name__)


@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()


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


@app.route('/models', methods=['GET'])
def get_models():
    # print(db_manager.get_all())
    return jsonify(json_list=[i.serialize for i in db_manager.get_all()])

import time
from flask import Flask, send_file, send_from_directory, jsonify
from camera_utils import CameraPipe
from db_manager import db_session
from setting_manager import Setting_Manager
import db_manager
from utils import draw_point_cloud

setting_manager = Setting_Manager()
camera = CameraPipe()
app = Flask(__name__)


@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()


@app.route('/time')
def get_current_time():
    return {'time': time.time()}


@app.route('/close', methods=['GET'])
def close_pipe():
    try:
        camera.close_pipe()
        camera.reset_captures()
        return {"succeed closing pipe": 200}
    except Exception as error:
        return jsonify({'error': error})


@app.route('/open', methods=['GET'])
def open_pipe():
    try:
        camera.open_pipe()
        return {"succeed open pipe": 200}
    except Exception as error:
        return jsonify({'error': error})


@app.route('/feed/both', methods=['GET'])
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
    return jsonify([i.serialize for i in db_manager.get_all()])


@app.route('/capture', methods=['GET'])
def capture():
    try:
        camera.capture_frame()
        return {"succeed closing pipe": 200}
    except Exception as error:
        return jsonify({'error': error})


@app.route('/restart', methods=['GET'])
def reset():
    camera.reset_captures()
    return {"succeed closing pipe": 200}


@app.route('/settings', methods=['GET'])
def get_setting():
    try:
        data = setting_manager.get_json()
        return jsonify(data)
    except Exception as error:
        return jsonify({'error': error})


@app.route('/create_model', methods=['GET'])
def create_model():
    try:
        mesh = camera.create_model()
        draw_point_cloud(mesh)
        return {"succeed open pipe": 200}
    except Exception as error:
        return jsonify({'error': error})

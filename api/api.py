import os
import time
from sqlalchemy.exc import IntegrityError

from flask import Flask, send_file, jsonify, make_response
from camera_utils import CameraPipe
from db_manager import db_session
from setting_manager import Setting_Manager
import db_manager
from utils import covert_to_obj, convert_3d_to_2d

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
        return make_response(jsonify("camera is off"), 200)
    except Exception as error:
        return make_response(jsonify("failed close camera pipe"), 404)


@app.route('/open', methods=['GET'])
def open_pipe():
    try:
        camera.open_pipe()
        camera.reset_captures()
        return make_response(jsonify("camera is on"), 200)

    except Exception as error:
        return make_response(jsonify("failed open pipe"), 404)


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

#try catch
@app.route('/models', methods=['GET'])
def get_models():
    # print(db_manager.get_all())
    return jsonify([i.serialize for i in db_manager.get_all()])


@app.route('/models/delete/<name>', methods=['GET'])
def get_models_by_name(name=None):
    try:
        result = db_manager.delete_item(name)
        if result == 0:
            make_response(jsonify(f"didn't found model named {name}"), 200)
        return make_response(jsonify("model has been deleted"), 200)
    except Exception as error:
        return make_response(jsonify("failed deleting model"), 404)

# @app.route('/models/date', methods=['GET'])
# def get_models_by_date():
#     # print(db_manager.get_all())
#     return jsonify([i.serialize for i in db_manager.get_all()])
#
#
# @app.route('/models/size', methods=['GET'])
# def get_models_by_size():
#     # print(db_manager.get_all())
#     return jsonify([i.serialize for i in db_manager.get_all()])
#
#
# @app.route('/models/name', methods=['GET'])
# def get_models_by_name():
#     # print(db_manager.get_all())
#     return jsonify([i.serialize for i in db_manager.get_all()])


@app.route('/capture', methods=['GET'])
def capture():
    try:
        camera.capture_frame()
        # if camera.captured_frames_counter == setting_manager.get_val("number_of_frames"):
        #     camera.close_pipe()
        #     camera.reset_captures()
        return {"succeed closing pipe": 200}
    except Exception as error:
        print(error)
        return make_response(jsonify("failed capture frame"), 404)


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
        print(error)
        return make_response(jsonify(error), 404)


@app.route('/models/create/<name>', methods=['GET'])
def create_model(name=None):
    global obj_url, img_url
    try:
        mesh = camera.create_model()
        count = db_manager.count(name)
        if count:
            name = f'{name}({count})'
        print("convert obj")
        obj_url = covert_to_obj(mesh, name)
        print("convert img")

        img_url = convert_3d_to_2d(mesh, name)
        db_manager.add_item(name=name, obj_url=f'../api/{obj_url}', img_url=f'../api/{img_url}')
        print("save midel")
        model = db_manager.get_item(name)
        if model is not None:
            return model.serialize
        return make_response(jsonify("model was not found in db"), 404)
    except Exception as error:
        print(error)
        if os.path.exists(f'{obj_url}'):
            os.remove(f'{obj_url}')
        if os.path.exists(f'{img_url}'):
            os.remove(f'{img_url}')
        return make_response(jsonify("failed creating model"), 404)

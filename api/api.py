import os
import time
from flask import Flask, send_file, jsonify, make_response
from camera_utils import CameraPipe
from db_manager import db_session
import db_manager
from utils import covert_to_obj, convert_3d_to_2d, setting_manager, view_model_by_url
from hurry.filesize import size

camera = CameraPipe()
app = Flask(__name__)
url_base = "../public/my_models"


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
    try:
        img_io = camera.get_both()
        print(type(img_io))
    except Exception as e:
        print(e)
        return make_response(jsonify("failed capture frame"), 404)
    return send_file(img_io, mimetype='image/jpeg', as_attachment=False, cache_timeout=0)


@app.route('/feed/rgb', methods=['GET'])
def get_rgb():
    try:
        img_io = camera.get_rgb()
        print(type(img_io))
    except Exception as e:
        print(e)
        return make_response(jsonify("failed capture frame"), 404)
    return send_file(img_io, mimetype='image/jpeg', as_attachment=False, cache_timeout=0)



@app.route('/feed/aligne', methods=['GET'])
def get_aligned():
    try:
        img_io = camera.get_align_path()
        print(type(img_io))
    except Exception as e:
        print(e)
        return make_response(jsonify("failed capture frame"), 404)

    return send_file(img_io, mimetype='image/jpeg', as_attachment=False, cache_timeout=0)


@app.route('/api', methods=['GET'])
def index():
    return {
        'name': ['orange', 'apple']
    }


# try catch
@app.route('/models', methods=['GET'])
def get_models():
    try:
        return jsonify([i.serialize for i in db_manager.get_all()])
    except Exception as error:
        return make_response(jsonify("failed getting models from db"), 404)


@app.route('/models/delete/<name>', methods=['GET'])
def get_models_by_name(name=None):
    try:
        result = db_manager.delete_item(name, url_base)
        if result == 0:
            make_response(jsonify(f"didn't found model named {name}"), 200)
        return make_response(jsonify("model has been deleted"), 200)
    except Exception as error:
        return make_response(jsonify("failed deleting model"), 404)


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


@app.route('/settings/number_of_frames/<int:number_of_frames>', methods=['GET'])
def set_frames(number_of_frames):
    try:
        setting_manager.modify_val("number_of_frames", number_of_frames)
        return make_response(f'number_of_frames has changed to {number_of_frames}', 200)
    except Exception as error:
        print(error)
        return make_response("error occured while changing value", 404)


@app.route('/settings/obj_distance/<float:obj_distance>', methods=['GET'])
def set_obj_distance(obj_distance):
    try:
        setting_manager.modify_val("obj_distance", obj_distance)
        return make_response(f'obj_distance has changed to {obj_distance}', 200)
    except Exception as error:
        print(error)
        return make_response("error occured while changing value", 404)


@app.route('/settings/obj_radius/<float:obj_radius>', methods=['GET'])
def set_obj_radius(obj_radius):
    try:
        setting_manager.modify_val("obj_radius", obj_radius)
        return make_response(f'obj_radius has changed to {obj_radius}', 200)
    except Exception as error:
        print(error)
        return make_response("error occured while changing value", 404)


@app.route('/settings/voice_control/<int:voice_control>', methods=['GET'])
def set_voice_control(voice_control):
    try:
        if voice_control:
            setting_manager.modify_val("voice_control", True)
        else:
            setting_manager.modify_val("voice_control", False)
        return make_response(f'voice_control has changed to {voice_control}', 200)
    except Exception as error:
        print(error)
        return make_response("error occured while changing value", 404)


@app.route('/models/create/<name>', methods=['GET'])
def create_model(name=None):
    global obj_url, img_url
    try:
        mesh = camera.create_model()
        count = db_manager.count(name)
        if count:
            name = f'{name}({count})'
        obj_url = f'{url_base}/{name}.obj'
        img_url = f'{url_base}/{name}.jpg'

        print("convert obj")
        covert_to_obj(mesh, obj_url)
        print("convert img")
        convert_3d_to_2d(mesh, img_url)
        size_bites = os.path.getsize(obj_url)
        size_bytes = size(size_bites) + 'B'

        db_manager.add_item(name=name, obj_url=f'my_models/{name}.obj', img_url=f'my_models/{name}.jpg',
                            size=size_bytes)
        print("save midel")
        model = db_manager.get_item(name)
        if model is not None:
            return model.serialize
        return make_response(jsonify("model was not found in db"), 404)
    except Exception as error:
        print(error)
        if os.path.exists(obj_url):
            os.remove(obj_url)
        if os.path.exists(img_url):
            os.remove(img_url)
        return make_response(jsonify("failed creating model"), 404)


@app.route('/models/view/<name>', methods=['GET'])
def model_viewer(name=None):
    if not name:
        return make_response(jsonify("model name wasn't provided"), 404)
    model = db_manager.get_item(name)
    view_model_by_url(f'../public/{model.model_url}', name)
    return make_response(f"{name}'s opened successfully", 200)

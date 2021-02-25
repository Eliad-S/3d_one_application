import time

from flask import Flask, send_file, send_from_directory
from camera_utils import CameraPip

app = Flask(__name__)

@app.route('/time')
def get_current_time():
    return {'time': time.time()}

@app.route('/feed/both', methods=['GET'])
def get_both():
    camera = CameraPip()
    name_file, path = camera.get_both()

    try:
        return send_from_directory(
            path,
            name_file,
            as_attachment=True,
            attachment_filename='test.png',
            mimetype='image/png'
        )

    except Exception as e:
        return str(e)


@app.route('/feed/rgb', methods=['GET'])
def get_rgb():
    camera = CameraPip()
    name_file, path = camera.get_rgb()

    try:
        return send_from_directory(
            path,
            name_file,
            as_attachment=True,
            attachment_filename='test.png',
            mimetype='image/png'
        )

    except Exception as e:
        return str(e)


@app.route('/feed/aligned', methods=['GET'])
def get_aligned():
    camera = CameraPip()
    name_file, path = camera.get_align_path()

    try:
        return send_from_directory(
            path,
            name_file,
            as_attachment=True,
            attachment_filename='test.png',
            mimetype='image/png'
        )

    except Exception as e:
        return str(e)

#
# @app.route('/capture_frame', methods=['POST'])
# def get_feed():
#     camera = CameraPip()
#     camera.create_ply()
#
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

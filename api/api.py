import time
from os import sendfile

from flask import Flask, send_file, send_from_directory
from camera_utils import CameraPip
import pointcloudadjustment

app = Flask(__name__)


@app.route('/feed/both', methods=['GET'])
def get_both():
    camera = CameraPip()
    name_file, path = camera.both_path()

    try:
        return send_from_directory(
            path,
            name_file,
            as_attachment=True,
            attachment_filename='test.jpg',
            mimetype='image/jpg'
        )

    except Exception as e:
        return str(e)


@app.route('/feed/rgb', methods=['GET'])
def get_rgb():
    camera = CameraPip()
    name_file, path = camera.rgb_path()

    try:
        return send_from_directory(
            path,
            name_file,
            as_attachment=True,
            attachment_filename='test.jpg',
            mimetype='image/jpg'
        )

    except Exception as e:
        return str(e)


@app.route('/feed/aligned', methods=['GET'])
def get_aligned():
    camera = CameraPip()
    name_file, path = camera.align_path()

    try:
        return send_from_directory(
            path,
            name_file,
            as_attachment=True,
            attachment_filename='test.jpg',
            mimetype='image/jpg'
        )

    except Exception as e:
        return str(e)


@app.route('/capture_frame', methods=['POST'])
def get_feed():
    camera = CameraPip()
    camera.create_ply()


@app.route('/model_name', methods=['POST'])
def get_feed():
    # create file in path in setting
    pass


@app.route('/feed', methods=['GET'])
def get_feed():
    pass


#####settingsssss
# default 4
@app.route('/settings/number_of_frames', methods=['GET,POST'])
def get_feed():
    pass


@app.route('/settings/directory/', methods=['GET', 'POST'])
def get_feed():
    pass

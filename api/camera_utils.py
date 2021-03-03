from time import sleep
from datetime import datetime
import numpy as np
import pyrealsense2 as rs
from PIL import Image
import cv2
from utils import serve_pil_image
from threading import Thread, Lock
time = datetime.now()
mutex = Lock()

rgb_option = 1
aligned_option = 2
both_option = 3


def check_timeout():
    while True:
        sleep(3)
        now = datetime.now()
        mutex.acquire()
        try:
            diff = (now - time).total_seconds()
            print(diff)
            print('Do some stuff')
        finally:
            mutex.release()


class CameraPip:
    def __init__(self):
        self.pipeline = rs.pipeline()
        self.pc = rs.pointcloud()
        self.config = rs.config()
        self.is_open_pip = False
        self.captured_frames_counter = 5
        # cwd = os.getcwd()
        # self.align_path = os.path.join(cwd, aligned_file)
        # self.rgb_path = os.path.join(cwd, rgb_file)
        # self.both_path = os.path.join(cwd, both_file)


    def open_pip(self):
        self.captured_frames_counter = 0
        self.is_open_pip = True
        config = rs.config()
        config.enable_stream(rs.stream.depth, 1024, 768, rs.format.z16, 30)
        config.enable_stream(rs.stream.color, 1280, 720, rs.format.rgb8, 30)

        # Start streaming
        profile = self.pipeline.start(config)

        # Getting the depth sensor's depth scale (see rs-align example for explanation)
        depth_sensor = profile.get_device().first_depth_sensor()
        depth_scale = depth_sensor.get_depth_scale()
        # Create a config and configure the pipeline to stream

        depth_sensor.set_option(rs.option.min_distance, 0.25)
        # depth_sensor.set_option(rs.option.max_distance, 1)

        print("Depth Scale is: ", depth_scale)

        # We will be removing the background of objects more than
        #  clipping_distance_in_meters meters away
        clipping_distance_in_meters = 1  # 1 meter
        self.clipping_distance = clipping_distance_in_meters / depth_scale

    def close_pip(self):
        if self.is_open_pip:
            self.pipeline.stop()
            self.is_open_pip = False

    def get_align_path(self):
        pil_img = self.capture_frame(aligned_option)
        # create relevent img and return it
        return serve_pil_image(pil_img)

    def get_both(self):
        pil_img = self.capture_frame(both_option)
        # create relevent img and return it
        return serve_pil_image(pil_img)

    def get_rgb(self):
        pil_img = self.capture_frame(rgb_option)
        return serve_pil_image(pil_img)

    def create_ply(self):
        try:
            print(f"Saving to {self.captured_frames_counter}.ply...")

            # BGR to RGB
            # Apply the processing block to the frameset which contains the depth frame and the texture
            self.points.export_to_ply(f"{self.captured_frames_counter}.ply", self.color_frame)

            # ply.process(colorized)
            print("Done")

        except Exception:
            self.close_pip()

    def capture_frame(self, option):
        print("enter capture_frame")
        if not self.is_open_pip:
            print("oprn pip")
            self.open_pip()
            t = Thread(target=check_timeout)
            t.start()
        mutex.acquire()
        try:
            align_to = rs.stream.color
            align = rs.align(align_to)
            # Get frameset of color and depth
            frames = self.pipeline.wait_for_frames()
            # frames.get_depth_frame() is a 640x360 depth image

            # Align the depth frame to color frame
            aligned_frames = align.process(frames)
            aligned_depth_frame = aligned_frames.get_depth_frame()
            self.color_frame = aligned_frames.get_color_frame()

            self.pc.map_to(self.color_frame)
            self.points = self.pc.calculate(aligned_depth_frame)

            # Get aligned frames
            # aligned_depth_frame = aligned_frames.get_depth_frame() # aligned_depth_frame is a 640x480 depth image
            # color_frame = aligned_frames.get_color_frame()

            # Validate that both frames are valid
            if not aligned_depth_frame or not self.color_frame:
                return

            depth_image = np.asanyarray(aligned_depth_frame.get_data())
            color_image = np.asanyarray(self.color_frame.get_data())

            # Remove background - Set pixels further than clipping_distance to grey
            grey_color = 153
            depth_image_3d = np.dstack(
                (depth_image, depth_image, depth_image))  # depth image is 1 channel, color is 3 channels
            bg_removed = np.where((depth_image_3d > self.clipping_distance) | (depth_image_3d <= 0), grey_color, color_image)

            # Render images
            depth_colormap = cv2.applyColorMap(cv2.convertScaleAbs(depth_image, alpha=0.03), cv2.COLORMAP_JET)
            images = np.hstack((bg_removed, depth_colormap))
            image = cv2.cvtColor(images, cv2.COLOR_RGB2BGR)
            print("Image written to file-system : ", type(image))

            # save image

            if option == both_option:
                both_frame = Image.fromarray(image)
                return both_frame
            elif option == aligned_option:
                aligned_frame = Image.fromarray(bg_removed)
                return aligned_frame
            else:
                rgb_frame = Image.fromarray(color_image)
                return rgb_frame

            # status = cv2.imwrite('both_frame.png', image)
            # status = cv2.imwrite('aligned_frame.png', bg_removed)
            # status = cv2.imwrite('rgb_frame.png', color_image)
            # print("Image written to file-system : ", status)

        except Exception:
            self.close_pip()

        finally:
            global time
            time = datetime.now()
            mutex.release()





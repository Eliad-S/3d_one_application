from time import sleep

import pyrealsense2 as rs
# Import Numpy for easy array manipulation
import numpy as np
# Import OpenCV for easy image rendering
import cv2
import os
rgb_file = 'rgb_frame.jpg'
aligned_file = 'aligned_frame.jpg'
both_file = 'both_frame.jpg'

class CameraPip:
    def __init__(self):
        self.pipeline = rs.pipeline()
        self.pc = rs.pointcloud()
        self.config = rs.config()
        self.is_open_pip = False
        self.captured_frames_counter = 5
        cwd = os.getcwd()
        self.align_path = os.path.join(cwd, 'aligned_frame.png')
        self.rgb_path = os.path.join(cwd, 'rgb_frame.png')
        self.both_path = os.path.join(cwd, 'both.png')


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
        self.pipeline.stop()
        self.is_open_pip = False

    def get_align_path(self):
        self.capture_frame()
        # create relevent img and return it
        return aligned_file, self.align_path

    def get_both(self):
        self.capture_frame()
        # create relevent img and return it
        return both_file, self.both_path

    def get_rgb(self):
        self.capture_frame()
        return rgb_file, self.rgb_path

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

    def capture_frame(self):
        if not self.is_open_pip:
            self.open_pip()
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
            status = cv2.imwrite('both_frame.jpg', image)
            status = cv2.imwrite('aligned_frame.jpg', bg_removed)
            status = cv2.imwrite('rgb_frame.jpg', color_image)
            print("Image written to file-system : ", status)

        except Exception:
            self.close_pip()





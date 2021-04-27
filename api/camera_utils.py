from datetime import datetime
import numpy as np
import pyrealsense2 as rs
from PIL import Image
import cv2
from utils import serve_pil_image, create_3d_model
time = datetime.now()
rgb_option = 1
aligned_option = 2
both_option = 3


class CameraPipe:
    def __init__(self):
        self.pipeline = rs.pipeline()
        self.pc = rs.pointcloud()
        self.config = rs.config()
        self.is_open_pip = False
        self.captured_frames_counter = 1

    def open_pipe(self):
        if self.is_open_pip:
            return
        self.is_open_pip = True
        print("open pip")
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
        # depth_sensor.set_option(rs.option.max_distance, 0.7)

        print("Depth Scale is: ", depth_scale)

        # We will be removing the background of objects more than
        #  clipping_distance_in_meters meters away
        clipping_distance_in_meters = 1  # 1 meter
        self.clipping_distance = clipping_distance_in_meters / depth_scale

    def close_pipe(self):
        if self.is_open_pip:
            self.pipeline.stop()
            self.is_open_pip = False

    def get_align_path(self):
        pil_img = self.get_frame(aligned_option)
        # create relevent img and return it
        return serve_pil_image(pil_img)

    def get_both(self):
        pil_img = self.get_frame(both_option)
        # create relevent img and return it
        return serve_pil_image(pil_img)

    def get_rgb(self):
        pil_img = self.get_frame(rgb_option)
        return serve_pil_image(pil_img)

    def capture_frame(self):
        try:
            print(f"Saving to {self.captured_frames_counter}.ply...")
            # BGR to RGB
            # Apply the processing block to the frameset which contains the depth frame and the texture

            self.points.export_to_ply(f"{self.captured_frames_counter}.ply", self.color_frame)
            texture = self.points.get_texture_coordinates()
            print(texture)
            # ply.process(colorized)
            self.captured_frames_counter += 1
            print("Done")
        except Exception as error:
            self.close_pipe()
            print(error)

    def reset_captures(self):
        self.captured_frames_counter = 1

    # create a 3d model consisting of the captured frames
    # check if there is enough frames
    def create_model(self):
        mesh = create_3d_model()
        return mesh

    def get_frame(self, option):
        print("enter capture_frame")
        print(self.is_open_pip)
        if not self.is_open_pip:
            self.open_pipe()
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
            # waits for user to press any key
            # (this is necessary to avoid Python kernel form crashing)
            cv2.waitKey(0)
            height = bg_removed.shape[0]
            width = bg_removed.shape[1]
            try:
                cv2.line(bg_removed, (0, int(height/2)), (width, int(height/2)), (204, 229, 255), 2)
                cv2.line(bg_removed, (int(width/2), 0), (int(width / 2), height), (204, 229, 255), 2)
            except Exception as e:
                print(e)


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
            self.close_pipe()

# camera = CameraPipe()
# camera.open_pipe()
# camera.get_frame(aligned_option)
#
# camera.capture_frame()



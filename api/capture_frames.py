## License: Apache 2.0. See LICENSE file in root directory.
## Copyright(c) 2017 Intel Corporation. All Rights Reserved.

#####################################################
##              Align Depth to Color               ##
#####################################################

# First import the library
import pyrealsense2 as rs
# Import Numpy for easy array manipulation
import numpy as np
# Import OpenCV for easy image rendering
import cv2
NUMBER_OF_CAPTURES = 8


def capture_frames(counter=NUMBER_OF_CAPTURES):
    if counter == 0:
        return
    # Create a pipeline
    pipeline = rs.pipeline()
    pc = rs.pointcloud()

    #  different resolutions of color and depth streams
    config = rs.config()
    config.enable_stream(rs.stream.depth, 1024, 768, rs.format.z16, 30)
    config.enable_stream(rs.stream.color, 1280, 720, rs.format.rgb8, 30)

    # Start streaming
    profile = pipeline.start(config)

    # Getting the depth sensor's depth scale (see rs-align example for explanation)
    depth_sensor = profile.get_device().first_depth_sensor()
    depth_scale = depth_sensor.get_depth_scale()
    # Create a config and configure the pipeline to stream

    depth_sensor.set_option(rs.option.min_distance, 0.25)
    # depth_sensor.set_option(rs.option.max_distance, 1)

    print("Depth Scale is: ", depth_scale)

    # We will be removing the background of objects more than
    #  clipping_distance_in_meters meters away
    clipping_distance_in_meters = 1 #1 meter
    clipping_distance = clipping_distance_in_meters / depth_scale

    # Create an align object
    # rs.align allows us to perform alignment of depth frames to others frames
    # The "align_to" is the stream type to which we plan to align depth frames.
    align_to = rs.stream.color
    align = rs.align(align_to)
    captured_frames_counter = 0
    # Streaming loop
    try:
        while counter > 0:
            # Get frameset of color and depth
            frames = pipeline.wait_for_frames()
            # frames.get_depth_frame() is a 640x360 depth image

            # Align the depth frame to color frame
            aligned_frames = align.process(frames)
            aligned_depth_frame = aligned_frames.get_depth_frame()
            color_frame = aligned_frames.get_color_frame()

            pc.map_to(color_frame)
            points = pc.calculate(aligned_depth_frame)

            # Get aligned frames
            # aligned_depth_frame = aligned_frames.get_depth_frame() # aligned_depth_frame is a 640x480 depth image
            # color_frame = aligned_frames.get_color_frame()

            # Validate that both frames are valid
            if not aligned_depth_frame or not color_frame:
                continue

            depth_image = np.asanyarray(aligned_depth_frame.get_data())
            color_image = np.asanyarray(color_frame.get_data())

            # Remove background - Set pixels further than clipping_distance to grey
            grey_color = 153
            depth_image_3d = np.dstack((depth_image,depth_image,depth_image)) #depth image is 1 channel, color is 3 channels
            bg_removed = np.where((depth_image_3d > clipping_distance) | (depth_image_3d <= 0), grey_color, color_image)

            # Render images
            depth_colormap = cv2.applyColorMap(cv2.convertScaleAbs(depth_image, alpha=0.03), cv2.COLORMAP_JET)
            images = np.hstack((bg_removed, depth_colormap))
            cv2.namedWindow('Align Example', cv2.WINDOW_AUTOSIZE)
            cv2.imshow('Align Example', cv2.cvtColor(images, cv2.COLOR_RGB2BGR))
            key = cv2.waitKey(1)
            if key & 0xFF == ord('e'):
                captured_frames_counter += 1
                colorizer = rs.colorizer()
                colorized = colorizer.process(frames)

                # Create save_to_ply object

                # ply = rs.save_to_ply(f"{captured_frames_counter}.ply")
                # # Set options to the desired values
                # # In this example we'll generate a textual PLY with normals (mesh is already created by default)
                # ply.set_option(rs.save_to_ply.option_ply_binary, False)
                # ply.set_option(rs.save_to_ply.option_ply_normals, True)


                print(f"Saving to {captured_frames_counter}.ply...")

                # BGR to RGB
                # Apply the processing block to the frameset which contains the depth frame and the texture
                points.export_to_ply(f"{captured_frames_counter}.ply", color_frame)

                # ply.process(colorized)
                print("Done")
            # Press esc or 'q' to close the image window
            if key & 0xFF == ord('q') or key == 27:
                cv2.destroyAllWindows()
                break
    finally:
        pipeline.stop()


capture_frames()

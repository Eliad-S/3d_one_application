import os
from camera_utils import CameraPip
import pyrealsense2 as rs
# Import Numpy for easy array manipulation
import numpy as np
# Import OpenCV for easy image rendering
import cv2


cp =CameraPip()
cp.open_pip()
cp.capture_frame()
# sleep(5)
cp.capture_frame()
# cp.capture()
# img = cv2.imread('python_color_filter.png', 0)
# cv2.imshow('img', img)
# cv2.waitKey(0)
# cv2.destroyAllWindows()

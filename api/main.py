import pyrealsense2 as rs
from pointcloudadjustment import *
from capture_frames import *


def main():
    captured_frames_counter = capture_frames()
    model = create_3d_model()


if __name__ == "__main__":
    main()

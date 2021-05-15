import numpy as np

import open3d as o3d
import copy
import trimesh
from io import BytesIO
from setting_manager import Setting_Manager

setting_manager = Setting_Manager()


def serve_pil_image(pil_img):
    img_io = BytesIO()
    pil_img.save(img_io, 'JPEG', quality=70)
    img_io.seek(0)
    return img_io


def ply_to_point_cloud(file):
    # Read the point cloud

    pcd = o3d.io.read_point_cloud(file)
    pcd.estimate_normals()
    return pcd


def draw_point_cloud(cloud):
    o3d.visualization.draw_geometries([cloud])  # Visualize the point cloud


def from_pcd_to_ply_file(pcd):
    o3d.io.write_point_cloud("mesh.ply", pcd)


def rotate_point_cloud(cloud, number_of_frames, frame_number):
    mesh = cloud
    T = np.eye(4)
    T[:3, :3] = mesh.get_rotation_matrix_from_xyz((0, (np.pi / (number_of_frames / 2)) * frame_number, 0))
    print(T)
    mesh_t = copy.deepcopy(mesh).transform(T)
    return mesh_t


def point_of_origin(cloud):
    center = o3d.geometry.PointCloud.get_center(cloud)
    center[2] += setting_manager.get_val("obj_distance")
    mesh = cloud
    mesh_mv = copy.deepcopy(mesh).translate(center, relative=False)
    print(f'Center of mesh: {mesh.get_center()}')
    print(f'Center of translated mesh: {mesh_mv.get_center()}')
    # open3d.visualization.draw_geometries([mesh, mesh_mv])
    # draw_point_cloud(mesh_mv)
    return mesh_mv


def crop_dinamically(cloud):
    radius = setting_manager.get_val("obj_radius")
    min_height = -0.15
    max_height = 1
    corners = np.array([[radius, max_height, radius],
                        [-radius, min_height, -radius],
                        [-radius, max_height, -radius],
                        [radius, min_height, -radius],
                        [radius, max_height, radius],
                        [-radius, max_height, radius],
                        [radius, min_height, radius],
                        [-radius, min_height, radius]
                        ])

    # Convert the corners array to have type float64
    bounding_polygon = corners.astype("float64")

    # Create a SelectionPolygonVolume
    vol = o3d.visualization.SelectionPolygonVolume()

    # You need to specify what axis to orient the polygon to.
    # I choose the "Z" axis. I made the max value the maximum Z of
    # the polygon vertices and the min value the minimum Z of the
    # polygon vertices.
    vol.orthogonal_axis = "Z"
    vol.axis_max = np.max(bounding_polygon[:, 2])
    vol.axis_min = np.min(bounding_polygon[:, 2])

    # Set all the Y values to 0 (they aren't needed since we specified what they
    # should be using just vol.axis_max and vol.axis_min).
    bounding_polygon[:, 2] = 0

    # Convert the np.array to a Vector3dVector
    vol.bounding_polygon = o3d.utility.Vector3dVector(bounding_polygon)

    # Crop the point cloud using the Vector3dVector
    cropped_pcd = vol.crop_point_cloud(cloud)
    return cropped_pcd


def crop(pcd):
    print("Load a polygon volume and use it to crop the original point cloud")
    vol = o3d.visualization.read_selection_polygon_volume(
        "polygon.json")
    cropped_pcd = vol.crop_point_cloud(pcd)
    return cropped_pcd


def get_radius_of_object():
    pass


def get_depth_of_object():
    pass


def merge_ply_files():
    pcd = ply_to_point_cloud("1.ply")
    pcd = point_of_origin(pcd)
    number_of_frames = setting_manager.get_val("number_of_frames")
    for i in range(2, number_of_frames + 1):
        pcd_i = ply_to_point_cloud(f"{i}.ply")
        pcd_i = point_of_origin(pcd_i)
        pcd_i = rotate_point_cloud(pcd_i, number_of_frames, i - 1)
        pcd += pcd_i
    return pcd


def point_cloud_to_mesh(pcd):

    print('run Poisson surface reconstruction')
    with o3d.utility.VerbosityContextManager(
            o3d.utility.VerbosityLevel.Debug) as cm:
        mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
            pcd, depth=9)
    print(mesh)
    return mesh
    # o3d.visualization.draw_geometries([mesh])


def mesh3(pcd):
    with o3d.utility.VerbosityContextManager(o3d.utility.VerbosityLevel.Debug) as cm:
        mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcd, depth=9, n_threads=8)

    print('remove low density vertices')
    vertices_to_remove = densities < np.quantile(densities, 0.01)
    mesh.remove_vertices_by_mask(vertices_to_remove)
    return mesh


def mesh2(pcd):
    # estimate radius for rolling ball
    distances = pcd.compute_nearest_neighbor_distance()
    avg_dist = np.mean(distances)
    radius = 1.5 * avg_dist
    radii = [0.005, 0.01, 0.02, 0.04]

    mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_ball_pivoting(
        pcd,
        o3d.utility.DoubleVector([radius, radius * 2]))

    tri = trimesh.Trimesh(np.asarray(mesh.vertices), np.asarray(mesh.triangles),
                          vertex_normals=np.asarray(mesh.vertex_normals))

    tri.export('test.stl')

    mesh.compute_vertex_normals()

    return mesh


def create_3d_model():
    pcd = merge_ply_files()
    print("stroopppp")
    cropped_pcd = crop_dinamically(pcd)

    # cl, ind = cropped_pcd.remove_statistical_outlier(nb_neighbors=10, std_ratio=2.0)
    cl, ind = cropped_pcd.remove_radius_outlier(nb_points=30, radius=0.005)
    # draw_point_cloud(cl)
    mesh = mesh3(cl)  # change to obj file
    # draw_point_cloud(mesh)
    return mesh


def covert_to_obj(mesh, obj_url):
    o3d.io.write_triangle_mesh(obj_url,
                               mesh, write_triangle_uvs=True, print_progress=True)


def convert_3d_to_2d(mesh, img_url):
    vis = o3d.visualization.Visualizer()
    vis.create_window()
    vis.get_render_option().point_color_option = o3d.visualization.PointColorOption.Color
    vis.get_render_option().point_size = 3.0
    vis.add_geometry(mesh)
    vis.capture_screen_image(img_url, do_render=True)
    vis.destroy_window()


def view_model_by_url(url, model_name):
    print(url)
    mesh = o3d.io.read_triangle_mesh(url, print_progress=False)
    o3d.visualization.draw_geometries([mesh], window_name=f"{model_name}'s 3D Model")

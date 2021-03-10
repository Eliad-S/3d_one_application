import numpy as np
import open3d
import pymesh
from open3d.cpu.pybind.io import read_point_cloud
from open3d.cpu.pybind.visualization import draw_geometries
import open3d as o3d
import copy
import trimesh
from io import BytesIO

NUMBER_OF_CAPTURES = 4
OBJECT_DISTANCE = 0.63


def serve_pil_image(pil_img):
    img_io = BytesIO()
    pil_img.save(img_io, 'JPEG', quality=70)
    img_io.seek(0)
    return img_io


def ply_to_point_cloud(file):
    # Read the point cloud

    pcd = read_point_cloud(file)
    pcd.estimate_normals()
    return pcd


def draw_point_cloud(cloud):
    draw_geometries([cloud])  # Visualize the point cloud


def from_pcd_to_ply_file(pcd):
    o3d.io.write_point_cloud("mesh.ply", pcd)


def draw_point_clouds(clouds):
    o3d.visualization.draw_geometries(clouds)


def rotate_point_cloud(cloud, frame_number):
    mesh = cloud
    T = np.eye(4)
    T[:3, :3] = mesh.get_rotation_matrix_from_xyz((0, (np.pi / 2) * frame_number, 0))
    print(T)
    mesh_t = copy.deepcopy(mesh).transform(T)
    return mesh_t


def point_of_origin(cloud):
    center = o3d.geometry.PointCloud.get_center(cloud)
    center[2] += OBJECT_DISTANCE
    # open3d.geometry.PointCloud.rotate( , ,center)
    mesh = cloud
    mesh_mv = copy.deepcopy(mesh).translate(center, relative=False)
    print(f'Center of mesh: {mesh.get_center()}')
    print(f'Center of translated mesh: {mesh_mv.get_center()}')
    # open3d.visualization.draw_geometries([mesh, mesh_mv])
    # draw_point_cloud(mesh_mv)
    return mesh_mv


def crop_point_cloud(cloud):
    vol = o3d.visualization.read_selection_polygon_volume("cropped.json")
    chair = vol.crop_point_cloud(cloud)
    return chair


def crop_dinamically(cloud):
    radius = 0.35
    min_height = -0.4
    max_height = 0.4
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
    # I choose the "Y" axis. I made the max value the maximum Y of
    # the polygon vertices and the min value the minimum Y of the
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
    # Get a nice looking bounding box to display around the newly cropped point cloud
    # (This part is optional and just for display purposes)
    # bounding_box = cropped_pcd.get_axis_aligned_bounding_box()
    # bounding_box.color = (1, 0, 0)
    #
    # # Draw the newly cropped PCD and bounding box
    # o3d.visualization.draw_geometries([cropped_pcd, bounding_box],
    #                                   zoom=2,
    #                                   front=[5, -2, 0.5],
    #                                   lookat=[7.67473496, -3.24231903, 0.3062945],
    #                                   up=[1.0, 0.0, 0.0])


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
    for i in range(2, NUMBER_OF_CAPTURES + 1):
        pcd_i = ply_to_point_cloud(f"{i}.ply")
        pcd_i = point_of_origin(pcd_i)
        pcd_i = rotate_point_cloud(pcd_i, i - 1)
        pcd += pcd_i
    return pcd


def point_cloud_to_mesh(pcd):
    # tetra_mesh, pt_map = o3d.geometry.TetraMesh.create_from_point_cloud(pcd)
    # for alpha in np.logspace(np.log10(0.5), np.log10(0.01), num=4):
    #     print(f"alpha={alpha:.3f}")
    #     mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_alpha_shape(pcd, alpha, tetra_mesh, pt_map)
    #     mesh.compute_vertex_normals()
    #     o3d.visualization.draw_geometries([mesh], mesh_show_back_face=True)
    #

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
        mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcd, depth=9)
    densities = np.asarray(densities)
    print('remove low density vertices')
    vertices_to_remove = densities < np.quantile(densities, 0.015)
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

    tri.export('stuff.stl')

    mesh.compute_vertex_normals()
    o3d.visualization.draw_geometries([mesh])

    return mesh
    # create the triangular mesh with the vertices and faces from open3d
    # tri_mesh = trimesh.Trimesh(np.asarray(mesh.vertices), np.asarray(mesh.triangles),
    #                            vertex_normals=np.asarray(mesh.vertex_normals))
    #
    # trimesh.convex.is_convex(tri_mesh)
    # return tri_mesh


def create_3d_model():
    pcd = merge_ply_files()
    # mesh = point_cloud_to_mesh(pcd)
    print("stroopppp")
    cropped_pcd = crop_dinamically(pcd)
    mesh = mesh3(cropped_pcd)  # change to obj file
    # o3d.io.write_triangle_mesh("copy_of_knot.ply", mesh)
    # copy_textured_mesh = o3d.io.read_triangle_mesh('copy_of_crate.obj')
    # draw_point_cloud(mesh)
    return mesh


def covert_to_obj(mesh, name):
    file_url = f'{name}.obj'
    pymesh.save_mesh("filename.obj", mesh)
    # o3d.io.write_triangle_mesh(file_url,
    #                            mesh,
    #                            write_triangle_uvs=True)
    return file_url


def convert_3d_to_2d(mesh, name):
    img_url = f'{name}.jpg'
    vis = o3d.visualization.Visualizer()
    vis.create_window()
    vis.get_render_option().point_color_option = o3d.visualization.PointColorOption.Color
    vis.get_render_option().point_size = 3.0
    vis.add_geometry(mesh)
    vis.capture_screen_image(img_url, do_render=True)
    vis.destroy_window()
    return img_url
    # resize img
    # img = Image.open("file.jpg")
    # # WIDTH and HEIGHT are integers
    # resized_img = img.resize((1920, 1200))
    # resized_img.save("resized_image.jpg")


# pcd = open3d.geometry.PointCloud()
# np_points = np.array([[5.31972845, -3.21384387, 0.30217625],
#                       [5.34483288, -1.13804348, 0.29917539],
#                       [7.69983939, -1.16651864, 0.30329364],
#                       [7.67473496, -3.24231903, 0.3062945],
#                       [5.31845904, -3.21276837, 1.03551451],
#                       [5.34356348, -1.13696798, 1.03251366],
#                       [7.69856999, -1.16544314, 1.03663191],
#                       [7.67346556, -3.24124353, 1.03963277]])
#
# # From numpy to Open3D
# pcd.points = open3d.utility.Vector3dVector(np_points)
# draw_point_cloud(pcd)
# from_pcd_to_ply_file(pcd)

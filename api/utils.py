import numpy as np
from open3d.cpu.pybind.io import read_point_cloud
from open3d.cpu.pybind.visualization import draw_geometries
import open3d as o3d
import copy
import trimesh
from io import  BytesIO

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

    cropped_pcd = crop(pcd)
    mesh = mesh3(cropped_pcd)
    # change to obj file
    #draw_point_cloud(mesh)
    return mesh




# print("what")
# create_3d_model()

# mesh = point_cloud_to_mesh(cropped_pcd)
# mesh = point_cloud_to_mesh(cropped_pcd)
# draw_point_cloud(mesh)

# from_pcd_to_ply_file(cropped_pcd)

# centered_cloud = point_of_origin(cloud)
# rotate_point_cloud(centered_cloud)
# draw_point_cloud(cloud)

# create_3d_model()


# def check_timeout():
#     while True:
#         sleep(3)
#         now = datetime.now()
#         mutex.acquire()
#         try:
#             diff = (now - time).total_seconds()
#             print(diff)
#             print('Do some stuff')
#         finally:
#             mutex.release()
"""Prepare the Sceaux Castle article assets. This does NOT rerun OpenMVS.

Requires Python, numpy, scipy, opencv-python and Pillow. Downloads are pinned;
the manifest records original counts, hashes and every display transformation.
Run from the repository root: python scripts/prepare_reconstruction.py
"""
from pathlib import Path
import hashlib
import json
import shutil
import struct
import urllib.request

import cv2
import numpy as np
from PIL import Image
from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation

REV = '8b67734532c4391604c646071938e7ac8ae9486d'
BASE = f'https://raw.githubusercontent.com/cdcseacave/openMVS_sample/{REV}/'
CACHE = Path('tmp/mvs-source')
OUT = Path('assets/data/reconstruction')
FILES = ['LICENSE', 'README.md', 'run_pipeline.sh', 'Sparse.ply', 'scene_dense.ply',
         'scene_dense_mesh_refine.ply', 'scene_dense.jpg', 'scene_dense_mesh_refine.jpg',
         'images/00004.jpg', 'images/00005.jpg',
         'CreateStructure-260522001534003931.log', 'DensifyPointCloud-260522001550005CB5.log']


def read_cloud(path, dense=False):
    data = path.read_bytes()
    start = data.index(b'end_header\n') + len(b'end_header\n')
    count = int(data[:start].decode().split('element vertex ')[1].splitlines()[0])
    xyz = np.empty((count, 3), np.float32)
    rgb = np.empty((count, 3), np.float32)
    offset = start
    for i in range(count):
        xyz[i] = struct.unpack_from('<fff', data, offset)
        rgb[i] = np.frombuffer(data, np.uint8, 3, offset + 12) / 255
        offset += 27 if dense else 15
        n = data[offset]
        offset += 1 + n * 4
        if dense:
            n = data[offset]
            offset += 1 + n * 4
    assert offset == len(data)
    return xyz, rgb


def read_mesh(path):
    data = path.read_bytes()
    start = data.index(b'end_header\n') + len(b'end_header\n')
    header = data[:start].decode()
    nv = int(header.split('element vertex ')[1].splitlines()[0])
    nf = int(header.split('element face ')[1].splitlines()[0])
    vertices = np.frombuffer(data, '<f4', nv * 3, start).reshape(-1, 3).copy()
    faces = np.frombuffer(data, np.dtype([('n', 'u1'), ('v', '<u4', 3)]), nf, start + nv * 12)
    assert np.all(faces['n'] == 3)
    return vertices, faces['v'].copy()


def bundle_experiment():
    rng = np.random.default_rng(19)
    points = rng.uniform([-1.3, -.9, 4.5], [1.3, .9, 7], (18, 3))
    cameras = np.array([[0, 0, 0, 0, 0, 0], [0, .1, 0, -1.2, 0, .1],
                        [.03, -.08, .02, .9, -.1, .1], [-.03, .04, 0, -.4, .5, 0]])

    def project(cams, pts):
        result = []
        for c in cams:
            p = Rotation.from_rotvec(c[:3]).apply(pts) + c[3:]
            result.append(420 * p[:, :2] / p[:, 2:] + [240, 170])
        return np.array(result)

    observed = project(cameras, points) + rng.normal(0, .4, (4, 18, 2))
    initial_cams = cameras.copy()
    initial_cams[2:] += rng.normal(0, [.02, .02, .02, .09, .09, .09], (2, 6))
    initial_points = points + rng.normal(0, .12, points.shape)
    x0 = np.r_[initial_cams[2:].ravel(), initial_points.ravel()]

    def unpack(x):
        return np.r_[cameras[:2], x[:12].reshape(2, 6)], x[12:].reshape(-1, 3)

    def residual(x):
        return (project(*unpack(x)) - observed).ravel()

    frames = []
    for budget in [1, 2, 3, 4, 6, 10, 20]:
        fit = least_squares(residual, x0, max_nfev=budget, method='trf')
        prediction = project(*unpack(fit.x))
        rms = np.sqrt(np.mean(np.sum((prediction - observed) ** 2, axis=2)))
        frames.append({'budget': budget, 'rms': round(float(rms), 4),
                       'projections': prediction.round(3).tolist()})
    (OUT / 'bundle.json').write_text(json.dumps({'observed': observed.round(3).tolist(),
        'frames': frames, 'description': 'Synthetic 4-camera, 18-point pinhole BA; scipy least_squares; first two camera poses fixed, focal length fixed; 0.4 px Gaussian observation noise.'}), encoding='utf-8')


def plane_sweep(photos):
    """A real two-view fronto-parallel plane sweep, not upstream MVS output."""
    h, w = photos[0].shape[:2]
    # Final calibration printed in the pinned CreateStructure log, original 2832x2128.
    intrinsic = np.array([[2985.61, 0, 1466.13], [0, 2985.61, 1116.10], [0, 0, 1.]])
    intrinsic[0] *= w / 2832
    intrinsic[1] *= h / 2128
    distortion = np.array([-.2472, .2558, .001472, -.0004225, .1764])
    undistorted = [cv2.undistort(im, intrinsic, distortion) for im in photos]
    for i, im in enumerate(undistorted):
        Image.fromarray(im).save(OUT / f'sweep-{i}.webp', quality=91)
    gray = [cv2.cvtColor(im, cv2.COLOR_RGB2GRAY) for im in undistorted]
    sift = cv2.SIFT_create(nfeatures=4000)
    feat = [sift.detectAndCompute(im, None) for im in gray]
    pairs = cv2.BFMatcher().knnMatch(feat[0][1], feat[1][1], k=2)
    good = [m for m, n in pairs if m.distance < .75 * n.distance]
    a = np.float32([feat[0][0][m.queryIdx].pt for m in good])
    b = np.float32([feat[1][0][m.trainIdx].pt for m in good])
    cv2.setRNGSeed(31)
    essential, mask = cv2.findEssentialMat(a, b, intrinsic, cv2.RANSAC, .999, .8)
    count, rotation, translation, mask = cv2.recoverPose(essential, a, b, intrinsic, mask=mask)
    a, b = a[mask.ravel() != 0], b[mask.ravel() != 0]
    triangulated = cv2.triangulatePoints(intrinsic @ np.c_[np.eye(3), np.zeros(3)], intrinsic @ np.c_[rotation, translation], a.T, b.T)
    triangulated = triangulated[:3] / triangulated[3:]
    depths = triangulated[2]
    near, far = np.percentile(depths[depths > 0], [3, 97])
    inverse_depths = np.linspace(1 / (far * 1.2), 1 / (near * .8), 161)
    kinv = np.linalg.inv(intrinsic)
    cases = []
    for key, center in [('corner', [482., 463.]), ('windows', [641., 497.]), ('sky', [470., 65.])]:
        item = {'key': key, 'center': center, 'windows': {}}
        for size in [11, 21]:
            radius = (size - 1) / 2
            yy, xx = np.mgrid[-radius:radius+1, -radius:radius+1]
            x, y = (xx + center[0]).astype(np.float32), (yy + center[1]).astype(np.float32)
            reference = cv2.remap(gray[0], x, y, cv2.INTER_LINEAR).astype(float)
            ref0 = reference - reference.mean()
            rows = []
            for iz in inverse_depths:
                homography = intrinsic @ (rotation + translation @ np.array([[0., 0., iz]])) @ kinv
                flat = np.stack([x.ravel(), y.ravel(), np.ones(x.size)])
                q = homography @ flat
                q = (q[:2] / q[2:]).reshape(2, size, size).astype(np.float32)
                valid = bool((q[0].min() >= 0) and (q[0].max() < w - 1) and (q[1].min() >= 0) and (q[1].max() < h - 1))
                sample = cv2.remap(gray[1], q[0], q[1], cv2.INTER_LINEAR).astype(float)
                ss = sample - sample.mean()
                denom = np.linalg.norm(ref0) * np.linalg.norm(ss)
                ncc = float(np.sum(ref0 * ss) / denom) if denom > 1e-9 else None
                # No clipping: a controlled affine-exposure change, exactly NCC-invariant.
                shifted = sample * 1.2 + 20
                rows.append({'ncc': round(1 - np.clip(ncc, -1, 1), 6) if ncc is not None and valid else None,
                    'ssd': round(float(np.mean((sample - reference)**2) / 255**2), 6) if valid else None,
                    'exposureSsd': round(float(np.mean((shifted - reference)**2) / 255**2), 6) if valid else None,
                    'supportStd': round(float(sample.std()), 3),
                    'center': q[:, size//2, size//2].round(3).tolist(),
                    'outline': [q[:, j, k].round(3).tolist() for j, k in [(0, 0), (0, size-1), (size-1, size-1), (size-1, 0)]]})
            item['windows'][str(size)] = {'referenceStd': round(float(reference.std()), 3), 'samples': rows}
        cases.append(item)
    result = {'width': w, 'height': h, 'inverseDepths': inverse_depths.round(8).tolist(), 'cases': cases,
        'calibration': intrinsic.tolist(), 'distortion': distortion.tolist(), 'rotation': rotation.tolist(),
        'translation': translation.ravel().tolist(), 'poseInliers': count,
        'description': 'Independent calibrated two-view fronto-parallel plane sweep on resized undistorted real photos. Relative pose estimated locally with Essential matrix RANSAC and cheirality; translation norm is 1, depth is not in meters. Costs use uncompressed grayscale pixels with bilinear interpolation. ZNCC cost=1-correlation; SSD is mean squared difference /255^2. Controlled exposure is 1.2*support+20 without clipping. No PatchMatch, multi-view aggregation, or dense fusion is performed.'}
    (OUT / 'plane-sweep.json').write_text(json.dumps(result, separators=(',', ':')), encoding='utf-8')
    print('Plane sweep:', count, 'pose inliers, relative depth', round(float(near), 2), round(float(far), 2))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sources = {}
    for name in FILES:
        path = CACHE / name
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            print('Downloading', name, flush=True)
            urllib.request.urlretrieve(BASE + name, path)
        sources[name] = {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                         'bytes': path.stat().st_size}
    shutil.copyfile(CACHE / 'LICENSE', OUT / 'LICENSE-OpenMVS-sample.txt')
    for name in ['scene_dense.jpg', 'scene_dense_mesh_refine.jpg']:
        shutil.copyfile(CACHE / name, OUT / name)
    photos = []
    for name in ['00004', '00005']:
        image = Image.open(CACHE / f'images/{name}.jpg')
        image.thumbnail((960, 960))
        image.save(OUT / f'{name}.webp', quality=86)
        photos.append(np.array(image))
    cv2.setRNGSeed(23)
    sift = cv2.SIFT_create(nfeatures=2500)
    features = [sift.detectAndCompute(cv2.cvtColor(p, cv2.COLOR_RGB2GRAY), None) for p in photos]
    pairs = cv2.BFMatcher().knnMatch(features[0][1], features[1][1], k=2)
    matches = [m for m, n in pairs if m.distance < .8 * n.distance]
    a = np.float32([features[0][0][m.queryIdx].pt for m in matches])
    b = np.float32([features[1][0][m.trainIdx].pt for m in matches])
    _, mask = cv2.findFundamentalMat(a, b, cv2.FM_RANSAC, 1.0, .999)
    mask = mask.ravel().astype(bool)
    # Deterministic uniform selection through the candidate order, no invented links.
    chosen = np.r_[np.flatnonzero(mask)[::max(1, int(mask.sum()) // 95)], np.flatnonzero(~mask)[:25]]
    data = {'width': photos[0].shape[1], 'height': photos[0].shape[0],
            'keypoints': [len(f[0]) for f in features], 'candidates': len(matches),
            'inliers': int(mask.sum()), 'method': 'SIFT 2500; BF L2 k=2; ratio 0.8; F RANSAC 1.0 px confidence 0.999; seed 23',
            'matches': [{'a': a[i].round(2).tolist(), 'b': b[i].round(2).tolist(), 'inlier': bool(mask[i])} for i in chosen]}
    (OUT / 'features.json').write_text(json.dumps(data), encoding='utf-8')
    plane_sweep(photos)
    sparse, scolor = read_cloud(CACHE / 'Sparse.ply')
    dense, dcolor = read_cloud(CACHE / 'scene_dense.ply', True)
    # One shared display transform: centered, uniformly scaled; no geometry cleanup.
    low, high = np.percentile(dense, [1, 99], axis=0)
    center = (low + high) / 2
    scale = 2 / max(high - low)

    def normalized(p):
        p = (p - center) * scale
        p[:, 1:] *= -1  # source camera convention to an upright display
        return p

    sparse = normalized(sparse)
    dense = normalized(dense)
    indices = np.linspace(0, len(dense) - 1, 65000, dtype=int)
    np.c_[sparse, scolor].astype('<f4').tofile(OUT / 'sparse.bin')
    np.c_[dense[indices], dcolor[indices]].astype('<f4').tofile(OUT / 'dense.bin')
    mesh, faces = read_mesh(CACHE / 'scene_dense_mesh_refine.ply')
    mesh = normalized(mesh)
    normals = np.zeros_like(mesh)
    tri = mesh[faces]
    cross = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    for k in range(3):
        np.add.at(normals, faces[:, k], cross)
    normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-9)
    light = .3 + .7 * np.abs(normals @ np.array([.3, .6, .7416]))
    color = light[:, None] * [.60, .76, .84]
    np.c_[mesh, color].astype('<f4').tofile(OUT / 'mesh.bin')
    faces.astype('<u4').tofile(OUT / 'faces.bin')
    bundle_experiment()
    manifest = {'repository': 'https://github.com/cdcseacave/openMVS_sample', 'revision': REV,
        'sources': sources, 'sparsePoints': len(sparse), 'densePoints': len(dense),
        'displayDensePoints': len(indices), 'meshVertices': len(mesh), 'meshFaces': len(faces),
        'displayTransform': {'center': center.tolist(), 'scale': float(scale), 'flipYZ': True},
        'notes': 'Upstream full reconstruction, not rerun here. Dense cloud uniformly subsampled in file order to 65000 points; all sparse points and all mesh triangles retained. Mesh uses computed vertex lighting, no texture. Images resized to width 960. Features recomputed locally on resized photos; not upstream SfM tracks. Bundle experiment is synthetic, not Castle BA history. plane-sweep.json is an independent real-photo two-view calibrated fronto-parallel plane sweep with recovered unit translation, not the full Castle MVS result. Browser displays precomputed geometry and experiments; it does not execute full reconstruction.'}
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in manifest.items() if k != 'sources'}, indent=2))
    print('Feature counts', data['keypoints'], data['candidates'], data['inliers'])


if __name__ == '__main__':
    main()

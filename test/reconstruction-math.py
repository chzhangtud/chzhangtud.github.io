"""Numerical checks of the articles' transform and derivative conventions.

Uses the independently recovered Castle pose with synthetic, known 3D points.
Run: python test/reconstruction-math.py
"""
from pathlib import Path
import json

import cv2
import numpy as np
from scipy.spatial.transform import Rotation

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'assets/data/reconstruction/plane-sweep.json').read_text())
K = np.array(data['calibration'])
R = np.array(data['rotation'])
t = np.array(data['translation'])
rng = np.random.default_rng(42)


def skew(v):
    x, y, z = v
    return np.array([[0, -z, y], [z, 0, -x], [-y, x, 0]])


def project(point):
    p = K @ point
    return p[:2] / p[2]


def close(a, b, tolerance=1e-7):
    assert np.max(np.abs(np.asarray(a) - np.asarray(b))) < tolerance


# Epipolar constraints, triangulation, and reference/support direction.
E = skew(t) @ R
F = np.linalg.inv(K).T @ E @ np.linalg.inv(K)
P0 = K @ np.c_[np.eye(3), np.zeros(3)]
P1 = K @ np.c_[R, t]
for _ in range(12):
    point = rng.uniform([-1, -.8, 7], [1, .8, 11])
    p0 = np.r_[project(point), 1]
    p1 = np.r_[project(R @ point + t), 1]
    close(p1 @ F @ p0, 0)
    x = cv2.triangulatePoints(P0, P1, p0[:2, None], p1[:2, None])[:, 0]
    close(x[:3] / x[3], point)
    close(R.T @ (R @ point + t - t), point)
print('PASS epipolar constraint, triangulation, and depth round trip')

# Plane-induced homography with n^T X = h, including non-fronto-parallel planes.
for normal in [[0, 0, 1], [.3, -.2, 1]]:
    n = np.array(normal, dtype=float); n /= np.linalg.norm(n)
    h = 8.
    H = K @ (R + np.outer(t, n) / h) @ np.linalg.inv(K)
    for pixel in [[250, 220, 1], [510, 430, 1], [650, 360, 1]]:
        ray = np.linalg.solve(K, pixel)
        point = h / (n @ ray) * ray
        warped = H @ pixel
        close(warped[:2] / warped[2], project(R @ point + t))
print('PASS plane-induced homography and its positive sign convention')

# Left SE(3) perturbation: both RX and t rotate; the point increment uses X_c.
point = np.array([.6, -.3, 9.])
xc = R @ point + t
fx, fy = K[0, 0], K[1, 1]
Jp = np.array([[fx/xc[2], 0, -fx*xc[0]/xc[2]**2],
               [0, fy/xc[2], -fy*xc[1]/xc[2]**2]])
Jpose = Jp @ np.c_[np.eye(3), -skew(xc)]
eps = 1e-6
numeric = np.zeros((2, 6))
for i in range(6):
    delta = np.zeros(6); delta[i] = eps
    plus = Rotation.from_rotvec(delta[3:]).apply(xc) + delta[:3]
    minus = Rotation.from_rotvec(-delta[3:]).apply(xc) - delta[:3]
    numeric[:, i] = (project(plus) - project(minus)) / (2*eps)
close(numeric, Jpose, 2e-6)
print('PASS perspective and left-pose Jacobians against central differences')

# Similarity gauge transform, including the corresponding camera translation.
s = 2.3
Q = Rotation.from_rotvec([.15, -.23, .1]).as_matrix()
a = np.array([2, -1, .4])
Rp = R @ Q.T
tp = s*t - Rp @ a
close(project(Rp @ (s*Q @ point + a) + tp), project(R @ point + t))
print('PASS similarity gauge invariance of projection')

# Schur elimination must equal the full damped normal-equation solution.
J = rng.normal(size=(60, 18)); residual = rng.normal(size=60)
normal = J.T @ J + .1*np.eye(18)
rhs = -J.T @ residual
U, B, V = normal[:6, :6], normal[:6, 6:], normal[6:, 6:]
dc = np.linalg.solve(U-B @ np.linalg.solve(V, B.T), rhs[:6]-B @ np.linalg.solve(V, rhs[6:]))
dx = np.linalg.solve(V, rhs[6:]-B.T @ dc)
close(np.r_[dc, dx], np.linalg.solve(normal, rhs))
print('PASS Schur reduced solve and point back-substitution')

# Depth sensitivity and controlled photometric invariance.
f, baseline, disparity = 1200., .5, 60.
numeric_depth = (f*baseline/(disparity+eps)-f*baseline/(disparity-eps))/(2*eps)
close(numeric_depth, -f*baseline/disparity**2)
aa, bb = rng.normal(size=(2, 441))


def zncc(x, y):
    x = x-x.mean(); y = y-y.mean()
    return x @ y / (np.linalg.norm(x)*np.linalg.norm(y))


close(zncc(aa, bb), zncc(aa, 1.2*bb+20))
print('PASS disparity-depth derivative and ZNCC affine-intensity invariance')

"""Prepare small, attributed teaching inputs; this script trains no model.

Run from any directory with Python + numpy. Only the named PLY member is read
from Stanford's archive; no archive paths are extracted to the filesystem.
"""
import argparse
import io
import json
from pathlib import Path
import tarfile
from urllib.request import urlopen

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
URL = "https://graphics.stanford.edu/pub/3Dscanrep/bunny.tar.gz"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, help="Use an already downloaded official bunny.tar.gz")
    args = parser.parse_args()
    prior = json.loads((ROOT / "assets/data/vae-mnist-model.json").read_text(encoding="utf-8"))
    mnist = {
        "source": "https://docs.pytorch.org/vision/stable/generated/torchvision.datasets.MNIST.html",
        "description": "First 10 official test images, binarized at pixel value > 127; reused from the site's VAE data. No generated images.",
        "images": prior["images"][:10], "labels": prior["labels"][:10],
    }
    (ROOT / "assets/data/generative-mnist.json").write_text(json.dumps(mnist), encoding="utf-8")
    if args.archive:
        archive_bytes = args.archive.read_bytes()
    else:
        with urlopen(URL, timeout=60) as response:
            archive_bytes = response.read()
    with tarfile.open(fileobj=io.BytesIO(archive_bytes), mode="r:gz") as archive:
        member = archive.extractfile("bunny/reconstruction/bun_zipper.ply")
        lines = member.read().decode("ascii").splitlines()
    end = lines.index("end_header")
    vertices = int(next(line.split()[-1] for line in lines[:end] if line.startswith("element vertex")))
    faces = int(next(line.split()[-1] for line in lines[:end] if line.startswith("element face")))
    positions = np.array([[float(x) for x in line.split()[:3]] for line in lines[end + 1:end + 1 + vertices]])
    indices = np.array([[int(x) for x in line.split()[1:4]] for line in lines[end + 1 + vertices:end + 1 + vertices + faces]])
    triangles = positions[indices]
    areas = np.linalg.norm(np.cross(triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0]), axis=1)
    rng = np.random.default_rng(47)
    chosen = triangles[rng.choice(faces, 1024, p=areas / areas.sum())]
    uv = rng.random((1024, 2))
    r = np.sqrt(uv[:, :1])
    points = (1 - r) * chosen[:, 0] + r * (1 - uv[:, 1:]) * chosen[:, 1] + r * uv[:, 1:] * chosen[:, 2]
    center = (positions.max(axis=0) + positions.min(axis=0)) / 2
    radius = np.linalg.norm(positions - center, axis=1).max()
    data = {
        "source": "https://graphics.stanford.edu/data/3Dscanrep/", "archive": URL,
        "credit": "Stanford University Computer Graphics Laboratory",
        "terms": "Research/educational use; free redistribution with credit. See source for commercial-use restrictions.",
        "description": "1024 area-uniform surface samples of bun_zipper.ply, seed 47. Centered at mesh bounding-box center; divided by maximum vertex radius. Not generated samples or a training dataset of shapes.",
        "points": np.round((points - center) / radius, 5).tolist(),
    }
    (ROOT / "assets/data/generative-bunny.json").write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    print("Prepared 10 MNIST inputs and 1024 Stanford Bunny surface samples.")


if __name__ == "__main__":
    main()

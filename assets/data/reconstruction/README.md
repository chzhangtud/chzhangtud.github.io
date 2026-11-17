# Sceaux Castle article assets

Source: https://github.com/cdcseacave/openMVS_sample
Revision: `8b67734532c4391604c646071938e7ac8ae9486d` (v3.0.0).
The upstream repository supplies AGPL-3.0; its complete LICENSE is retained in
`LICENSE-OpenMVS-sample.txt`. Original photographs and reconstruction outputs
remain attributed to their original source. Consult upstream for material-specific
rights. This notice does not change the license of the surrounding website.

These files are converted upstream reconstruction data, not a reconstruction
executed for the article. Changes made for display:

- Two photos resized to width 960 and encoded as WebP.
- Every sparse point retained; dense points uniformly sampled in source-file
  order to 65,000. No spatial crop or hole filling is applied by the converter.
- Shared center, uniform scale and Y/Z sign conversion, recorded in manifest.
- All 123,010 mesh vertices and 244,247 triangle faces retained. Vertex lighting
  computed from normals; no photograph texture applied.
- Binary vertex records: little-endian float32 `x y z r g b` (24 bytes/vertex).
  Faces: little-endian uint32 triplets. Coordinates have relative, not metric, scale.
- `scene_dense.jpg` and `scene_dense_mesh_refine.jpg` copied unmodified upstream
  preview images. They are not rendered screenshots from this website.
- `features.json`: independent OpenCV SIFT matching on the resized photo pair;
  these are not upstream SfM feature tracks. Includes actual inliers and outliers.
- `bundle.json`: independent synthetic 4-camera / 18-point least-squares example;
  these are not Castle observations, poses, or BA history. Focal length and the
  first two camera poses are fixed. Each budget starts from the same initialization.
- `plane-sweep.json`, `sweep-0.webp`, `sweep-1.webp`: independent real-photo
  calibrated two-view plane sweep. Uses the final intrinsics/distortion printed
  in the pinned upstream log, scales calibration for the thumbnails, undistorts
  them, and independently estimates relative pose. Translation has unit norm;
  depths are baseline-relative reference-camera Z, not metric or the full model's
  display coordinates. 161 inverse-depth candidates, fixed fronto-parallel normal,
  11/21-pixel windows. ZNCC and normalized mean SSD use uncompressed grayscale
  patches and bilinear warping. The affine-exposure condition is a controlled
  1.2 gain +20 offset without clipping; ZNCC is mathematically invariant to it.
  This experiment performs no PatchMatch, multi-view aggregation, or dense fusion.

Regenerate with `python scripts/prepare_reconstruction.py` from the repository
root. Requires numpy, scipy, opencv-python and Pillow. Pinned source downloads
are cached in `tmp/mvs-source/`; hashes and original counts are in `manifest.json`.

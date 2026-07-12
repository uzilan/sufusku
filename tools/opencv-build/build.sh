#!/usr/bin/env bash
# One-off Docker build of a trimmed opencv.js. Artifact is committed to
# public/opencv/ — rerun only to upgrade OpenCV or change the whitelist.
set -euo pipefail
cd "$(dirname "$0")"

OPENCV_VERSION=4.10.0
EMSDK_IMAGE=emscripten/emsdk:3.1.64

docker run --rm -v "$PWD":/work "$EMSDK_IMAGE" bash -c "
  set -e
  git clone --depth 1 --branch $OPENCV_VERSION https://github.com/opencv/opencv.git /opencv
  cd /opencv
  python3 ./platforms/js/build_js.py build_wasm --build_wasm --config /work/whitelist.py
  cp build_wasm/bin/opencv.js /work/opencv.js
  cp build_wasm/bin/*.wasm /work/ 2>/dev/null || true
"

mkdir -p ../../public/opencv
cp opencv.js ../../public/opencv/opencv.js
if ls ./*.wasm >/dev/null 2>&1; then cp ./*.wasm ../../public/opencv/; fi
echo "Done: $(du -h ../../public/opencv/opencv.js | cut -f1)"

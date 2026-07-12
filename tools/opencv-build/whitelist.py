# Trimmed OpenCV.js whitelist for Sufusku: only what grid detection needs.
def makeWhiteList(module_list):
    wl = {}
    for m in module_list:
        for k in m.keys():
            if k in wl:
                wl[k] += m[k]
            else:
                wl[k] = m[k]
    return wl

core = {'': ['minMaxLoc']}

imgproc = {'': [
    'adaptiveThreshold',
    'approxPolyDP',
    'arcLength',
    'boundingRect',
    'contourArea',
    'cvtColor',
    'findContours',
    'GaussianBlur',
    'getPerspectiveTransform',
    'isContourConvex',
    'resize',
    'threshold',
    'warpPerspective',
]}

white_list = makeWhiteList([core, imgproc])

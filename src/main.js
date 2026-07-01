// OmeTV Virtual Camera Unblock — entry point.
//
// ome.tv's virtual-camera detection is entirely client-side and funnels through one global,
// `window.FCN`, whose `isValid(label)` / `isSuspicious(label)` decide whether a device is allowed.
// Instead of disguising the stream (renaming devices, spoofing enumerateDevices), we neutralize that
// check at its root — so real device names like "OBS Virtual Camera" pass through unchanged.
//
// The patch must land before ome.tv assigns `window.FCN`, hence @run-at document-start. See shim.js.

import { installShim } from './shim.js';

installShim();

// Display-only frames measured from the original manufacturer assets.
// [left, top, width, height] are fractions of the source, followed by source aspect ratio.
// A small safety margin keeps edges and shadows; source files remain untouched.
export const catalogPhotoFrames: Readonly<Record<string, readonly number[]>> = {
  'usb-ethernet.jpg': [0.351, 0.133, 0.285, 0.698, 1.0],
  'usb-wifi.jpg': [0.209, 0.03, 0.53, 0.947, 1.0],
  'access-point.png': [0.175, 0.152, 0.65, 0.65, 1.0],
  'camera-indoor.jpg': [0.173, 0.029, 0.652, 0.95, 1.0],
  'nic.jpg': [0.2583, 0.0597, 0.5073, 0.9264, 1.33333],
  'router-wifi.jpg': [0.078, 0.209, 0.85, 0.571, 1.0],
  'router-business.jpg': [0.096, 0.347, 0.809, 0.304, 1.0],
  'switch-24.jpg': [0.034, 0.407, 0.932, 0.218, 1.0],
  'ups.jpg': [0.0197, 0.1717, 0.9607, 0.6567, 1.0],
  'connector.jpg': [0.0, 0.19, 1.0, 0.585, 1.0],
  'patch-panel.jpg': [0.0, 0.395, 1.0, 0.245, 1.0],
  'rack.jpg': [0.0875, 0.1725, 0.9125, 0.8275, 1.0],
  'keyboard.png': [0.0413, 0.1037, 0.9187, 0.74, 2.0],
  'mouse.png': [0.3063, 0.1082, 0.3875, 0.8258, 1.16448],
  'camera-outdoor.jpg': [0.114, 0.198, 0.781, 0.525, 1.0],
  'ssd-sata.jpg': [0.0238, 0.1591, 0.9523, 0.6818, 1.0],
  'ssd-nvme.jpg': [0.0, 0.3432, 1.0, 0.3142, 1.0],
  'organizer.jpg': [0.015, 0.37, 0.975, 0.2925, 1.0],
  'cable.jpg': [0.1425, 0.0, 0.8575, 0.885, 1.0],
  'ram.png': [0.0, 0.0176, 1.0, 0.9713, 2.62295],
  '../product-photos/tl-sg108.jpg': [0.031, 0.352, 0.932, 0.31, 1.0],
};

from mediapipe_handler import MediaPipeHandler
import numpy as np
from PIL import Image
import cv2

handler = MediaPipeHandler()

image_path = "data/image.png" #Change to whatever image you want

image = Image.open(image_path)
vis = image.copy()
vis = image.convert("RGB")

# Convert PIL image to numpy array
vis = np.array(vis)

image_formated = handler.format_image_from_PIL(image)
detection = handler.predict_from_image(image_formated)
pose_detection = handler.predict_pose_from_image(image_formated)

new_image = handler.draw_landmarks_on_image(vis, detection)

cv2.imwrite("data/pose_visualization.jpg", cv2.cvtColor(new_image, cv2.COLOR_RGB2BGR))

print(pose_detection)

handler.visualise_from_pose(pose_detection)
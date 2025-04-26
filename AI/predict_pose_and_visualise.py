from app.mediapipe_handler import MediaPipeHandler
import numpy as np
from PIL import Image
import cv2
import random as rand

handler = MediaPipeHandler()

image_path = "/Users/yasinetawfeek/Developer/DesD_AI_pathway/AI/data/image.png" #Change to whatever image you want

image = Image.open(image_path)
vis = image.copy()
vis = image.convert("RGB")

# Convert PIL image to numpy array
vis = np.array(vis)

image_formated = handler.format_image_from_PIL(image)
detection = handler.predict_from_image(image_formated)
pose_detection = handler.predict_pose_from_image(image_formated)

noise_filter = 0.02

for point in detection.pose_landmarks[0]:
    point.x = rand.uniform(point.x - noise_filter, point.x + noise_filter)
    point.y = rand.uniform(point.y - noise_filter, point.y + noise_filter)
    point.z = rand.uniform(point.z - noise_filter, point.z + noise_filter)

    if point.x >= 1:
        point.x = 0.9999
    if point.y >= 1:
        point.y = 0.9999
    if point.z >= 1:
        point.z = 0.9999

    if point.x <= 0:
        point.x = 0.0001
    if point.y <= 0:
        point.y = 0.0001
    if point.z <= 0:
        point.z = 0.0001

detection.pose_landmarks[0][1].x = rand.uniform(detection.pose_landmarks[0][1].x - noise_filter, detection.pose_landmarks[0][1].x + noise_filter) 

# pose_detection[2] = [0, 0, 0]

new_image = handler.draw_landmarks_on_image(vis, detection)

cv2.imwrite("/Users/yasinetawfeek/Developer/DesD_AI_pathway/AI/data/pose_visualization.jpg", cv2.cvtColor(new_image, cv2.COLOR_RGB2BGR))

print(pose_detection)

# handler.visualise_from_pose(pose_detection)
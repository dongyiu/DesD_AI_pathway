import mediapipe as mp
import time
import numpy as np
import pandas as pd
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe import ImageFormat
from PIL import Image
import cv2
import ast
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import os
import random as rand

class MediaPipeHandler():
    def __init__(self):
        print("current OS working directory is",os.getcwd())
        # self.model_path = "H:\\DesD_AI_pathway\\AI\\app\\pose_landmarker_full.task" 
        self.model_path = os.getcwd() + "/pose_landmarker_full.task"
        # self.model_path=os.path.join("app", "pose_landmarker_full.task")

        base_options = python.BaseOptions(model_asset_path=self.model_path)
        self.options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            output_segmentation_masks=True,
            min_pose_detection_confidence=0.5,  # Try lowering this if no poses are detected
            min_pose_presence_confidence=0.5,   # Try lowering this if no poses are detected
            min_tracking_confidence=0.5         # Try lowering this if no poses are detected
        )
        self.detector = vision.PoseLandmarker.create_from_options(self.options)

        self.image_format = ImageFormat.SRGB

    def format_image_from_path(self, image_path):
        image = Image.open(image_path)
        image = image.convert("RGB")
        image_np = np.array(image)

        mp_image = mp.Image(
        data=image_np,
        image_format=self.image_format
        )

        return mp_image

    def format_image_from_PIL(self, image):
        image = image.convert("RGB")
        image_np = np.array(image)

        mp_image = mp.Image(
        data=image_np,
        image_format=self.image_format
        )

        return mp_image
    
    def predict_from_image(self, image):
        detection_result = self.detector.detect(image)
        del detection_result.pose_landmarks[0][:11]

        return detection_result
    
    def predict_pose_from_image(self, image):
        detection_result = self.detector.detect(image)

        if detection_result.pose_landmarks:
            del detection_result.pose_landmarks[0][:11]
            del detection_result.pose_landmarks[0][6:12]
            del detection_result.pose_landmarks[0][12:]
            pose_landmarks = detection_result.pose_landmarks[0]
            pose_coordinates = []

            for landmark_idx, landmark in enumerate(pose_landmarks):
                x, y, z, = landmark.x, landmark.y, landmark.z
                pose_coordinates.append((x, y, z))
            
            return np.array(pose_coordinates)
        
        else:
            return np.array([])
    
    # def pandas_add_detections_from_image(self, df, image_column_name="image", detections_column_name="pose"):
        
    #     images = df[image_column_name]
    #     pose = []

    #     counter = 0
    #     for image in images:
    #         start = time.time()
    #         image_formated = self.format_image_from_PIL(image)
    #         pose.append(self.predict_pose_from_image(image_formated))
    #         print(f"predicted image {counter} from {len(images)}, time: {time.time() - start}")
    #         counter+= 1


    #     df['pose'] = pose

    #     return df
    
    # Lazy code incoming
    def pandas_add_detections_from_image_and_remove_nulls(self, df, image_column_name="image", detections_column_name="pose"):

        images = df[image_column_name]

        left_shoulder = []          # 0
        right_shoulder = []         # 1
        left_elbow = []             # 2
        right_elbow = []            # 3
        left_wrist = []             # 4
        right_wrist = []            # 5
        left_hip = []               # 12
        right_hip = []              # 13
        left_knee = []              # 14
        right_knee = []             # 15
        left_ankle = []             # 16
        right_ankle = []            # 17

        counter = 0
        for img in images:
            start = time.time()
            img_formated = self.format_image_from_PIL(img)
            pose = self.predict_pose_from_image(img_formated)

            if len(pose) == 0:
                left_shoulder.append(np.array([]))
                right_shoulder.append(np.array([]))
                left_elbow.append(np.array([]))
                right_elbow.append(np.array([]))
                left_wrist.append(np.array([]))
                right_wrist.append(np.array([]))
                left_hip.append(np.array([]))
                right_hip.append(np.array([]))
                left_knee.append(np.array([]))
                right_knee.append(np.array([]))
                left_ankle.append(np.array([]))
                right_ankle.append(np.array([]))

            else:
                left_shoulder.append(pose[0])
                right_shoulder.append(pose[1])
                left_elbow.append(pose[2])
                right_elbow.append(pose[3])
                left_wrist.append(pose[4])
                right_wrist.append(pose[5])
                left_hip.append(pose[6])
                right_hip.append(pose[7])
                left_knee.append(pose[8])
                right_knee.append(pose[9])
                left_ankle.append(pose[10])
                right_ankle.append(pose[11])
            
            print(f"predicted image {counter} from {len(images)}, time: {time.time() - start}, type: {type(left_shoulder[-1])}")
            counter+= 1
                
        df['left_shoulder'] = left_shoulder
        df['right_shoulder'] = right_shoulder
        df['left_elbow'] = left_elbow
        df['right_elbow'] = right_elbow
        df['left_wrist'] = left_wrist
        df['right_wrist'] = right_wrist
        df['left_hip'] = left_hip
        df['right_hip'] = right_hip
        df['left_knee'] = left_knee
        df['right_knee'] = right_knee
        df['left_ankle'] = left_ankle
        df['right_ankle'] = right_ankle

        return df[df['left_shoulder'].map(len) != 0]

    def add_noise_to_df(self, df, noise_intensity, noise_possibility=1):
        df_copy = df.copy(deep=True)
        # noise_possibility -=1
        
        left_shoulder = []          # 0
        right_shoulder = []         # 1
        left_elbow = []             # 2
        right_elbow = []            # 3
        left_wrist = []             # 4
        right_wrist = []            # 5
        left_hip = []               # 12
        right_hip = []              # 13
        left_knee = []              # 14
        right_knee = []             # 15
        left_ankle = []             # 16
        right_ankle = []            # 17

        for i, row in df_copy.iterrows():
            noise_filter = 0
            if rand.randint(0,noise_possibility) == 0:
                noise_filter = noise_intensity
            left_shoulder.append(np.array([rand.uniform(row['left_shoulder'][0] - noise_filter, row['left_shoulder'][0] + noise_filter),
             rand.uniform(row['left_shoulder'][1] - noise_filter, row['left_shoulder'][1] + noise_filter),
             rand.uniform(row['left_shoulder'][2] - noise_filter, row['left_shoulder'][2] + noise_filter)]))

            noise_filter = 0
            if rand.randint(0,noise_possibility) == 0:
                noise_filter = noise_intensity
            right_shoulder.append(np.array([rand.uniform(row['right_shoulder'][0] - noise_filter, row['right_shoulder'][0] + noise_filter),
             rand.uniform(row['right_shoulder'][1] - noise_filter, row['right_shoulder'][1] + noise_filter),
             rand.uniform(row['right_shoulder'][2] - noise_filter, row['right_shoulder'][2] + noise_filter)]))

            noise_filter = 0
            if rand.randint(0,noise_possibility) == 0:
                noise_filter = noise_intensity
            left_elbow.append(np.array([rand.uniform(row['left_elbow'][0] - noise_filter, row['left_elbow'][0] + noise_filter),
             rand.uniform(row['left_elbow'][1] - noise_filter, row['left_elbow'][1] + noise_filter),
             rand.uniform(row['left_elbow'][2] - noise_filter, row['left_elbow'][2] + noise_filter)]))

            noise_filter = 0
            if rand.randint(0,noise_possibility) == 0:
                noise_filter = noise_intensity
            right_elbow.append(np.array([rand.uniform(row['right_elbow'][0] - noise_filter, row['right_elbow'][0] + noise_filter),
             rand.uniform(row['right_elbow'][1] - noise_filter, row['right_elbow'][1] + noise_filter),
             rand.uniform(row['right_elbow'][2] - noise_filter, row['right_elbow'][2] + noise_filter)]))

            noise_filter = 0
            if rand.randint(0,noise_possibility) == 0:
                noise_filter = noise_intensity
            left_wrist.append(np.array([rand.uniform(row['left_wrist'][0] - noise_filter, row['left_wrist'][0] + noise_filter),
             rand.uniform(row['left_wrist'][1] - noise_filter, row['left_wrist'][1] + noise_filter),
             rand.uniform(row['left_wrist'][2] - noise_filter, row['left_wrist'][2] + noise_filter)]))

            noise_filter = 0
            if rand.randint(0,noise_possibility) == 0:
                noise_filter = noise_intensity
            right_wrist.append(np.array([rand.uniform(row['right_wrist'][0] - noise_filter, row['right_wrist'][0] + noise_filter),
             rand.uniform(row['right_wrist'][1] - noise_filter, row['right_wrist'][1] + noise_filter),
             rand.uniform(row['right_wrist'][2] - noise_filter, row['right_wrist'][2] + noise_filter)]))

            noise_filter = 0
            if rand.randint(0,noise_possibility) == 0:
                noise_filter = noise_intensity
            left_hip.append(np.array([rand.uniform(row['left_hip'][0] - noise_filter, row['left_hip'][0] + noise_filter),
             rand.uniform(row['left_hip'][1] - noise_filter, row['left_hip'][1] + noise_filter),
             rand.uniform(row['left_hip'][2] - noise_filter, row['left_hip'][2] + noise_filter)]))

            noise_filter = 0
            if rand.randint(0,noise_possibility) == 0:
                noise_filter = noise_intensity
            right_hip.append(np.array([rand.uniform(row['right_hip'][0] - noise_filter, row['right_hip'][0] + noise_filter),
             rand.uniform(row['right_hip'][1] - noise_filter, row['right_hip'][1] + noise_filter),
             rand.uniform(row['right_hip'][2] - noise_filter, row['right_hip'][2] + noise_filter)]))

            noise_filter = 0
            if rand.randint(0,noise_possibility) == 0:
                noise_filter = noise_intensity
            left_knee.append(np.array([rand.uniform(row['left_knee'][0] - noise_filter, row['left_knee'][0] + noise_filter),
             rand.uniform(row['left_knee'][1] - noise_filter, row['left_knee'][1] + noise_filter),
             rand.uniform(row['left_knee'][2] - noise_filter, row['left_knee'][2] + noise_filter)]))

            noise_filter = 0
            if rand.randint(0,noise_possibility) == 0:
                noise_filter = noise_intensity
            right_knee.append(np.array([rand.uniform(row['right_knee'][0] - noise_filter, row['right_knee'][0] + noise_filter),
             rand.uniform(row['right_knee'][1] - noise_filter, row['right_knee'][1] + noise_filter),
             rand.uniform(row['right_knee'][2] - noise_filter, row['right_knee'][2] + noise_filter)]))

            noise_filter = 0
            if rand.randint(0,noise_possibility) == 0:
                noise_filter = noise_intensity
            left_ankle.append(np.array([rand.uniform(row['left_ankle'][0] - noise_filter, row['left_ankle'][0] + noise_filter),
             rand.uniform(row['left_ankle'][1] - noise_filter, row['left_ankle'][1] + noise_filter),
             rand.uniform(row['left_ankle'][2] - noise_filter, row['left_ankle'][2] + noise_filter)]))

            noise_filter = 0
            if rand.randint(0,noise_possibility) == 0:
                noise_filter = noise_intensity
            right_ankle.append(np.array([rand.uniform(row['right_ankle'][0] - noise_filter, row['right_ankle'][0] + noise_filter),
             rand.uniform(row['right_ankle'][1] - noise_filter, row['right_ankle'][1] + noise_filter),
             rand.uniform(row['right_ankle'][2] - noise_filter, row['right_ankle'][2] + noise_filter)]))
            
        df_copy['left_shoulder'] = left_shoulder
        df_copy['right_shoulder'] = right_shoulder
        df_copy['left_elbow'] = left_elbow
        df_copy['right_elbow'] = right_elbow
        df_copy['left_wrist'] = left_wrist
        df_copy['right_wrist'] = right_wrist
        df_copy['left_hip'] = left_hip
        df_copy['right_hip'] = right_hip
        df_copy['left_knee'] = left_knee
        df_copy['right_knee'] = right_knee
        df_copy['left_ankle'] = left_ankle
        df_copy['right_ankle'] = right_ankle
        # return pd.concat([df,df_copy], ignore_index=True)
        return df_copy
    
    def add_noise_to_df_with_displacement(self, df, noise_intensity, noise_possibility = 4):
        df_copy = df.copy(deep=True)
        
        noise_possibility -=1

        left_shoulder = []          # 0
        right_shoulder = []         # 1
        left_elbow = []             # 2
        right_elbow = []            # 3
        left_wrist = []             # 4
        right_wrist = []            # 5
        left_hip = []               # 12
        right_hip = []              # 13
        left_knee = []              # 14
        right_knee = []             # 15
        left_ankle = []             # 16
        right_ankle = []            # 17


        left_shoulder_displacement = []
        right_shoulder_displacement = []
        left_elbow_displacement = []
        right_elbow_displacement = []
        left_wrist_displacement = []
        right_wrist_displacement = []
        left_hip_displacement = []
        right_hip_displacement = []
        left_knee_displacement = []
        right_knee_displacement = []
        left_ankle_displacement = []
        right_ankle_displacement = []

        for i, row in df_copy.iterrows():

            noise_factor = 0
            if rand.randint(0, noise_possibility) == 0:
                noise_factor = noise_intensity
            x_dis = rand.uniform(row['left_shoulder'][0] - noise_factor, row['left_shoulder'][0] + noise_factor)
            y_dis = rand.uniform(row['left_shoulder'][1] - noise_factor, row['left_shoulder'][1] + noise_factor)
            z_dis = rand.uniform(row['left_shoulder'][2] - noise_factor, row['left_shoulder'][2] + noise_factor)
            left_shoulder_displacement.append(np.array([row['left_shoulder'][0] - x_dis, row['left_shoulder'][1] - y_dis, row['left_shoulder'][2] - z_dis]))
            left_shoulder.append(np.array([x_dis, y_dis, z_dis]))

            noise_factor = 0
            if rand.randint(0, noise_possibility) == 0:
                noise_factor = noise_intensity
            x_dis = rand.uniform(row['right_shoulder'][0] - noise_factor, row['right_shoulder'][0] + noise_factor)
            y_dis = rand.uniform(row['right_shoulder'][1] - noise_factor, row['right_shoulder'][1] + noise_factor)
            z_dis = rand.uniform(row['right_shoulder'][2] - noise_factor, row['right_shoulder'][2] + noise_factor)
            right_shoulder_displacement.append(np.array([row['right_shoulder'][0] - x_dis, row['right_shoulder'][1] - y_dis, row['right_shoulder'][2] - z_dis]))
            right_shoulder.append(np.array([x_dis, y_dis, z_dis]))

            noise_factor = 0
            if rand.randint(0, noise_possibility) == 0:
                noise_factor = noise_intensity
            x_dis = rand.uniform(row['left_elbow'][0] - noise_factor, row['left_elbow'][0] + noise_factor)
            y_dis = rand.uniform(row['left_elbow'][1] - noise_factor, row['left_elbow'][1] + noise_factor)
            z_dis = rand.uniform(row['left_elbow'][2] - noise_factor, row['left_elbow'][2] + noise_factor)
            left_elbow_displacement.append(np.array([row['left_elbow'][0] - x_dis, row['left_elbow'][1] - y_dis, row['left_elbow'][2] - z_dis]))
            left_elbow.append(np.array([x_dis, y_dis, z_dis]))

            noise_factor = 0
            if rand.randint(0, noise_possibility) == 0:
                noise_factor = noise_intensity
            x_dis = rand.uniform(row['right_elbow'][0] - noise_factor, row['right_elbow'][0] + noise_factor)
            y_dis = rand.uniform(row['right_elbow'][1] - noise_factor, row['right_elbow'][1] + noise_factor)
            z_dis = rand.uniform(row['right_elbow'][2] - noise_factor, row['right_elbow'][2] + noise_factor)
            right_elbow_displacement.append(np.array([row['right_elbow'][0] - x_dis, row['right_elbow'][1] - y_dis, row['right_elbow'][2] - z_dis]))
            right_elbow.append(np.array([x_dis, y_dis, z_dis]))

            noise_factor = 0
            if rand.randint(0, noise_possibility) == 0:
                noise_factor = noise_intensity
            x_dis = rand.uniform(row['left_wrist'][0] - noise_factor, row['left_wrist'][0] + noise_factor)
            y_dis = rand.uniform(row['left_wrist'][1] - noise_factor, row['left_wrist'][1] + noise_factor)
            z_dis = rand.uniform(row['left_wrist'][2] - noise_factor, row['left_wrist'][2] + noise_factor)
            left_wrist_displacement.append(np.array([row['left_wrist'][0] - x_dis, row['left_wrist'][1] - y_dis, row['left_wrist'][2] - z_dis]))
            left_wrist.append(np.array([x_dis, y_dis, z_dis]))

            noise_factor = 0
            if rand.randint(0, noise_possibility) == 0:
                noise_factor = noise_intensity
            x_dis = rand.uniform(row['right_wrist'][0] - noise_factor, row['right_wrist'][0] + noise_factor)
            y_dis = rand.uniform(row['right_wrist'][1] - noise_factor, row['right_wrist'][1] + noise_factor)
            z_dis = rand.uniform(row['right_wrist'][2] - noise_factor, row['right_wrist'][2] + noise_factor)
            right_wrist_displacement.append(np.array([row['right_wrist'][0] - x_dis, row['right_wrist'][1] - y_dis, row['right_wrist'][2] - z_dis]))
            right_wrist.append(np.array([x_dis, y_dis, z_dis]))

            noise_factor = 0
            if rand.randint(0, noise_possibility) == 0:
                noise_factor = noise_intensity
            x_dis = rand.uniform(row['left_hip'][0] - noise_factor, row['left_hip'][0] + noise_factor)
            y_dis = rand.uniform(row['left_hip'][1] - noise_factor, row['left_hip'][1] + noise_factor)
            z_dis = rand.uniform(row['left_hip'][2] - noise_factor, row['left_hip'][2] + noise_factor)
            left_hip_displacement.append(np.array([row['left_hip'][0] - x_dis, row['left_hip'][1] - y_dis, row['left_hip'][2] - z_dis]))
            left_hip.append(np.array([x_dis, y_dis, z_dis]))

            noise_factor = 0
            if rand.randint(0, noise_possibility) == 0:
                noise_factor = noise_intensity
            x_dis = rand.uniform(row['right_hip'][0] - noise_factor, row['right_hip'][0] + noise_factor)
            y_dis = rand.uniform(row['right_hip'][1] - noise_factor, row['right_hip'][1] + noise_factor)
            z_dis = rand.uniform(row['right_hip'][2] - noise_factor, row['right_hip'][2] + noise_factor)
            right_hip_displacement.append(np.array([row['right_hip'][0] - x_dis, row['right_hip'][1] - y_dis, row['right_hip'][2] - z_dis]))
            right_hip.append(np.array([x_dis, y_dis, z_dis]))

            noise_factor = 0
            if rand.randint(0, noise_possibility) == 0:
                noise_factor = noise_intensity
            x_dis = rand.uniform(row['left_knee'][0] - noise_factor, row['left_knee'][0] + noise_factor)
            y_dis = rand.uniform(row['left_knee'][1] - noise_factor, row['left_knee'][1] + noise_factor)
            z_dis = rand.uniform(row['left_knee'][2] - noise_factor, row['left_knee'][2] + noise_factor)
            left_knee_displacement.append(np.array([row['left_knee'][0] - x_dis, row['left_knee'][1] - y_dis, row['left_knee'][2] - z_dis]))
            left_knee.append(np.array([x_dis, y_dis, z_dis]))

            noise_factor = 0
            if rand.randint(0, noise_possibility) == 0:
                noise_factor = noise_intensity
            x_dis = rand.uniform(row['right_knee'][0] - noise_factor, row['right_knee'][0] + noise_factor)
            y_dis = rand.uniform(row['right_knee'][1] - noise_factor, row['right_knee'][1] + noise_factor)
            z_dis = rand.uniform(row['right_knee'][2] - noise_factor, row['right_knee'][2] + noise_factor)
            right_knee_displacement.append(np.array([row['right_knee'][0] - x_dis, row['right_knee'][1] - y_dis, row['right_knee'][2] - z_dis]))
            right_knee.append(np.array([x_dis, y_dis, z_dis]))

            noise_factor = 0
            if rand.randint(0, noise_possibility) == 0:
                noise_factor = noise_intensity
            x_dis = rand.uniform(row['left_ankle'][0] - noise_factor, row['left_ankle'][0] + noise_factor)
            y_dis = rand.uniform(row['left_ankle'][1] - noise_factor, row['left_ankle'][1] + noise_factor)
            z_dis = rand.uniform(row['left_ankle'][2] - noise_factor, row['left_ankle'][2] + noise_factor)
            left_ankle_displacement.append(np.array([row['left_ankle'][0] - x_dis, row['left_ankle'][1] - y_dis, row['left_ankle'][2] - z_dis]))
            left_ankle.append(np.array([x_dis, y_dis, z_dis]))

            noise_factor = 0
            if rand.randint(0, noise_possibility) == 0:
                noise_factor = noise_intensity
            x_dis = rand.uniform(row['right_ankle'][0] - noise_factor, row['right_ankle'][0] + noise_factor)
            y_dis = rand.uniform(row['right_ankle'][1] - noise_factor, row['right_ankle'][1] + noise_factor)
            z_dis = rand.uniform(row['right_ankle'][2] - noise_factor, row['right_ankle'][2] + noise_factor)
            right_ankle_displacement.append(np.array([row['right_ankle'][0] - x_dis, row['right_ankle'][1] - y_dis, row['right_ankle'][2] - z_dis]))
            right_ankle.append(np.array([x_dis, y_dis, z_dis]))
            
        df_copy['left_shoulder'] = left_shoulder
        df_copy['left_shoulder_displacement'] = left_shoulder_displacement

        df_copy['right_shoulder'] = right_shoulder
        df_copy['right_shoulder_displacement'] = right_shoulder_displacement

        df_copy['left_elbow'] = left_elbow
        df_copy['left_elbow_displacement'] = left_elbow_displacement

        df_copy['right_elbow'] = right_elbow
        df_copy['right_elbow_displacement'] = right_elbow_displacement

        df_copy['left_wrist'] = left_wrist
        df_copy['left_wrist_displacement'] = left_wrist_displacement

        df_copy['right_wrist'] = right_wrist
        df_copy['right_wrist_displacement'] = right_wrist_displacement

        df_copy['left_hip'] = left_hip
        df_copy['left_hip_displacement'] = left_hip_displacement

        df_copy['right_hip'] = right_hip
        df_copy['right_hip_displacement'] = right_hip_displacement

        df_copy['left_knee'] = left_knee
        df_copy['left_knee_displacement'] = left_knee_displacement

        df_copy['right_knee'] = right_knee
        df_copy['right_knee_displacement'] = right_knee_displacement

        df_copy['left_ankle'] = left_ankle
        df_copy['left_ankle_displacement'] = left_ankle_displacement

        df_copy['right_ankle'] = right_ankle
        df_copy['right_ankle_displacement'] = right_ankle_displacement

        # return pd.concat([df,df_copy], ignore_index=True)
        return df_copy

    def visualise_from_pose(self, pose):
        x, y, z = pose[:, 0], pose[:, 1], pose[:, 2]

        # Create 3D plot
        fig = plt.figure(figsize=(8, 6))
        ax = fig.add_subplot(111, projection='3d')
        ax.scatter(x, y, z, c='b', marker='o')

        # Labels and title
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.set_title('3D Scatter Plot of Given Points')

        # Show plot
        plt.show()
    
    def draw_landmarks_on_image(self, image, landmarks_array, adjusted_positions=None):
        # Make a copy of the image to draw on
        annotated_image = image.copy()
        
        # Get image dimensions
        image_height, image_width = image.shape[:2]
        
        # Define landmark connection lines (simplified version)
        POSE_CONNECTIONS = [
            # Torso
            (0, 1), (0, 2), (1, 3), (2, 4), (3, 5),
            (1, 7), (0, 6), (7, 6), (7, 9), (6, 8),
            (9, 11), (10, 8)
        ]
        
        # Process original landmarks (xyz format)
        original_landmarks = []
        for i in range(0, len(landmarks_array), 3):
            if i + 1 < len(landmarks_array):
                x = landmarks_array[i]
                y = landmarks_array[i+1]
                original_landmarks.append((x, y))
        
        # Draw original landmarks (green)
        for idx, (x_norm, y_norm) in enumerate(original_landmarks):
            x = int(x_norm * image_width)
            y = int(y_norm * image_height)
            cv2.circle(annotated_image, (x, y), 5, (0, 255, 0), -1)
            cv2.putText(annotated_image, str(idx), (x + 5, y - 5), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1, cv2.LINE_AA)
        
        # Draw original connections (orange)
        for connection in POSE_CONNECTIONS:
            start_idx, end_idx = connection
            if start_idx < len(original_landmarks) and end_idx < len(original_landmarks):
                start_point = (int(original_landmarks[start_idx][0] * image_width),
                            int(original_landmarks[start_idx][1] * image_height))
                end_point = (int(original_landmarks[end_idx][0] * image_width),
                            int(original_landmarks[end_idx][1] * image_height))
                cv2.line(annotated_image, start_point, end_point, (245, 117, 66), 2)
        
        # Process adjusted positions if provided
        if adjusted_positions is not None:
            # Handle both xyz and xy formats for adjusted positions
            step = 3 if len(adjusted_positions) > 2*len(original_landmarks) else 2
            adjusted_landmarks = []
            for i in range(0, len(adjusted_positions), step):
                if i + 1 < len(adjusted_positions):
                    x = adjusted_positions[i]
                    y = adjusted_positions[i+1]
                    adjusted_landmarks.append((x, y))
            
            # Only draw if we have correct number of landmarks
            if len(adjusted_landmarks) == len(original_landmarks):
                # Draw adjusted landmarks (red)
                for idx, (x_norm, y_norm) in enumerate(adjusted_landmarks):
                    x = int(x_norm * image_width)
                    y = int(y_norm * image_height)
                    cv2.circle(annotated_image, (x, y), 5, (0, 0, 255), -1)
                
                # Draw adjusted connections (red)
                for connection in POSE_CONNECTIONS:
                    start_idx, end_idx = connection
                    if start_idx < len(adjusted_landmarks) and end_idx < len(adjusted_landmarks):
                        start_point = (int(adjusted_landmarks[start_idx][0] * image_width),
                                    int(adjusted_landmarks[start_idx][1] * image_height))
                        end_point = (int(adjusted_landmarks[end_idx][0] * image_width),
                                    int(adjusted_landmarks[end_idx][1] * image_height))
                        cv2.line(annotated_image, start_point, end_point, (0, 0, 255), 2)
            else:
                print(f"Warning: Expected {len(original_landmarks)} adjusted landmarks, got {len(adjusted_landmarks)}")
        
        return annotated_image

    def read_csv_to_pd(self, csv_path):
        df = pd.read_csv(csv_path)

        for i, row in df.iterrows():
            df.at[i, 'left_shoulder'] = np.array(list(map(float, row['left_shoulder'].strip('[]').split())))
            df.at[i, 'right_shoulder'] = np.array(list(map(float, row['right_shoulder'].strip('[]').split())))
            df.at[i, 'left_elbow'] = np.array(list(map(float, row['left_elbow'].strip('[]').split())))
            df.at[i, 'right_elbow'] = np.array(list(map(float, row['right_elbow'].strip('[]').split())))
            df.at[i, 'left_wrist'] = np.array(list(map(float, row['left_wrist'].strip('[]').split())))
            df.at[i, 'right_wrist'] = np.array(list(map(float, row['right_wrist'].strip('[]').split())))
            df.at[i, 'left_hip'] = np.array(list(map(float, row['left_hip'].strip('[]').split())))
            df.at[i, 'right_hip'] = np.array(list(map(float, row['right_hip'].strip('[]').split())))
            df.at[i, 'left_knee'] = np.array(list(map(float, row['left_knee'].strip('[]').split())))
            df.at[i, 'right_knee'] = np.array(list(map(float, row['right_knee'].strip('[]').split())))
            df.at[i, 'left_ankle'] = np.array(list(map(float, row['left_ankle'].strip('[]').split())))
            df.at[i, 'right_ankle'] = np.array(list(map(float, row['right_ankle'].strip('[]').split())))
        
        return df
    
    def read_csv_to_pd_displacement(self, csv_path):
        df = pd.read_csv(csv_path)

        for i, row in df.iterrows():
            df.at[i, 'left_shoulder'] = np.array(list(map(float, row['left_shoulder'].strip('[]').split())))
            df.at[i, 'left_shoulder_displacement'] = np.array(list(map(float, row['left_shoulder_displacement'].strip('[]').split())))
            df.at[i, 'right_shoulder'] = np.array(list(map(float, row['right_shoulder'].strip('[]').split())))
            df.at[i, 'right_shoulder_displacement'] = np.array(list(map(float, row['right_shoulder_displacement'].strip('[]').split())))
            df.at[i, 'left_elbow'] = np.array(list(map(float, row['left_elbow'].strip('[]').split())))
            df.at[i, 'left_elbow_displacement'] = np.array(list(map(float, row['left_elbow_displacement'].strip('[]').split())))
            df.at[i, 'right_elbow'] = np.array(list(map(float, row['right_elbow'].strip('[]').split())))
            df.at[i, 'right_elbow_displacement'] = np.array(list(map(float, row['right_elbow_displacement'].strip('[]').split())))
            df.at[i, 'left_wrist'] = np.array(list(map(float, row['left_wrist'].strip('[]').split())))
            df.at[i, 'left_wrist_displacement'] = np.array(list(map(float, row['left_wrist_displacement'].strip('[]').split())))
            df.at[i, 'right_wrist'] = np.array(list(map(float, row['right_wrist'].strip('[]').split())))
            df.at[i, 'right_wrist_displacement'] = np.array(list(map(float, row['right_wrist_displacement'].strip('[]').split())))
            df.at[i, 'left_hip'] = np.array(list(map(float, row['left_hip'].strip('[]').split())))
            df.at[i, 'left_hip_displacement'] = np.array(list(map(float, row['left_hip_displacement'].strip('[]').split())))
            df.at[i, 'right_hip'] = np.array(list(map(float, row['right_hip'].strip('[]').split())))
            df.at[i, 'right_hip_displacement'] = np.array(list(map(float, row['right_hip_displacement'].strip('[]').split())))
            df.at[i, 'left_knee'] = np.array(list(map(float, row['left_knee'].strip('[]').split())))
            df.at[i, 'left_knee_displacement'] = np.array(list(map(float, row['left_knee_displacement'].strip('[]').split())))
            df.at[i, 'right_knee'] = np.array(list(map(float, row['right_knee'].strip('[]').split())))
            df.at[i, 'right_knee_displacement'] = np.array(list(map(float, row['right_knee_displacement'].strip('[]').split())))
            df.at[i, 'left_ankle'] = np.array(list(map(float, row['left_ankle'].strip('[]').split())))
            df.at[i, 'left_ankle_displacement'] = np.array(list(map(float, row['left_ankle_displacement'].strip('[]').split())))
            df.at[i, 'right_ankle'] = np.array(list(map(float, row['right_ankle'].strip('[]').split())))
            df.at[i, 'right_ankle_displacement'] = np.array(list(map(float, row['right_ankle_displacement'].strip('[]').split())))
        
        return df
    


# TODO clean up and change to consts and dictionary
def add_new_label(example):

    workout = example['label']
    muscle_group = None

    if workout == 0: # barbell bicep curl
        muscle_group = 3 # bicep
    
    elif workout == 1: # bench press
        muscle_group = 2 # chest
        
    elif workout == 2: # chest fly machine
        muscle_group = 2 # chest

    elif workout == 3: # deadlift
        muscle_group = 7 # back

    elif workout == 4: # decline bench press
        muscle_group = 3 # biceps

    elif workout == 5: # hammer curl
        muscle_group = 3 # bicep

    elif workout == 6: # hip thrust
        muscle_group = 6 # legs

    elif workout == 7: # incline bench press
        muscle_group = 2 # chest

    elif workout == 8: # lat pulldown
        muscle_group = 7 # back

    elif workout == 9: # lateral raises
        muscle_group = 1 # shoulders
    
    elif workout == 10: # leg extensions
        muscle_group = 6 # legs

    elif workout == 11: # leg raises
        muscle_group = 4 # core

    elif workout == 12: # plank
        muscle_group = 4 # core

    elif workout == 13: # pull up
        muscle_group = 7 # back

    elif workout == 14: # push ups
        muscle_group = 2 # chest

    elif workout == 15: # romanian deadlift
        muscle_group = 6 # legs
    
    elif workout == 16: # russian twist
        muscle_group = 4 # core

    elif workout == 17: # shoulder press
        muscle_group = 1 # shoulder

    elif workout == 18: # squat
        muscle_group = 6 # glutes

    elif workout == 19: # t bar row
        muscle_group = 7 # back

    elif workout == 20: # tricep dips
        muscle_group = 5 # tricep

    elif workout == 21: # tricep pushdown
        muscle_group = 5 #tricep

    example['muscle group'] = muscle_group

    return example
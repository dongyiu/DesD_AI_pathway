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
        self.model_path = "/Users/yasinetawfeek/Developer/DesD_AI_pathway/AI/app/pose_landmarker_full.task" 
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
        left_pinky = []             # 6
        right_pinky = []            # 7
        left_index = []             # 8
        right_index = []            # 9
        left_thumb = []             # 10
        right_thumb = []            # 11
        left_hip = []               # 12
        right_hip = []              # 13
        left_knee = []              # 14
        right_knee = []             # 15
        left_ankle = []             # 16
        right_ankle = []            # 17
        left_heel = []              # 18
        right_heel = []             # 19
        left_foot_index = []        # 20 
        right_foot_index = []       # 21 

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
                left_pinky.append(np.array([]))
                right_pinky.append(np.array([]))
                left_index.append(np.array([]))
                right_index.append(np.array([]))
                left_thumb.append(np.array([]))
                right_thumb.append(np.array([]))
                left_hip.append(np.array([]))
                right_hip.append(np.array([]))
                left_knee.append(np.array([]))
                right_knee.append(np.array([]))
                left_ankle.append(np.array([]))
                right_ankle.append(np.array([]))
                left_heel.append(np.array([]))
                right_heel.append(np.array([]))
                left_foot_index.append(np.array([]))
                right_foot_index.append(np.array([]))

            else:
                left_shoulder.append(pose[0])
                right_shoulder.append(pose[1])
                left_elbow.append(pose[2])
                right_elbow.append(pose[3])
                left_wrist.append(pose[4])
                right_wrist.append(pose[5])
                left_pinky.append(pose[6])
                right_pinky.append(pose[7])
                left_index.append(pose[8])
                right_index.append(pose[9])
                left_thumb.append(pose[10])
                right_thumb.append(pose[11])
                left_hip.append(pose[12])
                right_hip.append(pose[13])
                left_knee.append(pose[14])
                right_knee.append(pose[15])
                left_ankle.append(pose[16])
                right_ankle.append(pose[17])
                left_heel.append(pose[18])
                right_heel.append(pose[19])
                left_foot_index.append(pose[20])
                right_foot_index.append(pose[21])
            
            print(f"predicted image {counter} from {len(images)}, time: {time.time() - start}, type: {type(left_shoulder[-1])}")
            counter+= 1
                

        
        df['left_shoulder'] = left_shoulder
        df['right_shoulder'] = right_shoulder
        df['left_elbow'] = left_elbow
        df['right_elbow'] = right_elbow
        df['left_wrist'] = left_wrist
        df['right_wrist'] = right_wrist
        df['left_pinky'] = left_pinky
        df['right_pinky'] = right_pinky
        df['left_index'] = left_index
        df['right_index'] = right_index
        df['left_thumb'] = left_thumb
        df['right_thumb'] = right_thumb
        df['left_hip'] = left_hip
        df['right_hip'] = right_hip
        df['left_knee'] = left_knee
        df['right_knee'] = right_knee
        df['left_ankle'] = left_ankle
        df['right_ankle'] = right_ankle
        df['left_heel'] = left_heel
        df['right_heel'] = right_heel
        df['left_foot_index'] = left_foot_index
        df['right_foot_index'] = right_foot_index

        return df[df['left_shoulder'].map(len) != 0]

    def add_noise_to_df(self, df, noise_intensity):
        df_copy = df.copy(deep=True)
        
        left_shoulder = []          # 0
        right_shoulder = []         # 1
        left_elbow = []             # 2
        right_elbow = []            # 3
        left_wrist = []             # 4
        right_wrist = []            # 5
        left_pinky = []             # 6
        right_pinky = []            # 7
        left_index = []             # 8
        right_index = []            # 9
        left_thumb = []             # 10
        right_thumb = []            # 11
        left_hip = []               # 12
        right_hip = []              # 13
        left_knee = []              # 14
        right_knee = []             # 15
        left_ankle = []             # 16
        right_ankle = []            # 17
        left_heel = []              # 18
        right_heel = []             # 19
        left_foot_index = []        # 20 
        right_foot_index = []       # 21 

        for i, row in df_copy.iterrows():
            left_shoulder.append(np.array([rand.uniform(row['left_shoulder'][0] - noise_intensity, row['left_shoulder'][0] + noise_intensity),
             rand.uniform(row['left_shoulder'][1] - noise_intensity, row['left_shoulder'][1] + noise_intensity),
             rand.uniform(row['left_shoulder'][2] - noise_intensity, row['left_shoulder'][2] + noise_intensity)]))

            right_shoulder.append(np.array([rand.uniform(row['right_shoulder'][0] - noise_intensity, row['right_shoulder'][0] + noise_intensity),
             rand.uniform(row['right_shoulder'][1] - noise_intensity, row['right_shoulder'][1] + noise_intensity),
             rand.uniform(row['right_shoulder'][2] - noise_intensity, row['right_shoulder'][2] + noise_intensity)]))

            left_elbow.append(np.array([rand.uniform(row['left_elbow'][0] - noise_intensity, row['left_elbow'][0] + noise_intensity),
             rand.uniform(row['left_elbow'][1] - noise_intensity, row['left_elbow'][1] + noise_intensity),
             rand.uniform(row['left_elbow'][2] - noise_intensity, row['left_elbow'][2] + noise_intensity)]))

            right_elbow.append(np.array([rand.uniform(row['right_elbow'][0] - noise_intensity, row['right_elbow'][0] + noise_intensity),
             rand.uniform(row['right_elbow'][1] - noise_intensity, row['right_elbow'][1] + noise_intensity),
             rand.uniform(row['right_elbow'][2] - noise_intensity, row['right_elbow'][2] + noise_intensity)]))

            left_wrist.append(np.array([rand.uniform(row['left_wrist'][0] - noise_intensity, row['left_wrist'][0] + noise_intensity),
             rand.uniform(row['left_wrist'][1] - noise_intensity, row['left_wrist'][1] + noise_intensity),
             rand.uniform(row['left_wrist'][2] - noise_intensity, row['left_wrist'][2] + noise_intensity)]))

            right_wrist.append(np.array([rand.uniform(row['right_wrist'][0] - noise_intensity, row['right_wrist'][0] + noise_intensity),
             rand.uniform(row['right_wrist'][1] - noise_intensity, row['right_wrist'][1] + noise_intensity),
             rand.uniform(row['right_wrist'][2] - noise_intensity, row['right_wrist'][2] + noise_intensity)]))

            left_pinky.append(np.array([rand.uniform(row['left_pinky'][0] - noise_intensity, row['left_pinky'][0] + noise_intensity),
             rand.uniform(row['left_pinky'][1] - noise_intensity, row['left_pinky'][1] + noise_intensity),
             rand.uniform(row['left_pinky'][2] - noise_intensity, row['left_pinky'][2] + noise_intensity)]))

            right_pinky.append(np.array([rand.uniform(row['right_pinky'][0] - noise_intensity, row['right_pinky'][0] + noise_intensity),
             rand.uniform(row['right_pinky'][1] - noise_intensity, row['right_pinky'][1] + noise_intensity),
             rand.uniform(row['right_pinky'][2] - noise_intensity, row['right_pinky'][2] + noise_intensity)]))

            left_index.append(np.array([rand.uniform(row['left_index'][0] - noise_intensity, row['left_index'][0] + noise_intensity),
             rand.uniform(row['left_index'][1] - noise_intensity, row['left_index'][1] + noise_intensity),
             rand.uniform(row['left_index'][2] - noise_intensity, row['left_index'][2] + noise_intensity)]))

            right_index.append(np.array([rand.uniform(row['right_index'][0] - noise_intensity, row['right_index'][0] + noise_intensity),
             rand.uniform(row['right_index'][1] - noise_intensity, row['right_index'][1] + noise_intensity),
             rand.uniform(row['right_index'][2] - noise_intensity, row['right_index'][2] + noise_intensity)]))

            left_thumb.append(np.array([rand.uniform(row['left_thumb'][0] - noise_intensity, row['left_thumb'][0] + noise_intensity),
             rand.uniform(row['left_thumb'][1] - noise_intensity, row['left_thumb'][1] + noise_intensity),
             rand.uniform(row['left_thumb'][2] - noise_intensity, row['left_thumb'][2] + noise_intensity)]))

            right_thumb.append(np.array([rand.uniform(row['right_thumb'][0] - noise_intensity, row['right_thumb'][0] + noise_intensity),
             rand.uniform(row['right_thumb'][1] - noise_intensity, row['right_thumb'][1] + noise_intensity),
             rand.uniform(row['right_thumb'][2] - noise_intensity, row['right_thumb'][2] + noise_intensity)]))

            left_hip.append(np.array([rand.uniform(row['left_hip'][0] - noise_intensity, row['left_hip'][0] + noise_intensity),
             rand.uniform(row['left_hip'][1] - noise_intensity, row['left_hip'][1] + noise_intensity),
             rand.uniform(row['left_hip'][2] - noise_intensity, row['left_hip'][2] + noise_intensity)]))

            right_hip.append(np.array([rand.uniform(row['right_hip'][0] - noise_intensity, row['right_hip'][0] + noise_intensity),
             rand.uniform(row['right_hip'][1] - noise_intensity, row['right_hip'][1] + noise_intensity),
             rand.uniform(row['right_hip'][2] - noise_intensity, row['right_hip'][2] + noise_intensity)]))

            left_knee.append(np.array([rand.uniform(row['left_knee'][0] - noise_intensity, row['left_knee'][0] + noise_intensity),
             rand.uniform(row['left_knee'][1] - noise_intensity, row['left_knee'][1] + noise_intensity),
             rand.uniform(row['left_knee'][2] - noise_intensity, row['left_knee'][2] + noise_intensity)]))

            right_knee.append(np.array([rand.uniform(row['right_knee'][0] - noise_intensity, row['right_knee'][0] + noise_intensity),
             rand.uniform(row['right_knee'][1] - noise_intensity, row['right_knee'][1] + noise_intensity),
             rand.uniform(row['right_knee'][2] - noise_intensity, row['right_knee'][2] + noise_intensity)]))

            left_ankle.append(np.array([rand.uniform(row['left_ankle'][0] - noise_intensity, row['left_ankle'][0] + noise_intensity),
             rand.uniform(row['left_ankle'][1] - noise_intensity, row['left_ankle'][1] + noise_intensity),
             rand.uniform(row['left_ankle'][2] - noise_intensity, row['left_ankle'][2] + noise_intensity)]))

            right_ankle.append(np.array([rand.uniform(row['right_ankle'][0] - noise_intensity, row['right_ankle'][0] + noise_intensity),
             rand.uniform(row['right_ankle'][1] - noise_intensity, row['right_ankle'][1] + noise_intensity),
             rand.uniform(row['right_ankle'][2] - noise_intensity, row['right_ankle'][2] + noise_intensity)]))

            left_heel.append(np.array([rand.uniform(row['left_heel'][0] - noise_intensity, row['left_heel'][0] + noise_intensity),
             rand.uniform(row['left_heel'][1] - noise_intensity, row['left_heel'][1] + noise_intensity),
             rand.uniform(row['left_heel'][2] - noise_intensity, row['left_heel'][2] + noise_intensity)]))

            right_heel.append(np.array([rand.uniform(row['right_heel'][0] - noise_intensity, row['right_heel'][0] + noise_intensity),
             rand.uniform(row['right_heel'][1] - noise_intensity, row['right_heel'][1] + noise_intensity),
             rand.uniform(row['right_heel'][2] - noise_intensity, row['right_heel'][2] + noise_intensity)]))

            left_foot_index.append(np.array([rand.uniform(row['left_foot_index'][0] - noise_intensity, row['left_foot_index'][0] + noise_intensity),
             rand.uniform(row['left_foot_index'][1] - noise_intensity, row['left_foot_index'][1] + noise_intensity),
             rand.uniform(row['left_foot_index'][2] - noise_intensity, row['left_foot_index'][2] + noise_intensity)]))

            right_foot_index.append(np.array([rand.uniform(row['right_foot_index'][0] - noise_intensity, row['right_foot_index'][0] + noise_intensity),
             rand.uniform(row['right_foot_index'][1] - noise_intensity, row['right_foot_index'][1] + noise_intensity),
             rand.uniform(row['right_foot_index'][2] - noise_intensity, row['right_foot_index'][2] + noise_intensity)]))
            
        df_copy['left_shoulder'] = left_shoulder
        df_copy['right_shoulder'] = right_shoulder
        df_copy['left_elbow'] = left_elbow
        df_copy['right_elbow'] = right_elbow
        df_copy['left_wrist'] = left_wrist
        df_copy['right_wrist'] = right_wrist
        df_copy['left_pinky'] = left_pinky
        df_copy['right_pinky'] = right_pinky
        df_copy['left_index'] = left_index
        df_copy['right_index'] = right_index
        df_copy['left_thumb'] = left_thumb
        df_copy['right_thumb'] = right_thumb
        df_copy['left_hip'] = left_hip
        df_copy['right_hip'] = right_hip
        df_copy['left_knee'] = left_knee
        df_copy['right_knee'] = right_knee
        df_copy['left_ankle'] = left_ankle
        df_copy['right_ankle'] = right_ankle
        df_copy['left_heel'] = left_heel
        df_copy['right_heel'] = right_heel
        df_copy['left_foot_index'] = left_foot_index
        df_copy['right_foot_index'] = right_foot_index

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
    
    def draw_landmarks_on_image(self, image, detection_result):
        # Make a copy of the image to draw on
        annotated_image = image.copy()
        
        # Get image dimensions
        image_height, image_width = image.shape[:2]
        
        # Define landmark connection lines (simplified version)
        POSE_CONNECTIONS = [
            # Torso
            (0, 1), (1, 13), (13, 12), (12, 0), 
            # Left arm
            (0, 2), (2, 4), (4, 6), (4, 8), (4, 10),
            # Right arm
            (1, 3), (3, 5), (5, 7), (5, 9), (5, 11),
            # Left leg
            (12, 14), (14, 16), (16, 18), (16, 20),
            # Right leg
            (13, 15), (15, 17), (17, 19), (17, 21),
        ]
        
        # Draw landmarks and connections for each detected pose
        if detection_result.pose_landmarks:
            for pose_landmarks in detection_result.pose_landmarks:
                # Draw landmarks
                for idx, landmark in enumerate(pose_landmarks):
                    # Convert normalized coordinates to pixel values
                    x = int(landmark.x * image_width)
                    y = int(landmark.y * image_height)
                    
                    # Draw a circle at each landmark
                    cv2.circle(annotated_image, (x, y), 5, (0, 255, 0), -1)  # Green circle
                    
                    # Add landmark index
                    cv2.putText(annotated_image, str(idx), (x + 5, y - 5), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1, cv2.LINE_AA)
                    
                # Draw connections
                for connection in POSE_CONNECTIONS:
                    start_idx, end_idx = connection
                    
                    if start_idx < len(pose_landmarks) and end_idx < len(pose_landmarks):
                        # Get start and end points
                        start_point = (
                            int(pose_landmarks[start_idx].x * image_width),
                            int(pose_landmarks[start_idx].y * image_height)
                        )
                        end_point = (
                            int(pose_landmarks[end_idx].x * image_width),
                            int(pose_landmarks[end_idx].y * image_height)
                        )
                        
                        # Draw a line connecting the points
                        cv2.line(annotated_image, start_point, end_point, (245, 117, 66), 2)
        
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
            df.at[i, 'left_pinky'] = np.array(list(map(float, row['left_pinky'].strip('[]').split())))
            df.at[i, 'right_pinky'] = np.array(list(map(float, row['right_pinky'].strip('[]').split())))
            df.at[i, 'left_index'] = np.array(list(map(float, row['left_index'].strip('[]').split())))
            df.at[i, 'right_index'] = np.array(list(map(float, row['right_index'].strip('[]').split())))
            df.at[i, 'left_thumb'] = np.array(list(map(float, row['left_thumb'].strip('[]').split())))
            df.at[i, 'right_thumb'] = np.array(list(map(float, row['right_thumb'].strip('[]').split())))
            df.at[i, 'left_hip'] = np.array(list(map(float, row['left_hip'].strip('[]').split())))
            df.at[i, 'right_hip'] = np.array(list(map(float, row['right_hip'].strip('[]').split())))
            df.at[i, 'left_knee'] = np.array(list(map(float, row['left_knee'].strip('[]').split())))
            df.at[i, 'right_knee'] = np.array(list(map(float, row['right_knee'].strip('[]').split())))
            df.at[i, 'left_ankle'] = np.array(list(map(float, row['left_ankle'].strip('[]').split())))
            df.at[i, 'right_ankle'] = np.array(list(map(float, row['right_ankle'].strip('[]').split())))
            df.at[i, 'left_heel'] = np.array(list(map(float, row['left_heel'].strip('[]').split())))
            df.at[i, 'right_heel'] = np.array(list(map(float, row['right_heel'].strip('[]').split())))
            df.at[i, 'left_foot_index'] = np.array(list(map(float, row['left_foot_index'].strip('[]').split())))
            df.at[i, 'right_foot_index'] = np.array(list(map(float, row['right_foot_index'].strip('[]').split())))
        
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
import pandas as pd
import numpy as np
from datasets import load_dataset, Dataset
from mediapipe_handler import MediaPipeHandler, add_new_label
import os

def mediapipe_format_dataset_handler(dataset_name):
    try:
        ds = load_dataset(dataset_name)
        new_ds = ds.map(add_new_label)

        train = new_ds['train']
        test = new_ds['test']
        validation = new_ds['validation']

        train = pd.DataFrame(train)
        test = pd.DataFrame(test)
        validation = pd.DataFrame(validation)

        # print(type(train['image'][0]))

        media_pipe_handler = MediaPipeHandler()

        train = media_pipe_handler.pandas_add_detections_from_image_and_remove_nulls(train)
        test = media_pipe_handler.pandas_add_detections_from_image_and_remove_nulls(test)
        validation = media_pipe_handler.pandas_add_detections_from_image_and_remove_nulls(validation)

        # noise_intensity = 0.1
        noise_intensity = 0.25
        noise_possibility = 10

        train_with_noise = media_pipe_handler.add_noise_to_df_with_displacement(train, 0)
        test_with_noise = media_pipe_handler.add_noise_to_df_with_displacement(test, 0)
        validation_with_noise = media_pipe_handler.add_noise_to_df_with_displacement(validation, 0)

        duplicate_noise_positions_exponential = 6
        for i in range(duplicate_noise_positions_exponential):
            train_with_noise = media_pipe_handler.add_noise_to_df_with_displacement(train, 0)
            test_with_noise = media_pipe_handler.add_noise_to_df_with_displacement(test, 0)
            validation_with_noise = media_pipe_handler.add_noise_to_df_with_displacement(validation, 0)

        for i in range(duplicate_noise_positions_exponential + 4):
            train_with_noise = pd.concat([train_with_noise, media_pipe_handler.add_noise_to_df_with_displacement(train, noise_intensity, noise_possibility)], ignore_index=True) 
            test_with_noise = pd.concat([test_with_noise, media_pipe_handler.add_noise_to_df_with_displacement(test, noise_intensity, noise_possibility)], ignore_index=True)
            validation_with_noise = pd.concat([validation_with_noise, media_pipe_handler.add_noise_to_df_with_displacement(validation, noise_intensity, noise_possibility)], ignore_index=True)
            print(f"Added {i+1} of {duplicate_noise_positions_exponential} noisey duplicates")

        # noise_intensity = 0.02
        # noise_intensity = 0.04
        noise_intensity = 0.06
        noise_possibility = 3
        for i in range(duplicate_noise_positions_exponential):
            train_with_noise = pd.concat([train_with_noise, media_pipe_handler.add_noise_to_df_with_displacement(train, noise_intensity, noise_possibility)], ignore_index=True) 
            test_with_noise = pd.concat([test_with_noise, media_pipe_handler.add_noise_to_df_with_displacement(test, noise_intensity, noise_possibility)], ignore_index=True)
            validation_with_noise = pd.concat([validation_with_noise, media_pipe_handler.add_noise_to_df_with_displacement(validation, noise_intensity, noise_possibility)], ignore_index=True)
            print(f"Added {i+1} of {duplicate_noise_positions_exponential} noisey duplicates")

        os.makedirs('data', exist_ok=True)

        train_with_noise = train_with_noise.sample(frac=1).reset_index(drop=True)
        test_with_noise = test_with_noise.sample(frac=1).reset_index(drop=True)
        validation_with_noise = validation_with_noise.sample(frac=1).reset_index(drop=True)

        print("saving...")
        train_with_noise.to_csv(os.getcwd() + '/data/train_new_final_model.csv')
        test_with_noise.to_csv(os.getcwd() + '/data/test_new_final_model.csv')
        validation_with_noise.to_csv(os.getcwd() + '/data/validation_new_final_model.csv')
    except Exception as e:
        print(f'Error processing dataset: {str(e)}')
        return False
    return True

mediapipe_format_dataset_handler("averrous/workout")
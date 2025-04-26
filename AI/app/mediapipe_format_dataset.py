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

        train_with_noise = train
        test_with_noise = test
        validation_with_noise = validation

        duplicate_noise_positions_exponential = 7
        noise_intensity = 0.02
        for i in range(duplicate_noise_positions_exponential):
            train_with_noise = pd.concat([train_with_noise, media_pipe_handler.add_noise_to_df(train, noise_intensity)], ignore_index=True) 
            test_with_noise = pd.concat([test_with_noise, media_pipe_handler.add_noise_to_df(test, noise_intensity)], ignore_index=True)
            validation_with_noise = pd.concat([validation_with_noise, media_pipe_handler.add_noise_to_df(validation, noise_intensity)], ignore_index=True)

        os.makedirs('data', exist_ok=True)

        train_with_noise.to_csv('/Users/yasinetawfeek/Developer/DesD_AI_pathway/AI/data/train_new.csv')
        test_with_noise.to_csv('/Users/yasinetawfeek/Developer/DesD_AI_pathway/AI/data/test_new.csv')
        validation_with_noise.to_csv('/Users/yasinetawfeek/Developer/DesD_AI_pathway/AI/data/validation_new.csv')
    except Exception as e:
        print(f'Error processing dataset: {str(e)}')
        return False
    return True

mediapipe_format_dataset_handler("averrous/workout")
import pandas as pd
import numpy as np
from datasets import load_dataset, Dataset
from mediapipe_handler import MediaPipeHandler, add_new_label
import os

def mediapipe_format_dataset_handler(dataset_name):
    try:
        ds = load_dataset(dataset_name)
        new_ds = ds.map(add_new_label)

        train = new_ds['train'][:500]
        test = new_ds['test'][:500]
        validation = new_ds['validation'][:500]

        train = pd.DataFrame(train)
        test = pd.DataFrame(test)
        validation = pd.DataFrame(validation)

        # print(type(train['image'][0]))

        media_pipe_handler = MediaPipeHandler()

        train_new = media_pipe_handler.pandas_add_detections_from_image_and_remove_nulls(train)
        test_new = media_pipe_handler.pandas_add_detections_from_image_and_remove_nulls(test)
        validation_new = media_pipe_handler.pandas_add_detections_from_image_and_remove_nulls(validation)

        print(train_new)
        print(test_new)
        print(validation_new)
        os.makedirs('data', exist_ok=True)

        train_new.to_csv('data/train_new.csv')
        test_new.to_csv('data/test_new.csv')
        validation_new.to_csv('data/validation_new.csv')
    except Exception as e:
        print(f'Error processing dataset: {str(e)}')
        return False
    return True
import pandas as pd
import numpy as np
from datasets import load_dataset, Dataset
from mediapipe_handler import MediaPipeHandler, add_new_label

ds = load_dataset("averrous/workout")
new_ds = ds.map(add_new_label)

train = new_ds['train']
test = new_ds['test']
validation = new_ds['validation']

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

train_new.to_csv('data/train_new.csv')
test_new.to_csv('data/test_new.csv')
validation_new.to_csv('data/validation_new.csv')
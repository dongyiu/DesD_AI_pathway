
from fetch_dataset_from_url import url_exists, extract_dataset_name, check_if_huggingface
from mediapipe_format_dataset import mediapipe_format_dataset_handler
from workout_classifer_model import train_workout_and_evaluate, predict_workout
from muscle_group_classifer import train_muscle_group_and_evaluate, predict_muscle_group
from displacement_model import train_displacement_and_evaluate
from mediapipe_handler import MediaPipeHandler
import os

def download_dataset(url):
    if url_exists(url) and check_if_huggingface(url):
        dataset_name = extract_dataset_name(url)
        print(f"Dataset name: {dataset_name}")
    else:
        print("Invalid URL or not a Hugging Face dataset.")
        return  False
    
    # Assuming the dataset is in a format that can be loaded directly
    if mediapipe_format_dataset_handler(dataset_name):
        print("Dataset loaded successfully.")
        return True
    else:
        print("Failed to load dataset.")
        return False
    

def train_workout_classifier(random_forest_gridsearch=False,support_vector_machine_gridsearch=False):

    """
    Assuming that dataset has been stored and is ready to be loaded
    """
    mediapipe_model = MediaPipeHandler()
    training_dataset=mediapipe_model.read_csv_to_pd(os.path.join("data", "train_new.csv"))
    testing_dataset=mediapipe_model.read_csv_to_pd(os.path.join("data", "test_new.csv"))


    return train_workout_and_evaluate(training_dataset,testing_dataset,random_forest_gridsearch,support_vector_machine_gridsearch)

def train_muscle_group_classifier(random_forest_gridsearch,support_vector_machine_gridsearch):
    """
    Assuming that dataset has been stored and is ready to be loaded
    """
    mediapipe_model = MediaPipeHandler()

    training_dataset=mediapipe_model.read_csv_to_pd(os.path.join("data", "train_new.csv"))
    testing_dataset=mediapipe_model.read_csv_to_pd(os.path.join("data", "test_new.csv"))
    return train_muscle_group_and_evaluate(training_dataset,testing_dataset,random_forest_gridsearch,support_vector_machine_gridsearch)

def train_displacement_classifier():
    """
    Assuming that dataset has been stored and is ready to be loaded
    """
    mediapipe_model = MediaPipeHandler()

    training_dataset=mediapipe_model.read_csv_to_pd(os.path.join("data", "train_new.csv"))
    testing_dataset=mediapipe_model.read_csv_to_pd(os.path.join("data", "test_new.csv"))
    validation_dataset=mediapipe_model.read_csv_to_pd(os.path.join("data", "validation_new.csv"))
    
    return train_displacement_and_evaluate(training_dataset,validation_dataset,testing_dataset)



def predict_workout_classifier(data_to_predict):
    return predict_workout(data_to_predict)
def predict_muscle_group_classifier(data_to_predict):
    return predict_muscle_group(data_to_predict)
def predict_displacement_classifier(data_to_predict):
    pass

# predict_workout_classifier
def predict(x):
    return "Push Up"




# download_dataset("https://huggingface.co/datasets/averrous/workout")
# train_workout_classifier()
# train_muscle_group_classifier()
# train_displacement_classifier()

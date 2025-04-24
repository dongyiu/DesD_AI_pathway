import pandas as pd
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from sklearn.ensemble import  RandomForestClassifier
from sklearn.tree import  DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import VarianceThreshold
from sklearn.model_selection import GridSearchCV
# from lime import lime_tabular
from mediapipe_handler import MediaPipeHandler
from get_work_out_labels import add_workout_label_back
# import seaborn as sns
from sklearn.svm import SVC
# from imblearn.over_sampling import SMOTE
from store_best_model import save_model_as_pickle, load_model
# mediapipe_model = MediaPipeHandler()
# training_dataset=mediapipe_model.read_csv_to_pd("D:\\DesD_AI_pathway\\AI\\data\\train_new.csv")
# testing_dataset=mediapipe_model.read_csv_to_pd("D:\\DesD_AI_pathway\\AI\\data\\test_new.csv")
from prepare_frontend_mediapipe_data import prepare_data_to_predict, Preprocess_data

print("loading dataset....")
"""
Removes original feature and splits it into x,y,z components

"""


"""
Splits dataset into X_train,y_train or X_test,y_test, if you give it training dataset then X_train and y_train

"""
def Return_X_y(dataframe,columns_to_delete):
    X=dataframe.drop(columns=columns_to_delete)
    y=dataframe['label']
    return X,y





# training_dataset_preprocessed=Preprocess_data(training_dataset,features_to_split)
# X_train, y_train = Return_X_y(training_dataset_preprocessed,['label','muscle group','image','Unnamed: 0'])


# testing_dataset_preprocessed=Preprocess_data(testing_dataset,features_to_split)
# X_test, y_test = Return_X_y(testing_dataset_preprocessed,['label','muscle group','image','Unnamed: 0'])


def predict_workout(data_to_predict):
    data_to_predict = prepare_data_to_predict(data_to_predict)
    model=load_model("workout")
    result=model.predict(data_to_predict)
    result=add_workout_label_back(result[0])
    print("workout_value is",result)
    return result




def train_workout_and_evaluate(training_dataset,testing_dataset,random_forest_gridsearch,support_vector_machine_gridsearch):
    
    # return 92.0
    features_to_split=['left_shoulder',
       'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist',
       'right_wrist', 'left_pinky', 'right_pinky', 'left_index', 'right_index',
       'left_thumb', 'right_thumb', 'left_hip', 'right_hip', 'left_knee',
       'right_knee', 'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
       'left_foot_index', 'right_foot_index']

    training_dataset_preprocessed=Preprocess_data(training_dataset,features_to_split)
    X_train, y_train = Return_X_y(training_dataset_preprocessed,['label','muscle group','image','Unnamed: 0'])
    testing_dataset_preprocessed=Preprocess_data(testing_dataset,features_to_split)
    X_test, y_test = Return_X_y(testing_dataset_preprocessed,['label','muscle group','image','Unnamed: 0'])
    
    

    param_grid = {
    'n_estimators': [1000],
    'max_depth': [20],

    }
    param_grid_two = {
        'C': [0.1, 1, 10],
        'kernel': ['linear', 'rbf'],
    }
    if random_forest_gridsearch:
        param_grid = random_forest_gridsearch
    if support_vector_machine_gridsearch:
        param_grid_two = support_vector_machine_gridsearch

    random_tree_model = RandomForestClassifier(random_state=42)

    grid_search = GridSearchCV(
        estimator=random_tree_model,
        param_grid=param_grid,
        cv=3,  # 5-fold cross-validation
        n_jobs=-1,  # Use all available cores
        verbose=2,
        scoring='accuracy'
    )
    grid_search.fit(X_train,y_train)
    y_predictions=grid_search.predict(X_test)
    accuracy = accuracy_score(y_test,y_predictions)
    report = classification_report(y_test,y_predictions)
    confusion_matrix_values = confusion_matrix(y_test,y_predictions)


    print("Best Parameters:", grid_search.best_params_)
    print("Accuracy:", (accuracy*100),"%")
    print("Classification Report:\n", report)


    svm_model = SVC(random_state=42)

    grid_search_two = GridSearchCV(
        estimator=svm_model,
        param_grid=param_grid_two,
        cv=3,  # 5-fold cross-validation
        n_jobs=-1,  # Use all available cores
        verbose=2,
        scoring='accuracy'
    )
    grid_search_two.fit(X_train,y_train)
    y_predictions=grid_search_two.predict(X_test)
    accuracy_two = accuracy_score(y_test,y_predictions)
    report_two = classification_report(y_test,y_predictions)
    confusion_matrix_values_two = confusion_matrix(y_test,y_predictions)

    best_model_to_store =grid_search.best_estimator_
    best_model = "Random Forest"
    if accuracy_two>accuracy:
        print("Best Accuracy:", (accuracy_two*100),"%")
        accuracy=accuracy_two
        best_model = "SVM"
        best_model_to_store = grid_search_two.best_estimator_
    
    save_model_as_pickle(best_model_to_store, "workout_"+best_model)

    return (accuracy*100) , best_model









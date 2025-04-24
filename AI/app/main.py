from flask import Flask, request, jsonify
# from ai_model import p
from ai_model import *
import subprocess
import time
import os
#train_model(training_dataset,testing_dataset)

app = Flask(__name__)
API_KEY ="job_hunting_ai_memory_leakage" #should be the same as the one in viewset.py in django app
API_KEY=''
# ALLOWED_IP="10.167.143.148" # Django App if running locally
ALLOWED_IP="172.18.0.1" #if running Docker
@app.route('/train_model', methods=['POST'])
def train_model():

    """
    API for training classify_workout model
    """
    print("request.remote_addr",request.remote_addr,ALLOWED_IP)
    
    try:
        data = request.get_json()

        secret_api_key=request.headers.get('X-API-KEY', '')
        if secret_api_key!= API_KEY:
            return jsonify({"status": "error", "message": "Invalid secret API key"}), 401
        dataset_url = data.get("dataset_url","https://huggingface.co/datasets/averrous/workout")
        random_forest_gridsearch = data.get("random_forest_gridsearch", False)
        support_vector_machine_gridsearch = data.get("support_vector_machine_gridsearch", False)
        print("random_forest_gridsearch",random_forest_gridsearch)
        print("support_vector_machine_gridsearch",support_vector_machine_gridsearch)
        if download_dataset(dataset_url):
            accuracy_workout,best_workout_model=train_workout_classifier(random_forest_gridsearch,support_vector_machine_gridsearch)
            accuracy_muscle_group,best_muscle_group_model=train_muscle_group_classifier(random_forest_gridsearch,support_vector_machine_gridsearch)
            # accuracy_displacement=train_displacement_classifier()
            result=f"""Training accuracy for Workout Classifier is {accuracy_workout} \n
            Training accuracy for Muscle Group Classifier is {accuracy_muscle_group} \n
            Training accuracy for Displacement Classifier is {accuracy_muscle_group} 
            
            Btw best model  best_workout_model{best_workout_model} and best_muscle_group_model{best_muscle_group_model}\n
            """
        else:
            return jsonify({"status": "error", "message": "Failed to download or load dataset"}), 400

        return jsonify({"status": "success", "result": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500



@app.route('/predict_workout_endpoint', methods=['POST'])
def predict_workout_endpoint():
    try:
        
            data = request.get_json()
            data_to_predict = data.get("data_to_predict")
            start_time = time.time()

            workout_label = predict_workout_classifier(data_to_predict)
            print("time",time.time()-start_time)
            return jsonify({"status": "success", "workout_label": workout_label})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/predict_muscle_group_endpoint', methods=['POST'])
def predict_muscle_group_endpoint():
    try:
            data = request.get_json()
            data_to_predict = data.get("data_to_predict")
            muscle_group = predict_muscle_group_classifier(data_to_predict)
            return jsonify({"status": "success", "muscle_group": muscle_group})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/predict_adjust_pose', methods=['POST'])
def predict_adjust_pose():
    try:
            data = request.get_json()
            data_to_predict = data.get("data_to_predict")
            workout_int = data.get("workout_int")
            workout_label = predict_muscle_group_classifier(data_to_predict)
            muscle_group = predict_muscle_group_classifier(data_to_predict)
            return jsonify({"status": "success", "workout_label": workout_label,"muscle_group":muscle_group})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


"""
1) input: pose/output: 1D array pose[predicted] + workout + muscle_group
 
2)input: pose + workout/output: pose + workout + muscle_group
 
"""

@app.route('/predict_model', methods=['POST'])
def predict_model():
    print("request.remote_addr",request.remote_addr)
    if request.remote_addr != ALLOWED_IP:
        return {"error": "Unauthorized"}, 403
    try:
        data = request.get_json()
        data_to_predict = data.get("data_to_predict")
        # workout_label = predict(data_to_predict)
        workout_label = "Unknown" # Placeholder for actual model prediction
        return jsonify({"status": "success", "workout_label": workout_label})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001)
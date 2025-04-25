from flask import Flask, request, jsonify
# from ai_model import p
from ai_model import *
import subprocess

import os
#train_model(training_dataset,testing_dataset)

app = Flask(__name__)
API_KEY ="job_hunting_ai_memory_leakage" #should be the same as the one in viewset.py in django app
# ALLOWED_IP="10.167.143.148" # Django App if running locally
ALLOWED_IP="172.18.0.1" #if running Docker
@app.route('/train_model', methods=['POST'])
def train_model():

    """
    API for training classify_workout model
    """
    print("request.remote_addr",request.remote_addr,ALLOWED_IP)
    # if request.remote_addr != ALLOWED_IP:
    #     return {"error": "Unauthorized"}, 403
    
    try:
        data = request.get_json()
        # training_dataset = data.get("training_dataset")
        # testing_dataset = data.get("testing_dataset")
        # print("training_dataset",training_dataset)
        secret_api_key=request.headers.get('X-API-KEY', '')
        if secret_api_key!= API_KEY:
            return jsonify({"status": "error", "message": "Invalid secret API key"}), 401
        dataset_url = data.get("dataset_url")
        if download_dataset(dataset_url):
            accuracy_workout=train_workout_classifier()
            accuracy_muscle_group=train_muscle_group_classifier()
            result=f"""Training accuracy for Workout Classifier is {accuracy_workout} \n
            Training accuracy for Muscle Group Classifier is {accuracy_muscle_group} \n"""
        else:
            return jsonify({"status": "error", "message": "Failed to download or load dataset"}), 400

        return jsonify({"status": "success", "result": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


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
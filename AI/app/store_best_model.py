import pickle
import os
import time

def save_model_as_pickle(model, filename, folder_path="machine_learning_models"):
    try:
        # Create the folder if that folder does not exist, in this case it is called machine_learning_models
        unique_id = str(int(time.time())) # Unique ID based on current time
        filename = f"{unique_id}_{filename}"

        if not os.path.exists(folder_path):
            os.makedirs(folder_path)

        file_path = os.path.join(folder_path, filename)
        
        with open(file_path, 'wb') as file:
            pickle.dump(model, file)
        
        print(f"Model successfully saved to {file_path}")
        return True
    except Exception as e:
        print(f"Error saving model: {e}")
        return False


def load_model(model_type,folder_path="selected_machine_learning_models"):
    model_file = [f for f in os.listdir(folder_path) if model_type in f]
    print("model_file",model_file)

    file_path = os.path.join(folder_path, model_file[0])

    with open(file_path, 'rb') as f:
        model = pickle.load(f)
    print(model)
    return model


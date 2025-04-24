import pandas as pd
import numpy as np
def Preprocess_data(dataframe,columns_to_flatten):
    final_df=dataframe.copy()
    # Expanding each column into 3 separate columns (x, y, z) and appending it to the final dataframe.
    for column in columns_to_flatten:
        # print(np.vstack(dataframe[column]).astype(float))
        expanded_df=pd.DataFrame(np.vstack(dataframe[column]).astype(float), 
                           columns=[column+'_x', column+'_y', column+'_z'],
                           index=dataframe.index)
        new_df = pd.concat([dataframe.drop(column, axis=1), expanded_df], axis=1)
        for new_column in new_df.columns:
            final_df[new_column] = new_df[new_column]

    return final_df.drop(columns=columns_to_flatten,axis=1)



def prepare_data_to_predict(data_to_predict):
   mediapipe_keypoints = [
      "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner",
      "right_eye", "right_eye_outer", "left_ear", "right_ear", "mouth_left", 
      "mouth_right", "left_shoulder", "right_shoulder", "left_elbow", 
      "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky", 
      "left_index", "right_index", "left_thumb", "right_thumb", "left_hip", 
      "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle", 
      "left_heel", "right_heel", "left_foot_index", "right_foot_index"
      ]
   data_to_predict = pd.DataFrame(data_to_predict)
   print("data_to_predict df",data_to_predict)
#    data_to_predict = pd.read_json("test_pose.json")
   data_to_predict['Column']=mediapipe_keypoints

   features_to_split=["left_shoulder",
         "right_shoulder", "left_elbow", "right_elbow", "left_wrist",
         "right_wrist", "left_pinky", "right_pinky", "left_index", "right_index",
         "left_thumb", "right_thumb", "left_hip", "right_hip", "left_knee",
         "right_knee", "left_ankle", "right_ankle", "left_heel", "right_heel",
         "left_foot_index", "right_foot_index"]

   data_to_predict['Column']=data_to_predict['Column'].astype('string')
   data_to_predict = data_to_predict.drop(columns='visibility')
   print("<data_to_predict>",data_to_predict)
   data_to_predict = data_to_predict[data_to_predict['Column'].isin(features_to_split)]

   new_columns = []
   values = []
   for joint in features_to_split:
        # Find the row for this joint (note there's a typo in 'shoulder' in your data)
        row = data_to_predict[data_to_predict['Column'].str.contains(joint.split('_')[1])].iloc[0]
        new_columns.extend([f'{joint}_x', f'{joint}_y', f'{joint}_z'])
        values.extend([row['x'], row['y'], row['z']])

    # Create a new DataFrame with one row
   output_df = pd.DataFrame([values], columns=new_columns)
   print("final df",output_df)
   return output_df
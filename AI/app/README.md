# Real-time Workout Pose Correction

This Flask application provides real-time pose correction for workouts using a deep neural network model.

## Setup

1. Install the required packages:

```bash
pip install -r requirements.txt
```

2. Make sure the model file exists at `AI/data/best_model.pth`.

3. In the frontend directory, install the required npm packages:

```bash
cd frontend
npm install
```

## Running the Application

1. Start the Flask backend:

```bash
cd AI/app
python main.py
```

This will start the server at http://localhost:8001.

2. Start the React frontend:

```bash
cd frontend
npm run dev
```

This will start the frontend development server.

3. Open your browser and navigate to the frontend URL (typically http://localhost:3000).

## Endpoints

- WebSocket: Connect to `ws://localhost:8001` for real-time pose corrections.
  - Send: `pose_data` event with landmarks data
  - Receive: `pose_corrections` event with correction data

- REST API: 
  - POST `/train_model`: Train the workout and muscle group classifiers
  - POST `/predict_model`: Predict workout label for given data

## How It Works

1. The frontend captures pose data using MediaPipe Pose detection.
2. Pose landmarks are sent to the server via WebSocket.
3. The server processes the landmarks through the DNN model, using the barbell bicep curl workout type.
4. The model returns pose corrections, which are sent back to the client.
5. The frontend visualizes the corrections as arrows, guiding the user to the correct pose. 
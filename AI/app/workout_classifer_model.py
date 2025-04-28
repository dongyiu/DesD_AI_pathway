import pandas as pd
import numpy as np
import pickle
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE

# PyTorch imports
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torch.nn.utils.rnn import pad_sequence

# Assuming these imports work the same way as in the original code
from mediapipe_handler import MediaPipeHandler
from get_work_out_labels import add_workout_label_back

# Set random seeds for reproducibility
torch.manual_seed(42)
np.random.seed(42)

# GPU setup with more detailed handling
def get_device_info():
    if torch.cuda.is_available():
        device = torch.device("cuda")
        current_device = torch.cuda.current_device()
        device_properties = torch.cuda.get_device_properties(current_device)
        print(f"GPU Device: {torch.cuda.get_device_name(current_device)}")
        print(f"GPU Memory: {device_properties.total_memory / 1e9:.2f} GB")
        print(f"CUDA Version: {torch.version.cuda}")
        # Set device to highest memory capacity GPU if multiple are available
        if torch.cuda.device_count() > 1:
            print(f"Multiple GPUs available: {torch.cuda.device_count()}")
            max_mem = 0
            max_mem_device = 0
            for i in range(torch.cuda.device_count()):
                props = torch.cuda.get_device_properties(i)
                print(f"  GPU {i}: {props.name} ({props.total_memory / 1e9:.2f} GB)")
                if props.total_memory > max_mem:
                    max_mem = props.total_memory
                    max_mem_device = i
            torch.cuda.set_device(max_mem_device)
            print(f"Using GPU {max_mem_device} as primary device")
        print("CUDA is available! Training on GPU.")
    else:
        device = torch.device("cpu")
        print("WARNING: CUDA is not available. Training on CPU will be much slower!")
    
    return device

device = get_device_info()

# Enable cuDNN benchmarking for performance optimization if using GPU
if device.type == 'cuda':
    torch.backends.cudnn.benchmark = True
    torch.backends.cudnn.deterministic = False

mediapipe_model = MediaPipeHandler()

# Define base data directory using a relative path
try:
    # Try script-style path resolution first
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
except NameError:
    # If in a Jupyter notebook, use the current working directory
    import pathlib
    base_dir = os.path.abspath(os.path.join(os.getcwd(), ".."))

data_dir = os.path.join(base_dir, "data")
models_dir = os.path.join(data_dir, "models")

# Create models directory if it doesn't exist
os.makedirs(models_dir, exist_ok=True)

# Print paths for debugging
print(f"Base directory: {base_dir}")
print(f"Data directory: {data_dir}")
print(f"Models directory: {models_dir}")

# Load and prepare data
training_dataset = mediapipe_model.read_csv_to_pd(os.path.join(data_dir, "train_new.csv"))[:40000]
testing_dataset = mediapipe_model.read_csv_to_pd(os.path.join(data_dir, "test_new.csv"))
validation_dataset = mediapipe_model.read_csv_to_pd(os.path.join(data_dir, "validation_new.csv"))

# Add workout labels
training_dataset['WorkoutLabel'] = training_dataset.apply(lambda x: add_workout_label_back(x['label']), axis=1)
testing_dataset['WorkoutLabel'] = testing_dataset.apply(lambda x: add_workout_label_back(x['label']), axis=1)
validation_dataset['WorkoutLabel'] = validation_dataset.apply(lambda x: add_workout_label_back(x['label']), axis=1)

# Get unique workout labels
Workout_labels = training_dataset['WorkoutLabel'].unique()
print(f"Number of unique workout labels: {len(Workout_labels)}")
print(f"Workout labels: {Workout_labels}")

# Visualize class distribution
plt.figure(figsize=(20, 8))
value_counts = training_dataset['WorkoutLabel'].value_counts()
percentages = value_counts / value_counts.sum() * 100

# Plot
ax = percentages.plot(kind='bar', color='skyblue')

# Add percentage text on each bar
for p in ax.patches:
    ax.annotate(f'{p.get_height():.1f}%', (p.get_x() + p.get_width() / 2., p.get_height()), 
                ha='center', va='center', fontsize=12, color='black', xytext=(0, 5), textcoords='offset points')

plt.title('Training Dataset WorkoutLabel Distribution (Percentage)')
plt.ylabel('Percentage')
plt.tight_layout()
plt.show()

# Preprocessing function - but don't convert label columns
def preprocess_data(dataframe, columns_to_flatten):
    final_df = dataframe.copy()
    
    # Expanding each column into 3 separate columns (x, y, z)
    for column in columns_to_flatten:
        # Convert string representations of arrays to actual arrays if needed
        if isinstance(dataframe[column].iloc[0], str):
            try:
                dataframe[column] = dataframe[column].apply(
                    lambda x: np.array(eval(x)) if isinstance(x, str) else x
                )
            except:
                print(f"Warning: Could not convert column {column} from string to array")
        
        # Now expand the arrays into separate columns
        try:
            expanded_df = pd.DataFrame(
                np.vstack(dataframe[column]).astype(float), 
                columns=[column+'_x', column+'_y', column+'_z'],
                index=dataframe.index
            )
            new_df = pd.concat([dataframe.drop(column, axis=1), expanded_df], axis=1)
            for new_column in new_df.columns:
                final_df[new_column] = new_df[new_column]
        except Exception as e:
            print(f"Error processing column {column}: {e}")
            print(f"Sample value: {dataframe[column].iloc[0]}")
            
    result_df = final_df.drop(columns=columns_to_flatten, axis=1)
    
    # Clean numeric columns only - skip label columns
    columns_to_skip = ['label', 'WorkoutLabel', 'muscle group']
    for col in result_df.columns:
        if col in columns_to_skip:
            continue
            
        if result_df[col].dtype == 'object':
            print(f"Converting column {col} from object type")
            try:
                # Try to convert string arrays to float
                if isinstance(result_df[col].iloc[0], str) and '[' in result_df[col].iloc[0]:
                    # This looks like a string representation of an array
                    result_df[col] = result_df[col].apply(
                        lambda x: float(eval(x)[0]) if isinstance(x, str) and '[' in x else x
                    )
                
                # General conversion to float
                result_df[col] = result_df[col].astype(float)
            except Exception as e:
                print(f"Could not convert column {col}: {e}")
                print(f"Sample value: {result_df[col].iloc[0]}")
                # As a last resort, drop problematic columns
                if "[" in str(result_df[col].iloc[0]):
                    print(f"Dropping column {col} as it contains array strings")
                    result_df = result_df.drop(columns=[col])
    
    return result_df

# Splits dataset into X, y
def return_X_y(dataframe, columns_to_delete):
    X = dataframe.drop(columns=columns_to_delete)
    y = dataframe['label']
    return X, y

# List of body keypoint features to preprocess
features_to_split = [
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip', 
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
]

# Process datasets
training_dataset_preprocessed = preprocess_data(training_dataset, features_to_split)
X_train, y_train = return_X_y(
    training_dataset_preprocessed, 
    ['label', 'muscle group', 'WorkoutLabel', 'image', 'Unnamed: 0']
)

testing_dataset_preprocessed = preprocess_data(testing_dataset, features_to_split)
X_test, y_test = return_X_y(
    testing_dataset_preprocessed, 
    ['label', 'muscle group', 'WorkoutLabel', 'image', 'Unnamed: 0']
)

validation_dataset_preprocessed = preprocess_data(validation_dataset, features_to_split)
X_validation, y_validation = return_X_y(
    validation_dataset_preprocessed, 
    ['label', 'muscle group', 'WorkoutLabel', 'image', 'Unnamed: 0']
)

# Convert any remaining object columns to float
for df in [X_train, X_test, X_validation]:
    for col in df.select_dtypes(include=['object']).columns:
        try:
            df[col] = df[col].astype(float)
        except:
            print(f"Dropping column {col} that can't be converted to float")
            df.drop(columns=[col], inplace=True)

# Apply SMOTE for class balancing
smote = SMOTE(random_state=42)
X_train_balanced, y_train_balanced = smote.fit_resample(X_train, y_train)
X_test_balanced, y_test_balanced = smote.fit_resample(X_test, y_test)
X_validation_balanced, y_validation_balanced = smote.fit_resample(X_validation, y_validation)

print("After SMOTE:")
print("X_train Shape", X_train_balanced.shape)
print("y_train Shape", y_train_balanced.shape)
print("X_test Shape", X_test_balanced.shape)
print("y_test Shape", y_test_balanced.shape)

# Scale features for better neural network performance
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_balanced)
X_test_scaled = scaler.transform(X_test_balanced)
X_validation_scaled = scaler.transform(X_validation_balanced)

# Save the scaler for future use
scaler_path = os.path.join(models_dir, "feature_scaler.pkl")
with open(scaler_path, 'wb') as f:
    pickle.dump(scaler, f)

# Create label encoder and encoding
from sklearn.preprocessing import LabelEncoder
label_encoder = LabelEncoder()
label_encoder.fit(y_train_balanced)

# Save the label encoder
encoder_path = os.path.join(models_dir, "label_encoder.pkl")
with open(encoder_path, 'wb') as f:
    pickle.dump(label_encoder, f)

# Encode labels
y_train_encoded = label_encoder.transform(y_train_balanced)
y_test_encoded = label_encoder.transform(y_test_balanced)
y_validation_encoded = label_encoder.transform(y_validation_balanced)

# PyTorch Dataset for workout data
class WorkoutDataset(Dataset):
    def __init__(self, features, labels, add_noise=False, noise_level=0.05):
        self.features = torch.FloatTensor(features)
        self.labels = torch.LongTensor(labels)
        self.add_noise = add_noise
        self.noise_level = noise_level
        
    def __len__(self):
        return len(self.labels)
    
    def __getitem__(self, idx):
        x = self.features[idx]
        
        # Add Gaussian noise during training for robustness
        if self.add_noise:
            noise = torch.randn_like(x) * self.noise_level
            x = x + noise
            
        return x, self.labels[idx]

# Create datasets (with higher noise for training)
train_dataset = WorkoutDataset(X_train_scaled, y_train_encoded, add_noise=True, noise_level=0.08)
test_dataset = WorkoutDataset(X_test_scaled, y_test_encoded)
val_dataset = WorkoutDataset(X_validation_scaled, y_validation_encoded)

# Create dataloaders
batch_size = 64
train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=batch_size)
val_loader = DataLoader(val_dataset, batch_size=batch_size)

# Define LSTM Model
class LSTMWorkoutClassifier(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, num_classes, dropout=0.2):
        super(LSTMWorkoutClassifier, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, 
                           batch_first=True, dropout=dropout if num_layers > 1 else 0)
        
        # Fully connected layers
        self.fc1 = nn.Linear(hidden_size, 128)
        self.dropout = nn.Dropout(dropout)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(128, num_classes)
        
    def forward(self, x):
        # Reshape input for LSTM - add time dimension (batch, time_steps, features)
        # For this non-sequential data, we treat each sample as having one time step
        x = x.unsqueeze(1)
        
        # Initialize hidden state
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        
        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # Get output from last time step
        out = out[:, -1, :]
        
        # Dense layers
        out = self.fc1(out)
        out = self.relu(out)
        out = self.dropout(out)
        out = self.fc2(out)
        
        return out

# Define model parameters
input_size = X_train_scaled.shape[1]  # Number of features
hidden_size = 128
num_layers = 2
num_classes = len(label_encoder.classes_)
dropout_rate = 0.3

# Initialize model
model = LSTMWorkoutClassifier(input_size, hidden_size, num_layers, num_classes, dropout_rate)
model = model.to(device)
print(model)

# Loss function and optimizer
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)  # Added weight decay for regularization
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5)

# Print model device info
print(f"Model is on device: {next(model.parameters()).device}")

# Training function with GPU memory optimization
def train_model(model, train_loader, val_loader, criterion, optimizer, scheduler, num_epochs=25):
    # Empty CUDA cache at the start of training
    if device.type == 'cuda':
        torch.cuda.empty_cache()
    train_losses = []
    val_losses = []
    val_accuracies = []
    
    # For early stopping
    best_val_loss = float('inf')
    patience = 10
    patience_counter = 0
    
    for epoch in range(num_epochs):
        # Training phase
        model.train()
        running_loss = 0.0
        for i, (inputs, labels) in enumerate(train_loader):
            inputs, labels = inputs.to(device), labels.to(device)
            
            # Zero the parameter gradients
            optimizer.zero_grad()
            
            # Forward pass
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            # Backward and optimize
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            
        epoch_train_loss = running_loss / len(train_loader.dataset)
        train_losses.append(epoch_train_loss)
        
        # Validation phase
        model.eval()
        running_loss = 0.0
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                running_loss += loss.item() * inputs.size(0)
                
                _, preds = torch.max(outputs, 1)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
        
        epoch_val_loss = running_loss / len(val_loader.dataset)
        val_losses.append(epoch_val_loss)
        
        # Calculate accuracy
        val_accuracy = accuracy_score(all_labels, all_preds)
        val_accuracies.append(val_accuracy)
        
        # Update learning rate
        scheduler.step(epoch_val_loss)
        
        # Print statistics
        print(f'Epoch {epoch+1}/{num_epochs}')
        print(f'Train Loss: {epoch_train_loss:.4f}, Val Loss: {epoch_val_loss:.4f}, Val Acc: {val_accuracy:.4f}')
        
        # Early stopping
        if epoch_val_loss < best_val_loss:
            best_val_loss = epoch_val_loss
            best_model_state = model.state_dict()
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f'Early stopping at epoch {epoch+1}')
                model.load_state_dict(best_model_state)  # Restore best model
                break
    
    # Plot training curves
    plt.figure(figsize=(10, 5))
    plt.subplot(1, 2, 1)
    plt.plot(train_losses, label='Train Loss')
    plt.plot(val_losses, label='Validation Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot(val_accuracies, label='Validation Accuracy')
    plt.xlabel('Epochs')
    plt.ylabel('Accuracy')
    plt.legend()
    
    plt.tight_layout()
    plt.show()
    
    return model

# Train the model
print("Starting model training...")
model = train_model(model, train_loader, val_loader, criterion, optimizer, scheduler, num_epochs=50)

# Save the model
model_path = os.path.join(models_dir, "lstm_workout_classifier.pth")
torch.save({
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'input_size': input_size,
    'hidden_size': hidden_size,
    'num_layers': num_layers,
    'num_classes': num_classes,
    'dropout_rate': dropout_rate
}, model_path)

print(f"Model saved to {model_path}")

# Evaluation function
def evaluate_model(model, data_loader, label_encoder):
    model.eval()
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for inputs, labels in data_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    # Convert indices back to original labels for reporting
    all_preds_decoded = label_encoder.inverse_transform(all_preds)
    all_labels_decoded = label_encoder.inverse_transform(all_labels)
    
    # Calculate metrics
    accuracy = accuracy_score(all_labels_decoded, all_preds_decoded)
    report = classification_report(all_labels_decoded, all_preds_decoded)
    conf_matrix = confusion_matrix(all_labels_decoded, all_preds_decoded)
    
    return accuracy, report, conf_matrix, all_preds_decoded, all_labels_decoded

# Evaluate on test set
print("\n===== Model Performance Evaluation =====")

# Make sure model is on correct device
if next(model.parameters()).device != device:
    model = model.to(device)
    print(f"Model moved to {device}")

test_accuracy, test_report, test_conf_matrix, test_preds, test_labels = evaluate_model(
    model, test_loader, label_encoder
)
print(f"Test Accuracy: {test_accuracy:.4f} ({test_accuracy*100:.2f}%)")
print("\nClassification Report (Test Data):")
print(test_report)

# Plot confusion matrix
plt.figure(figsize=(12, 10))
sns.heatmap(test_conf_matrix, annot=True, fmt='d', cmap='Blues', 
            xticklabels=label_encoder.classes_,
            yticklabels=label_encoder.classes_)
plt.xlabel('Predicted Labels')
plt.ylabel('True Labels')
plt.title('Confusion Matrix on Test Data')
plt.tight_layout()
plt.show()

# Evaluate on validation set
val_accuracy, val_report, val_conf_matrix, val_preds, val_labels = evaluate_model(
    model, val_loader, label_encoder
)
print(f"\nValidation Accuracy: {val_accuracy:.4f} ({val_accuracy*100:.2f}%)")
print("\nClassification Report (Validation Data):")
print(val_report)

# Plot confusion matrix for validation data
plt.figure(figsize=(12, 10))
sns.heatmap(val_conf_matrix, annot=True, fmt='d', cmap='Blues', 
            xticklabels=label_encoder.classes_,
            yticklabels=label_encoder.classes_)
plt.xlabel('Predicted Labels')
plt.ylabel('True Labels')
plt.title('Confusion Matrix on Validation Data')
plt.tight_layout()
plt.show()

# Function for making predictions on new data
def predict_workout(model, scaler, label_encoder, input_data):
    """
    Make predictions on new data
    
    Args:
        model: Trained LSTM model
        scaler: Fitted StandardScaler
        label_encoder: Fitted LabelEncoder
        input_data: Data for prediction (should be preprocessed)
        
    Returns:
        Predicted workout labels
    """
    model.eval()
    
    # Scale the input data
    input_scaled = scaler.transform(input_data)
    input_tensor = torch.FloatTensor(input_scaled).to(device)
    
    # Make prediction
    with torch.no_grad():
        outputs = model(input_tensor)
        _, preds = torch.max(outputs, 1)
    
    # Convert indices back to original labels
    predicted_labels = label_encoder.inverse_transform(preds.cpu().numpy())
    
    return predicted_labels

print("\n===== Model Evaluation Complete =====")
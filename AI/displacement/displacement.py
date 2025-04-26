# Import required libraries
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold
import tensorflow as tf
from tensorflow.keras import layers, Model, regularizers, callbacks
from tensorflow.keras.layers import Dense, LSTM, Dropout, Bidirectional, BatchNormalization, Input, Concatenate, Masking, TimeDistributed
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns
import os

# Configure GPU
print("GPU setup:")
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    try:
        # Currently, memory growth needs to be the same across GPUs
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        logical_gpus = tf.config.list_logical_devices('GPU')
        print(f"Found {len(gpus)} Physical GPUs, {len(logical_gpus)} Logical GPUs")
        print(f"Using GPU: {gpus[0].name}")
    except RuntimeError as e:
        print(e)
else:
    print("No GPU found, running on CPU")

# Set random seeds for reproducibility
tf.random.set_seed(42)
np.random.seed(42)

# Load the datasets
train_df = pd.read_csv('data/train_new.csv')
test_df = pd.read_csv('data/test_new.csv')

# Combine datasets for better data utilization and cross-validation
all_data = pd.concat([train_df, test_df], ignore_index=True)
print(f"Total samples: {len(all_data)}")

# Define joint columns (22 joints)
joint_columns = [
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
    'left_index', 'right_index', 'left_thumb', 'right_thumb',
    'left_hip', 'right_hip', 'left_knee', 'right_knee',
    'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
    'left_foot_index', 'right_foot_index'
]

# Examine class distribution
print("Class distribution:")
print(all_data['label'].value_counts().sort_index())

# Function to parse joint position strings
def parse_joint_positions(joint_str):
    try:
        values = joint_str.strip('[]').split()
        return [float(val) for val in values]
    except (AttributeError, ValueError):
        # Handle cases where the input is already a list
        return joint_str if isinstance(joint_str, list) else []

# Parse joint positions
for col in joint_columns:
    all_data[col] = all_data[col].apply(parse_joint_positions)

# Define parameters for sequence creation
MIN_SEQ_LENGTH = 15  # Minimum sequence length to consider
MAX_SEQ_LENGTH = 30  # Maximum sequence length (for padding)
STRIDE = 10          # For overlapping sequences (stride < MAX_SEQ_LENGTH creates overlap)

# Function to calculate joint angles (additional features)
def calculate_joint_angles(positions):
    """Calculate angles between joints to add biomechanically relevant features"""
    angles = []
    
    # Extract joint positions
    try:
        # Shoulder-elbow-wrist angles (both sides)
        left_shoulder = np.array(positions[0])
        right_shoulder = np.array(positions[1])
        left_elbow = np.array(positions[2])
        right_elbow = np.array(positions[3])
        left_wrist = np.array(positions[4])
        right_wrist = np.array(positions[5])
        
        # Hip-knee-ankle angles (both sides)
        left_hip = np.array(positions[12])
        right_hip = np.array(positions[13])
        left_knee = np.array(positions[14])
        right_knee = np.array(positions[15])
        left_ankle = np.array(positions[16])
        right_ankle = np.array(positions[17])
        
        # Calculate elbow angles
        # Left elbow angle
        v1 = left_shoulder - left_elbow
        v2 = left_wrist - left_elbow
        
        # Normalize vectors and calculate angle
        v1_norm = np.linalg.norm(v1)
        v2_norm = np.linalg.norm(v2)
        
        if v1_norm > 0 and v2_norm > 0:
            cos_angle = np.clip(np.dot(v1, v2) / (v1_norm * v2_norm), -1.0, 1.0)
            left_elbow_angle = np.arccos(cos_angle)
            angles.append(left_elbow_angle)
        else:
            angles.append(0)
            
        # Right elbow angle
        v1 = right_shoulder - right_elbow
        v2 = right_wrist - right_elbow
        
        v1_norm = np.linalg.norm(v1)
        v2_norm = np.linalg.norm(v2)
        
        if v1_norm > 0 and v2_norm > 0:
            cos_angle = np.clip(np.dot(v1, v2) / (v1_norm * v2_norm), -1.0, 1.0)
            right_elbow_angle = np.arccos(cos_angle)
            angles.append(right_elbow_angle)
        else:
            angles.append(0)
        
        # Calculate knee angles
        # Left knee angle
        v1 = left_hip - left_knee
        v2 = left_ankle - left_knee
        
        v1_norm = np.linalg.norm(v1)
        v2_norm = np.linalg.norm(v2)
        
        if v1_norm > 0 and v2_norm > 0:
            cos_angle = np.clip(np.dot(v1, v2) / (v1_norm * v2_norm), -1.0, 1.0)
            left_knee_angle = np.arccos(cos_angle)
            angles.append(left_knee_angle)
        else:
            angles.append(0)
            
        # Right knee angle
        v1 = right_hip - right_knee
        v2 = right_ankle - right_knee
        
        v1_norm = np.linalg.norm(v1)
        v2_norm = np.linalg.norm(v2)
        
        if v1_norm > 0 and v2_norm > 0:
            cos_angle = np.clip(np.dot(v1, v2) / (v1_norm * v2_norm), -1.0, 1.0)
            right_knee_angle = np.arccos(cos_angle)
            angles.append(right_knee_angle)
        else:
            angles.append(0)
        
        # Shoulder-hip-knee angles (for posture)
        # Left side
        v1 = left_shoulder - left_hip
        v2 = left_knee - left_hip
        
        v1_norm = np.linalg.norm(v1)
        v2_norm = np.linalg.norm(v2)
        
        if v1_norm > 0 and v2_norm > 0:
            cos_angle = np.clip(np.dot(v1, v2) / (v1_norm * v2_norm), -1.0, 1.0)
            left_posture_angle = np.arccos(cos_angle)
            angles.append(left_posture_angle)
        else:
            angles.append(0)
            
        # Right side
        v1 = right_shoulder - right_hip
        v2 = right_knee - right_hip
        
        v1_norm = np.linalg.norm(v1)
        v2_norm = np.linalg.norm(v2)
        
        if v1_norm > 0 and v2_norm > 0:
            cos_angle = np.clip(np.dot(v1, v2) / (v1_norm * v2_norm), -1.0, 1.0)
            right_posture_angle = np.arccos(cos_angle)
            angles.append(right_posture_angle)
        else:
            angles.append(0)
    
    except (IndexError, TypeError):
        # Handle missing joints
        for _ in range(6):  # Add zeros for all angles we try to calculate
            angles.append(0)
    
    return angles

# Function to normalize positions relative to hip center
def normalize_positions(joint_positions):
    """Normalize positions relative to hip center to make pose invariant to position"""
    try:
        positions_array = np.array(joint_positions)
        
        # Calculate hip center as average of left and right hip
        left_hip_idx = joint_columns.index('left_hip')
        right_hip_idx = joint_columns.index('right_hip')
        
        hip_center = (positions_array[left_hip_idx] + positions_array[right_hip_idx]) / 2
        
        # Normalize by subtracting hip center
        normalized_positions = []
        for pos in positions_array:
            normalized_positions.extend(pos - hip_center)
        
        return normalized_positions
    except (IndexError, ValueError, TypeError):
        # If can't normalize, return flattened joint positions
        return [item for sublist in joint_positions for item in sublist] if joint_positions else []

def add_noise(features, noise_level=0.03):
    """Add Gaussian noise to features for data augmentation"""
    return features + np.random.normal(0, noise_level, features.shape)

def add_joint_occlusions(sequence, occlusion_prob=0.05):
    """Simulate joint occlusions by zeroing out random joints"""
    seq_copy = sequence.copy()
    frames, features = seq_copy.shape
    joint_dim = 3  # Dimension of each joint (x,y,z)
    num_joints = min(22, features // joint_dim)  # Up to 22 joints
    
    # For each frame, randomly occlude some joints
    for f in range(frames):
        for j in range(num_joints):
            if np.random.random() < occlusion_prob:
                # Zero out the joint
                start_idx = j * joint_dim
                end_idx = start_idx + joint_dim
                if start_idx < features:  # Safety check
                    seq_copy[f, start_idx:min(end_idx, features)] = 0
    
    return seq_copy

def add_joint_bias(sequence, bias_prob=0.1, max_bias=0.05):
    """Add systematic bias to random joints (simulating sensor calibration error)"""
    seq_copy = sequence.copy()
    frames, features = seq_copy.shape
    joint_dim = 3
    num_joints = min(22, features // joint_dim)
    
    # Decide which joints will have bias
    biased_joints = []
    for j in range(num_joints):
        if np.random.random() < bias_prob:
            # This joint will have a systematic bias
            bias_vector = np.random.uniform(-max_bias, max_bias, joint_dim)
            biased_joints.append((j, bias_vector))
    
    # Apply the bias to all frames for selected joints
    for j, bias_vector in biased_joints:
        start_idx = j * joint_dim
        for d in range(joint_dim):
            if start_idx + d < features:  # Safety check
                seq_copy[:, start_idx + d] += bias_vector[d]
    
    return seq_copy

def drop_frames(sequence, drop_prob=0.05):
    """Randomly drop frames by setting them to zero"""
    seq_copy = sequence.copy()
    frames, _ = seq_copy.shape
    
    # Randomly select frames to drop
    for f in range(frames):
        if np.random.random() < drop_prob:
            seq_copy[f, :] = 0
    
    return seq_copy

def simulate_wrong_execution(sequence, label, num_classes=22):
    """Simulate a person performing an exercise incorrectly"""
    seq_copy = sequence.copy()
    frames, features = seq_copy.shape
    
    # Different types of execution errors:
    error_type = np.random.randint(0, 4)
    
    if error_type == 0:
        # Type 1: Reduced range of motion (scale down movements by random factor)
        scale = np.random.uniform(0.4, 0.7)  # Reduce motion by 30-60%
        center = np.mean(seq_copy, axis=0)
        seq_copy = center + scale * (seq_copy - center)
        
    elif error_type == 1:
        # Type 2: Introduce asymmetry (affect only left or right side)
        side = np.random.randint(0, 2)  # 0=left, 1=right
        if side == 0:  # Left side
            # Find left side joints and apply distortion
            for joint_name in ['left_shoulder', 'left_elbow', 'left_wrist', 
                              'left_hip', 'left_knee', 'left_ankle']:
                if joint_name in joint_columns:
                    idx = joint_columns.index(joint_name)
                    start_idx = idx * 3
                    # Apply random scaling to joint movement
                    scale = np.random.uniform(0.6, 1.4)
                    center = np.mean(seq_copy[:, start_idx:start_idx+3], axis=0)
                    seq_copy[:, start_idx:start_idx+3] = center + scale * (seq_copy[:, start_idx:start_idx+3] - center)
        else:  # Right side
            # Find right side joints and apply distortion
            for joint_name in ['right_shoulder', 'right_elbow', 'right_wrist', 
                              'right_hip', 'right_knee', 'right_ankle']:
                if joint_name in joint_columns:
                    idx = joint_columns.index(joint_name)
                    start_idx = idx * 3
                    # Apply random scaling to joint movement
                    scale = np.random.uniform(0.6, 1.4)
                    center = np.mean(seq_copy[:, start_idx:start_idx+3], axis=0)
                    seq_copy[:, start_idx:start_idx+3] = center + scale * (seq_copy[:, start_idx:start_idx+3] - center)
    
    elif error_type == 2:
        # Type 3: Introduce jerky movements by adding high frequency noise
        jitter_scale = np.random.uniform(0.05, 0.12)  # Increased jitter for wrong execution
        for f in range(1, frames):
            if seq_copy[f].sum() != 0:  # Only add jitter to non-zero frames
                jitter = np.random.normal(0, jitter_scale, features)
                seq_copy[f] += jitter
    
    else:
        # Type 4: Mix with another exercise (blend with another class)
        # Simulate as if person is transitioning between exercises incorrectly
        other_label = (label + np.random.randint(1, num_classes)) % num_classes
        blend_factor = np.random.uniform(0.2, 0.4)  # How much to blend
        
        # We're simulating a different exercise by adding systematic bias
        # to certain joint groups depending on exercise difference
        joint_groups = [
            ['left_shoulder', 'right_shoulder'],  # Upper body focus
            ['left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],  # Arm focus
            ['left_knee', 'right_knee', 'left_ankle', 'right_ankle'],  # Leg focus
            ['left_hip', 'right_hip']  # Core focus
        ]
        
        # Choose 1-2 joint groups to modify
        num_groups = np.random.randint(1, 3)
        group_indices = np.random.choice(len(joint_groups), num_groups, replace=False)
        
        for group_idx in group_indices:
            for joint_name in joint_groups[group_idx]:
                if joint_name in joint_columns:
                    idx = joint_columns.index(joint_name)
                    start_idx = idx * 3
                    # Add directional bias
                    bias = np.random.normal(0, 0.2, 3) * blend_factor
                    seq_copy[:, start_idx:start_idx+3] += bias
    
    return seq_copy

def add_enhanced_noise(sequence, label=None, num_classes=22):
    """
    Add various types of noise to a sequence to simulate real-world conditions
    Returns: noisy sequence
    """
    # Apply base noise (higher level than before)
    noisy_seq = sequence + np.random.normal(0, 0.03, sequence.shape)
    
    # Apply various noise types with some probability
    if np.random.random() < 0.35:  # 35% chance of joint occlusions
        noisy_seq = add_joint_occlusions(noisy_seq, occlusion_prob=0.05)
    
    if np.random.random() < 0.25:  # 25% chance of systematic bias
        noisy_seq = add_joint_bias(noisy_seq, bias_prob=0.1, max_bias=0.04)
    
    if np.random.random() < 0.2:  # 20% chance of dropped frames
        noisy_seq = drop_frames(noisy_seq, drop_prob=0.05)
    
    # 40% chance of simulating wrong exercise execution
    if np.random.random() < 0.4 and label is not None:
        noisy_seq = simulate_wrong_execution(noisy_seq, label, num_classes)
    
    return noisy_seq

def introduce_label_errors(labels, error_rate=0.03, num_classes=22):
    """Introduce random label errors at the specified rate"""
    labels_copy = labels.copy()
    num_samples = len(labels)
    num_errors = int(num_samples * error_rate)
    
    # Randomly select samples to mislabel
    error_indices = np.random.choice(num_samples, num_errors, replace=False)
    
    # For each selected sample, assign a random incorrect label
    for idx in error_indices:
        current_label = labels_copy[idx]
        possible_labels = [l for l in range(num_classes) if l != current_label]
        if possible_labels:  # Make sure we have alternative labels
            labels_copy[idx] = np.random.choice(possible_labels)
    
    return labels_copy

# Updated sequence processing function
def process_sequences(df, max_seq_len, min_seq_len, stride, joint_cols, augment=False):
    """
    Process dataframe into sequences with variable length, padding, and augmentation
    df: DataFrame with joint positions
    max_seq_len: Maximum sequence length (for padding)
    min_seq_len: Minimum sequence length to consider
    stride: Step size for creating sequences
    joint_cols: List of joint column names
    augment: Whether to add augmented examples
    """
    sequences = []
    labels = []
    
    # Group by exercise type to keep sequences within same exercise type
    for label, group in df.groupby('label'):
        group = group.reset_index(drop=True)
        
        # Create sequences with sliding window
        for start_idx in range(0, len(group) - min_seq_len + 1, stride):
            end_idx = min(start_idx + max_seq_len, len(group))
            
            # Skip if sequence is too short
            if end_idx - start_idx < min_seq_len:
                continue
                
            sequence = group.iloc[start_idx:end_idx]
            
            # Process frames in sequence
            seq_features = []
            for _, row in sequence.iterrows():
                # Get joint positions for this frame
                joint_positions = [row[joint] for joint in joint_cols]
                
                # Normalize positions
                normalized_positions = normalize_positions(joint_positions)
                
                if not normalized_positions:  # Skip frames with invalid data
                    continue
                
                # Calculate joint angles
                joint_angles = calculate_joint_angles(joint_positions)
                
                # Combine features
                frame_features = normalized_positions + joint_angles
                seq_features.append(frame_features)
            
            # Skip if no valid frames
            if not seq_features:
                continue
                
            # Convert to numpy array
            seq_features = np.array(seq_features)
            
            # Pad sequence if shorter than max_seq_len
            if len(seq_features) < max_seq_len:
                padding = np.zeros((max_seq_len - len(seq_features), seq_features.shape[1]))
                seq_features = np.vstack([seq_features, padding])
            
            sequences.append(seq_features)
            labels.append(label)
            
            # Add augmented examples with enhanced noise
            if augment:
                # Add basic noise (increased noise level)
                aug_features1 = add_noise(seq_features.copy(), noise_level=0.03)
                sequences.append(aug_features1)
                labels.append(label)
                
                # Add enhanced noise with multiple noise types
                aug_features2 = add_enhanced_noise(seq_features.copy(), label=label)
                sequences.append(aug_features2)
                labels.append(label)
                
                # Add more challenging wrong execution example
                aug_features3 = add_enhanced_noise(seq_features.copy(), label=label)
                sequences.append(aug_features3)
                # Decide whether to keep the correct label or mislabel it
                if np.random.random() < 0.5:  # 50% chance to mislabel "wrong execution" example
                    # Assign a nearby class for more realistic confusion
                    offset = np.random.choice([-2, -1, 1, 2])
                    new_label = (label + offset) % 22  # Wrap around to stay in range 0-21
                    labels.append(new_label)
                else:
                    labels.append(label)
                
                # Add time-reversed sequence for temporal augmentation
                if len(seq_features) >= min_seq_len:
                    reversed_features = seq_features.copy()[::-1]
                    # Also add some noise to reversed sequence
                    reversed_features = add_noise(reversed_features, noise_level=0.02)
                    sequences.append(reversed_features)
                    labels.append(label)
    
    # Convert to numpy arrays
    sequences = np.array(sequences)
    labels = np.array(labels)
    
    # Introduce a small percentage of label errors to simulate real-world conditions
    if augment:
        labels = introduce_label_errors(labels, error_rate=0.03)
    
    return sequences, labels

# Process all data
print("Processing sequences...")
X, y = process_sequences(all_data, MAX_SEQ_LENGTH, MIN_SEQ_LENGTH, STRIDE, joint_columns, augment=True)

# Get feature dimension
feature_dim = X.shape[2]
print(f"Created {len(X)} sequences with feature dimension: {feature_dim}")
print(f"Class distribution in processed data: {np.bincount(y)}")

# Apply stratified k-fold cross-validation
n_splits = 5
skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

# Attention layer for the model
class AttentionLayer(layers.Layer):
    def __init__(self, **kwargs):
        super(AttentionLayer, self).__init__(**kwargs)
        
    def build(self, input_shape):
        self.W = self.add_weight(name="att_weight", shape=(input_shape[-1], 1),
                                 initializer="normal")
        self.b = self.add_weight(name="att_bias", shape=(input_shape[1], 1),
                                 initializer="zeros")
        super(AttentionLayer, self).build(input_shape)
        
    def call(self, x):
        # Alignment scores. Shape: (batch_size, seq_len, 1)
        e = tf.nn.tanh(tf.matmul(x, self.W) + self.b)
        
        # Attention weights. Shape: (batch_size, seq_len, 1)
        a = tf.nn.softmax(e, axis=1)
        
        # Weighted sum. Shape: (batch_size, features)
        output = tf.reduce_sum(x * a, axis=1)
        
        return output

# Define the improved LSTM model - GPU optimized
def create_model(input_shape, num_classes=22):
    # Model inputs
    inputs = Input(shape=input_shape)
    
    # Masking layer to handle padded sequences
    x = Masking(mask_value=0.0)(inputs)
    
    # First Bidirectional LSTM layer - using CuDNNLSTM for GPU acceleration
    # Note: When using GPU, we use standard LSTM with recurrent_dropout=0
    # as CuDNNLSTM is automatically used by TF when on GPU
    x = Bidirectional(LSTM(128, return_sequences=True, 
                         recurrent_dropout=0,  # Set to 0 for GPU optimization
                         kernel_regularizer=regularizers.l2(2e-4)))(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)
    
    # Second Bidirectional LSTM layer
    x = Bidirectional(LSTM(128, return_sequences=True,
                         recurrent_dropout=0,  # Set to 0 for GPU optimization
                         kernel_regularizer=regularizers.l2(2e-4)))(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)
    
    # Attention mechanism
    x = AttentionLayer()(x)
    
    # Dense layers for classification
    x = Dense(128, activation='relu', kernel_regularizer=regularizers.l2(2e-4))(x)
    x = BatchNormalization()(x)
    x = Dropout(0.5)(x)  # Increased dropout for more regularization
    
    # Output layer
    outputs = Dense(num_classes, activation='softmax')(x)
    
    # Create model
    model = Model(inputs=inputs, outputs=outputs)
    
    return model

# Run cross-validation
for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
    print(f"\n---- Fold {fold+1}/{n_splits} ----")
    
    # Split data
    X_train, X_val = X[train_idx], X[val_idx]
    y_train, y_val = y[train_idx], y[val_idx]
    
    # Normalize the data (important for LSTM)
    # Compute mean and std on training data only
    mean = np.mean(X_train, axis=(0, 1), keepdims=True)
    std = np.std(X_train, axis=(0, 1), keepdims=True)
    std = np.where(std < 1e-6, 1e-6, std)  # Avoid division by zero
    
    # Apply normalization
    X_train = (X_train - mean) / std
    X_val = (X_val - mean) / std
    
    # Compute class weights to handle imbalance
    from sklearn.utils.class_weight import compute_class_weight
    class_weights = compute_class_weight(class_weight='balanced', 
                                         classes=np.unique(y_train), 
                                         y=y_train)
    class_weight_dict = {i: weight for i, weight in enumerate(class_weights)}
    
    # Create model
    model = create_model((MAX_SEQ_LENGTH, feature_dim))
    
    if fold == 0:
        model.summary()
    
    # Modified callbacks - no ModelCheckpoint for now to avoid file issues
    callbacks_list = [
        callbacks.EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True  # Keep weights in memory instead of saving to disk
        ),
        callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-6
        )
    ]
    
    # Removed mixed precision policy to simplify troubleshooting
    # Compile model with standard precision
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Train the model - simplified approach
    history = model.fit(
        X_train, y_train,
        epochs=50,
        batch_size=64,
        validation_data=(X_val, y_val),
        class_weight=class_weight_dict,
        callbacks=callbacks_list,
        verbose=1
    )
    
    # Evaluate on validation set
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    cv_scores.append(val_acc)
    
    # Make predictions
    y_pred = np.argmax(model.predict(X_val), axis=1)
    all_true_labels.extend(y_val)
    all_predictions.extend(y_pred)
    
    # Save history for later plotting
    fold_histories.append(history)
    
    # Manually save model to avoid file path issues
    try:
        model_path = f'model_fold_{fold+1}.h5'
        model.save(model_path)
        print(f"Model saved to {model_path}")
    except Exception as e:
        print(f"Warning: Could not save model: {str(e)}")
    
    print(f"Fold {fold+1} - Validation Accuracy: {val_acc:.4f}")

# Print cross-validation results
print(f"\nCross-Validation Results:")
for i, score in enumerate(cv_scores):
    print(f"Fold {i+1}: {score:.4f}")
print(f"Mean Accuracy: {np.mean(cv_scores):.4f} ± {np.std(cv_scores):.4f}")

# Overall confusion matrix
cm = confusion_matrix(all_true_labels, all_predictions)
plt.figure(figsize=(15, 15))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.xlabel('Predicted')
plt.ylabel('True')
plt.title('Confusion Matrix (Cross-Validation)')
plt.savefig('confusion_matrix_cv.png')
plt.show()

# Classification report
print("\nClassification Report:")
print(classification_report(all_true_labels, all_predictions))

# Plot learning curves for each fold
plt.figure(figsize=(20, 10))

# Plot accuracy
plt.subplot(1, 2, 1)
for i, history in enumerate(fold_histories):
    plt.plot(history.history['accuracy'], linestyle='--', alpha=0.5, label=f'Fold {i+1} Train')
    plt.plot(history.history['val_accuracy'], label=f'Fold {i+1} Val')

plt.title('Model Accuracy Across Folds')
plt.ylabel('Accuracy')
plt.xlabel('Epoch')
plt.legend()
plt.grid(True, linestyle='--', alpha=0.5)

# Plot loss
plt.subplot(1, 2, 2)
for i, history in enumerate(fold_histories):
    plt.plot(history.history['loss'], linestyle='--', alpha=0.5, label=f'Fold {i+1} Train')
    plt.plot(history.history['val_loss'], label=f'Fold {i+1} Val')

plt.title('Model Loss Across Folds')
plt.ylabel('Loss')
plt.xlabel('Epoch')
plt.legend()
plt.grid(True, linestyle='--', alpha=0.5)

plt.tight_layout()
plt.savefig('training_history_cv.png')
plt.show()

# Save the best model from CV - simplified approach to avoid file issues
best_fold = np.argmax(cv_scores)
try:
    best_model = tf.keras.models.load_model(f'model_fold_{best_fold+1}.h5', 
                                          custom_objects={'AttentionLayer': AttentionLayer})
    best_model.save('best_exercise_classifier.h5')
    print(f"Best model (from fold {best_fold+1}) saved to best_exercise_classifier.h5")
except Exception as e:
    print(f"Warning: Could not load/save best model: {str(e)}")

# Analyze performance by class
class_accuracies = []
for cls in range(22):  # Assuming 22 classes
    cls_indices = [i for i, label in enumerate(all_true_labels) if label == cls]
    if cls_indices:  # Check if we have examples for this class
        cls_preds = [all_predictions[i] for i in cls_indices]
        cls_true = [all_true_labels[i] for i in cls_indices]
        cls_acc = sum(1 for p, t in zip(cls_preds, cls_true) if p == t) / len(cls_indices)
        class_accuracies.append((cls, cls_acc, len(cls_indices)))
    else:
        class_accuracies.append((cls, 0, 0))

# Sort by accuracy
class_accuracies.sort(key=lambda x: x[1], reverse=True)

# Plot class accuracies
plt.figure(figsize=(12, 8))
classes = [f"Class {cls}" for cls, _, _ in class_accuracies]
accuracies = [acc for _, acc, _ in class_accuracies]
counts = [count for _, _, count in class_accuracies]

plt.bar(classes, accuracies, alpha=0.7)
plt.axhline(y=np.mean(cv_scores), color='r', linestyle='--', label=f"Mean Accuracy: {np.mean(cv_scores):.2f}")
plt.xticks(rotation=45, ha='right')
plt.xlabel('Exercise Class')
plt.ylabel('Accuracy')
plt.title('Accuracy by Exercise Class')
plt.tight_layout()
plt.savefig('class_accuracies.png')
plt.show()

# Final summary
print(f"\nFinal Model Summary:")
print(f"Number of training sequences: {len(X)}")
print(f"Feature dimension: {feature_dim}")
print(f"Cross-validation accuracy: {np.mean(cv_scores):.4f} ± {np.std(cv_scores):.4f}")
print("Model saved to 'best_exercise_classifier.h5'")
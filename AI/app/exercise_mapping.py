"""
Exercise class mapping for workout classification model.
Maps numerical class IDs (0-21) to human-readable exercise names.
"""

EXERCISE_MAPPING = {
    0: "Squat",
    1: "Deadlift",
    2: "Bench Press",
    3: "Push-up",
    4: "Pull-up",
    5: "Overhead Press",
    6: "Bicep Curl",
    7: "Tricep Extension",
    8: "Lateral Raise",
    9: "Front Raise",
    10: "Shoulder Press",
    11: "Lunge",
    12: "Calf Raise",
    13: "Leg Press", 
    14: "Leg Extension",
    15: "Leg Curl",
    16: "Plank",
    17: "Sit-up",
    18: "Crunch",
    19: "Russian Twist",
    20: "Mountain Climber",
    21: "Burpee"
}

def get_exercise_name(class_id):
    """Get the exercise name for a given class ID"""
    return EXERCISE_MAPPING.get(class_id, f"Unknown Exercise ({class_id})") 
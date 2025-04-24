def add_workout_label_back(example):
    # print("example is",example)
    workout_int = example
    workout_label = None

    if workout_int == 0: # barbell bicep curl
        workout_label = "barbell bicep curl"
    
    elif workout_int == 1: # bench press
        workout_label =    "bench press"
        
    elif workout_int == 2: # chest fly machine
        workout_label =  "chest fly machine"

    elif workout_int == 3: # deadlift
        workout_label = "deadlift"

    elif workout_int == 4: # decline bench press
        workout_label =  "decline bench press"

    elif workout_int == 5: # hammer curl
        workout_label = "hammer curl"

    elif workout_int == 6: # hip thrust
        workout_label =  "hip thrust"

    elif workout_int == 7: # incline bench press
        workout_label = "incline bench press"

    elif workout_int == 8: # lat pulldown
        workout_label = "lat pulldown"

    elif workout_int == 9: # lateral raises
        workout_label = "lateral raises"
    
    elif workout_int == 10: # leg extensions
        workout_label = "leg extensions"

    elif workout_int == 11: # leg raises
        workout_label = "leg raises"

    elif workout_int == 12: # plank
        workout_label = "plank"

    elif workout_int == 13: # pull up
        workout_label = "pull up"

    elif workout_int == 14: # push ups
        workout_label = "push ups"

    elif workout_int == 15: # romanian deadlift
        workout_label = "romanian deadlift"
    
    elif workout_int == 16: # russian twist
        workout_label = "russian twist"

    elif workout_int == 17: # shoulder press
        workout_label = "shoulder press"

    elif workout_int == 18: # squat
        workout_label = "squat"

    elif workout_int == 19: # t bar row
        workout_label = "t bar row"

    elif workout_int == 20: # tricep dips
        workout_label = "tricep dips"

    elif workout_int == 21: # tricep pushdown
        workout_label = "tricep pushdown"

    # print(" single one is workout label is",workout_label)
    return workout_label


def add_muscle_groups_label(example):

    workout = example
    muscle_group = None

    if workout == 0: # barbell bicep curl
        muscle_group = 'bicep' # bicep
    
    elif workout == 1: # bench press
        muscle_group = 'chest' # chest
        
    elif workout == 2: # chest fly machine
        muscle_group = 'chest' # chest

    elif workout == 3: # deadlift
        muscle_group = 'back' # back

    elif workout == 4: # decline bench press
        muscle_group = 'bicep' # biceps

    elif workout == 5: # hammer curl
        muscle_group = 'bicep' # bicep

    elif workout == 6: # hip thrust
        muscle_group = 'legs' # legs

    elif workout == 7: # incline bench press
        muscle_group = 'chest' # chest

    elif workout == 8: # lat pulldown
        muscle_group = 'back' # back

    elif workout == 9: # lateral raises
        muscle_group =  'shoulders' # shoulders
    
    elif workout == 10: # leg extensions
        muscle_group = 'legs' # legs

    elif workout == 11: # leg raises
        muscle_group = 'core' # core

    elif workout == 12: # plank
        muscle_group = 'core' # core

    elif workout == 13: # pull up
        muscle_group = 'back' # back

    elif workout == 14: # push ups
        muscle_group = 'chest' # chest

    elif workout == 15: # romanian deadlift
        muscle_group = 'legs' # legs
    
    elif workout == 16: # russian twist
        muscle_group = 'core' # core

    elif workout == 17: # shoulder press
        muscle_group = 'shoulders' # shoulder

    elif workout == 18: # squat
        muscle_group = 'legs' # glutes

    elif workout == 19: # t bar row
        muscle_group = 'back' # back

    elif workout == 20: # tricep dips
        muscle_group = 'tricep' # tricep

    elif workout == 21: # tricep pushdown
        muscle_group = 'tricep' #tricep

    return muscle_group
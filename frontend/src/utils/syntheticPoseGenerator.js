/**
 * Synthetic Pose Data Generator
 * Generates realistic pose landmark coordinates for demonstrations
 * without requiring a real camera or MediaPipe
 */

/**
 * Generate a plank pose with optional form errors
 * @param {number} frame - Current animation frame
 * @param {boolean} withErrors - Whether to include form errors for demo
 * @returns {Array} Array of 33 landmark objects with x, y, z coordinates
 */
export const generatePlankPose = (frame, withErrors = true) => {
  const time = frame * 0.05; // Time factor for animations

  // Subtle breathing movement
  const breathe = Math.sin(time * 2) * 0.008;

  // Hip sag (form error) - oscillates to show correction
  const hipSag = withErrors ? Math.sin(time * 0.5) * 0.08 : 0;

  // Slight natural body sway
  const sway = Math.sin(time * 1.5) * 0.01;

  // Base plank position (side view, facing right)
  const landmarks = new Array(33);

  // Head (0-10) - nose, eyes, ears, mouth
  landmarks[0] = { x: 0.30 + sway, y: 0.25 + breathe, z: 0 }; // nose
  landmarks[1] = { x: 0.28 + sway, y: 0.24 + breathe, z: 0.01 }; // left eye inner
  landmarks[2] = { x: 0.27 + sway, y: 0.24 + breathe, z: 0.01 }; // left eye
  landmarks[3] = { x: 0.26 + sway, y: 0.24 + breathe, z: 0.01 }; // left eye outer
  landmarks[4] = { x: 0.32 + sway, y: 0.24 + breathe, z: -0.01 }; // right eye inner
  landmarks[5] = { x: 0.33 + sway, y: 0.24 + breathe, z: -0.01 }; // right eye
  landmarks[6] = { x: 0.34 + sway, y: 0.24 + breathe, z: -0.01 }; // right eye outer
  landmarks[7] = { x: 0.25 + sway, y: 0.25 + breathe, z: 0.02 }; // left ear
  landmarks[8] = { x: 0.35 + sway, y: 0.25 + breathe, z: -0.02 }; // right ear
  landmarks[9] = { x: 0.28 + sway, y: 0.27 + breathe, z: 0 }; // mouth left
  landmarks[10] = { x: 0.32 + sway, y: 0.27 + breathe, z: 0 }; // mouth right

  // Shoulders (11-12)
  landmarks[11] = { x: 0.28 + sway, y: 0.32 + breathe, z: 0.02 }; // left shoulder
  landmarks[12] = { x: 0.32 + sway, y: 0.32 + breathe, z: -0.02 }; // right shoulder

  // Elbows (13-14) - bent at 90 degrees for forearm plank
  landmarks[13] = { x: 0.20 + sway, y: 0.40 + breathe, z: 0.02 }; // left elbow
  landmarks[14] = { x: 0.24 + sway, y: 0.40 + breathe, z: -0.02 }; // right elbow

  // Wrists (15-16) - on the ground
  landmarks[15] = { x: 0.12 + sway, y: 0.48 + breathe * 0.5, z: 0.02 }; // left wrist
  landmarks[16] = { x: 0.16 + sway, y: 0.48 + breathe * 0.5, z: -0.02 }; // right wrist

  // Hands (17-22) - pinky, index, thumb
  landmarks[17] = { x: 0.10 + sway, y: 0.49, z: 0.02 }; // left pinky
  landmarks[18] = { x: 0.14 + sway, y: 0.49, z: -0.02 }; // right pinky
  landmarks[19] = { x: 0.11 + sway, y: 0.48, z: 0.03 }; // left index
  landmarks[20] = { x: 0.15 + sway, y: 0.48, z: -0.03 }; // right index
  landmarks[21] = { x: 0.13 + sway, y: 0.47, z: 0.03 }; // left thumb
  landmarks[22] = { x: 0.17 + sway, y: 0.47, z: -0.03 }; // right thumb

  // Hips (23-24) - with intentional sag for demo
  landmarks[23] = { x: 0.58 + sway, y: 0.42 + breathe + hipSag, z: 0.03 }; // left hip
  landmarks[24] = { x: 0.62 + sway, y: 0.42 + breathe + hipSag, z: -0.03 }; // right hip

  // Knees (25-26) - slightly bent or straight
  landmarks[25] = { x: 0.68 + sway, y: 0.48 + breathe + hipSag * 0.5, z: 0.03 }; // left knee
  landmarks[26] = { x: 0.72 + sway, y: 0.48 + breathe + hipSag * 0.5, z: -0.03 }; // right knee

  // Ankles (27-28)
  landmarks[27] = { x: 0.78 + sway, y: 0.52 + breathe + hipSag * 0.3, z: 0.03 }; // left ankle
  landmarks[28] = { x: 0.82 + sway, y: 0.52 + breathe + hipSag * 0.3, z: -0.03 }; // right ankle

  // Feet (29-32) - heel and foot index
  landmarks[29] = { x: 0.76 + sway, y: 0.54, z: 0.02 }; // left heel
  landmarks[30] = { x: 0.80 + sway, y: 0.54, z: -0.02 }; // right heel
  landmarks[31] = { x: 0.80 + sway, y: 0.53, z: 0.04 }; // left foot index
  landmarks[32] = { x: 0.84 + sway, y: 0.53, z: -0.04 }; // right foot index

  return landmarks;
};

/**
 * Generate a push-up pose with animation cycle
 * @param {number} frame - Current animation frame
 * @returns {Array} Array of 33 landmark objects
 */
export const generatePushUpPose = (frame) => {
  const time = frame * 0.03;

  // Push-up cycle: 0 = up, 1 = down
  const cycle = (Math.sin(time) + 1) / 2;

  // Vertical offset based on push-up phase
  const yOffset = cycle * 0.15; // Move down 15% of canvas height

  // Elbow bend angle affects arm position
  const elbowBend = cycle * 0.08;

  // Similar to plank but with vertical movement
  const landmarks = new Array(33);

  // Head
  landmarks[0] = { x: 0.30, y: 0.20 + yOffset, z: 0 };
  landmarks[1] = { x: 0.28, y: 0.19 + yOffset, z: 0.01 };
  landmarks[2] = { x: 0.27, y: 0.19 + yOffset, z: 0.01 };
  landmarks[3] = { x: 0.26, y: 0.19 + yOffset, z: 0.01 };
  landmarks[4] = { x: 0.32, y: 0.19 + yOffset, z: -0.01 };
  landmarks[5] = { x: 0.33, y: 0.19 + yOffset, z: -0.01 };
  landmarks[6] = { x: 0.34, y: 0.19 + yOffset, z: -0.01 };
  landmarks[7] = { x: 0.25, y: 0.20 + yOffset, z: 0.02 };
  landmarks[8] = { x: 0.35, y: 0.20 + yOffset, z: -0.02 };
  landmarks[9] = { x: 0.28, y: 0.22 + yOffset, z: 0 };
  landmarks[10] = { x: 0.32, y: 0.22 + yOffset, z: 0 };

  // Shoulders
  landmarks[11] = { x: 0.28, y: 0.27 + yOffset, z: 0.02 };
  landmarks[12] = { x: 0.32, y: 0.27 + yOffset, z: -0.02 };

  // Elbows - bend more when going down
  landmarks[13] = { x: 0.20 - elbowBend, y: 0.35 + yOffset + elbowBend, z: 0.02 };
  landmarks[14] = { x: 0.24 + elbowBend, y: 0.35 + yOffset + elbowBend, z: -0.02 };

  // Wrists
  landmarks[15] = { x: 0.12, y: 0.43 + yOffset, z: 0.02 };
  landmarks[16] = { x: 0.16, y: 0.43 + yOffset, z: -0.02 };

  // Hands
  landmarks[17] = { x: 0.10, y: 0.44 + yOffset, z: 0.02 };
  landmarks[18] = { x: 0.14, y: 0.44 + yOffset, z: -0.02 };
  landmarks[19] = { x: 0.11, y: 0.43 + yOffset, z: 0.03 };
  landmarks[20] = { x: 0.15, y: 0.43 + yOffset, z: -0.03 };
  landmarks[21] = { x: 0.13, y: 0.42 + yOffset, z: 0.03 };
  landmarks[22] = { x: 0.17, y: 0.42 + yOffset, z: -0.03 };

  // Hips - move with body
  landmarks[23] = { x: 0.58, y: 0.37 + yOffset, z: 0.03 };
  landmarks[24] = { x: 0.62, y: 0.37 + yOffset, z: -0.03 };

  // Knees
  landmarks[25] = { x: 0.68, y: 0.43 + yOffset, z: 0.03 };
  landmarks[26] = { x: 0.72, y: 0.43 + yOffset, z: -0.03 };

  // Ankles
  landmarks[27] = { x: 0.78, y: 0.47 + yOffset, z: 0.03 };
  landmarks[28] = { x: 0.82, y: 0.47 + yOffset, z: -0.03 };

  // Feet
  landmarks[29] = { x: 0.76, y: 0.49 + yOffset, z: 0.02 };
  landmarks[30] = { x: 0.80, y: 0.49 + yOffset, z: -0.02 };
  landmarks[31] = { x: 0.80, y: 0.48 + yOffset, z: 0.04 };
  landmarks[32] = { x: 0.84, y: 0.48 + yOffset, z: -0.04 };

  return landmarks;
};

/**
 * Generate a shoulder press pose with animation cycle
 * Focused on upper body with intentional form errors
 * @param {number} frame - Current animation frame
 * @param {boolean} withErrors - Whether to include form errors for demo
 * @returns {Array} Array of 33 landmark objects
 */
export const generateShoulderPressPose = (frame, withErrors = true) => {
  const time = frame * 0.01; // Slower movement (was 0.02)

  // Shoulder press cycle: 0 = down (shoulders), 1 = up (overhead)
  const cycle = (Math.sin(time) + 1) / 2;

  // Arms move from shoulder level to overhead
  const armRaise = cycle * 0.35; // Raise arms more for visibility

  // FORM ERRORS - intentional mistakes for AI to correct
  const elbowFlare = withErrors ? Math.sin(time * 1.2) * 0.08 : 0; // Elbows flaring out (BAD!)
  const uneven = withErrors ? Math.sin(time * 0.8) * 0.04 : 0; // Uneven arms (BAD!)
  const headForward = withErrors ? cycle * 0.03 : 0; // Head jutting forward (BAD!)

  const landmarks = new Array(33);

  // Scale and center the skeleton - make it smaller and centered
  const scale = 0.6; // Make skeleton 60% of original size
  const centerX = 0.50;
  const centerY = 0.50;

  // Head - scaled and centered with forward lean error
  landmarks[0] = { x: centerX + (0.00 + headForward) * scale, y: centerY + (-0.35) * scale, z: 0 }; // nose
  landmarks[1] = { x: centerX + (-0.02 + headForward) * scale, y: centerY + (-0.36) * scale, z: 0.01 }; // left eye inner
  landmarks[2] = { x: centerX + (-0.03 + headForward) * scale, y: centerY + (-0.36) * scale, z: 0.01 }; // left eye
  landmarks[3] = { x: centerX + (-0.04 + headForward) * scale, y: centerY + (-0.36) * scale, z: 0.01 }; // left eye outer
  landmarks[4] = { x: centerX + (0.02 + headForward) * scale, y: centerY + (-0.36) * scale, z: -0.01 }; // right eye inner
  landmarks[5] = { x: centerX + (0.03 + headForward) * scale, y: centerY + (-0.36) * scale, z: -0.01 }; // right eye
  landmarks[6] = { x: centerX + (0.04 + headForward) * scale, y: centerY + (-0.36) * scale, z: -0.01 }; // right eye outer
  landmarks[7] = { x: centerX + (-0.05 + headForward) * scale, y: centerY + (-0.35) * scale, z: 0.02 }; // left ear
  landmarks[8] = { x: centerX + (0.05 + headForward) * scale, y: centerY + (-0.35) * scale, z: -0.02 }; // right ear
  landmarks[9] = { x: centerX + (-0.02 + headForward) * scale, y: centerY + (-0.33) * scale, z: 0 }; // mouth left
  landmarks[10] = { x: centerX + (0.02 + headForward) * scale, y: centerY + (-0.33) * scale, z: 0 }; // mouth right

  // Shoulders - scaled
  landmarks[11] = { x: centerX + (-0.15) * scale, y: centerY + (-0.20) * scale, z: 0.03 }; // left shoulder
  landmarks[12] = { x: centerX + (0.15) * scale, y: centerY + (-0.20) * scale, z: -0.03 }; // right shoulder

  // Elbows - with flaring error and uneven heights
  landmarks[13] = {
    x: centerX + (-0.25 + cycle * 0.05 - elbowFlare) * scale,
    y: centerY + (-0.08 - armRaise + uneven) * scale,
    z: 0.04
  };
  landmarks[14] = {
    x: centerX + (0.25 - cycle * 0.05 + elbowFlare) * scale,
    y: centerY + (-0.08 - armRaise - uneven) * scale,
    z: -0.04
  };

  // Wrists - follow elbows with errors
  landmarks[15] = {
    x: centerX + (-0.20 + cycle * 0.12 - elbowFlare * 0.5) * scale,
    y: centerY + (-0.30 - armRaise + uneven) * scale,
    z: 0.03
  };
  landmarks[16] = {
    x: centerX + (0.20 - cycle * 0.12 + elbowFlare * 0.5) * scale,
    y: centerY + (-0.30 - armRaise - uneven) * scale,
    z: -0.03
  };

  // Hands - follow wrists
  landmarks[17] = { x: centerX + (-0.22 + cycle * 0.12 - elbowFlare * 0.5) * scale, y: centerY + (-0.32 - armRaise + uneven) * scale, z: 0.03 };
  landmarks[18] = { x: centerX + (0.22 - cycle * 0.12 + elbowFlare * 0.5) * scale, y: centerY + (-0.32 - armRaise - uneven) * scale, z: -0.03 };
  landmarks[19] = { x: centerX + (-0.21 + cycle * 0.12 - elbowFlare * 0.5) * scale, y: centerY + (-0.33 - armRaise + uneven) * scale, z: 0.04 };
  landmarks[20] = { x: centerX + (0.21 - cycle * 0.12 + elbowFlare * 0.5) * scale, y: centerY + (-0.33 - armRaise - uneven) * scale, z: -0.04 };
  landmarks[21] = { x: centerX + (-0.19 + cycle * 0.12 - elbowFlare * 0.5) * scale, y: centerY + (-0.34 - armRaise + uneven) * scale, z: 0.04 };
  landmarks[22] = { x: centerX + (0.19 - cycle * 0.12 + elbowFlare * 0.5) * scale, y: centerY + (-0.34 - armRaise - uneven) * scale, z: -0.04 };

  // Hips - visible at bottom edge (torso visible)
  landmarks[23] = { x: centerX + (-0.08) * scale, y: centerY + (0.15) * scale, z: 0.02 };
  landmarks[24] = { x: centerX + (0.08) * scale, y: centerY + (0.15) * scale, z: -0.02 };

  // Knees - just off screen
  landmarks[25] = { x: 0.41, y: 1.05, z: 0.02 };
  landmarks[26] = { x: 0.59, y: 1.05, z: -0.02 };

  // Ankles - off screen
  landmarks[27] = { x: 0.40, y: 1.25, z: 0.01 };
  landmarks[28] = { x: 0.60, y: 1.25, z: -0.01 };

  // Feet - off screen
  landmarks[29] = { x: 0.38, y: 1.35, z: 0.01 };
  landmarks[30] = { x: 0.62, y: 1.35, z: -0.01 };
  landmarks[31] = { x: 0.41, y: 1.34, z: 0.02 };
  landmarks[32] = { x: 0.61, y: 1.34, z: -0.02 };

  return landmarks;
};

/**
 * Generate a squat pose with animation cycle
 * @param {number} frame - Current animation frame
 * @returns {Array} Array of 33 landmark objects
 */
export const generateSquatPose = (frame) => {
  const time = frame * 0.02;

  // Squat cycle: 0 = standing, 1 = deep squat
  const depth = (Math.sin(time) + 1) / 2;

  // Hip and knee bend based on squat depth
  const hipDrop = depth * 0.20; // Hips drop 20% of canvas height
  const kneeForward = depth * 0.08; // Knees move forward

  const landmarks = new Array(33);

  // Head - stays relatively stable
  landmarks[0] = { x: 0.50, y: 0.15 + hipDrop * 0.3, z: 0 };
  landmarks[1] = { x: 0.48, y: 0.14 + hipDrop * 0.3, z: 0.01 };
  landmarks[2] = { x: 0.47, y: 0.14 + hipDrop * 0.3, z: 0.01 };
  landmarks[3] = { x: 0.46, y: 0.14 + hipDrop * 0.3, z: 0.01 };
  landmarks[4] = { x: 0.52, y: 0.14 + hipDrop * 0.3, z: -0.01 };
  landmarks[5] = { x: 0.53, y: 0.14 + hipDrop * 0.3, z: -0.01 };
  landmarks[6] = { x: 0.54, y: 0.14 + hipDrop * 0.3, z: -0.01 };
  landmarks[7] = { x: 0.45, y: 0.15 + hipDrop * 0.3, z: 0.02 };
  landmarks[8] = { x: 0.55, y: 0.15 + hipDrop * 0.3, z: -0.02 };
  landmarks[9] = { x: 0.48, y: 0.17 + hipDrop * 0.3, z: 0 };
  landmarks[10] = { x: 0.52, y: 0.17 + hipDrop * 0.3, z: 0 };

  // Shoulders
  landmarks[11] = { x: 0.42, y: 0.25 + hipDrop * 0.4, z: 0.03 };
  landmarks[12] = { x: 0.58, y: 0.25 + hipDrop * 0.4, z: -0.03 };

  // Elbows - arms forward during squat
  landmarks[13] = { x: 0.38 + depth * 0.05, y: 0.35 + hipDrop * 0.5, z: 0.05 };
  landmarks[14] = { x: 0.62 - depth * 0.05, y: 0.35 + hipDrop * 0.5, z: -0.05 };

  // Wrists
  landmarks[15] = { x: 0.35 + depth * 0.08, y: 0.40 + hipDrop * 0.6, z: 0.06 };
  landmarks[16] = { x: 0.65 - depth * 0.08, y: 0.40 + hipDrop * 0.6, z: -0.06 };

  // Hands
  landmarks[17] = { x: 0.33 + depth * 0.08, y: 0.41 + hipDrop * 0.6, z: 0.06 };
  landmarks[18] = { x: 0.67 - depth * 0.08, y: 0.41 + hipDrop * 0.6, z: -0.06 };
  landmarks[19] = { x: 0.34 + depth * 0.08, y: 0.40 + hipDrop * 0.6, z: 0.07 };
  landmarks[20] = { x: 0.66 - depth * 0.08, y: 0.40 + hipDrop * 0.6, z: -0.07 };
  landmarks[21] = { x: 0.36 + depth * 0.08, y: 0.39 + hipDrop * 0.6, z: 0.07 };
  landmarks[22] = { x: 0.64 - depth * 0.08, y: 0.39 + hipDrop * 0.6, z: -0.07 };

  // Hips - drop significantly
  landmarks[23] = { x: 0.42, y: 0.45 + hipDrop, z: 0.02 };
  landmarks[24] = { x: 0.58, y: 0.45 + hipDrop, z: -0.02 };

  // Knees - bend and move forward
  landmarks[25] = { x: 0.40 + kneeForward, y: 0.65 + hipDrop * 0.5, z: 0.05 };
  landmarks[26] = { x: 0.60 - kneeForward, y: 0.65 + hipDrop * 0.5, z: -0.05 };

  // Ankles
  landmarks[27] = { x: 0.42, y: 0.85, z: 0.02 };
  landmarks[28] = { x: 0.58, y: 0.85, z: -0.02 };

  // Feet
  landmarks[29] = { x: 0.40, y: 0.88, z: 0.01 };
  landmarks[30] = { x: 0.56, y: 0.88, z: -0.01 };
  landmarks[31] = { x: 0.43, y: 0.87, z: 0.03 };
  landmarks[32] = { x: 0.59, y: 0.87, z: -0.03 };

  return landmarks;
};

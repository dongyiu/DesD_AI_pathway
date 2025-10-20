import React from 'react';
import { AnimatePresence } from 'framer-motion';
import MobileHeader from './MobileHeader';
import MobileStatsDrawer from './MobileStatsDrawer';
import MobileWorkoutModal from './MobileWorkoutModal';
import MobileMenuModal from './MobileMenuModal';

/**
 * Mobile Layout Component
 * Main layout wrapper for mobile devices
 * Displays fullscreen camera with overlays
 */
const MobileLayout = ({
  // Workout data
  currentWorkout,
  predictedWorkout,
  predictionConfidence,
  predictionThreshold,
  predictedMuscleGroup,
  muscleGroupConfidence,
  workoutMap,
  muscleGroupMap,

  // Connection & Status
  connectionStatus,
  isGuestMode,
  sessionDuration,
  receivedCount,
  feedbackLatency,
  pendingUpdates,

  // Refs
  webcamRef,
  canvasRef,

  // UI State
  showMobileMenu,
  setShowMobileMenu,
  showWorkoutModal,
  setShowWorkoutModal,
  isDrawerOpen,
  setIsDrawerOpen,

  // Settings
  isDarkMode,
  toggleDarkMode,
  showMuscleVisualizer,
  toggleMuscleVisualizer,

  // Actions
  handleWorkoutChange,
  forceUpdateUsageStats,

  // User
  user,
  handleLogout,

  // Notifications
  notifications,
  removeNotification,
  CustomNotification
}) => {
  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader
        currentWorkout={currentWorkout}
        workoutMap={workoutMap}
        connectionStatus={connectionStatus}
        isGuestMode={isGuestMode}
        onWorkoutSelect={() => setShowWorkoutModal(true)}
        onMenuOpen={() => setShowMobileMenu(true)}
      />

      {/* Camera View (full screen) */}
      <div className="flex-1 relative mt-[56px]"> {/* Account for header height */}
        <video
          ref={webcamRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          autoPlay
          muted
          playsInline
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Notifications (bottom, above drawer) */}
        <AnimatePresence>
          {notifications.length > 0 && (
            <div className="absolute bottom-24 left-4 right-4 z-30 space-y-2">
              {notifications.map(notification => (
                <CustomNotification
                  key={notification.id}
                  type={notification.type}
                  message={notification.message}
                  onClose={() => removeNotification(notification.id)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Stats Drawer */}
      <MobileStatsDrawer
        isOpen={isDrawerOpen}
        onToggle={setIsDrawerOpen}
        sessionDuration={sessionDuration}
        receivedCount={receivedCount}
        currentWorkout={currentWorkout}
        predictedWorkout={predictedWorkout}
        predictionConfidence={predictionConfidence}
        predictionThreshold={predictionThreshold}
        predictedMuscleGroup={predictedMuscleGroup}
        muscleGroupConfidence={muscleGroupConfidence}
        feedbackLatency={feedbackLatency}
        onForceUpdate={forceUpdateUsageStats}
        pendingUpdates={pendingUpdates}
        workoutMap={workoutMap}
        muscleGroupMap={muscleGroupMap}
      />

      {/* Modals */}
      <MobileWorkoutModal
        isOpen={showWorkoutModal}
        currentWorkout={currentWorkout}
        onSelect={handleWorkoutChange}
        onClose={() => setShowWorkoutModal(false)}
        isDarkMode={isDarkMode}
        workoutMap={workoutMap}
      />

      <MobileMenuModal
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        showMuscleVisualizer={showMuscleVisualizer}
        toggleMuscleVisualizer={toggleMuscleVisualizer}
        user={user}
        handleLogout={handleLogout}
      />
    </div>
  );
};

export default MobileLayout;

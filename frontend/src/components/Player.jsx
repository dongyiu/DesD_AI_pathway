import { useMeeting } from "@videosdk.live/react-sdk";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, RefreshCw, Volume2, VolumeX, Play, Pause, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ViewerComponent({ playbackUrl, onPlay }) {
    const { hlsState } = useMeeting();
    const videoRef = useRef(null);
    const [hlsInstance, setHlsInstance] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isMuted, setIsMuted] = useState(true); // Start muted by default
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isWaitingForPlay, setIsWaitingForPlay] = useState(false);
    
    const streamUrl = hlsState?.playbackHlsUrl || playbackUrl;

    const handlePlaybackError = (message) => {
        setError(message);
        setLoaded(false);
        setIsBuffering(false);
        setIsWaitingForPlay(true);
    };

    const startPlayback = async () => {
        if (!videoRef.current) return;
        
        try {
            setIsBuffering(true);
            setError(null);

            // Always try to play muted first
            videoRef.current.muted = true;
            await videoRef.current.play();
            
            setLoaded(true);
            setIsBuffering(false);
            setIsWaitingForPlay(false);
            setIsPlaying(true);
            onPlay?.();
        } catch (err) {
            console.error("Playback failed:", err);
            handlePlaybackError("Click play to start the stream");
        }
    };

    const initializeHls = async (autoplay = true) => {
        if (!streamUrl || !videoRef.current) return;

        setError(null);
        setIsBuffering(true);

        try {
            if (Hls.isSupported()) {
                // Cleanup existing instance
                if (hlsInstance) {
                    hlsInstance.destroy();
                }

                const hls = new Hls({
                    maxBufferLength: 30,
                    liveSyncDuration: 10,
                    debug: false,
                    startLevel: -1,
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        switch(data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                handlePlaybackError("Stream playback error. Please try refreshing.");
                                hls.destroy();
                                break;
                        }
                    }
                });

                // Setup success handling
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (autoplay) {
                        videoRef.current.muted = true; // Ensure muted for autoplay
                        startPlayback();
                    } else {
                        setIsBuffering(false);
                        setIsWaitingForPlay(true);
                    }
                });

                // Load the stream
                hls.loadSource(streamUrl);
                hls.attachMedia(videoRef.current);
                setHlsInstance(hls);

            } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
                videoRef.current.src = streamUrl;
                videoRef.current.muted = true; // Ensure muted for autoplay
                if (autoplay) {
                    await startPlayback();
                } else {
                    setIsBuffering(false);
                    setIsWaitingForPlay(true);
                }
            }
        } catch (err) {
            console.error("HLS initialization failed:", err);
            handlePlaybackError("Failed to initialize stream. Please try again.");
        }
    };

    // Initialize when stream URL changes
    useEffect(() => {
        if (streamUrl) {
            initializeHls(true);
        }
        return () => {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        };
    }, [streamUrl]);

    // Controls visibility
    useEffect(() => {
        let hideTimeout;
        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => setShowControls(false), 3000);
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(hideTimeout);
        };
    }, []);

    const handleRetry = () => {
        setIsWaitingForPlay(false);
        initializeHls(true);
    };

    const handlePlayClick = async () => {
        try {
            if (videoRef.current) {
                await videoRef.current.play();
                setIsWaitingForPlay(false);
                setIsPlaying(true);
                setError(null);
                onPlay?.();
            }
        } catch (err) {
            console.error("Manual play failed:", err);
            handlePlaybackError("Playback failed. Please try again.");
        }
    };

    const handlePauseClick = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handlePlayPauseToggle = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play()
                    .then(() => {
                        setIsPlaying(true);
                    })
                    .catch(err => {
                        console.error("Play failed:", err);
                    });
            }
        }
    };

    const handleUnmute = async () => {
        try {
            videoRef.current.muted = false;
            setIsMuted(false);
        } catch (err) {
            console.error("Unmute failed:", err);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div className="relative w-full h-full bg-black">
            <video
                ref={videoRef}
                className="w-full h-full"
                playsInline
                muted={isMuted}
                controls={false}
            />

            {/* Play Button Overlay */}
            {isWaitingForPlay && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlayClick}
                        className="w-20 h-20 rounded-full bg-purple-500/80 flex items-center justify-center text-white"
                    >
                        <Play className="w-10 h-10" />
                    </motion.button>
                </div>
            )}

            {/* Unmute Button */}
            {loaded && isMuted && (
                <div className="absolute top-4 left-4 z-10">
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={handleUnmute}
                        className="px-4 py-2 bg-purple-500/80 backdrop-blur-sm rounded-full text-white text-sm flex items-center gap-2"
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(168, 85, 247, 0.9)' }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Volume2 className="w-4 h-4" />
                        <span className="font-light">Unmute</span>
                    </motion.button>
                </div>
            )}

            {/* Controls Overlay */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handlePlayPauseToggle}
                                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-2 rounded-full transition-colors"
                                >
                                    {isPlaying 
                                        ? <Pause className="w-5 h-5 text-purple-400" /> 
                                        : <Play className="w-5 h-5 text-purple-400" />
                                    }
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        const newMutedState = !isMuted;
                                        setIsMuted(newMutedState);
                                        if (videoRef.current) {
                                            videoRef.current.muted = newMutedState;
                                        }
                                    }}
                                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-2 rounded-full transition-colors"
                                >
                                    {isMuted 
                                        ? <VolumeX className="w-5 h-5 text-purple-400" /> 
                                        : <Volume2 className="w-5 h-5 text-purple-400" />
                                    }
                                </motion.button>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleFullscreen}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-2 rounded-full transition-colors"
                            >
                                <Maximize2 className="w-5 h-5 text-purple-400" />
                            </motion.button>
                        </div>

                        {error && (
                            <div className="mt-3 flex items-center gap-2 text-red-400 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-light">{error}</span>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleRetry}
                                    className="ml-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Spinner */}
            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
                    />
                </div>
            )}
        </div>
    );
}

export default ViewerComponent;
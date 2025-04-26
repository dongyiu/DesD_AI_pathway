import { MeetingProvider } from "@videosdk.live/react-sdk";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Play, Calendar, Info, Video, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ViewerComponent from "../components/Player";
import NavBar from '../components/Navbar';

function Meeting() {
    const [streamInfo, setStreamInfo] = useState(null);
    const [token, setToken] = useState(null);
    const [error, setError] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const fetchWithRetry = async (url, options, retries = 3) => {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            if (retries > 0) return fetchWithRetry(url, options, retries - 1);
            throw err;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                // Using the API endpoints
                const [streamData, tokenData] = await Promise.all([
                    fetchWithRetry("http://localhost:8000/api/stream-info/"),
                    fetchWithRetry("http://localhost:8000/api/get-token/")
                ]);
                console.log("Successfully fetched stream data and token from API endpoints");
                
                setStreamInfo(streamData);
                
                if (!tokenData?.token) {
                    throw new Error("No token received from server");
                }
                
                setToken(String(tokenData.token));
            } catch (err) {
                console.error("Initialization failed:", err);
                setError("Failed to initialize stream. Please try again.");
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        if (token) {
            setTimeout(() => setIsReady(true), 100);
        }
    }, [token]);

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-6 flex items-center gap-3 text-red-400"
                >
                    <AlertCircle className="w-6 h-6" />
                    <span className="font-light">{error}</span>
                </motion.div>
            </div>
        );
    }

    if (!streamInfo || !token || !isReady) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-purple-400 flex items-center gap-3"
                >
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-light">Preparing your stream...</span>
                </motion.div>
            </div>
        );
    }

    const tokenString = typeof token === 'string' ? token.trim() : String(token).trim();
    
    const meetingConfig = {
        meetingId: "stream1",
        mode: "VIEWER",
        token: tokenString,
        name: "Viewer",
        micEnabled: false,
        webcamEnabled: false,
        participantId: "user-" + Date.now()
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <NavBar isDarkMode={isDarkMode} />

            
            <div className="max-w-6xl mx-auto p-4 py-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl backdrop-blur-sm bg-white/5 border border-white/5 overflow-hidden"
                >
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <div className="flex items-center space-x-3">
                            <div className="bg-purple-500/20 p-2 rounded-lg">
                                <Video className="w-5 h-5 text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-light">Live <span className="text-purple-400 font-medium">Stream</span></h2>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-purple-400/60 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div className="aspect-video relative">
                        <MeetingProvider config={meetingConfig} token={tokenString}>
                            <ViewerComponent 
                                playbackUrl={streamInfo?.playback_url}
                                onPlay={() => setIsPlaying(true)}
                            />
                        </MeetingProvider>

                        <AnimatePresence>
                            {!isPlaying && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-20 h-20 rounded-full bg-purple-500/80 flex items-center justify-center text-white"
                                        onClick={() => setIsPlaying(true)}
                                    >
                                        <Play className="w-10 h-10" />
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-6 border-t border-white/5">
                        <div className="flex gap-4 flex-col md:flex-row">
                            <motion.div className="bg-gray-700/30 backdrop-blur-sm rounded-lg p-4 flex-1">
                                <h3 className="text-sm text-purple-400/60 uppercase tracking-wider mb-3">Stream Details</h3>
                                <h2 className="text-xl font-light">{streamInfo?.title || "Welcome to the Live Stream"}</h2>
                                
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="bg-purple-500/5 p-3 rounded-lg">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <Info className="w-4 h-4 text-purple-400" />
                                            <span className="text-xs text-purple-400/60 uppercase">Status</span>
                                        </div>
                                        <div className="font-light text-lg">Live</div>
                                    </div>
                                    
                                    <div className="bg-purple-500/5 p-3 rounded-lg">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <Users className="w-4 h-4 text-purple-400" />
                                            <span className="text-xs text-purple-400/60 uppercase">Viewers</span>
                                        </div>
                                        <div className="font-light text-lg">42</div>
                                    </div>
                                </div>
                            </motion.div>
                            
                            <motion.div className="bg-gray-700/30 backdrop-blur-sm rounded-lg p-4 flex-1">
                                <h3 className="text-sm text-purple-400/60 uppercase tracking-wider mb-3">Stream Info</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-purple-500/5 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-purple-500/20 p-1.5 rounded-lg">
                                                <Calendar className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="font-light">Start Time</div>
                                                <div className="text-xs text-gray-400">{new Date().toLocaleTimeString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-purple-500/5 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-purple-500/20 p-1.5 rounded-lg">
                                                <Info className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="font-light">Stream Quality</div>
                                                <div className="text-xs text-gray-400">1080p HD</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default Meeting;
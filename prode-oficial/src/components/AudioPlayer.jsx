// src/components/AudioPlayer.jsx
import React, { useState, useRef } from 'react'; // <--- Se quitó useEffect
import './AudioPlayer.css';

const AudioPlayer = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    
    const audioRef = useRef(null);

    // Formatear tiempo (ej: 0:12)
    const formatTime = (time) => {
        if (!time) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        if (audio) {
            const current = audio.currentTime;
            const total = audio.duration;
            setCurrentTime(current);
            setProgress((current / total) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        const audio = audioRef.current;
        if (audio) {
            setDuration(audio.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        const newTime = (e.target.value / 100) * duration;
        audio.currentTime = newTime;
        setProgress(e.target.value);
    };

    return (
        <div className="custom-audio-player">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />
            
            <button className="play-pause-btn" onClick={togglePlay}>
                {isPlaying ? (
                    // Icono Pause (SVG)
                    <svg viewBox="0 0 24 24" fill="currentColor" height="20" width="20">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                ) : (
                    // Icono Play (SVG)
                    <svg viewBox="0 0 24 24" fill="currentColor" height="20" width="20">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                )}
            </button>

            <div className="progress-container">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={handleSeek}
                    className="progress-bar"
                    style={{ backgroundSize: `${progress}% 100%` }} 
                />
            </div>

            <span className="time-display">
                {isPlaying || currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}
            </span>
        </div>
    );
};

export default AudioPlayer;
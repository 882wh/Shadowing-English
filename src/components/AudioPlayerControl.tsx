import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Volume2 } from 'lucide-react';

interface AudioPlayerControlProps {
  text: string;
  durationSeconds: number;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onComplete: () => void;
  // Shared progress
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  className?: string;
  idPrefix?: string;
}

export default function AudioPlayerControl({
  text,
  durationSeconds,
  isPlaying,
  onPlayStateChange,
  onComplete,
  currentTime,
  setCurrentTime,
  className = '',
  idPrefix = 'player'
}: AudioPlayerControlProps) {
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const hasCompletedThisPlaybackRef = useRef<boolean>(false);

  const safeComplete = () => {
    if (!hasCompletedThisPlaybackRef.current) {
      hasCompletedThisPlaybackRef.current = true;
      onComplete();
    }
  };

  // Initialize Speech Synthesis for standard TTS output
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // Slightly slower speed for easier shadowing practice

      utterance.onend = () => {
        // Stop playing
        onPlayStateChange(false);
        setCurrentTime(durationSeconds);
        safeComplete();
      };
      ttsUtteranceRef.current = utterance;
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [text, durationSeconds]);

  // Handle Speech Synthesis play and pause events based on isPlaying trigger
  useEffect(() => {
    if (!isPlaying) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.pause();
      }
      return;
    }

    // Reset completion tracker whenever a play event is commanded
    hasCompletedThisPlaybackRef.current = false;

    // Play flow
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.cancel();
        if (ttsUtteranceRef.current) {
          window.speechSynthesis.speak(ttsUtteranceRef.current);
        }
      }
    }

    // Advance progress bar smoothly
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = window.setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= durationSeconds) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          onPlayStateChange(false);
          safeComplete();
          return durationSeconds;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying]);

  // Handle back 5s
  const handleRewind = () => {
    setCurrentTime((prev) => {
      const next = Math.max(0, prev - 5);
      // Restart speech syntheses from a proportional spot if restarted
      if (typeof window !== 'undefined' && window.speechSynthesis && isPlaying) {
        window.speechSynthesis.cancel();
        if (ttsUtteranceRef.current) {
          window.speechSynthesis.speak(ttsUtteranceRef.current);
        }
      }
      return next;
    });
  };

  // Handle forward 5s
  const handleForward = () => {
    setCurrentTime((prev) => {
      const next = Math.min(durationSeconds, prev + 5);
      if (next >= durationSeconds) {
        onPlayStateChange(false);
        safeComplete();
      }
      return next;
    });
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressPercent = clickX / rect.width;
    const clickTime = Math.round(progressPercent * durationSeconds);
    const clampedTime = Math.max(0, Math.min(durationSeconds, clickTime));
    
    setCurrentTime(clampedTime);
    if (clampedTime >= durationSeconds) {
      onPlayStateChange(false);
      safeComplete();
    } else if (isPlaying && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      if (ttsUtteranceRef.current) {
        window.speechSynthesis.speak(ttsUtteranceRef.current);
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const progressPercent = (currentTime / durationSeconds) * 100;

  return (
    <div className={`flex flex-col items-center bg-[#FAF8F5] border-2 border-[#E3DCD1] p-4 rounded-2xl w-full max-w-md ${className}`}>
      {/* Play Controls Row above the progress bar */}
      <div className="flex items-center space-x-6 mb-3">
        {/* Rewind 5s */}
        <button
          id={`${idPrefix}-rewind-btn`}
          onClick={handleRewind}
          type="button"
          className="p-2.5 rounded-full bg-white hover:bg-[#F3EFE9] border-2 border-[#E3DCD1] text-[#4b3e35] active:translate-y-0.5 transition-all outline-none"
          title="后退5秒"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Play/Pause */}
        <button
          id={`${idPrefix}-play-toggle`}
          onClick={() => onPlayStateChange(!isPlaying)}
          type="button"
          className={`p-4 rounded-full border-b-4 font-bold text-white transition-all active:border-b-0 active:translate-y-1 ${
            isPlaying
              ? 'bg-[#FF9600] border-[#E08200] hover:bg-[#E58700]'
              : 'bg-[#58CC02] border-[#3C8E00] hover:bg-[#46A302]'
          }`}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
        </button>

        {/* Forward 5s */}
        <button
          id={`${idPrefix}-forward-btn`}
          onClick={handleForward}
          type="button"
          className="p-2.5 rounded-full bg-white hover:bg-[#F3EFE9] border-2 border-[#E3DCD1] text-[#4b3e35] active:translate-y-0.5 transition-all outline-none"
          title="快进5秒"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full flex items-center space-x-3">
        <span className="text-xs font-mono text-[#5C4D3E] w-8 text-right">
          {formatTime(currentTime)}
        </span>
        
        <div 
          onClick={handleProgressBarClick}
          className="flex-1 h-3 bg-[#E3DCD1] rounded-full overflow-hidden cursor-pointer relative"
        >
          <div 
            className="h-full bg-[#58CC02] transition-all duration-150 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <span className="text-xs font-mono text-[#5C4D3E] w-8">
          {formatTime(durationSeconds)}
        </span>
      </div>


    </div>
  );
}

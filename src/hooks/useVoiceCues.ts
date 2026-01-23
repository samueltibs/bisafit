import { useCallback, useRef, useState } from 'react';

export function useVoiceCues() {
  const [isEnabled, setIsEnabled] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if speech synthesis is available
  const isAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Initialize speech synthesis
  const initSynth = useCallback(() => {
    if (!isAvailable) return null;
    if (!synthRef.current) {
      synthRef.current = window.speechSynthesis;
    }
    return synthRef.current;
  }, [isAvailable]);

  // Speak a message
  const speak = useCallback((message: string, priority: 'high' | 'normal' = 'normal') => {
    if (!isEnabled || !isAvailable) return;

    const synth = initSynth();
    if (!synth) return;

    // Cancel current speech for high priority messages
    if (priority === 'high') {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    // Use a clear voice if available
    const voices = synth.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-') && v.localService);
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [isEnabled, isAvailable, initSynth]);

  // Cancel current speech
  const cancel = useCallback(() => {
    if (!isAvailable) return;
    const synth = initSynth();
    if (synth) {
      synth.cancel();
    }
  }, [isAvailable, initSynth]);

  // Pre-defined workout cues
  const announceWorkoutStart = useCallback(() => {
    speak("Workout started. Let's go!", 'high');
  }, [speak]);

  const announceRest = useCallback((seconds: number) => {
    speak(`Rest for ${seconds} seconds`, 'normal');
  }, [speak]);

  const announceCountdown = useCallback(() => {
    speak("3, 2, 1, go!", 'high');
  }, [speak]);

  const announceNextExercise = useCallback((exerciseName: string) => {
    speak(`Next exercise: ${exerciseName}`, 'high');
  }, [speak]);

  const announceSetComplete = useCallback((setNumber: number, totalSets: number) => {
    if (setNumber < totalSets) {
      speak(`Set ${setNumber} complete. ${totalSets - setNumber} more to go.`, 'normal');
    } else {
      speak(`All sets complete. Great work!`, 'high');
    }
  }, [speak]);

  const announceWorkoutComplete = useCallback(() => {
    speak("Workout complete! Excellent job!", 'high');
  }, [speak]);

  const announceTimerWarning = useCallback((seconds: number) => {
    if (seconds <= 3 && seconds > 0) {
      speak(String(seconds), 'high');
    }
  }, [speak]);

  return {
    isEnabled,
    setIsEnabled,
    isAvailable,
    speak,
    cancel,
    // Workout-specific cues
    announceWorkoutStart,
    announceRest,
    announceCountdown,
    announceNextExercise,
    announceSetComplete,
    announceWorkoutComplete,
    announceTimerWarning,
  };
}

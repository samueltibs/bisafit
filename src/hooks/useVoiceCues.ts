import { useCallback, useRef, useState, useEffect } from 'react';

export type CoachVoice = 'male' | 'female';

interface VoiceCuesOptions {
  preferredVoice?: CoachVoice;
}

export function useVoiceCues(options: VoiceCuesOptions = {}) {
  const { preferredVoice = 'female' } = options;
  const [isEnabled, setIsEnabled] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Check if speech synthesis is available
  const isAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load voices when available
  useEffect(() => {
    if (!isAvailable) return;

    const synth = window.speechSynthesis;
    
    const loadVoices = () => {
      voicesRef.current = synth.getVoices();
      setVoicesLoaded(voicesRef.current.length > 0);
    };

    // Load immediately if available
    loadVoices();

    // Chrome requires this event listener
    synth.addEventListener('voiceschanged', loadVoices);

    return () => {
      synth.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isAvailable]);

  // Initialize speech synthesis
  const initSynth = useCallback(() => {
    if (!isAvailable) return null;
    if (!synthRef.current) {
      synthRef.current = window.speechSynthesis;
    }
    return synthRef.current;
  }, [isAvailable]);

  // Find the best matching voice based on preference and language
  const findVoice = useCallback((voiceType: CoachVoice): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current;
    if (!voices.length) return null;

    // Get browser language (e.g., 'en-US', 'es-ES')
    const browserLang = navigator.language || 'en-US';
    const langPrefix = browserLang.split('-')[0]; // 'en', 'es', etc.

    // Gender keywords to match voices
    const maleKeywords = ['male', 'man', 'guy', 'david', 'james', 'daniel', 'google us english', 'microsoft david', 'microsoft mark'];
    const femaleKeywords = ['female', 'woman', 'girl', 'samantha', 'victoria', 'zira', 'google us english female', 'microsoft zira', 'karen'];

    const targetKeywords = voiceType === 'male' ? maleKeywords : femaleKeywords;

    // First try: exact language match with gender preference
    const exactMatch = voices.find(v => {
      const voiceLang = v.lang.toLowerCase();
      const voiceName = v.name.toLowerCase();
      const matchesLang = voiceLang.startsWith(langPrefix.toLowerCase());
      const matchesGender = targetKeywords.some(kw => voiceName.includes(kw));
      return matchesLang && matchesGender;
    });

    if (exactMatch) return exactMatch;

    // Second try: language match only (any gender)
    const langMatch = voices.find(v => 
      v.lang.toLowerCase().startsWith(langPrefix.toLowerCase()) && v.localService
    );

    if (langMatch) return langMatch;

    // Third try: English fallback with gender preference
    const englishGenderMatch = voices.find(v => {
      const voiceLang = v.lang.toLowerCase();
      const voiceName = v.name.toLowerCase();
      const isEnglish = voiceLang.startsWith('en');
      const matchesGender = targetKeywords.some(kw => voiceName.includes(kw));
      return isEnglish && matchesGender;
    });

    if (englishGenderMatch) return englishGenderMatch;

    // Fourth try: any English voice
    const englishVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith('en') && v.localService
    );

    if (englishVoice) return englishVoice;

    // Fallback: first available local voice
    return voices.find(v => v.localService) || voices[0] || null;
  }, []);

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
    
    // Use preferred voice type
    const selectedVoice = findVoice(preferredVoice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [isEnabled, isAvailable, initSynth, findVoice, preferredVoice]);

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
    voicesLoaded,
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

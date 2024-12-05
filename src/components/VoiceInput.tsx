import React, { useState, useRef, useEffect } from 'react';

interface VoiceInputProps {
  onSpeechRecognized: (transcript: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onSpeechRecognized }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Setup keyboard shortcut
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === 's') {
        event.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  };

  const resetSilenceTimeout = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    // Auto-stop after 2 seconds of silence
    silenceTimeoutRef.current = setTimeout(() => {
      if (isListening) {
        stopListening();
      }
    }, 1000);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    cleanup();

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
      finalTranscriptRef.current = '';
      setInterimTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';

      const currentResult = event.results[event.results.length - 1];
      if (currentResult.isFinal) {
        finalTranscriptRef.current = finalTranscriptRef.current + currentResult[0].transcript + ' ';
      } else {
        interimTranscript = currentResult[0].transcript;
      }

      setInterimTranscript(interimTranscript);
      resetSilenceTimeout();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        cleanup();
      }
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    setIsListening(false);
    setInterimTranscript('');

    // Only send if there's actual content
    if (finalTranscriptRef.current.trim()) {
      onSpeechRecognized(finalTranscriptRef.current.trim());
      finalTranscriptRef.current = '';
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={toggleListening}
        className={`px-4 py-2 rounded-lg font-medium transition-colors
          ${isListening
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
      >
        {isListening ? 'Voice (Ctrl/Cmd+S)' : 'Voice (Ctrl/Cmd+S)'}
      </button>
      {isListening && interimTranscript && (
        <div className="text-sm text-gray-500 italic">
          {interimTranscript}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;

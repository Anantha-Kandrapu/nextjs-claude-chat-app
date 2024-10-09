import React, { useState, useRef, useEffect } from 'react';

interface VoiceInputProps {
  onSpeechRecognized: (transcript: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onSpeechRecognized }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;

        if (event.results[lastResultIndex].isFinal) {
          transcriptRef.current += transcript + ' ';

          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Set a new timeout to send the accumulated transcript
          timeoutRef.current = window.setTimeout(() => {
            onSpeechRecognized(transcriptRef.current.trim());
            transcriptRef.current = '';
          }, 2500); // Wait for 1.5 seconds of silence before sending
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);

      // Send any remaining transcript
      if (transcriptRef.current) {
        onSpeechRecognized(transcriptRef.current.trim());
        transcriptRef.current = '';
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  return (
    <button
      onClick={toggleListening}
      className={`px-4 py-2 rounded ${isListening ? 'bg-red-500' : 'bg-blue-500'} text-white`}
    >
      {isListening ? 'Stop Listening (Ctrl/Cmd+S)' : 'Start Voice Input (Ctrl/Cmd+S)'}
    </button>
  );
};

export default VoiceInput;
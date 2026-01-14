import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader, AlertCircle, CheckCircle } from 'lucide-react';

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSpeechSupport = !!SpeechRecognition;

const VoiceInput = ({ onTranscript, disabled = false }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, listening, processing, success, error
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!hasSpeechSupport) {
            setError('Speech recognition is not supported in this browser');
            return;
        }

        // Initialize speech recognition
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setStatus('listening');
            setError(null);
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            const currentText = finalTranscript || interimTranscript;
            setTranscript(currentText);

            // Send final transcript to parent
            if (finalTranscript) {
                onTranscript?.(finalTranscript);
                setStatus('success');
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            setStatus('error');

            switch (event.error) {
                case 'not-allowed':
                    setError('Microphone permission denied. Please allow microphone access.');
                    break;
                case 'no-speech':
                    setError('No speech detected. Please try again.');
                    break;
                case 'network':
                    setError('Network error. Please check your connection.');
                    break;
                default:
                    setError(`Error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            if (status === 'listening') {
                setStatus('idle');
            }
        };

        return () => {
            if (recognition) {
                recognition.abort();
            }
        };
    }, [onTranscript, status]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            setStatus('idle');
        } else {
            setTranscript('');
            setError(null);
            recognitionRef.current.start();
        }
    };

    if (!hasSpeechSupport) {
        return (
            <div className="voice-input-unsupported">
                <MicOff size={16} />
                <span>Voice input not supported</span>
            </div>
        );
    }

    return (
        <div className={`voice-input-container ${status}`}>
            <button
                type="button"
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                disabled={disabled}
                title={isListening ? 'Stop recording' : 'Start voice input'}
            >
                {status === 'listening' ? (
                    <>
                        <div className="voice-pulse" />
                        <Mic size={20} className="mic-icon active" />
                    </>
                ) : status === 'processing' ? (
                    <Loader size={20} className="spinner" />
                ) : status === 'success' ? (
                    <CheckCircle size={20} className="success-icon" />
                ) : (
                    <Mic size={20} className="mic-icon" />
                )}
            </button>

            {isListening && (
                <div className="voice-status">
                    <span className="voice-label">Listening...</span>
                    {transcript && (
                        <p className="voice-transcript">{transcript}</p>
                    )}
                </div>
            )}

            {error && (
                <div className="voice-error">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default VoiceInput;


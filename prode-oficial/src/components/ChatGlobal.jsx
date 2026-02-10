// src/components/ChatGlobal.jsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { API_URL } from '../config'; 
import './ChatGlobal.css'; 
import AudioPlayer from './AudioPlayer';

// Iconos simples (puedes cambiarlos por íconos SVG o de librería si prefieres)
const ICON_MIC = "🎤";
const ICON_STOP = "⏹️";
const ICON_SEND = "➤";
const ICON_CANCEL = "❌";

// Conexión socket fuera del componente
const socket = io(API_URL);

function ChatGlobal({ username, fullPage, messages, setMessages }) {
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    // --- ESTADOS DE AUDIO ---
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]); // Para ir guardando los pedacitos de audio

    // 1. Inicializamos userId (Lazy init para evitar errores)
    const [userId] = useState(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const payload = JSON.parse(jsonPayload);
                return payload.id;
            } catch (error) {
                console.error("Error decoding token:", error);
                return null;
            }
        }
        return null;
    });

    // 2. Cargar historial inicial
    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/api/chat/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if(res.ok) {
                    const history = await res.json();
                    setMessages(prev => {
                        if (prev.length === 0) return history;
                        return prev;
                    });
                }
            } catch (error) {
                console.error("Error cargando historial:", error);
            }
        };
        fetchHistory();
    }, [setMessages]);

    // 3. Escuchar nuevos mensajes
    useEffect(() => {
        const handleNewMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
        };
        socket.on('chat_message', handleNewMessage);
        return () => { socket.off('chat_message', handleNewMessage); };
    }, [setMessages]);

    // 4. Scroll automático
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- LÓGICA DE GRABACIÓN ---

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                chunksRef.current = [];
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accediendo al micrófono:", err);
            alert("No se pudo acceder al micrófono. Verifica los permisos.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Apagar el "punto rojo" del navegador
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const cancelAudio = () => {
        setAudioBlob(null);
        setIsRecording(false);
    };

    // Helper: Convertir Audio a Texto (Base64) para enviarlo
    const convertBlobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // --- ENVIAR MENSAJE (TEXTO O AUDIO) ---
    const sendMessage = async (e) => {
        e.preventDefault();

        // A) SI HAY AUDIO
        if (audioBlob) {
            const base64Audio = await convertBlobToBase64(audioBlob);
            const messageData = {
                user: username,
                userId: userId,
                text: base64Audio, // Aquí va el audio codificado
                type: 'audio',     // Importante marcar el tipo
                timestamp: new Date().toISOString()
            };
            socket.emit('chat_message', messageData);
            setAudioBlob(null);
            return;
        }

        // B) SI ES TEXTO
        if (newMessage.trim() === "") return;

        const messageData = {
            user: username,
            userId: userId,
            text: newMessage,
            type: 'text',
            timestamp: new Date().toISOString()
        };

        socket.emit('chat_message', messageData);
        setNewMessage("");
    };

    const formatTime = (isoString) => {
        if(!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`chat-container ${fullPage ? 'full-page-chat' : ''}`}>
            <div className="chat-header">
                <h3>💬 Chat Global</h3>
            </div>
            
            <div className="chat-messages-area">
                {messages.map((msg, index) => {
                    const isMe = msg.user === username;
                    return (
                        <div key={index} className={`message-bubble ${isMe ? 'my-message' : 'other-message'}`}>
                            <div className="msg-header">
                                <span className="msg-user">{msg.user}</span>
                                <span className="msg-time">{formatTime(msg.timestamp)}</span>
                            </div>
                            <div className="msg-content">
                                {/* Renderizado condicional: Audio o Texto */}
                               {msg.type === 'audio' ? (
                                    <AudioPlayer src={msg.text} />
                                ) : (
                                    msg.text
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={sendMessage}>
                {/* Ocultamos el input de texto si estamos grabando o hay un audio listo */}
                {!isRecording && !audioBlob && (
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="chat-input"
                    />
                )}

                {/* CONTROLES DE AUDIO */}
                <div className="audio-controls">
                    {isRecording ? (
                        <span className="recording-indicator">🔴 Grabando...</span>
                    ) : audioBlob ? (
                        <div className="audio-preview">
                            <span>🎤 Audio listo</span>
                            <button type="button" onClick={cancelAudio} className="btn-cancel-audio">{ICON_CANCEL}</button>
                        </div>
                    ) : null}
                </div>

                {/* BOTÓN DE ACCIÓN DINÁMICO */}
                <div className="action-buttons">
                    {(newMessage.trim() !== "" || audioBlob) ? (
                        // Botón ENVIAR (si hay texto o audio)
                        <button type="submit" className="chat-send-btn send">{ICON_SEND}</button>
                    ) : (
                        // Botón MICRÓFONO (si está vacío)
                        <button 
                            type="button" 
                            onClick={isRecording ? stopRecording : startRecording} 
                            className={`chat-send-btn ${isRecording ? 'stop' : 'mic'}`}
                        >
                            {isRecording ? ICON_STOP : ICON_MIC}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default ChatGlobal;
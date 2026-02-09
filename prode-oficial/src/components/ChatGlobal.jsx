// src/components/ChatGlobal.jsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { API_URL } from '../config'; 
import './ChatGlobal.css'; 

// Conexión fuera del componente para evitar reconexiones múltiples
const socket = io(API_URL);

function ChatGlobal({ username, fullPage, messages, setMessages }) {
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    // ✅ Inicializamos userId directamente (Lazy Initialization)
    const [userId] = useState(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Decodificamos el token para sacar el ID
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const payload = JSON.parse(jsonPayload);
                return payload.id;
            } catch (error) { 
                // SOLUCIÓN AL ERROR: Usamos la variable 'error' para mostrarlo en consola
                console.error("Error al decodificar ID:", error);
                return null;
            }
        }
        return null;
    });

    // 2. Cargar historial inicial (Solo una vez al montar)
    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/api/chat/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if(res.ok) {
                    const history = await res.json();
                    // Solo actualizamos si no tenemos mensajes aún para evitar duplicados visuales
                    setMessages(prev => {
                        if (prev.length === 0) return history;
                        return prev;
                    });
                }
            } catch (error) {
                console.error("Error cargando historial de chat:", error);
            }
        };
        fetchHistory();
    }, [setMessages]);

    // 3. Escuchar nuevos mensajes en tiempo real
    useEffect(() => {
        const handleNewMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
        };

        socket.on('chat_message', handleNewMessage);

        return () => {
            socket.off('chat_message', handleNewMessage);
        };
    }, [setMessages]);

    // 4. Scroll automático al fondo
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() === "") return;

        const messageData = {
            user: username,
            userId: userId, // Usamos el ID que calculamos al inicio
            text: newMessage,
            type: 'text',
            timestamp: new Date().toISOString()
        };

        // Emitir al servidor
        socket.emit('chat_message', messageData);
        setNewMessage("");
    };

    // Formatear hora
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
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={sendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="chat-input"
                />
                <button type="submit" className="chat-send-btn">➤</button>
            </form>
        </div>
    );
}

export default ChatGlobal;
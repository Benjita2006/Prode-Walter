// src/components/ChatGlobal.jsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { API_URL } from '../config';
import './ChatGlobal.css';

// 🟢 Conectamos el socket FUERA del componente para que no se reconecte en cada render
const socket = io(API_URL);

// 🟢 Recibimos messages y setMessages como PROPS desde App.jsx
function ChatGlobal({ username, fullPage, messages, setMessages }) {
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Escuchar mensajes entrantes
        socket.on('chat_message', (msg) => {
            // Usamos la versión callback de setMessages para asegurar el estado más reciente
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off('chat_message');
        };
    }, [setMessages]);

    // Auto-scroll al fondo
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            const msgData = {
                user: username,
                text: newMessage,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            socket.emit('chat_message', msgData);
            setNewMessage("");
        }
    };

    return (
        <div className={`chat-container ${fullPage ? 'chat-full' : ''}`}>
            
            <div className="chat-header">
                <span className="status-dot"></span> Chat General
            </div>

            {/* 🟢 ÁREA DE MENSAJES (Ocupará todo el espacio disponible) */}
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="welcome-chat">
                        <p>💬 ¡Bienvenido al chat!</p>
                        <small>Sé el primero en escribir.</small>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={`message-bubble ${msg.user === username ? 'my-message' : 'other-message'}`}
                        >
                            <div className="msg-user">{msg.user}</div>
                            <div className="msg-text">{msg.text}</div>
                            <div className="msg-time">{msg.time}</div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 🟢 ÁREA DE INPUT (Fija abajo) */}
            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="chat-input"
                />
                <button type="submit" className="chat-send-btn">
                    Enviar
                </button>
            </form>
        </div>
    );
}

export default ChatGlobal;
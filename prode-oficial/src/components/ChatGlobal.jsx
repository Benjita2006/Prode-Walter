import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { API_URL } from '../config';
import './ChatGlobal.css';

// Conectamos el socket fuera del componente para evitar reconexiones múltiples
const socket = io(API_URL);

function ChatGlobal({ username, fullPage = false }) {
    // Inicializamos el estado basándonos en si es fullPage o no.
    const [isOpen, setIsOpen] = useState(fullPage);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const messagesEndRef = useRef(null);

    // --- CORRECCIÓN AQUÍ ---
    useEffect(() => {
        // 1. Eliminamos la línea "if (fullPage) setIsOpen(true)" que daba error.
        //    No es necesaria porque la lógica de abajo (el return) ya maneja esto.

        // Listeners del Socket
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        socket.on('chat_message', (data) => {
            setMessages((prev) => [...prev, data]);
        });

        // Limpieza al desmontar
        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('chat_message');
        };
    }, []); // 👈 2. Array vacío: Esto se ejecuta solo una vez al montar el componente.

    // Auto-scroll al fondo cuando llegan mensajes o se abre el chat
    useEffect(() => {
        if (isOpen || fullPage) { // Agregamos fullPage aquí para asegurar el scroll
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen, fullPage]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            const msgData = {
                user: username,
                text: message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                id: Date.now()
            };
            socket.emit('chat_message', msgData);
            setMessage('');
        }
    };

    // LÓGICA DE RENDERIZADO:
    // Si NO es pantalla completa Y NO está abierto manualmente -> Muestra Botón Flotante
    if (!fullPage && !isOpen) {
        return (
            <button 
                className="chat-toggle-btn" 
                onClick={() => setIsOpen(true)}
            >
                💬
            </button>
        );
    }

    // Si es fullPage O está abierto -> Muestra el Chat completo
    return (
        <div className={`chat-container ${fullPage ? 'full-mode' : 'floating-mode'}`}>
            
            {/* ENCABEZADO */}
            <div className="chat-header">
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
                    <h3>Chat General {fullPage ? '' : '💬'}</h3>
                </div>
                
                {/* Solo mostramos la X de cerrar si es modo flotante */}
                {!fullPage && (
                    <button className="close-chat" onClick={() => setIsOpen(false)}>✖</button>
                )}
            </div>

            {/* CUERPO MENSAJES */}
            <div className="chat-messages">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`message ${msg.user === username ? 'my-message' : 'other-message'}`}
                    >
                        <div className="msg-content">
                            <small className="msg-user">{msg.user}</small>
                            <p>{msg.text}</p>
                            <span className="msg-time">{msg.time}</span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <form className="chat-input-area" onSubmit={sendMessage}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                />
                <button type="submit">Enviar</button>
            </form>
        </div>
    );
}

export default ChatGlobal;
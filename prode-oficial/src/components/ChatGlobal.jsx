// src/components/ChatGlobal.jsx
import { API_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './ChatGlobal.css'; // Ahora creamos el CSS

// Conexión fuera del componente para que no se reconecte en cada render
const socket = io(API_URL); 

function ChatGlobal({ username }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const messagesEndRef = useRef(null); // Para el scroll automático

    useEffect(() => {
        // Escuchar mensajes que vienen del servidor
        socket.on('chat_message', (msg) => {
            setMensajes((prev) => [...prev, msg]);
        });

        return () => {
            socket.off('chat_message');
        };
    }, []);

    // Scroll automático al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes, isOpen]);

    const enviarMensaje = (e) => {
        e.preventDefault();
        if (nuevoMensaje.trim() && username) {
            const data = {
                usuario: username,
                texto: nuevoMensaje,
                hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            
            // Enviar al servidor
            socket.emit('chat_message', data);
            setNuevoMensaje("");
        }
    };

    return (
        <div className="chat-wrapper">
            {/* Botón flotante para abrir/cerrar */}
            <button 
                className={`chat-toggle-btn ${isOpen ? 'open' : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? '❌' : '💬 Chat Global'}
            </button>

            {/* Ventana del Chat */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <h4>La Tribuna 🏟️</h4>
                    </div>
                    
                    <div className="chat-body">
                        {mensajes.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`chat-bubble ${msg.usuario === username ? 'my-msg' : 'other-msg'}`}
                            >
                                <div className="msg-info">
                                    <span className="msg-user">{msg.usuario}</span>
                                    <span className="msg-time">{msg.hora}</span>
                                </div>
                                <div className="msg-text">{msg.texto}</div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-footer" onSubmit={enviarMensaje}>
                        <input 
                            type="text" 
                            placeholder="Escribe algo..." 
                            value={nuevoMensaje}
                            onChange={(e) => setNuevoMensaje(e.target.value)}
                        />
                        <button type="submit">Enviar</button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default ChatGlobal;
import React from 'react';

function WhatsAppBtn() {
    // Reemplaza con tu número real (código país + número, sin + ni espacios)
    // Ejemplo Argentina: 5491112345678
    const phoneNumber = "5493513135564"; 
    const message = "Hola! Tengo una consulta sobre el Prode.";

    return (
        <a 
            href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
            className="whatsapp-float"
            target="_blank"
            rel="noopener noreferrer"
        >
            <i className="fa fa-whatsapp">📞</i> {/* Puedes usar un icono SVG o emoji */}
        </a>
    );
}

export default WhatsAppBtn;
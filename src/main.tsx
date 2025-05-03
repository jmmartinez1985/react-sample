import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
// Importamos el archivo CSS existente
import './index.css';

// Asegurarse de que el elemento existe antes de intentar renderizar
const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error(
        'No se encontró el elemento con ID "root". Asegúrate de que existe en index.html'
    );
}

// Crear root solo si el elemento existe
const root = ReactDOM.createRoot(rootElement);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
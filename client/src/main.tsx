import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso: ', registration);
      })
      .catch(error => {
        console.log('Falha no registro do Service Worker: ', error);
      });
  });
}

// Função para gerenciar a tela cheia
const setupFullscreenMode = () => {
  // Verifica se é um dispositivo móvel
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Cria um botão flutuante para alternar o modo tela cheia
    const fullscreenButton = document.createElement('button');
    fullscreenButton.innerHTML = '📱';
    fullscreenButton.style.position = 'fixed';
    fullscreenButton.style.bottom = '80px';
    fullscreenButton.style.right = '20px';
    fullscreenButton.style.zIndex = '9999';
    fullscreenButton.style.backgroundColor = '#6CB33F';
    fullscreenButton.style.color = 'white';
    fullscreenButton.style.border = 'none';
    fullscreenButton.style.borderRadius = '50%';
    fullscreenButton.style.width = '40px';
    fullscreenButton.style.height = '40px';
    fullscreenButton.style.fontSize = '20px';
    fullscreenButton.style.display = 'flex';
    fullscreenButton.style.alignItems = 'center';
    fullscreenButton.style.justifyContent = 'center';
    fullscreenButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    fullscreenButton.setAttribute('aria-label', 'Alternar tela cheia');
    
    // Adiciona o botão ao documento após o carregamento completo
    window.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(fullscreenButton);

      // Função para alternar entre modo tela cheia
      fullscreenButton.addEventListener('click', () => {
        const doc = document.documentElement;
        
        if (!document.fullscreenElement) {
          if (doc.requestFullscreen) {
            doc.requestFullscreen()
              .catch(err => console.log('Erro ao entrar em modo tela cheia:', err));
          } else if ((doc as any).mozRequestFullScreen) {
            (doc as any).mozRequestFullScreen();
          } else if ((doc as any).webkitRequestFullscreen) {
            (doc as any).webkitRequestFullscreen();
          } else if ((doc as any).msRequestFullscreen) {
            (doc as any).msRequestFullscreen();
          }
          fullscreenButton.innerHTML = '📱'; // Ícone quando estiver em tela cheia
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
          }
          fullscreenButton.innerHTML = '📱'; // Ícone quando não estiver em tela cheia
        }
      });

      // Tentar entrar em modo de tela cheia automaticamente quando for instalado (standalone)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        const doc = document.documentElement;
        if (doc.requestFullscreen) {
          doc.requestFullscreen().catch(err => {
            console.log('Erro ao entrar em modo tela cheia automático:', err);
          });
        }
      }
    });
  }
};

// Inicializar o modo de tela cheia
setupFullscreenMode();

createRoot(document.getElementById("root")!).render(<App />);

'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstaller = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('SW registrado: ', registration);
        } catch (error) {
          console.log('Error al registrar SW: ', error);
        }
      });
    }

    // Detectar si la app ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Escuchar evento de instalación
    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e as BeforeInstallPromptEvent);
      
      // Mostrar banner después de 3 segundos
      setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallHandler);

    // Detectar cuando la app se instala
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setSupportsPWA(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!promptInstall) return;

    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA instalada');
      setShowBanner(false);
    } else {
      console.log('Instalación cancelada');
    }
    
    setPromptInstall(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // No volver a mostrar en esta sesión
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // No mostrar si está instalada o ya fue rechazada en esta sesión
  if (isInstalled || !supportsPWA || !showBanner || sessionStorage.getItem('pwa-banner-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 rounded-full p-2">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Instalar Mapa 360</h3>
            <p className="text-xs text-gray-600">Accede más rápido desde tu dispositivo</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstallClick}
            className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstaller;
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/routes/dashboard.route';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

if (Capacitor.isNativePlatform()) {
    App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
            App.exitApp();
        } else {
            window.history.back();
        }
    });
}

bootstrapApplication(AppComponent, {
    providers: [provideRouter(routes), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })],
}).catch((err) => console.error(err));


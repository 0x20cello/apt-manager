import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

if (Capacitor.isNativePlatform()) {
    App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
            App.exitApp();
        } else {
            window.history.back();
        }
    });
}

bootstrapApplication(AppComponent).catch((err) => console.error(err));


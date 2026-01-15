import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/routes/dashboard.route';
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

bootstrapApplication(AppComponent, {
    providers: [provideRouter(routes)],
}).catch((err) => console.error(err));


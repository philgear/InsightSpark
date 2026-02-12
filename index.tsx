import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, Provider, importProvidersFrom } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './src/app.component';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';

const isIframe = window.self !== window.top;
const providers: Provider[] = [
  provideZonelessChangeDetection(),
  importProvidersFrom(FormsModule),
  { provide: LocationStrategy, useClass: HashLocationStrategy }
];

// The sandboxed iframe environment in AI Studio throws an 'InvalidStateError'
// when attempting to register a service worker. We will only provide the
// service worker when the app is running in a top-level context.
if (!isIframe) {
  const serviceWorkerUrl = `${location.origin}/ngsw-worker.js`;
  providers.push(
    provideServiceWorker(serviceWorkerUrl, {
        enabled: true,
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000'
    })
  );
}

bootstrapApplication(AppComponent, { providers })
  .catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './src/app.component';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';

const isIframe = window.self !== window.top;
const providers = [
  provideZonelessChangeDetection(),
  importProvidersFrom(FormsModule),
  { provide: LocationStrategy, useClass: HashLocationStrategy }
];

if (!isIframe) {
  const serviceWorkerUrl = `${location.origin}/ngsw-worker.js`;
  providers.push(
    provideServiceWorker(serviceWorkerUrl, {
        enabled: true,
        registrationStrategy: 'registerWhenStable:30000'
    })
  );
}

bootstrapApplication(AppComponent, { providers })
  .catch(err => console.error(err));

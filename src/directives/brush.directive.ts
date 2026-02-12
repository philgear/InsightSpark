import { Directive, input } from '@angular/core';

@Directive({
  selector: '[appKleeBrush]',
  standalone: true,
  host: {
    '[style.animation]': '"brush 3s infinite alternate ease-in-out"',
    '[style.--brush-color]': 'color()',
    // Apply a subtle rotation and scale on hover for more "organic" feel
    '[class.hover-brush]': 'true' 
  }
})
export class KleeBrushDirective {
  // Color can be passed from the template. Defaulting to Aha! Moment (#FDD87A)
  color = input<string>('#FDD87A'); 
}
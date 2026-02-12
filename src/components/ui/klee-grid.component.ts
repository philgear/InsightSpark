import { Component, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-klee-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid gap-3 transition-all duration-700 ease-in-out" 
         [style.grid-template-columns]="'repeat(' + cols() + ', minmax(0, 1fr))'">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class KleeGridComponent implements OnInit {
  cols = signal(2);

  ngOnInit() {
    this.calculateCols(window.innerWidth);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.calculateCols((event.target as Window).innerWidth);
  }

  private calculateCols(width: number) {
    // Klee's shifting composition logic:
    // Scale columns based on available width, mimicking patchwork density.
    // 150px per patch is the base unit.
    const newCols = Math.max(2, Math.floor(width / 160));
    // Cap at 5 for this specific UI to prevent too many small items
    this.cols.set(Math.min(newCols, 5));
  }
}
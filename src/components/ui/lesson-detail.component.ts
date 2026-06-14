import { Component, inject, input, output, computed, effect, signal, OnDestroy } from '@angular/core';
import { LojongCleansingComponent } from './lojong-cleansing.component';
import { IconComponent } from './icon.component';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { Lesson, Project, PROJECTS } from '../../models/portfolio-data';
import { CurriculumService } from '../../services/curriculum.service';
import { Theme } from '../../services/storage.service';
import { marked, Renderer } from 'marked';
import mermaid from 'mermaid';
import { GraphViewComponent } from './graph-view.component';

interface TableCell {
  text: string;
  align: 'center' | 'left' | 'right' | null;
}

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [LojongCleansingComponent, IconComponent, CommonModule, GraphViewComponent],
  template: `
    <div class="space-y-6 animate-pop">
      <!-- Top Action Bar -->
      <div class="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
        <button (click)="goBack.emit()" 
                class="flex items-center gap-2 text-sm font-semibold text-[var(--text-color-muted)] hover:text-[var(--text-accent)] transition-colors focus:outline-none py-2 px-1">
          <app-icon name="arrow-down" [size]="16" class="rotate-90"></app-icon>
          Back to Lessons
        </button>

        <div class="flex items-center gap-2">
          <button (click)="toggleCurriculum()" 
                  [class.bg-[var(--text-accent)]]="curriculumService.isSaved(lesson().id)"
                  [class.text-white]="curriculumService.isSaved(lesson().id)"
                  [class.bg-[var(--button-bg)]]="!curriculumService.isSaved(lesson().id)"
                  class="flex items-center justify-center gap-2 text-sm font-semibold py-2 px-4 rounded-full border-2 border-[var(--border-color)] transition-colors focus:outline-none">
            <app-icon name="bookmark" [size]="16" [class.fill-current]="curriculumService.isSaved(lesson().id)"></app-icon>
            <span>
              {{ curriculumService.isSaved(lesson().id) ? 'Saved in Curriculum' : 'Add to Curriculum' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Main Article -->
      <article class="bg-[var(--card-bg)] border-2 border-[var(--border-color)] rounded-3xl overflow-hidden ">
        <!-- Editorial Hero Header -->
        <div class="relative w-full aspect-video md:aspect-[21/9] bg-black border-b border-[var(--border-color)]">
          @if (safeVideoUrl()) {
            <iframe [src]="safeVideoUrl()!" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
          } @else {
            <div class="absolute inset-0 flex items-center justify-center bg-[var(--card-bg)]">
              <app-icon name="video" [size]="48" class="text-[var(--text-accent)] opacity-50"></app-icon>
            </div>
          }
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12">
          <!-- Left Article Content -->
          <div class="lg:col-span-8 p-8 md:p-12 lg:pr-16 lg:border-r-2 border-[var(--border-color)] waterfall-item">
            <div class="space-y-4 mb-10">
              <div class="flex flex-wrap gap-2 items-center">
                <span class="px-3 py-1.5 text-[11px] font-black uppercase tracking-widest bg-[var(--card-bg)] text-[var(--text-accent)] border-2 border-[var(--text-accent)]" style="border-radius: 0px !important;">
                  {{ lesson().discipline }}
                </span>
              </div>
              <h1 class="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--text-color)] leading-tight">{{ lesson().title }}</h1>
              <p class="text-xl md:text-2xl text-[var(--text-color-muted)] font-serif italic border-l-4 border-[var(--text-accent)] pl-6 py-2">
                {{ lesson().description }}
              </p>
            </div>

            <div class="prose max-w-none prose-lg article-content" [innerHTML]="renderedContent()"></div>

            <!-- Interleaved Learning: Project Case Studies & Code Demos -->
            @if (relatedProjects().length > 0) {
              <div class="mt-12 pt-10 border-t-2 border-[var(--border-color)] space-y-8 animate-pop">
                <header class="space-y-2">
                  <span class="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-[var(--card-bg)] text-[var(--secondary-color)] border border-[var(--secondary-color)]" style="border-radius: 0px !important;">
                    Interleaved Learning Section
                  </span>
                  <h2 class="font-serif text-3xl text-[var(--text-color)] m-0">
                    Case Studies &amp; Code Demos
                  </h2>
                  <p class="text-xs text-[var(--text-color-muted)] leading-relaxed">
                    Bypass Einstellung cognitive bias (relying on familiar solutions) by comparing the concepts above directly with their source code implementations and live runtimes below.
                  </p>
                </header>

                <div class="space-y-8">
                  @for (project of relatedProjects(); track project.id) {
                    <div class="bg-[var(--card-bg-subtle)] border-2 border-[var(--border-color)] p-6 space-y-6 relative overflow-hidden" style="border-radius: 0px !important;">
                      <!-- Project Header -->
                      <header class="flex items-center justify-between border-b border-[var(--border-color)]/30 pb-3">
                        <span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-[var(--card-bg)] text-[var(--text-accent)] border border-[var(--text-accent)]" style="border-radius: 0px !important;">
                          {{ project.discipline }}
                        </span>
                        <span class="text-[9px] text-[var(--text-color-muted)] font-black uppercase tracking-widest">
                          Project: {{ project.id }}
                        </span>
                      </header>

                      <!-- Description -->
                      <div class="space-y-2">
                        <h3 class="font-serif text-2xl text-[var(--text-color)] m-0 leading-tight">
                          {{ project.title }}
                        </h3>
                        <p class="text-xs text-[var(--text-color-muted)] leading-relaxed m-0">
                          {{ project.description }}
                        </p>
                      </div>

                      <!-- Key Features -->
                      <div class="space-y-2">
                        <h4 class="text-[9px] font-black uppercase tracking-widest text-[var(--text-color-subtle)] m-0">
                          Key Features:
                        </h4>
                        <ul class="list-disc pl-5 text-[10px] text-[var(--text-color-muted)] space-y-0.5">
                          @for (feat of project.features; track feat) {
                            <li>{{ feat }}</li>
                          }
                        </ul>
                      </div>

                      <!-- Code Chunks (View Code Architecture) -->
                      @if (project.chunks && project.chunks.length > 0) {
                        <div class="pt-2 border-t border-[var(--border-color)]/25">
                          <button (click)="toggleProjectChunks(project.id)"
                                  class="w-full text-left flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] hover:text-[var(--secondary-color)] focus:outline-none"
                                  style="cursor: pointer; min-height: 44px;">
                            <span class="flex items-center gap-1.5">
                              <app-icon name="collection" [size]="12"></app-icon>
                              {{ activeChunkProjectId() === project.id ? 'Hide Implementation' : 'View Code Architecture' }}
                            </span>
                            <app-icon [name]="activeChunkProjectId() === project.id ? 'chevron-up' : 'chevron-down'" [size]="12"></app-icon>
                          </button>

                          @if (activeChunkProjectId() === project.id) {
                            <div class="mt-2 space-y-3 max-h-[300px] overflow-y-auto pr-1">
                              @for (chunk of project.chunks; track chunk.title; let idx = $index) {
                                <div class="p-3 border border-[var(--border-color)]/30 bg-[var(--card-bg)] space-y-1" style="border-radius: 0px !important;">
                                  <div class="flex justify-between items-center">
                                    <h5 class="text-[10px] font-bold text-[var(--primary-color)] flex items-center gap-1 m-0">
                                      <span class="w-3.5 h-3.5 bg-[var(--primary-color)] text-black text-[9px] flex items-center justify-center font-black" style="border-radius: 0px !important;">{{ idx + 1 }}</span>
                                      {{ chunk.title }}
                                    </h5>
                                    @if (chunk.codeSnippet) {
                                      <button (click)="copyCode(chunk.codeSnippet, project.id + '-' + idx)"
                                              class="text-[8px] font-black uppercase tracking-widest text-[var(--text-color-muted)] hover:text-[var(--primary-color)] focus:outline-none px-2 py-0.5 border border-[var(--border-color)]/30 bg-[var(--card-bg-subtle)]"
                                              style="border-radius: 0px !important; min-height: 28px;">
                                        {{ copiedId() === (project.id + '-' + idx) ? 'Copied!' : 'Copy Code' }}
                                      </button>
                                    }
                                  </div>
                                  <p class="text-[9px] text-[var(--text-color-muted)] leading-relaxed m-0">
                                    {{ chunk.description }}
                                  </p>
                                  @if (chunk.codeSnippet) {
                                    <pre class="bg-black p-2 text-[8px] font-mono overflow-x-auto text-[var(--text-color-subtle)] border border-[var(--border-color)]/30" style="border-radius: 0px !important;"><code>{{ chunk.codeSnippet }}</code></pre>
                                  }
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }

                      <!-- Specs / Documentation -->
                      @if (project.documentation) {
                        <div class="pt-2 border-t border-[var(--border-color)]/25">
                          <button (click)="toggleDoc(project.id)"
                                  class="w-full text-left flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--secondary-color)] hover:text-[var(--primary-color)] focus:outline-none"
                                  style="cursor: pointer; min-height: 44px;">
                            <span class="flex items-center gap-1.5">
                              <app-icon name="book-open" [size]="12"></app-icon>
                              {{ activeDocProjectId() === project.id ? 'Hide Specifications' : 'View Specs & Changelog' }}
                            </span>
                            <app-icon [name]="activeDocProjectId() === project.id ? 'chevron-up' : 'chevron-down'" [size]="12"></app-icon>
                          </button>

                          @if (activeDocProjectId() === project.id) {
                            <div class="mt-2 space-y-3 max-h-[300px] overflow-y-auto pr-1 text-[9px]">
                              <div class="p-3 border border-[var(--border-color)]/30 bg-[var(--card-bg)] space-y-1" style="border-radius: 0px !important;">
                                <h6 class="font-black uppercase tracking-widest text-[var(--secondary-color)] text-[8px] m-0">Technical Specifications:</h6>
                                <p class="text-[9px] text-[var(--text-color-muted)] leading-relaxed m-0">{{ project.documentation }}</p>
                              </div>

                              @if (project.changelog && project.changelog.length > 0) {
                                <div class="p-3 border border-[var(--border-color)]/30 bg-[var(--card-bg)] space-y-2" style="border-radius: 0px !important;">
                                  <h6 class="font-black uppercase tracking-widest text-[var(--tertiary-color)] text-[8px] m-0">Version Changelog:</h6>
                                  <div class="space-y-2">
                                    @for (entry of project.changelog; track entry.version) {
                                      <div class="border-b border-[var(--border-color)]/10 pb-1.5 last:border-b-0 last:pb-0">
                                        <div class="flex justify-between font-bold text-[9px]">
                                          <span class="text-[var(--text-color)]">{{ entry.version }}</span>
                                          <span class="text-[var(--text-color-muted)]">{{ entry.date }}</span>
                                        </div>
                                        <ul class="list-disc pl-3 text-[8px] text-[var(--text-color-subtle)] mt-0.5 space-y-0.5">
                                          @for (change of entry.changes; track change) {
                                            <li>{{ change }}</li>
                                          }
                                        </ul>
                                      </div>
                                    }
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }

                      <!-- Live Interactive Sandbox inside Project Card -->
                      @if (project.id === 'lojong-breathing' || project.id === 'clockwork-gears' || project.id === 'fluid-dynamics' || project.id === 'relational-nodes' || project.id === 'ambient-synth' || project.id === 'a11y-assistant' || project.id === 'genai-weaver') {
                        <div class="pt-2 border-t border-[var(--border-color)]/25">
                          <button (click)="toggleSandbox(project.id)"
                                  class="w-full text-left flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--tertiary-color)] hover:text-[var(--secondary-color)] focus:outline-none"
                                  style="cursor: pointer; min-height: 44px;">
                            <span class="flex items-center gap-1.5">
                              <app-icon name="zap" [size]="12"></app-icon>
                              {{ activeSandboxProjectId() === project.id ? 'Close Sandbox' : 'Run Interactive Demo Sandbox' }}
                            </span>
                            <app-icon [name]="activeSandboxProjectId() === project.id ? 'chevron-up' : 'chevron-down'" [size]="12"></app-icon>
                          </button>

                          @if (activeSandboxProjectId() === project.id) {
                            <div class="mt-2">
                              @switch (project.id) {
                                @case ('lojong-breathing') {
                                  <div class="p-4 border border-[var(--border-color)] bg-[var(--card-bg)] space-y-3" style="border-radius: 0px !important;">
                                    <h6 class="text-[9px] font-black uppercase tracking-widest text-[var(--primary-color)] m-0">Live Meditative Respiration Guide</h6>
                                    <app-lojong-cleansing></app-lojong-cleansing>
                                  </div>
                                }
                                @case ('clockwork-gears') {
                                  <div class="p-4 border border-[var(--border-color)] bg-[var(--card-bg)] space-y-4 text-center" style="border-radius: 0px !important;">
                                    <h6 class="text-[9px] font-black uppercase tracking-widest text-[var(--primary-color)] text-left m-0">Live Kinetic Engine Simulator</h6>
                                    <div class="flex justify-center py-2">
                                      <svg width="70" height="70" viewBox="0 0 100 100" class="overflow-visible">
                                        <g [style.transform]="'rotate(' + gearRotationAngle() + 'deg)'" style="transform-origin: 50px 50px;">
                                          <circle cx="50" cy="50" r="36" fill="none" stroke="var(--primary-color)" stroke-width="4" stroke-dasharray="10 5"></circle>
                                          <circle cx="50" cy="50" r="12" fill="var(--primary-color)"></circle>
                                          <line x1="50" y1="12" x2="50" y2="88" stroke="black" stroke-width="3"></line>
                                          <line x1="12" y1="50" x2="88" y2="50" stroke="black" stroke-width="3"></line>
                                        </g>
                                      </svg>
                                    </div>
                                    <div class="flex flex-col gap-2 text-[9px] text-left">
                                      <div class="flex justify-between items-center">
                                        <span>Rotation Speed: {{ gearSpeed() }}x</span>
                                        <input type="range" min="1" max="5" [value]="gearSpeed()" (input)="updateGearSpeed($event)" class="w-24 accent-[var(--primary-color)] h-1 cursor-pointer">
                                      </div>
                                      <button (click)="toggleGearRunning()" class="w-full bg-[var(--button-bg)] hover:bg-[var(--primary-color)] hover:text-black py-1.5 px-3 border border-[var(--border-color)] font-bold transition-all text-[8px] uppercase tracking-wider" style="border-radius:0px !important; min-height: 28px;">
                                        {{ gearIsRunning() ? 'Pause Rotation' : 'Resume Rotation' }}
                                      </button>
                                    </div>
                                  </div>
                                }
                                @case ('fluid-dynamics') {
                                  <div class="p-4 border border-[var(--border-color)] bg-[var(--card-bg)] space-y-3 text-center" style="border-radius: 0px !important;">
                                    <h6 class="text-[9px] font-black uppercase tracking-widest text-[var(--primary-color)] text-left m-0">Live Convection Flow Sketchpad</h6>
                                    <p class="text-[8px] text-[var(--text-color-muted)] text-left m-0">Click &amp; drag across the pad to trigger simulated wind eddies.</p>
                                    <div class="bg-black border border-[var(--border-color)] relative" style="height: 120px; border-radius: 0px !important;">
                                      <div class="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-[var(--primary-color)] hover:bg-neutral-900 cursor-crosshair select-none"
                                           (mousemove)="updateWindCurrent($event)"
                                           (mousedown)="startWindCurrent()"
                                           (mouseup)="stopWindCurrent()"
                                           (mouseleave)="stopWindCurrent()">
                                        @if (!windCurrentActive()) {
                                          <span>Hover / Drag to Visualise Wind Current</span>
                                        } @else {
                                          <span class="animate-pulse">Active Force Vectors: {{ windForce() }} N</span>
                                        }
                                      </div>
                                    </div>
                                  </div>
                                }
                                 @case ('ambient-synth') {
                                  <div class="p-4 border border-[var(--border-color)] bg-[var(--card-bg)] space-y-3" style="border-radius: 0px !important;">
                                    <h6 class="text-[9px] font-black uppercase tracking-widest text-[var(--primary-color)] m-0">Interactive XY Frequency Synth</h6>
                                    <div class="relative overflow-hidden bg-black border border-[var(--border-color)]" style="height: 100px; border-radius: 0px !important;">
                                      <div class="absolute inset-0 flex flex-col justify-center items-center cursor-crosshair select-none transition-all hover:bg-neutral-950 z-20"
                                           (mousemove)="synthUpdateFreq($event)"
                                           (mousedown)="synthStart()"
                                           (mouseup)="synthStop()"
                                           (mouseleave)="synthStop()">
                                        @if (!synthIsPlaying()) {
                                          <span class="text-[9px] text-[var(--text-color-muted)] font-black uppercase tracking-wider">Drag to Sweeps Resonance</span>
                                        } @else {
                                          <span class="text-[10px] font-mono text-[var(--primary-color)] font-bold bg-black/75 px-2 py-0.5" style="border-radius: 0px !important;">{{ synthFrequency() }} Hz Frequency</span>
                                        }
                                      </div>
                                    </div>
                                    <div class="flex justify-between items-center text-[8px] font-bold">
                                      <span>Waveform:</span>
                                      <div class="flex gap-1">
                                        @for (type of ['sine', 'square', 'sawtooth', 'triangle']; track type) {
                                          <button (click)="synthUpdateOscType(type)"
                                                  [class.bg-[var(--primary-color)]]="synthOscType() === type"
                                                  [class.text-black]="synthOscType() === type"
                                                  class="px-1.5 py-0.5 border border-[var(--border-color)] uppercase text-[7px]" style="border-radius:0px !important; min-height: 28px;">
                                            {{ type }}
                                          </button>
                                        }
                                      </div>
                                    </div>
                                  </div>
                                }
                                @case ('a11y-assistant') {
                                  <div class="p-4 border border-[var(--border-color)] bg-[var(--card-bg)] space-y-3" style="border-radius: 0px !important;">
                                    <h6 class="text-[9px] font-black uppercase tracking-widest text-[var(--primary-color)] m-0">Accessibility Auditor Sandbox</h6>
                                    <div class="flex flex-col gap-2 text-[9px]">
                                      <div class="bg-[var(--card-bg-subtle)] p-2.5 border border-[var(--border-color)]/30 font-mono text-[8px] min-h-[36px]" style="border-radius: 0px !important;">
                                        <strong>Audible Speech Output:</strong> {{ simulatedSpeechText() || 'Silence. Select a node below.' }}
                                      </div>
                                      <div class="grid grid-cols-2 gap-2 pt-1">
                                        <button (click)="speakA11yText('Auditing document node: WCAG 2.1 compliance verified.')" class="bg-[var(--button-bg)] hover:bg-[var(--primary-color)] hover:text-black py-1.5 border border-[var(--border-color)] text-[8px] uppercase tracking-wider font-bold" style="border-radius: 0px !important; min-height: 28px;">
                                          Audit Node
                                        </button>
                                        <button (click)="speakA11yText('Dynamic announcement: Interactive detailed skills matrix focused.')" class="bg-[var(--button-bg)] hover:bg-[var(--primary-color)] hover:text-black py-1.5 border border-[var(--border-color)] text-[8px] uppercase tracking-wider font-bold" style="border-radius: 0px !important; min-height: 28px;">
                                          Announce Live
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                }
                                @case ('genai-weaver') {
                                  <div class="p-4 border border-[var(--border-color)] bg-[var(--card-bg)] space-y-3" style="border-radius: 0px !important;">
                                    <h6 class="text-[9px] font-black uppercase tracking-widest text-[var(--primary-color)] m-0">LLM Streaming SSE Simulator</h6>
                                    <div class="flex flex-col gap-2 text-[9px]">
                                      <input type="text" [value]="weaverPrompt()" (input)="updateWeaverPrompt($event)" class="p-1.5 bg-black border border-[var(--border-color)] text-[9px] font-mono text-white" style="border-radius: 0px !important;">
                                      <button (click)="runWeaverMockStream()" [disabled]="weaverIsStreaming()" class="bg-[var(--secondary-color)] text-white hover:bg-[#d94f44] py-1.5 border border-transparent text-[8px] uppercase tracking-wider font-black" style="border-radius: 0px !important; min-height: 28px;">
                                        {{ weaverIsStreaming() ? 'Streaming SSE Chunks...' : 'Weave Creative Prompt' }}
                                      </button>
                                      @if (weaverStreamingText()) {
                                        <pre class="bg-black p-2 border border-[var(--border-color)]/30 text-[8px] font-mono text-[var(--text-color-subtle)] overflow-x-auto whitespace-pre-wrap max-h-[80px]" style="border-radius: 0px !important;"><code>{{ weaverStreamingText() }}</code></pre>
                                      }
                                    </div>
                                  </div>
                                }
                                @case ('relational-nodes') {
                                  <div class="p-4 border border-[var(--border-color)] bg-[var(--card-bg)] space-y-3" style="border-radius: 0px !important;">
                                    <h6 class="text-[9px] font-black uppercase tracking-widest text-[var(--primary-color)] m-0">Live D3 Physics Graph Preview</h6>
                                    <div style="height: 200px;" class="border border-[var(--border-color)] bg-black overflow-hidden relative">
                                      <app-graph-view [projects]="allProjects" [activeLesson]="lesson()" (nodeSelected)="handleNodeSelected($event)"></app-graph-view>
                                    </div>
                                  </div>
                                }
                              }
                            </div>
                          }
                        </div>
                      }

                      <!-- Action footer -->
                      <div class="flex items-center justify-between pt-4 mt-4 border-t border-[var(--border-color)]/30 text-[10px]">
                        <div class="flex items-center gap-2">
                          <a [href]="project.demoUrl" target="_blank" class="font-black uppercase tracking-widest text-[var(--text-accent)] hover:text-[var(--secondary-color)] flex items-center gap-1 min-h-[44px]" style="display: inline-flex; align-items: center;">
                            Demo
                            <app-icon name="external-link" [size]="10"></app-icon>
                          </a>
                          <a [href]="project.codeUrl" target="_blank" class="font-black uppercase tracking-widest text-[var(--text-accent)] hover:text-[var(--secondary-color)] flex items-center gap-1 min-h-[44px]" style="display: inline-flex; align-items: center; margin-left: 12px;">
                            Code
                            <app-icon name="copy" [size]="10"></app-icon>
                          </a>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Right Sidebar -->
          <aside class="lg:col-span-4 p-8 md:p-12 bg-[var(--card-bg)] space-y-10 waterfall-item delay-200">
            <!-- Interactive Sandbox / Live Lab -->
            @if (hasSandbox()) {
              <div class="border-2 border-[var(--secondary-color)] p-5 space-y-4" style="border-radius: 0px !important;">
                <h3 class="text-xs font-black uppercase tracking-widest text-[var(--secondary-color)] flex items-center gap-1.5 m-0 pb-2 border-b border-[var(--border-color)]/30">
                  <app-icon name="zap" [size]="14"></app-icon>
                  Interactive Lab Sandbox
                </h3>
                
                @switch (lesson().id) {
                  @case ('interactive-svg-math') {
                    <div class="space-y-4 text-xs">
                      <div class="space-y-2">
                        <span class="font-bold text-[var(--text-color)] block text-left">Live Respiration Guide</span>
                        <app-lojong-cleansing></app-lojong-cleansing>
                      </div>
                      <div class="border-t border-[var(--border-color)]/20 pt-3 space-y-3 text-center">
                        <span class="font-bold text-[var(--text-color)] text-left block">Live Kinetic Gear Simulator</span>
                        <div class="flex justify-center py-2">
                          <svg width="70" height="70" viewBox="0 0 100 100" class="overflow-visible">
                            <g [style.transform]="'rotate(' + gearRotationAngle() + 'deg)'" style="transform-origin: 50px 50px;">
                              <circle cx="50" cy="50" r="36" fill="none" stroke="var(--primary-color)" stroke-width="4" stroke-dasharray="10 5"></circle>
                              <circle cx="50" cy="50" r="12" fill="var(--primary-color)"></circle>
                              <line x1="50" y1="12" x2="50" y2="88" stroke="black" stroke-width="3"></line>
                              <line x1="12" y1="50" x2="88" y2="50" stroke="black" stroke-width="3"></line>
                            </g>
                          </svg>
                        </div>
                        <div class="flex flex-col gap-2 text-left">
                          <div class="flex justify-between items-center">
                            <span>Rotation Speed: {{ gearSpeed() }}x</span>
                            <input type="range" min="1" max="5" [value]="gearSpeed()" (input)="updateGearSpeed($event)" class="w-24 accent-[var(--primary-color)] h-1 cursor-pointer">
                          </div>
                          <button (click)="toggleGearRunning()" class="w-full bg-[var(--button-bg)] hover:bg-[var(--primary-color)] hover:text-black py-1.5 px-3 border border-[var(--border-color)] font-bold transition-all text-[8px] uppercase tracking-wider" style="border-radius:0px !important; min-height: 28px;">
                            {{ gearIsRunning() ? 'Pause Rotation' : 'Resume Rotation' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                  @case ('canvas-fluid-physics') {
                    <div class="space-y-3 text-xs">
                      <span class="font-bold text-[var(--text-color)] block">Live Convection Flow Sketchpad</span>
                      <p class="text-[9px] text-[var(--text-color-muted)] m-0">Click &amp; drag across the pad to trigger simulated wind eddies.</p>
                      <div class="bg-black border border-[var(--border-color)] relative" style="height: 120px; border-radius: 0px !important;">
                        <div class="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-[var(--primary-color)] hover:bg-neutral-900 cursor-crosshair select-none"
                             (mousemove)="updateWindCurrent($event)"
                             (mousedown)="startWindCurrent()"
                             (mouseup)="stopWindCurrent()"
                             (mouseleave)="stopWindCurrent()">
                          @if (!windCurrentActive()) {
                            <span>Hover / Drag to Visualise Wind Current</span>
                          } @else {
                            <span class="animate-pulse">Active Force Vectors: {{ windForce() }} N</span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                  @case ('web-audio-synthesis') {
                    <div class="space-y-3 text-xs">
                      <span class="font-bold text-[var(--text-color)] block">Interactive XY Frequency Synth</span>
                      <div class="relative overflow-hidden bg-black border border-[var(--border-color)]" style="height: 100px; border-radius: 0px !important;">
                        @if (synthIsPlaying()) {
                          <svg class="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 300 100" preserveAspectRatio="none">
                            <path [attr.d]="synthWaveformPath()" fill="none" stroke="var(--primary-color)" stroke-width="2"></path>
                          </svg>
                        }
                        <div class="absolute inset-0 flex flex-col justify-center items-center cursor-crosshair select-none transition-all hover:bg-neutral-950 z-20"
                             (mousemove)="synthUpdateFreq($event)"
                             (mousedown)="synthStart()"
                             (mouseup)="synthStop()"
                             (mouseleave)="synthStop()">
                          @if (!synthIsPlaying()) {
                            <span class="text-[9px] text-[var(--text-color-muted)] font-black uppercase tracking-wider">Drag to Sweeps Resonance</span>
                          } @else {
                            <span class="text-[10px] font-mono text-[var(--primary-color)] font-bold bg-black/75 px-2 py-0.5" style="border-radius: 0px !important;">{{ synthFrequency() }} Hz Frequency</span>
                          }
                        </div>
                      </div>
                      <div class="flex justify-between items-center text-[9px] font-bold">
                        <span>Waveform:</span>
                        <div class="flex gap-1">
                          @for (type of ['sine', 'square', 'sawtooth', 'triangle']; track type) {
                            <button (click)="synthUpdateOscType(type)"
                                    [class.bg-[var(--primary-color)]]="synthOscType() === type"
                                    [class.text-black]="synthOscType() === type"
                                    class="px-1.5 py-0.5 border border-[var(--border-color)] uppercase text-[7px]" style="border-radius:0px !important;">
                              {{ type }}
                            </button>
                          }
                        </div>
                      </div>
                    </div>
                  }
                  @case ('a11y-systems-strategy') {
                    <div class="space-y-3 text-xs">
                      <span class="font-bold text-[var(--text-color)] block">Accessibility Auditor Sandbox</span>
                      <div class="flex flex-col gap-2">
                        <div class="bg-[var(--card-bg-subtle)] p-2.5 border border-[var(--border-color)]/30 font-mono text-[9px] min-h-[36px]" style="border-radius: 0px !important;">
                          <strong>Audible Speech Output:</strong> {{ simulatedSpeechText() || 'Silence. Select a node below.' }}
                        </div>
                        <div class="grid grid-cols-2 gap-2 pt-1">
                          <button (click)="speakA11yText('Auditing document node: WCAG 2.1 compliance verified.')" class="bg-[var(--button-bg)] hover:bg-[var(--primary-color)] hover:text-black py-1.5 border border-[var(--border-color)] text-[8px] uppercase tracking-wider font-bold" style="border-radius: 0px !important; min-height: 28px;">
                            Audit Node
                          </button>
                          <button (click)="speakA11yText('Dynamic announcement: Interactive detailed skills matrix focused.')" class="bg-[var(--button-bg)] hover:bg-[var(--primary-color)] hover:text-black py-1.5 border border-[var(--border-color)] text-[8px] uppercase tracking-wider font-bold" style="border-radius: 0px !important; min-height: 28px;">
                            Announce Live
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                  @case ('generative-codesign-llms') {
                    <div class="space-y-3 text-xs">
                      <span class="font-bold text-[var(--text-color)] block">LLM Streaming SSE Simulator</span>
                      <div class="flex flex-col gap-2">
                        <input type="text" [value]="weaverPrompt()" (input)="updateWeaverPrompt($event)" class="p-1.5 bg-black border border-[var(--border-color)] text-[9px] font-mono text-white" style="border-radius: 0px !important;">
                        <button (click)="runWeaverMockStream()" [disabled]="weaverIsStreaming()" class="bg-[var(--secondary-color)] text-white hover:bg-[#d94f44] py-1.5 border border-transparent text-[8px] uppercase tracking-wider font-black" style="border-radius: 0px !important; min-height: 28px;">
                          {{ weaverIsStreaming() ? 'Streaming SSE Chunks...' : 'Weave Creative Prompt' }}
                        </button>
                        @if (weaverStreamingText()) {
                          <pre class="bg-black p-2 border border-[var(--border-color)]/30 text-[8px] font-mono text-[var(--text-color-subtle)] overflow-x-auto whitespace-pre-wrap max-h-[80px]" style="border-radius: 0px !important;"><code>{{ weaverStreamingText() }}</code></pre>
                        }
                      </div>
                    </div>
                  }
                }
              </div>
            }

            <!-- Tech Stack -->
            <div>
              <h3 class="font-serif text-xl font-bold border-b border-[var(--border-color)] pb-3 mb-4 text-[var(--text-accent)] flex items-center gap-2">
                <app-icon name="cpu" [size]="20"></app-icon> Technology Stack
              </h3>
              <div class="flex flex-wrap gap-2">
                @for (tech of lesson().technologies; track tech) {
                  <span class="px-4 py-2 text-xs font-bold rounded-lg bg-[var(--card-bg)] text-[var(--text-color-muted)] border-2 border-[var(--border-color)] ">
                    {{ tech }}
                  </span>
                }
              </div>
            </div>

            <!-- Related -->
            <div>
              <h3 class="font-serif text-xl font-bold border-b border-[var(--border-color)] pb-3 mb-4 text-[var(--text-accent)] flex items-center gap-2">
                <app-icon name="layers" [size]="20"></app-icon> Related Projects
              </h3>
              <div class="space-y-4">
                @for (proj of relatedProjects(); track proj.id) {
                  <button (click)="viewProject.emit(proj.title)" class="w-full text-left p-5 rounded-2xl border-2 border-[var(--border-color)] hover:border-[var(--text-accent)] transition-all bg-[var(--card-bg)] hover: group">
                    <h4 class="font-bold text-base group-hover:text-[var(--text-accent)] transition-colors">{{ proj.title }}</h4>
                    <p class="text-xs text-[var(--text-color-muted)] line-clamp-2 mt-2 leading-relaxed">{{ proj.description }}</p>
                    <div class="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[var(--text-accent)]">
                      Explore Project <app-icon name="arrow-right" [size]="12" class="group-hover:translate-x-1 transition-transform"></app-icon>
                    </div>
                  </button>
                }
              </div>
            </div>
          </aside>
        </div>
      </article>
    </div>
  `,
  styles: [`
    :host ::ng-deep .article-content h1 {
      font-size: 2rem;
      font-family: var(--font-serif, serif);
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      color: var(--text-accent);
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    :host ::ng-deep .article-content h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
      color: var(--text-color);
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 0.4rem;
    }
    :host ::ng-deep .article-content h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      color: var(--text-color);
    }
    :host ::ng-deep .article-content h4 {
      font-size: 1rem;
      font-weight: 700;
      margin-top: 1.25rem;
      margin-bottom: 0.4rem;
      color: var(--text-color);
    }
    :host ::ng-deep .article-content p {
      margin-bottom: 1.25rem;
      line-height: 1.8;
      font-size: 1rem;
      color: var(--text-color);
    }
    :host ::ng-deep .article-content ul,
    :host ::ng-deep .article-content ol {
      margin: 0 0 1.25rem 1.5rem;
      padding-left: 0.5rem;
    }
    :host ::ng-deep .article-content ul { list-style-type: disc; }
    :host ::ng-deep .article-content ol { list-style-type: decimal; }
    :host ::ng-deep .article-content li {
      margin-bottom: 0.4rem;
      line-height: 1.7;
      color: var(--text-color);
    }
    :host ::ng-deep .article-content pre {
      background: var(--card-bg);
      border: 2px solid var(--border-color);
      border-left: 4px solid var(--primary-color);
      border-radius: 0.5rem;
      padding: 1.25rem;
      overflow-x: auto;
      margin: 1.25rem 0;
      font-size: 0.875rem;
      line-height: 1.6;
    }
    :host ::ng-deep .article-content code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.875em;
      color: var(--text-accent);
      background: var(--card-bg);
      border: 2px solid var(--border-color);
      padding: 0.15em 0.4em;
      border-radius: 0.25rem;
    }
    :host ::ng-deep .article-content pre code {
      background: none;
      border: none;
      padding: 0;
      color: var(--text-color);
      font-size: inherit;
    }
    :host ::ng-deep .article-content blockquote {
      border-left: 4px solid var(--secondary-color);
      margin: 1.25rem 0;
      padding: 0.75rem 1.25rem;
      background: var(--card-bg);
      color: var(--text-color);
      font-style: italic;
    }
    :host ::ng-deep .article-content blockquote p {
      margin: 0;
    }
    :host ::ng-deep .article-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.9rem;
    }
    :host ::ng-deep .article-content th {
      background: var(--card-bg);
      color: var(--text-accent);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      padding: 0.75rem 1rem;
      border: 2px solid var(--border-color);
      text-align: left;
    }
    :host ::ng-deep .article-content td {
      padding: 0.65rem 1rem;
      border: 2px solid var(--border-color);
      color: var(--text-color);
      vertical-align: top;
    }
    :host ::ng-deep .article-content tr:nth-child(even) td {
      background: var(--card-bg);
    }
    :host ::ng-deep .article-content strong {
      font-weight: 700;
      color: var(--text-color);
    }
    :host ::ng-deep .article-content em {
      font-style: italic;
      color: var(--tertiary-color);
    }
    :host ::ng-deep .article-content hr {
      border: none;
      border-top: 2px solid var(--border-color);
      margin: 2rem 0;
    }
    :host ::ng-deep .article-content a {
      color: var(--primary-color);
      text-decoration: underline;
      font-weight: 600;
    }
  `],})
export class LessonDetailComponent implements OnDestroy {
  lesson = input.required<Lesson>();
  theme = input<Theme>('dark');
  goBack = output<void>();
  viewProject = output<string>();

  private sanitizer = inject(DomSanitizer);
  curriculumService = inject(CurriculumService);

  allProjects = PROJECTS;

  activeChunkProjectId = signal<string | null>(null);
  activeDocProjectId = signal<string | null>(null);
  activeSandboxProjectId = signal<string | null>(null);
  copiedId = signal<string | null>(null);

  // Sandbox state signals
  gearIsRunning = signal(true);
  gearSpeed = signal(2);
  gearRotationAngle = signal(0);
  private gearInterval: any = null;

  windCurrentActive = signal(false);
  windForce = signal(0);

  synthIsPlaying = signal(false);
  synthFrequency = signal(440);
  synthOscType = signal<'sine' | 'square' | 'sawtooth' | 'triangle'>('sine');
  private audioCtx: AudioContext | null = null;
  private oscNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  simulatedSpeechText = signal('');

  weaverPrompt = signal('Pacific Northwest Pine Forest at sunrise');
  weaverIsStreaming = signal(false);
  weaverStreamingText = signal('');

  hasSandbox = computed<boolean>(() => {
    const id = this.lesson().id;
    return ['interactive-svg-math', 'canvas-fluid-physics', 'web-audio-synthesis', 'a11y-systems-strategy', 'generative-codesign-llms'].includes(id);
  });

  constructor() {
    effect(() => {
      // Access lesson() and theme() to trigger reactive dependency tracking
      this.lesson();
      this.theme();
      setTimeout(() => {
        this.renderMermaidDiagrams();
      }, 50);
    });

    this.startGears();
  }

  ngOnDestroy(): void {
    this.stopGears();
    this.synthStop();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  startGears() {
    let lastTime = performance.now();
    const tick = (time: number) => {
      if (this.gearIsRunning()) {
        const delta = time - lastTime;
        const rate = 0.072 * this.gearSpeed();
        this.gearRotationAngle.update(current => (current + rate * delta) % 360);
      }
      lastTime = time;
      if (this.gearInterval !== null) {
        this.gearInterval = requestAnimationFrame(tick);
      }
    };
    this.gearInterval = requestAnimationFrame(tick);
  }

  stopGears() {
    if (this.gearInterval !== null) {
      cancelAnimationFrame(this.gearInterval);
      this.gearInterval = null;
    }
  }

  toggleGearRunning() {
    this.gearIsRunning.update(c => !c);
  }

  updateGearSpeed(event: Event) {
    const val = +(event.target as HTMLInputElement).value;
    this.gearSpeed.set(val);
  }

  startWindCurrent() {
    this.windCurrentActive.set(true);
  }

  stopWindCurrent() {
    this.windCurrentActive.set(false);
    this.windForce.set(0);
  }

  updateWindCurrent(event: MouseEvent) {
    if (!this.windCurrentActive()) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const force = Math.round(Math.sqrt(x*x + y*y) / 10);
    this.windForce.set(force);
  }

  synthStart() {
    if (this.synthIsPlaying()) return;
    try {
      const WebkitAudioContext = (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new (window.AudioContext || WebkitAudioContext)();
      this.oscNode = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();
      
      this.oscNode.type = this.synthOscType();
      this.oscNode.frequency.setValueAtTime(this.synthFrequency(), this.audioCtx.currentTime);
      this.gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      
      this.oscNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
      this.oscNode.start();
      this.synthIsPlaying.set(true);
    } catch (e) {
      console.error('Failed to init Web Audio context:', e);
    }
  }

  synthUpdateFreq(event: MouseEvent) {
    if (!this.synthIsPlaying() || !this.oscNode || !this.audioCtx) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    
    const freq = Math.round(110 * Math.pow(8, pct));
    this.synthFrequency.set(freq);
    this.oscNode.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
  }

  synthUpdateOscType(type: string) {
    const t = type as 'sine' | 'square' | 'sawtooth' | 'triangle';
    this.synthOscType.set(t);
    if (this.oscNode) {
      this.oscNode.type = t;
    }
  }

  synthStop() {
    if (!this.synthIsPlaying()) return;
    try {
      if (this.oscNode) {
        this.oscNode.stop();
        this.oscNode.disconnect();
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
      }
      this.oscNode = null;
      this.gainNode = null;
      this.synthIsPlaying.set(false);
    } catch (e) {
      console.error('Failed to stop Web Audio Context:', e);
    }
  }

  speakA11yText(text: string) {
    this.simulatedSpeechText.set(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  }

  updateWeaverPrompt(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.weaverPrompt.set(val);
  }

  runWeaverMockStream() {
    if (this.weaverIsStreaming()) return;
    this.weaverIsStreaming.set(true);
    this.weaverStreamingText.set('');
    
    const outputTokens = [
      '{"status": "processing", ',
      '"concept": "Interleaved Learning Guide", ',
      '"design_rationale": "Applying dynamic code sandboxes to reinforce theoretical reading and bypass Einstellung habitual thinking.", ',
      '"accessibility_compliance": "WCAG AA, focus outline tabs", ',
      '"code_chunks": [{"title": "Web Audio oscillator", "lines": 35}, {"title": "Sinusoidal easing path", "lines": 42}], ',
      '"deployment_ready": true}'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < outputTokens.length) {
        this.weaverStreamingText.update(current => current + outputTokens[index]);
        index++;
      } else {
        clearInterval(interval);
        this.weaverIsStreaming.set(false);
      }
    }, 600);
  }

  safeVideoUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.lesson().videoUrl;
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  relatedProjects = computed<Project[]>(() => {
    const projectIds = this.lesson().relatedProjectIds;
    return PROJECTS.filter(p => projectIds.includes(p.id));
  });

  renderedContent = computed<SafeHtml>(() => {
    return this.renderMarkdown(this.lesson().contentMarkdown);
  });

  toggleCurriculum(): void {
    const id = this.lesson().id;
    if (this.curriculumService.isSaved(id)) {
      this.curriculumService.removeLesson(id);
    } else {
      this.curriculumService.saveLesson(id);
    }
  }

  private async renderMermaidDiagrams() {
    const isDark = this.theme() === 'dark';
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      themeVariables: {
        background: isDark ? '#000000' : '#ffffff',
        primaryColor: '#3ebc9e',
        secondaryColor: '#ef6658',
        tertiaryColor: '#faa63c',
        primaryTextColor: isDark ? '#ffffff' : '#000000',
        lineColor: '#3ebc9e',
        actorBorder: '#3ebc9e',
        signalColor: '#ef6658',
        signalLineColor: '#ef6658',
        actorBkg: isDark ? '#000000' : '#ffffff',
        actorTextColor: isDark ? '#ffffff' : '#000000',
        mainBkg: isDark ? '#121212' : '#f7fafc',
        nodeBorder: '#3ebc9e',
        nodeTextColor: isDark ? '#ffffff' : '#000000',
        textColor: isDark ? '#ffffff' : '#000000',
        edgeLabelBackground: isDark ? '#000000' : '#ffffff',
        labelTextColor: isDark ? '#ffffff' : '#000000'
      }
    });

    const containers = document.querySelectorAll('.mermaid-diagram-container');
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      const sourceEl = container.querySelector('.mermaid');
      const targetEl = container.querySelector('.mermaid-rendered');
      if (sourceEl && targetEl) {
        const code = sourceEl.textContent || '';
        const id = `mermaid-svg-${this.lesson().id}-${i}`;
        try {
          targetEl.innerHTML = '<div class="text-xs text-[var(--text-color-subtle)] p-2">Rendering diagram...</div>';
          const { svg } = await mermaid.render(id, code);
          targetEl.innerHTML = svg;
        } catch (err) {
          console.error('Mermaid render error:', err);
          targetEl.innerHTML = `<div class="text-xs text-[var(--color-danger)] font-bold p-2">Failed to render Mermaid diagram: ${(err as Error).message}</div>`;
        }
      }
    }
  }

  toggleProjectChunks(projectId: string) {
    this.activeChunkProjectId.update(current => current === projectId ? null : projectId);
  }

  toggleDoc(projectId: string) {
    this.activeDocProjectId.update(current => current === projectId ? null : projectId);
  }

  toggleSandbox(projectId: string) {
    this.activeSandboxProjectId.update(current => {
      const next = current === projectId ? null : projectId;
      if (current === 'ambient-synth') {
        this.synthStop();
      }
      return next;
    });
  }

  copyCode(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedId.set(id);
      setTimeout(() => { if (this.copiedId() === id) this.copiedId.set(null); }, 2000);
    }).catch(err => console.error('Failed to copy: ', err));
  }

  handleNodeSelected(event: { id: string; type: string; rawId: string }) {
    console.log('Graph node clicked inside lesson details:', event);
  }

  private renderMarkdown(md: string): SafeHtml {
    if (!md) return this.sanitizer.bypassSecurityTrustHtml('');

    // Pre-process math blocks before marked consumes them
    // Replace $$ ... $$ with a placeholder div
    const processed = md
      .replace(/\$\$([\s\S]*?)\$\$/g, (_: string, formula: string) =>
        `<div class="math-block">${formula.trim()}</div>`
      )
      .replace(/\$([^$\n]+)\$/g, (_: string, formula: string) =>
        `<span class="math-inline">${formula}</span>`
      );

    const renderer = new Renderer();

    // Headers — let CSS handle styling via ::ng-deep
    renderer.heading = ({ text, depth }: { text: string; depth: number }) =>
      `<h${depth}>${text}</h${depth}>\n`;

    // Paragraphs
    renderer.paragraph = ({ text }: { text: string }) =>
      `<p>${text}</p>\n`;

    // Code blocks with language label
    renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
      if (lang === 'mermaid') {
        return `<div class="mermaid-diagram-container border-2 border-[var(--border-color)] p-4 bg-[var(--card-bg)] flex justify-center mb-6"><pre class="mermaid mb-0" style="display:none;">${text}</pre><div class="mermaid-rendered w-full"></div></div>\n`;
      }
      const langLabel = lang
        ? `<span class="code-lang-label">${lang}</span>`
        : '';
      return `<pre>${langLabel}<code class="language-${lang ?? 'text'}">${text}</code></pre>\n`;
    };

    // Inline code
    renderer.codespan = ({ text }: { text: string }) =>
      `<code>${text}</code>`;

    // Blockquotes
    renderer.blockquote = ({ text }: { text: string }) =>
      `<blockquote>${text}</blockquote>\n`;

    // Tables
    renderer.table = ({ header, rows }: { header: TableCell[]; rows: TableCell[][] }) => {
      const thead = `<thead><tr>${header.map((h: TableCell) => `<th>${h.text}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${rows.map((row: TableCell[]) =>
        `<tr>${row.map((cell: TableCell) => `<td>${cell.text}</td>`).join('')}</tr>`
      ).join('')}</tbody>`;
      return `<table>${thead}${tbody}</table>\n`;
    };

    // Links
    renderer.link = ({ href, title, text }: { href: string; title?: string | null; text: string }) =>
      `<a href="${href}" target="_blank" rel="noopener noreferrer"${title ? ` title="${title}"` : ''}>${text}</a>`;

    // Strong / bold
    renderer.strong = ({ text }: { text: string }) => `<strong>${text}</strong>`;

    // Emphasis / italic
    renderer.em = ({ text }: { text: string }) => `<em>${text}</em>`;

    // HR
    renderer.hr = () => `<hr>\n`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    marked.setOptions({ renderer, breaks: true, gfm: true } as any);

    const rawHtml = marked.parse(processed) as string;
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }
}

/**
 * Lazy in-browser WebGPU / ONNX Runtime engine using `@huggingface/transformers`.
 *
 * Designed as a pure TypeScript module with ZERO Angular DI (`inject()`) dependencies
 * so it can be unit-tested in Node and dynamically imported in browsers without
 * pulling `@huggingface/transformers` into the initial `main` bundle.
 *
 * CSP & Observatory 125+ Compatibility:
 * - Forces `env.useWasmCache = false` and `wasmPaths = '/assets/ort/'` (string) so
 *   ONNX Runtime loads self-hosted same-origin `.wasm` and `.mjs` files instead of
 *   synthesizing `blob:` script URLs (`script-src` remains free of `'unsafe-inline'`,
 *   `'unsafe-eval'`, and `blob:`).
 * - Note: Browser WebAssembly compilation inside ONNX Runtime requires `'wasm-unsafe-eval'`
 *   in `script-src` (enabled on Express / Cloud Run server CSP). Static Firebase Hosting
 *   retains `script-src 'self'` to preserve static Observatory guardrails.
 */

export type WebGpuModelKey = 'smollm3-3b' | 'gemma4-e2b' | 'medgemma-4b';

export interface WebGpuModelSpec {
  key: WebGpuModelKey;
  hfModelId: string;
  label: string;
  shortLabel: string;
  dtype: 'q4f16' | 'q4';
  approxDownloadLabel: string;
  recommendedRole: string;
  isGemma4Multimodal: boolean;
}

export const WEBGPU_MODEL_CATALOG: Record<WebGpuModelKey, WebGpuModelSpec> = {
  'smollm3-3b': {
    key: 'smollm3-3b',
    hfModelId: 'HuggingFaceTB/SmolLM3-3B-ONNX',
    label: 'SmolLM3 3B (ONNX q4f16)',
    shortLabel: 'SmolLM3 3B',
    dtype: 'q4f16',
    approxDownloadLabel: '~2.0 GB WebGPU cache',
    recommendedRole: 'Fast zero-network daily lateral thinking & JSON generation',
    isGemma4Multimodal: false,
  },
  'gemma4-e2b': {
    key: 'gemma4-e2b',
    hfModelId: 'onnx-community/gemma-4-E2B-it-ONNX',
    label: 'Gemma 4 E2B (ONNX q4f16)',
    shortLabel: 'Gemma 4 E2B',
    dtype: 'q4f16',
    approxDownloadLabel: '~2.7 GB WebGPU cache',
    recommendedRole: 'Google Gemma 4 Edge reasoning directly in browser memory',
    isGemma4Multimodal: true,
  },
  'medgemma-4b': {
    key: 'medgemma-4b',
    hfModelId: 'suhaibrashid17/medgemma-1.5-4b-it-ONNX-webgpu',
    label: 'MedGemma 1.5 4B (WebGPU q4)',
    shortLabel: 'MedGemma 4B',
    dtype: 'q4',
    approxDownloadLabel: '~2.5 GB WebGPU cache',
    recommendedRole: 'Clinical care-plan framing & HIPAA zero-egress synthesis',
    isGemma4Multimodal: false,
  },
};

export type WebGpuProgressStatus =
  | 'idle'
  | 'checking'
  | 'loading'
  | 'ready'
  | 'generating'
  | 'error';

export interface WebGpuLoadProgress {
  status: WebGpuProgressStatus;
  modelKey: WebGpuModelKey;
  hfModelId: string;
  progress?: number;
  file?: string;
  message: string;
}

export interface WebGpuGenerateOptions {
  modelKey?: WebGpuModelKey;
  maxNewTokens?: number;
  onProgress?: (progress: WebGpuLoadProgress) => void;
}

interface NavigatorGpuLike {
  gpu?: {
    requestAdapter: (options?: Record<string, unknown>) => Promise<unknown | null>;
  };
}

type TransformersModule = typeof import('@huggingface/transformers');
type LoadedTextGenPipeline = Awaited<ReturnType<TransformersModule['pipeline']>>;
type LoadedGemmaProcessor = Awaited<ReturnType<TransformersModule['AutoProcessor']['from_pretrained']>>;
type LoadedGemmaModel = Awaited<
  ReturnType<TransformersModule['Gemma4ForConditionalGeneration']['from_pretrained']>
>;

export function resolveWebGpuModelSpec(keyOrId?: string | null): WebGpuModelSpec {
  const raw = (keyOrId || '').trim();
  const normalized = raw.replace(/^(webgpu|hf):/i, '').trim();

  if (normalized in WEBGPU_MODEL_CATALOG) {
    return WEBGPU_MODEL_CATALOG[normalized as WebGpuModelKey];
  }

  const lower = normalized.toLowerCase();
  const byRepo = Object.values(WEBGPU_MODEL_CATALOG).find(
    (spec) => spec.hfModelId.toLowerCase() === lower
  );
  return byRepo ?? WEBGPU_MODEL_CATALOG['smollm3-3b'];
}

export function formatWebGpuError(err: unknown): string {
  const rawMessage = err instanceof Error ? err.message : String(err || 'Unknown WebGPU error');
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('wasm') ||
    lower.includes('webassembly') ||
    lower.includes('content security policy') ||
    lower.includes('unsafe-eval') ||
    lower.includes('wasm-unsafe-eval')
  ) {
    return (
      `WebGPU ONNX Runtime WebAssembly initialization was blocked by browser Content-Security-Policy (${rawMessage}). ` +
      `Self-hosted ONNX workers require "'wasm-unsafe-eval'" in script-src (supported on Express / Cloud Run deployments; ` +
      `static Firebase Hosting preserves strict "script-src 'self'").`
    );
  }

  if (lower.includes('adapter') || lower.includes('webgpu') || lower.includes('navigator.gpu')) {
    return (
      `WebGPU hardware acceleration is unavailable in this browser or worker context (${rawMessage}). ` +
      `Verify chrome://gpu / WebGPU flags or fall back to Chrome Prompt API / Ollama.`
    );
  }

  return rawMessage;
}

function stripReasoningBlocks(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export class BrowserWebGpuEngine {
  private loadedKey: WebGpuModelKey | null = null;
  private textGenPipeline: LoadedTextGenPipeline | null = null;
  private gemmaState: {
    model: LoadedGemmaModel;
    processor: LoadedGemmaProcessor;
  } | null = null;
  private loadPromise: Promise<WebGpuModelSpec> | null = null;
  private loadingKey: WebGpuModelKey | null = null;

  public getLoadedModelKey(): WebGpuModelKey | null {
    return this.loadedKey;
  }

  public isModelReady(modelKey: WebGpuModelKey): boolean {
    return this.loadedKey === modelKey && (this.textGenPipeline !== null || this.gemmaState !== null);
  }

  public async checkWebGpuSupport(): Promise<{ supported: boolean; reason?: string }> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        supported: false,
        reason: 'Browser window/navigator unavailable (non-browser runtime).',
      };
    }

    const nav = navigator as Navigator & NavigatorGpuLike;
    if (!nav.gpu || typeof nav.gpu.requestAdapter !== 'function') {
      return {
        supported: false,
        reason: 'navigator.gpu is not exposed in this browser context.',
      };
    }

    try {
      const adapter = await nav.gpu.requestAdapter();
      if (!adapter) {
        return {
          supported: false,
          reason: 'No compatible WebGPU hardware adapter was returned by navigator.gpu.requestAdapter().',
        };
      }
      return { supported: true };
    } catch (err) {
      return {
        supported: false,
        reason: err instanceof Error ? err.message : String(err),
      };
    }
  }

  public async dispose(): Promise<void> {
    try {
      if (this.gemmaState?.model && typeof this.gemmaState.model.dispose === 'function') {
        await this.gemmaState.model.dispose();
      }
      const pipeWithDispose = this.textGenPipeline as { dispose?: () => Promise<unknown> } | null;
      if (pipeWithDispose && typeof pipeWithDispose.dispose === 'function') {
        await pipeWithDispose.dispose();
      }
    } catch {
      // Best-effort cleanup of WebGPU buffers
    } finally {
      this.gemmaState = null;
      this.textGenPipeline = null;
      this.loadedKey = null;
      this.loadingKey = null;
      this.loadPromise = null;
    }
  }

  private async loadTransformers(): Promise<TransformersModule> {
    if (typeof window === 'undefined') {
      throw new Error('Transformers.js WebGPU runtime can only be loaded in a browser context.');
    }

    const tf = await import('@huggingface/transformers');
    tf.env.allowLocalModels = false;
    tf.env.allowRemoteModels = true;
    tf.env.useBrowserCache = true;
    tf.env.useWasmCache = false;
    if (tf.env.backends?.onnx?.wasm) {
      // String base path loads same-origin `/assets/ort/ort-wasm-*.mjs` directly without blob: scripts.
      tf.env.backends.onnx.wasm.wasmPaths = '/assets/ort/';
    }
    return tf;
  }

  public async loadModel(
    modelKey: WebGpuModelKey = 'smollm3-3b',
    onProgress?: (progress: WebGpuLoadProgress) => void
  ): Promise<WebGpuModelSpec> {
    const spec = resolveWebGpuModelSpec(modelKey);

    if (this.isModelReady(spec.key)) {
      onProgress?.({
        status: 'ready',
        modelKey: spec.key,
        hfModelId: spec.hfModelId,
        progress: 100,
        message: `${spec.label} ready in WebGPU memory.`,
      });
      return spec;
    }

    if (this.loadPromise && this.loadingKey === spec.key) {
      return this.loadPromise;
    }

    if (this.loadedKey && this.loadedKey !== spec.key) {
      await this.dispose();
    }

    this.loadingKey = spec.key;
    const task = (async (): Promise<WebGpuModelSpec> => {
      onProgress?.({
        status: 'checking',
        modelKey: spec.key,
        hfModelId: spec.hfModelId,
        progress: 0,
        message: `Checking WebGPU hardware adapter for ${spec.shortLabel}...`,
      });

      const support = await this.checkWebGpuSupport();
      if (!support.supported) {
        const msg = formatWebGpuError(support.reason || 'WebGPU unavailable');
        onProgress?.({
          status: 'error',
          modelKey: spec.key,
          hfModelId: spec.hfModelId,
          message: msg,
        });
        throw new Error(msg);
      }

      try {
        const tf = await this.loadTransformers();

        const progressCallback = (info: {
          status?: string;
          file?: string;
          progress?: number;
        }) => {
          const pct = typeof info.progress === 'number' ? Math.round(info.progress) : undefined;
          if (info.status === 'ready') {
            onProgress?.({
              status: 'loading',
              modelKey: spec.key,
              hfModelId: spec.hfModelId,
              progress: 98,
              message: `Finalizing ${spec.shortLabel} WebGPU shaders...`,
            });
            return;
          }
          const verb =
            info.status === 'done'
              ? 'Cached'
              : info.status === 'download' || info.status === 'progress'
                ? 'Downloading'
                : 'Loading';
          const detail = info.file
            ? `${verb} ${info.file}${pct !== undefined ? ` (${pct}%)` : ''}`
            : `Preparing ${spec.shortLabel}${pct !== undefined ? ` (${pct}%)` : ''}`;
          onProgress?.({
            status: 'loading',
            modelKey: spec.key,
            hfModelId: spec.hfModelId,
            progress: pct,
            file: info.file,
            message: detail,
          });
        };

        if (spec.isGemma4Multimodal) {
          try {
            const [processor, model] = await Promise.all([
              tf.AutoProcessor.from_pretrained(spec.hfModelId, {
                progress_callback: progressCallback,
              }),
              tf.Gemma4ForConditionalGeneration.from_pretrained(spec.hfModelId, {
                dtype: spec.dtype,
                device: 'webgpu',
                progress_callback: progressCallback,
              }),
            ]);
            this.gemmaState = { model, processor };
            this.textGenPipeline = null;
          } catch {
            // Fallback to generic text-generation pipeline if repo structure prefers CausalLM mapping
            const pipe = await tf.pipeline('text-generation', spec.hfModelId, {
              dtype: spec.dtype,
              device: 'webgpu',
              progress_callback: progressCallback,
            });
            this.textGenPipeline = pipe;
            this.gemmaState = null;
          }
        } else {
          const pipe = await tf.pipeline('text-generation', spec.hfModelId, {
            dtype: spec.dtype,
            device: 'webgpu',
            progress_callback: progressCallback,
          });
          this.textGenPipeline = pipe;
          this.gemmaState = null;
        }

        this.loadedKey = spec.key;
        onProgress?.({
          status: 'ready',
          modelKey: spec.key,
          hfModelId: spec.hfModelId,
          progress: 100,
          message: `${spec.label} loaded in WebGPU (zero-egress).`,
        });
        return spec;
      } catch (err) {
        const formatted = formatWebGpuError(err);
        onProgress?.({
          status: 'error',
          modelKey: spec.key,
          hfModelId: spec.hfModelId,
          message: formatted,
        });
        throw new Error(formatted, { cause: err });
      } finally {
        this.loadPromise = null;
        this.loadingKey = null;
      }
    })();

    this.loadPromise = task;
    return task;
  }

  public async generateText(
    systemPrompt: string,
    userPrompt: string,
    options: WebGpuGenerateOptions = {}
  ): Promise<string> {
    const spec = resolveWebGpuModelSpec(options.modelKey ?? 'smollm3-3b');
    const maxNewTokens = options.maxNewTokens ?? 768;

    await this.loadModel(spec.key, options.onProgress);

    options.onProgress?.({
      status: 'generating',
      modelKey: spec.key,
      hfModelId: spec.hfModelId,
      progress: 100,
      message: `Generating local response with ${spec.shortLabel} (WebGPU)...`,
    });

    // SmolLM3 benefits from `/no_think` directive when deterministic compact JSON output is requested.
    const effectiveSystem =
      spec.key === 'smollm3-3b' && !systemPrompt.includes('/no_think')
        ? `/no_think\n${systemPrompt}`
        : systemPrompt;

    const messages: { role: 'system' | 'user'; content: string }[] = [
      { role: 'system', content: effectiveSystem },
      { role: 'user', content: userPrompt },
    ];

    try {
      if (this.gemmaState) {
        const { model, processor } = this.gemmaState;
        const promptText = processor.apply_chat_template(messages, {
          tokenize: false,
          add_generation_prompt: true,
        }) as unknown as string;
        const callableProcessor = processor as unknown as (
          text: string
        ) => Promise<{ input_ids?: { dims?: number[] }; [key: string]: unknown }>;
        const inputs = await callableProcessor(promptText);
        const rawOutput = await model.generate({
          ...inputs,
          max_new_tokens: maxNewTokens,
          do_sample: false,
        });

        const seqTensor =
          rawOutput &&
          typeof rawOutput === 'object' &&
          'sequences' in rawOutput &&
          rawOutput.sequences
            ? rawOutput.sequences
            : rawOutput;

        let sliceInput: unknown = seqTensor;
        const promptLen = inputs?.input_ids?.dims?.[inputs.input_ids.dims.length - 1] ?? 0;
        const tensorObj = seqTensor as {
          dims?: number[];
          slice?: (...slices: (number | number[] | null)[]) => unknown;
        };
        if (
          tensorObj &&
          typeof tensorObj.slice === 'function' &&
          Array.isArray(tensorObj.dims) &&
          tensorObj.dims.length >= 2
        ) {
          const totalLen = tensorObj.dims[tensorObj.dims.length - 1] ?? promptLen;
          if (totalLen > promptLen) {
            sliceInput = tensorObj.slice(null, [promptLen, totalLen]);
          }
        }

        const decoded = processor.batch_decode(
          sliceInput as Parameters<typeof processor.batch_decode>[0],
          { skip_special_tokens: true }
        );
        const rawText = Array.isArray(decoded) ? String(decoded[0] ?? '') : '';
        options.onProgress?.({
          status: 'ready',
          modelKey: spec.key,
          hfModelId: spec.hfModelId,
          progress: 100,
          message: `${spec.label} ready in WebGPU memory.`,
        });
        return stripReasoningBlocks(rawText);
      }

      if (this.textGenPipeline) {
        const callablePipe = this.textGenPipeline as unknown as (
          input: { role: string; content: string }[],
          opts: Record<string, unknown>
        ) => Promise<{ generated_text?: string | { role?: string; content?: string }[] }[]>;

        const output = await callablePipe(messages, {
          max_new_tokens: maxNewTokens,
          do_sample: false,
          return_full_text: false,
        });
        const first = Array.isArray(output) ? output[0] : undefined;
        let text = '';
        if (typeof first?.generated_text === 'string') {
          text = first.generated_text;
        } else if (Array.isArray(first?.generated_text)) {
          const lastMsg = first.generated_text[first.generated_text.length - 1];
          text = typeof lastMsg?.content === 'string' ? lastMsg.content : '';
        }

        options.onProgress?.({
          status: 'ready',
          modelKey: spec.key,
          hfModelId: spec.hfModelId,
          progress: 100,
          message: `${spec.label} ready in WebGPU memory.`,
        });
        return stripReasoningBlocks(text);
      }

      throw new Error('WebGPU model session is not initialized.');
    } catch (err) {
      const formatted = formatWebGpuError(err);
      options.onProgress?.({
        status: 'error',
        modelKey: spec.key,
        hfModelId: spec.hfModelId,
        message: formatted,
      });
      throw new Error(formatted, { cause: err });
    }
  }
}

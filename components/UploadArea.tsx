"use client";

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';
import { Progress } from '@/components/ui/progress';

export function UploadArea() {
  const { isAnalyzing, progress, startAnalysis, setMessages, setStats, setError } = useAppStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      setError('Please upload a valid WhatsApp .txt export file.');
      return;
    }

    startAnalysis(file.name);

    try {
      const text = await file.text();
      
      const worker = new Worker(new URL('../lib/analyzer.worker.ts', import.meta.url));
      
      worker.postMessage({ action: 'parseAndAnalyze', text });

      worker.onmessage = (event) => {
        const { type, progress, messages, stats, error } = event.data;

        if (type === 'progress') {
          useAppStore.getState().setProgress(progress);
        } else if (type === 'success') {
          setMessages(messages);
          setStats(stats);
          worker.terminate();
        } else if (type === 'error') {
          setError(error);
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        setError(err.message || 'Worker thread encountered an error.');
        worker.terminate();
      };
    } catch (err: any) {
      setError(err.message || 'An error occurred during parsing.');
    }
  }, [startAnalysis, setMessages, setStats, setError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
        'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isAnalyzing
  });

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/30 max-w-2xl mx-auto w-full">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <h3 className="text-xl font-semibold mb-2">Analyzing your chat...</h3>
        <p className="text-muted-foreground mb-6 max-w-md text-center">
          This happens entirely on your device. No data is sent to any server.
        </p>
        <div className="w-full max-w-md">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-right mt-2 text-muted-foreground">{progress}%</p>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-xl cursor-pointer transition-colors max-w-2xl mx-auto w-full
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'}`}
    >
      <input {...getInputProps()} />
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <FileText className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-2xl font-semibold mb-2 text-foreground">Upload WhatsApp Chat</h3>
      <p className="text-muted-foreground mb-6 text-center max-w-sm">
        Drag & drop your exported <code>.txt</code> file here, or click to select file
      </p>
      
      <div className="flex items-center text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
        <Upload className="h-3 w-3 mr-2" />
        100% Private - Processed locally in your browser
      </div>
    </div>
  );
}

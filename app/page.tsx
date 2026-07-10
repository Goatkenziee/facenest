"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Camera,
  ScanFace,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import { FaceDetectionResult, FaceMatchResult } from "@/lib/face-engine";

type Screen = "home" | "camera" | "result" | "gallery";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [dark, setDark] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<{
    match: FaceMatchResult | null;
    faces: FaceDetectionResult[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleTheme = () => setDark((d) => !d);

  const startCamera = useCallback(async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScreen("camera");
    } catch (e) {
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions in your browser settings."
          : "Could not start camera. Make sure you're on a device with a camera."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScreen("home");
    setCapturing(false);
  }, []);

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    setCapturing(false);
    setDetecting(true);

    // Send canvas data to our face engine
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    try {
      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Detection failed");
      }
      const data = await res.json();
      setResult(data);
      setScreen("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Face detection failed");
      setScreen("home");
    } finally {
      setDetecting(false);
      stopCamera();
    }
  }, [stopCamera]);

  // Draw face boxes on result screen
  useEffect(() => {
    if (screen !== "result" || !result || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Re-draw the captured frame
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      // Draw face boxes
      for (const face of result.faces) {
        ctx.strokeStyle = "#c97b8b";
        ctx.lineWidth = 3;
        ctx.strokeRect(face.x, face.y, face.width, face.height);
        ctx.fillStyle = "rgba(201, 123, 139, 0.15)";
        ctx.fillRect(face.x, face.y, face.width, face.height);
        // Label
        ctx.fillStyle = "#c97b8b";
        ctx.font = "bold 14px system-ui";
        ctx.fillText(
          `${face.confidence ? Math.round(face.confidence * 100) + "%" : "face"}`,
          face.x + 4,
          face.y - 6
        );
      }
    };
    img.src = canvas.toDataURL();
  }, [screen, result]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-6 pt-4 safe-top">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanFace className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">FaceNest</h1>
        </div>
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted active:scale-95"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive animate-fade-up">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto shrink-0 rounded-full p-1 hover:bg-destructive/10"
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Screen: Home */}
      {screen === "home" && !detecting && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 animate-fade-up">
          {/* Hero */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
              <ScanFace className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Face Recognition
            </h2>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              On-device AI detects and matches faces instantly. Nothing leaves
              your phone.
            </p>
          </div>

          {/* Feature cards */}
          <div className="flex w-full flex-col gap-3">
            <FeatureCard
              icon={<Camera className="h-5 w-5" />}
              label="Detect faces in real-time"
              sub="Point your camera at a face"
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              label="Match against your gallery"
              sub="Find who it is instantly"
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5" />}
              label="100% on-device privacy"
              sub="No uploads, no servers"
            />
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="w-full gap-2 rounded-2xl text-base font-medium shadow-lg shadow-primary/20"
            onClick={startCamera}
          >
            <Camera className="h-5 w-5" />
            Open Camera
          </Button>

          <p className="text-xs text-muted-foreground">
            Requires camera permission · Works on iOS Safari & Chrome
          </p>
        </div>
      )}

      {/* Screen: Camera */}
      {screen === "camera" && (
        <div className="relative flex flex-1 flex-col items-center justify-center animate-fade-in">
          <div className="relative w-full overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-auto w-full max-h-[60vh] object-cover"
              onLoadedMetadata={() => videoRef.current?.play()}
            />
            {/* Scan overlay */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-primary/30">
              <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-primary/20" />
              <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-primary/20" />
              <div className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 animate-scan bg-gradient-to-b from-primary/60 to-transparent" />
            </div>
            {/* Corner brackets */}
            <div className="pointer-events-none absolute left-3 top-3 h-8 w-8 border-l-2 border-t-2 border-primary/50 rounded-tl" />
            <div className="pointer-events-none absolute right-3 top-3 h-8 w-8 border-r-2 border-t-2 border-primary/50 rounded-tr" />
            <div className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 border-b-2 border-l-2 border-primary/50 rounded-bl" />
            <div className="pointer-events-none absolute bottom-3 right-3 h-8 w-8 border-b-2 border-r-2 border-primary/50 rounded-br" />
          </div>

          <div className="mt-4 flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={stopCamera}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2 rounded-xl"
              onClick={() => {
                setCapturing(true);
                captureFrame();
              }}
              disabled={capturing}
            >
              {capturing ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Capture
            </Button>
          </div>
        </div>
      )}

      {/* Screen: Detecting */}
      {detecting && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 animate-fade-in">
          <Spinner className="h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing faces…</p>
        </div>
      )}

      {/* Screen: Result */}
      {screen === "result" && result && (
        <div className="flex flex-1 flex-col gap-4 animate-fade-up">
          <h2 className="text-lg font-semibold">Detection Results</h2>

          {/* Canvas with boxes */}
          <div className="overflow-hidden rounded-2xl bg-black">
            <canvas
              ref={canvasRef}
              className="h-auto w-full max-h-[50vh] object-contain"
            />
          </div>

          {/* Face count badge */}
          <div className="flex items-center gap-2">
            <Badge tone="default" className="gap-1 px-3 py-1 text-sm">
              <Users className="h-3.5 w-3.5" />
              {result.faces.length} face{result.faces.length !== 1 ? "s" : ""} detected
            </Badge>
            {result.match && (
              <Badge className="gap-1 bg-success/15 px-3 py-1 text-sm text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Match found
              </Badge>
            )}
          </div>

          {/* Match info */}
          {result.match && (
            <Card className="rounded-2xl border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium">Matched: {result.match.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Confidence: {Math.round(result.match.confidence * 100)}%
              </p>
            </Card>
          )}

          {!result.match && result.faces.length > 0 && (
            <Card className="rounded-2xl border-muted p-4">
              <p className="text-sm text-muted-foreground">
                Face detected but no match in gallery. Add this face to your
                gallery to recognize it next time.
              </p>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setScreen("home")}
            >
              Done
            </Button>
            <Button
              className="flex-1 gap-2 rounded-xl"
              onClick={startCamera}
            >
              <Camera className="h-4 w-4" />
              New Scan
            </Button>
          </div>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}

function FeatureCard({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-3 transition-colors hover:bg-muted/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

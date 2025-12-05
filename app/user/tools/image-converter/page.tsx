"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uploadToPinata } from "@/lib/pinata";
import {
  ImageIcon,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Upload,
  LinkIcon,
} from "lucide-react";
import { ethers } from "ethers";
import { getConnectedAddress } from "@/lib/web3";

type TargetFormat = "png" | "jpg" | "webp";

interface ConvertedResult {
  file: File;
  url: string;
  mime: string;
}

interface OwnershipBadge {
  cid: string;
  address: string;
  signature: string;
  timestamp: number;
}

export default function ImageConverterPage() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("webp");
  const [isConverting, setIsConverting] = useState(false);
  const [converted, setConverted] = useState<ConvertedResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsCid, setIpfsCid] = useState<string | null>(null);

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [badges, setBadges] = useState<OwnershipBadge[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initWallet = async () => {
      const address = await getConnectedAddress();
      if (address) setWalletAddress(address);

      const savedBadges = localStorage.getItem("incentiv3_file_badges");
      if (savedBadges) setBadges(JSON.parse(savedBadges));
    };
    initWallet();
  }, []);

  const canConvert = useMemo(
    () => !!sourceFile && !isConverting && walletAddress !== null,
    [sourceFile, isConverting, walletAddress]
  );

  const handleFileChange = (file: File | null) => {
    setSourceFile(file);
    setConverted(null);
    setIpfsCid(null);
    setError(null);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleConvert = async () => {
    if (!sourceFile) return;
    if (!walletAddress) {
      return setError("⚠ Connect wallet to convert file!");
    }

    setIsConverting(true);
    setConverted(null);
    setIpfsCid(null);
    setError(null);

    try {
      const mime =
        targetFormat === "png"
          ? "image/png"
          : targetFormat === "jpg"
          ? "image/jpeg"
          : "image/webp";

      const convertedFile = await convertImage(sourceFile, mime, targetFormat);
      const url = URL.createObjectURL(convertedFile);

      setConverted({
        file: convertedFile,
        url,
        mime,
      });
    } catch {
      setError("Failed to convert. Try another file.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleUploadToIpfs = async () => {
    if (!converted || !walletAddress) return;

    setIsUploading(true);
    setError(null);

    try {
      const cid = await uploadToPinata(converted.file);
      setIpfsCid(cid);

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const message = `I own this IPFS file: ${cid}`;
      const signature = await signer.signMessage(message);

      const newBadge: OwnershipBadge = {
        cid,
        address: walletAddress,
        signature,
        timestamp: Date.now(),
      };

      const updated = [...badges, newBadge];
      setBadges(updated);
      localStorage.setItem("incentiv3_file_badges", JSON.stringify(updated));
    } catch (e) {
      setError("IPFS upload failed. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#030014] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('/stars2.png')] opacity-40 animate-stars" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(80,35,201,0.6),_transparent_75%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* HEADER */}
        <header>
          <div className="inline-flex items-center gap-2 bg-violet-700/20 border border-violet-500/40 px-3 py-1 rounded-full text-xs">
            <ImageIcon className="w-3 h-3 text-violet-300" />
            <span className="text-violet-200/80">Decentralized Tool</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-violet-50">
            Image Format Converter
          </h1>
          <p className="text-sm text-violet-200/70 mt-1">
            Convert locally & prove file ownership via Web3 signature
          </p>
        </header>

        {/* MAIN CARD */}
        <Card className="bg-black/40 border border-violet-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="w-4 h-4 text-violet-300" />
              Select Source Image
            </CardTitle>
            <CardDescription>
              Wallet required to convert & claim ownership
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* FILE INPUT */}
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="cursor-pointer bg-black/50 border-slate-600/60"
            />

            {/* FORMAT SELECTOR UI — RESTORED */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between border border-slate-700/60 rounded-lg px-4 py-3 bg-black/40">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Convert to
                </span>
                <div className="inline-flex gap-2 bg-slate-900/60 border border-slate-700/80 rounded-full p-1">
                  {(["png", "jpg", "webp"] as TargetFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setTargetFormat(fmt)}
                      className={`px-3 py-1 text-xs rounded-full transition ${
                        targetFormat === fmt
                          ? "bg-violet-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.8)]"
                          : "text-slate-300 hover:bg-slate-800/80"
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                disabled={!canConvert}
                onClick={handleConvert}
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Converting…
                  </>
                ) : (
                  <>
                    Convert
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* ERROR */}
            {error && (
              <p className="text-xs text-red-300 bg-red-900/30 border border-red-500/40 px-3 py-2 rounded">
                {error}
              </p>
            )}

            {/* PREVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PreviewCard
                title="Original"
                file={sourceFile}
                url={previewUrl}
                accent="from-slate-800/80 to-slate-900/80"
              />
              <PreviewCard
                title="Converted"
                file={converted?.file ?? null}
                url={converted?.url ?? null}
                accent="from-violet-900/80 to-slate-950/80"
              />
            </div>

            {/* IPFS + OWNERSHIP SIGNING */}
            {converted && (
              <Button
                size="sm"
                onClick={handleUploadToIpfs}
                disabled={isUploading}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading & Signing…
                  </>
                ) : (
                  <>
                    Upload to IPFS + Save Ownership Proof
                    <LinkIcon className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}

            {/* BADGES LIST */}
            {badges.length > 0 && (
              <div className="border-t border-slate-700/60 pt-4">
                <h3 className="text-sm text-violet-300 mb-2">
                  🎖 Ownership Proofs
                </h3>
                {badges.map((b, index) => (
                  <div
                    key={index}
                    className="text-xs p-2 border border-violet-400/40 rounded bg-black/40 mt-2"
                  >
                    <p>IPFS CID: {b.cid}</p>
                    <p>
                      Owner: {b.address.slice(0, 6)}...
                      {b.address.slice(-4)}
                    </p>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${b.cid}`}
                      target="_blank"
                      className="underline text-emerald-400"
                    >
                      View File
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

/* --- Conversion Functions (unchanged) --- */
async function convertImage(
  file: File,
  mimeType: string,
  targetFormat: TargetFormat
): Promise<File> {
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) return reject(new Error("Blob creation failed"));
        resolve(b);
      },
      mimeType,
      0.92
    );
  });

  // Generate unique name with new extension
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const ext = targetFormat === "jpg" ? "jpeg" : targetFormat;
  const newFile = new File([blob], `${baseName}.${ext}`, { type: mimeType });

  return newFile;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

function PreviewCard({
  title,
  file,
  url,
  accent,
}: {
  title: string;
  file: File | null;
  url: string | null;
  accent: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-700/60 bg-gradient-to-br ${accent} p-3 flex flex-col gap-3`}
    >
      <span className="uppercase tracking-wide text-[10px] text-slate-400">
        {title}
      </span>
      <div className="flex-1 flex items-center justify-center rounded-lg bg-black/40 border border-slate-700/60 overflow-hidden min-h-[160px]">
        {url ? (
          <img
            src={url}
            alt={title}
            className="max-h-64 max-w-full object-contain"
          />
        ) : (
          <span className="text-xs text-slate-600">No image</span>
        )}
      </div>
      {file && <p className="text-[11px] truncate">{file.name}</p>}
    </div>
  );
}

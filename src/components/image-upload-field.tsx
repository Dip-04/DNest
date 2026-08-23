"use client";

import Image from "next/image";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

async function optimize(file: File): Promise<File> {
  if (file.size <= 2 * 1024 * 1024 || file.type === "image/avif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.84),
  );
  return blob && blob.size < file.size
    ? new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" })
    : file;
}

export function ImageUploadField({ name, label, currentUrl, removeName = "remove_image" }: {
  name: string;
  label: string;
  currentUrl?: string;
  removeName?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentUrl);
  const [selectedUrl, setSelectedUrl] = useState<string>();
  const [remove, setRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => { if (selectedUrl) URL.revokeObjectURL(selectedUrl); }, [selectedUrl]);

  async function choose(file?: File) {
    setError("");
    if (!file) return;
    if (!ACCEPTED.has(file.type)) {
      setError("Choose a JPG, PNG, WebP, or AVIF image.");
      if (input.current) input.current.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Choose an image no larger than 5 MB.");
      if (input.current) input.current.value = "";
      return;
    }
    setBusy(true);
    try {
      const ready = await optimize(file);
      const transfer = new DataTransfer();
      transfer.items.add(ready);
      if (input.current) input.current.files = transfer.files;
      if (selectedUrl) URL.revokeObjectURL(selectedUrl);
      const url = URL.createObjectURL(ready);
      setSelectedUrl(url);
      setPreview(url);
      setRemove(false);
    } catch {
      setError("This image could not be prepared. Please choose another one.");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    if (selectedUrl) URL.revokeObjectURL(selectedUrl);
    setSelectedUrl(undefined);
    setPreview(undefined);
    setRemove(Boolean(currentUrl));
    setError("");
    if (input.current) input.current.value = "";
  }

  return (
    <fieldset className="rounded-3xl border border-dashed border-[var(--border)] p-4">
      <legend className="label px-2">{label}</legend>
      <input type="hidden" name={removeName} value={remove ? "true" : "false"} />
      {preview ? (
        <div className="relative mx-auto aspect-square max-w-64 overflow-hidden rounded-3xl bg-[var(--rose-soft)]">
          <Image src={preview} alt={`${label} preview`} fill unoptimized className="object-cover" />
        </div>
      ) : (
        <div className="muted mx-auto grid aspect-square max-w-64 place-items-center rounded-3xl bg-[var(--rose-soft)]">
          <ImagePlus className="size-10" aria-hidden />
        </div>
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <label className="btn btn-secondary cursor-pointer">
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {preview ? "Replace image" : "Choose image"}
          <input ref={input} className="sr-only" name={name} type="file"
            accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy}
            onChange={(event) => void choose(event.target.files?.[0])} />
        </label>
        {preview && <button className="btn btn-secondary" type="button" onClick={clear}>
          <Trash2 className="size-4" /> Remove
        </button>}
      </div>
      <p className="muted mt-3 text-center text-xs">JPG, PNG, WebP, or AVIF · 5 MB maximum. Large images are optimized before upload.</p>
      {error && <p className="mt-2 text-center text-sm text-red-600" role="alert">{error}</p>}
    </fieldset>
  );
}

"use client";

import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

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
  const [error, setError] = useState("");

  useEffect(() => () => { if (selectedUrl) URL.revokeObjectURL(selectedUrl); }, [selectedUrl]);
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const reset = () => {
      if (selectedUrl) URL.revokeObjectURL(selectedUrl);
      setSelectedUrl(undefined);
      setPreview(currentUrl);
      setRemove(false);
      setError("");
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [currentUrl, selectedUrl]);

  function choose(file?: File) {
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
    if (selectedUrl) URL.revokeObjectURL(selectedUrl);
    const url = URL.createObjectURL(file);
    setSelectedUrl(url);
    setPreview(url);
    setRemove(false);
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
          <ImagePlus className="size-4" />
          {preview ? "Replace image" : "Choose image"}
          <input ref={input} className="sr-only" name={name} type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) => choose(event.target.files?.[0])} />
        </label>
        {preview && <button className="btn btn-secondary" type="button" onClick={clear}>
          <Trash2 className="size-4" /> Remove
        </button>}
      </div>
      <p className="muted mt-3 text-center text-xs">JPG, PNG, WebP, or AVIF · 5 MB maximum.</p>
      {error && <p className="mt-2 text-center text-sm text-red-600" role="alert">{error}</p>}
    </fieldset>
  );
}

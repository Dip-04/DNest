"use client";

import Image from "next/image";
import { Expand, X } from "lucide-react";
import { useEffect, useRef } from "react";

export function MomentImage({ src, alt }: { src: string; alt: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const restoreScroll = () => { document.body.style.overflow = ""; };
    dialog.addEventListener("close", restoreScroll);
    return () => dialog.removeEventListener("close", restoreScroll);
  }, []);

  const openPreview = () => {
    dialogRef.current?.showModal();
    document.body.style.overflow = "hidden";
  };

  return (
    <>
      <button className="moment-image-stage group/image" type="button" onClick={openPreview} aria-label={`Open full-size preview of ${alt}`}>
        <Image className="moment-image-blur" src={src} alt="" fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" unoptimized aria-hidden />
        <Image className="moment-image-full" src={src} alt={alt} fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" unoptimized />
        <span className="moment-image-expand" aria-hidden><Expand className="size-4" />View full photo</span>
      </button>

      <dialog ref={dialogRef} className="moment-lightbox" aria-label={`Full-size preview of ${alt}`} onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
        <div className="moment-lightbox-frame">
          <Image className="moment-lightbox-blur" src={src} alt="" fill sizes="100vw" unoptimized aria-hidden />
          <Image className="moment-lightbox-image" src={src} alt={alt} fill sizes="100vw" unoptimized priority />
          <button className="moment-lightbox-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close photo preview"><X className="size-5" /></button>
        </div>
      </dialog>
    </>
  );
}

"use client";

import { Pencil, RotateCcw, Save } from "lucide-react";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export function EditableFormSection({ action, children, className = "", encType }: {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  encType?: "multipart/form-data";
}) {
  const [editing, setEditing] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  return <form ref={form} action={action} className={className} encType={encType}>
    <fieldset className="contents" disabled={!editing}>{children}</fieldset>
    <EditControls editing={editing} onEdit={() => setEditing(true)} onCancel={() => {
      form.current?.reset();
      setEditing(false);
    }} />
  </form>;
}

function EditControls({ editing, onEdit, onCancel }: { editing: boolean; onEdit: () => void; onCancel: () => void }) {
  const { pending } = useFormStatus();
  if (!editing) return <button className="btn btn-secondary w-fit" type="button" onClick={onEdit}><Pencil className="size-4" />Edit</button>;
  return <div className="flex flex-wrap gap-3">
    <button className="btn btn-primary" type="submit" disabled={pending} aria-disabled={pending}>{pending ? <><span className="cute-button-heart">♥</span>Saving…</> : <><Save className="size-4" />Save changes</>}</button>
    <button className="btn btn-secondary" type="button" disabled={pending} onClick={onCancel}><RotateCcw className="size-4" />Cancel edit</button>
  </div>;
}

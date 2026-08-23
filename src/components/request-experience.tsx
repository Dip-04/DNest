"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { showToast } from "@/components/toast-viewport";

const activityEvent = "dnest:request-activity";

function updateFieldError(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  const id = field.id || field.name;
  if (!id) return;
  let error = field.parentElement?.querySelector<HTMLElement>(`:scope > [data-error-for="${CSS.escape(id)}"]`);
  if (!field.validationMessage) {
    error?.remove();
    field.removeAttribute("aria-invalid");
    return;
  }
  if (!error) {
    error = document.createElement("span");
    error.dataset.errorFor = id;
    error.className = "field-error";
    error.setAttribute("role", "alert");
    field.insertAdjacentElement("afterend", error);
  }
  error.textContent = field.validationMessage;
  field.setAttribute("aria-invalid", "true");
}

function refreshForm(form: HTMLFormElement) {
  const invalid = Boolean(form.querySelector(":invalid"));
  form.querySelectorAll<HTMLButtonElement>('button[type="submit"], input[type="submit"]').forEach((button) => {
    if (button.dataset.dnestBusy === "true") return;
    button.disabled = invalid;
    button.setAttribute("aria-disabled", String(invalid));
  });
}

export function RequestExperience() {
  const [pending, setPending] = useState(0);
  useEffect(() => {
    let count = 0;
    const originalFetch = window.fetch.bind(window);
    const inFlightGets = new Map<string, Promise<Response>>();
    const emit = (delta: number) => {
      count = Math.max(0, count + delta);
      window.dispatchEvent(new CustomEvent(activityEvent, { detail: count }));
    };
    window.fetch = async (input, init) => {
      const request = input instanceof Request ? input : null;
      const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
      const url = request?.url ?? String(input);
      const key = method === "GET" ? `${method}:${url}` : null;
      if (key && inFlightGets.has(key)) return (await inFlightGets.get(key)!).clone();
      emit(1);
      const operation = originalFetch(input, init);
      if (key) inFlightGets.set(key, operation);
      try {
        const response = await operation;
        return key ? response.clone() : response;
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          showToast("error", "DNest could not complete that request. Please try again.");
        throw error;
      } finally {
        if (key) inFlightGets.delete(key);
        emit(-1);
      }
    };

    const busyForms = new Set<HTMLFormElement>();
    const releaseForms = () => {
      busyForms.forEach((form) => {
        form.dataset.submitting = "false";
        form.querySelectorAll<HTMLButtonElement>('button[type="submit"], input[type="submit"]').forEach((button) => {
          delete button.dataset.dnestBusy;
        });
        refreshForm(form);
      });
      busyForms.clear();
    };
    const onActivity = (event: Event) => {
      const value = Number((event as CustomEvent<number>).detail) || 0;
      setPending(value);
      if (value === 0) releaseForms();
    };
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.dataset.submitting === "true") {
        event.preventDefault();
        return;
      }
      if (!form.checkValidity()) return;
      form.dataset.submitting = "true";
      busyForms.add(form);
      form.querySelectorAll<HTMLButtonElement>('button[type="submit"], input[type="submit"]').forEach((button) => {
        button.dataset.dnestBusy = "true";
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
      });
      window.setTimeout(() => {
        if (count === 0 && busyForms.has(form)) releaseForms();
      }, 1500);
    };
    const onInput = (event: Event) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      updateFieldError(field);
      if (field.form) refreshForm(field.form);
    };
    const onInvalid = (event: Event) => {
      const field = event.target;
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) updateFieldError(field);
    };
    document.querySelectorAll("form").forEach((form) => refreshForm(form));
    const observer = new MutationObserver(() =>
      document.querySelectorAll("form").forEach((form) => refreshForm(form)),
    );
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener(activityEvent, onActivity);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    document.addEventListener("invalid", onInvalid, true);
    return () => {
      observer.disconnect();
      window.fetch = originalFetch;
      window.removeEventListener(activityEvent, onActivity);
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
      document.removeEventListener("invalid", onInvalid, true);
    };
  }, []);

  return pending > 0 ? <div className="dnest-loader" role="status" aria-live="polite" aria-label="DNest is working">
    <div className="dnest-loader-nest" aria-hidden><span /><span /><span /><Heart className="dnest-loader-heart" /></div>
    <span>Holding this safely…</span>
  </div> : null;
}

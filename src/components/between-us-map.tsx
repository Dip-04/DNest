"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

type MapPerson = {
  name: string;
  avatarUrl?: string;
  latitude: number;
  longitude: number;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

export function BetweenUsMap({ me, partner }: { me: MapPerson; partner: MapPerson }) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!element.current) return;
    if (navigator.userAgent.toLowerCase().includes("jsdom")) return;
    let disposed = false;
    let map: import("leaflet").Map | undefined;
    void import("leaflet").then((L) => {
      if (disposed || !element.current) return;
      map = L.map(element.current, { zoomControl: true, attributionControl: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      const icon = (person: MapPerson, label: string, mine: boolean) => {
        const image = person.avatarUrl
          ? `<img src="${escapeHtml(person.avatarUrl)}" alt="" />`
          : `<span>${escapeHtml(person.name.trim().slice(0, 1).toUpperCase() || "♥")}</span>`;
        return L.divIcon({
          className: "between-leaflet-marker",
          html: `<div class="between-marker-avatar ${mine ? "is-me" : ""}">${image}<i>♥</i></div><strong>${escapeHtml(label)}</strong>`,
          iconSize: [76, 92],
          iconAnchor: [38, 32],
        });
      };
      const mine: [number, number] = [me.latitude, me.longitude];
      const theirs: [number, number] = [partner.latitude, partner.longitude];
      L.polyline([mine, theirs], { color: "#2496e8", weight: 5, opacity: 0.9 }).addTo(map);
      L.marker(mine, { icon: icon(me, "Me", true), zIndexOffset: 1000 }).addTo(map);
      L.marker(theirs, { icon: icon(partner, partner.name, false), zIndexOffset: 1000 }).addTo(map);
      const bounds = L.latLngBounds([mine, theirs]);
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) map.setView(mine, 16);
      else map.fitBounds(bounds, { padding: [55, 55], maxZoom: 14 });
      window.setTimeout(() => map?.invalidateSize(), 50);
    });
    return () => { disposed = true; map?.remove(); };
  }, [me, partner]);
  return <div ref={element} className="between-leaflet-map" aria-label="Map showing both partner locations" />;
}

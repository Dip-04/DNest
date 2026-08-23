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
  const meName = me.name;
  const meAvatarUrl = me.avatarUrl;
  const meLatitude = me.latitude;
  const meLongitude = me.longitude;
  const partnerName = partner.name;
  const partnerAvatarUrl = partner.avatarUrl;
  const partnerLatitude = partner.latitude;
  const partnerLongitude = partner.longitude;
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
        attribution: "",
      }).addTo(map);
      const icon = (person: MapPerson, label: string, mine: boolean) =>
        L.divIcon({
          className: "between-leaflet-marker",
          html: `<div class="between-marker-avatar ${mine ? "is-me" : ""}"><span>${escapeHtml(person.name.trim().slice(0, 1).toUpperCase() || "♥")}</span><i>♥</i></div><strong>${escapeHtml(label)}</strong>`,
          iconSize: [76, 92],
          iconAnchor: [38, 32],
        });
      const addPerson = (
        person: MapPerson,
        point: [number, number],
        label: string,
        mine: boolean,
      ) => {
        const marker = L.marker(point, {
          icon: icon(person, label, mine),
          zIndexOffset: 1000,
        });
        const applyAvatar = () => {
          const avatar = marker
            .getElement()
            ?.querySelector<HTMLElement>(".between-marker-avatar");
          if (avatar && person.avatarUrl) {
            avatar.classList.add("has-photo");
            avatar.style.backgroundImage = `url(${JSON.stringify(person.avatarUrl)})`;
          }
        };
        marker.on("add", applyAvatar).addTo(map!);
        applyAvatar();
      };
      const mine: [number, number] = [meLatitude, meLongitude];
      const theirs: [number, number] = [partnerLatitude, partnerLongitude];
      const bounds = L.latLngBounds([mine, theirs]);
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) map.setView(mine, 16);
      else
        map.fitBounds(bounds, {
          paddingTopLeft: [90, 105],
          paddingBottomRight: [90, 125],
          maxZoom: 13,
        });
      L.polyline([mine, theirs], {
        color: "#2496e8",
        weight: 5,
        opacity: 0.92,
        lineCap: "round",
      }).addTo(map);
      addPerson({ name: meName, avatarUrl: meAvatarUrl, latitude: meLatitude, longitude: meLongitude }, mine, "Me", true);
      addPerson({ name: partnerName, avatarUrl: partnerAvatarUrl, latitude: partnerLatitude, longitude: partnerLongitude }, theirs, partnerName, false);
      L.tooltip({
        permanent: true,
        direction: "center",
        className: "between-route-label",
        interactive: false,
      })
        .setLatLng([
          (meLatitude + partnerLatitude) / 2,
          (meLongitude + partnerLongitude) / 2,
        ])
        .setContent(`You → ${escapeHtml(partnerName)}`)
        .addTo(map);
      window.setTimeout(() => map?.invalidateSize(), 50);
    });
    return () => { disposed = true; map?.remove(); };
  }, [
    meAvatarUrl,
    meLatitude,
    meLongitude,
    meName,
    partnerAvatarUrl,
    partnerLatitude,
    partnerLongitude,
    partnerName,
  ]);
  return <div ref={element} className="between-leaflet-map" aria-label="Map showing both partner locations" />;
}

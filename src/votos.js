import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ================= AJUSTES (los puedes cambiar) =================
// Cuántos votos totales debe haber para mostrar porcentajes.
// Para probar déjalo en 1. ANTES DE DIFUNDIR súbelo a 20.
export const MIN_VOTOS_PORCENTAJE = 20;

// Cuántas personas deben escribir la misma idea para que se vuelva tarjeta.
export const UMBRAL_NUEVA_OPCION = 2;

// Máximo de tarjetas visibles a la vez.
export const MAX_TARJETAS = 10;

// true  = los porcentajes se ven desde el inicio.
// false = solo se ven después de votar (evita que la gente vote por el que va ganando).
export const MOSTRAR_ANTES_DE_VOTAR = true;
// ================================================================

export const ID_OTRAS = "otras-ideas";

export const BASE = [
  { id: "pizza", label: "Pizza", emoji: "🍕", alias: ["pizza", "pizzas", "pizzeria"] },
  { id: "hamburguesa", label: "Hamburguesas", emoji: "🍔", alias: ["hamburguesa", "hamburguesas", "burger", "burgers", "hamburgueseria"] },
  { id: "mexicana", label: "Comida mexicana", emoji: "🌮", alias: ["mexicana", "mexicano", "mexico"] },
  { id: "pollo", label: "Pollo", emoji: "🍗", alias: ["pollo", "pollos", "alita", "alitas", "broaster"] },
  { id: "carnes-bbq", label: "Carnes / BBQ", emoji: "🍖", alias: ["carne", "carnes", "bbq", "barbacoa", "barbecue", "asado", "asados", "asada", "carne asada", "parrilla", "parrillada", "texana", "texano", "texas", "costilla", "costillas", "steak", "churrasco"] },
  { id: "mariscos", label: "Mariscos", emoji: "🦐", alias: ["marisco", "mariscos", "camaron", "camarones", "pescado", "pescados", "ceviche", "langosta"] },
];

const RELLENO = new Set([
  "un", "una", "unos", "unas", "el", "la", "los", "las", "de", "del", "con", "y", "e", "o",
  "para", "que", "quiero", "quisiera", "me", "gustaria", "seria", "hay", "mas", "muy",
  "buena", "bueno", "buenos", "buenas", "rica", "rico", "ricos", "ricas",
  "comida", "comidas", "restaurante", "restaurantes", "lugar", "sitio", "negocio",
  "tienda", "venta", "puesto", "local",
]);

const EMOJI_POR_PALABRA = {
  taco: "🌮", burrito: "🌯", arepa: "🌽", empanada: "🥟", sushi: "🍣", ceviche: "🍤",
  helado: "🍦", postre: "🍰", pastel: "🎂", torta: "🍰", cafe: "☕", jugo: "🥤",
  batido: "🥤", fruta: "🍓", ensalada: "🥗", saludable: "🥗", vegano: "🥬",
  vegetariano: "🥬", perro: "🌭", hot: "🌭", chorizo: "🌭", pasta: "🍝",
  sandwich: "🥪", pan: "🥖", panaderia: "🥖", arroz: "🍚", chino: "🥡",
  asiatico: "🥡", ramen: "🍜", sopa: "🍲", desayuno: "🥞", crepe: "🥞",
  waffle: "🥞", cerveza: "🍺", dona: "🍩", donut: "🍩", papa: "🍟", rapida: "🍟",
  kebab: "🥙", shawarma: "🥙", arabe: "🥙", pincho: "🍢",
};

function limpiar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singular(p) {
  return p.length > 3 && p.endsWith("s") && !p.endsWith("ss") ? p.slice(0, -1) : p;
}

function palabrasClave(texto) {
  return limpiar(texto)
    .split(" ")
    .filter((p) => p && !RELLENO.has(p))
    .map(singular);
}

const ALIAS = new Map();
for (const b of BASE) {
  for (const a of b.alias) ALIAS.set(palabrasClave(a).join(" "), b);
}

function capitalizar(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function emojiPara(palabras) {
  for (const p of palabras) if (EMOJI_POR_PALABRA[p]) return EMOJI_POR_PALABRA[p];
  return "🍽️";
}

// Convierte lo que la persona escribió en una opción (existente, nueva u "otras ideas").
export function interpretar(texto) {
  const original = texto.trim().replace(/\s+/g, " ");
  const palabras = palabrasClave(original);
  const clave = palabras.join(" ");
  if (clave.replace(/ /g, "").length < 3) return null;

  if (palabras.length <= 3) {
    const base = ALIAS.get(clave) || palabras.map((p) => ALIAS.get(p)).find(Boolean);
    if (base) return { id: base.id, label: base.label, emoji: base.emoji, tipo: "base" };
  }

  if (palabras.length > 3 || clave.length > 32) {
    return { id: ID_OTRAS, label: "Otras ideas", emoji: "💡", tipo: "otras" };
  }

  return {
    id: palabras.join("-").slice(0, 40),
    label: capitalizar(original.slice(0, 40)),
    emoji: emojiPara(palabras),
    tipo: "nueva",
  };
}

// Escucha las opciones en vivo.
export function useOpciones() {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "options"),
      (snap) => setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.error("Error leyendo opciones:", e)
    );
    return unsub;
  }, []);

  return docs;
}

// Calcula lista de tarjetas, total y porcentajes.
export function armarLista(docs) {
  const activos = docs.filter((d) => !d.hidden);
  const total = activos.reduce((s, d) => s + (d.votes || 0), 0);
  const porId = new Map(activos.map((d) => [d.id, d]));
  const pct = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);

  const base = BASE.map((b, i) => {
    const votes = porId.get(b.id)?.votes || 0;
    return { id: b.id, label: b.label, emoji: b.emoji, votes, pct: pct(votes), orden: i };
  });

  const nuevas = activos
    .filter(
      (d) =>
        !BASE.some((b) => b.id === d.id) &&
        d.id !== ID_OTRAS &&
        (d.votes || 0) >= UMBRAL_NUEVA_OPCION
    )
    .map((d) => ({
      id: d.id,
      label: d.label,
      emoji: d.emoji,
      votes: d.votes,
      pct: pct(d.votes),
      orden: 100,
    }));

  return {
    total,
    lista: [...base, ...nuevas],
    porId,
    otras: porId.get(ID_OTRAS)?.votes || 0,
  };
}

// Guarda el voto: la respuesta y el contador se escriben juntos, o no se escribe nada.
export async function enviarVoto({ uid, opcion, texto }) {
  const respRef = doc(db, "responses", uid);
  const optRef = doc(db, "options", opcion.id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(optRef);

    const respuesta = { choice: opcion.id, createdAt: serverTimestamp() };
    if (texto && texto.trim()) respuesta.text = texto.trim().slice(0, 300);
    tx.set(respRef, respuesta);

    if (snap.exists()) {
      tx.update(optRef, { votes: increment(1), lastVoteAt: serverTimestamp() });
    } else {
      tx.set(optRef, {
        label: opcion.label,
        emoji: opcion.emoji,
        votes: 1,
        hidden: false,
        createdAt: serverTimestamp(),
        lastVoteAt: serverTimestamp(),
      });
    }
  });
}
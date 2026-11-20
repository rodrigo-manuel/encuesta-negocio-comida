import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { playSelect, playPop, playError, haptic } from "../sound";
import {
  interpretar,
  enviarVoto,
  MAX_TARJETAS,
  MIN_VOTOS_PORCENTAJE,
  MOSTRAR_ANTES_DE_VOTAR,
} from "../votos";
import Numero from "./Numero";

const EJEMPLOS = [
  "tacos al pastor",
  "alitas y cerveza",
  "arepas rellenas",
  "sushi",
  "helados artesanales",
  "comida vegana",
  "empanadas",
  "postres",
];

function Tarjeta({ op, activa, mostrarPct, onClick }) {
  return (
    <motion.button
      layout
      type="button"
      aria-pressed={activa}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: activa ? 1.04 : 1 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className={`relative overflow-hidden rounded-2xl p-3 text-left border-2 cursor-pointer ${
        activa
          ? "border-rose-500 bg-rose-50 shadow-lg shadow-rose-200"
          : "border-stone-200 bg-white"
      }`}
    >
      {activa && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 bg-rose-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center"
        >
          ✓
        </motion.span>
      )}
      <div className="text-4xl">{op.emoji}</div>
      <div className="font-bold text-stone-800 leading-tight mt-1">{op.label}</div>

      {mostrarPct && (
        <div className="mt-2">
          <div className="flex justify-between text-xs font-bold text-stone-600">
            <span>
              <Numero valor={op.pct} />%
            </span>
            <span>
              {op.votes} {op.votes === 1 ? "voto" : "votos"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-stone-200 overflow-hidden mt-1">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500"
              initial={{ width: 0 }}
              animate={{ width: `${op.pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </motion.button>
  );
}

export default function Pregunta({ uid, lista, total, porId, onDone }) {
  const [texto, setTexto] = useState("");
  const [elegidaId, setElegidaId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [ej, setEj] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setEj((n) => (n + 1) % EJEMPLOS.length), 2600);
    return () => clearInterval(t);
  }, []);

  const mostrarPct = MOSTRAR_ANTES_DE_VOTAR && total >= MIN_VOTOS_PORCENTAJE;

  const tarjetas = useMemo(() => {
    const copia = [...lista];
    if (mostrarPct) copia.sort((a, b) => b.votes - a.votes || a.orden - b.orden);
    return copia.slice(0, MAX_TARJETAS);
  }, [lista, mostrarPct]);

  const interpretada = useMemo(() => (texto.trim() ? interpretar(texto) : null), [texto]);
  const opcionElegida = elegidaId ? lista.find((o) => o.id === elegidaId) : null;
  const opcionFinal = opcionElegida || interpretada;
  const puedeEnviar = !!opcionFinal && !!uid && !enviando;

  function elegir(id) {
    playSelect();
    haptic();
    if (elegidaId === id) {
      setElegidaId(null);
    } else {
      setElegidaId(id);
      setTexto("");
    }
  }

  function escribir(valor) {
    setTexto(valor.slice(0, 300));
    if (elegidaId) setElegidaId(null);
  }

  let aviso = null;
  if (interpretada) {
    const existente = porId.get(interpretada.id);
    if (interpretada.tipo === "otras") {
      aviso = { icono: "💡", texto: "Guardaremos tu idea tal cual la escribiste." };
    } else if (interpretada.tipo === "base") {
      aviso = { icono: interpretada.emoji, texto: `Tu voto se suma a «${interpretada.label}»` };
    } else if (existente) {
      aviso = { icono: existente.emoji, texto: `¡Alguien más propuso «${existente.label}»! Tu voto se suma.` };
    } else {
      aviso = {
        icono: "🌟",
        texto: `Serás el primero en proponer «${interpretada.label}». Si más personas lo piden, se vuelve opción.`,
      };
    }
  } else if (texto.trim().length > 0) {
    aviso = { icono: "✍️", texto: "Sigue escribiendo…" };
  }

  async function enviar() {
    if (!puedeEnviar) return;
    setEnviando(true);
    setError("");
    playPop();
    haptic(20);

    try {
      await enviarVoto({
        uid,
        opcion: opcionFinal,
        texto: elegidaId ? null : texto,
      });
      onDone({
        id: opcionFinal.id,
        label: opcionFinal.label,
        emoji: opcionFinal.emoji,
        escrita: !elegidaId,
        yaVoto: false,
      });
    } catch (e) {
      console.error(e);
      if (e.code === "permission-denied") {
        onDone({ id: null, yaVoto: true });
      } else {
        playError();
        setError("No se pudo enviar. Revisa tu internet e intenta de nuevo.");
        setEnviando(false);
      }
    }
  }

  return (
    <motion.div
      className="vidrio rounded-3xl w-full max-w-xl p-5 sm:p-7 flex flex-col gap-4"
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.45 }}
    >
      <div className="text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-stone-800 leading-tight">
          ¿Qué negocio de comida te gustaría ver?
        </h2>
        <p className="text-stone-600 mt-1">Escribe lo que se te venga a la mente 👇</p>
      </div>

      <div>
        <textarea
          value={texto}
          onChange={(e) => escribir(e.target.value)}
          rows={2}
          maxLength={300}
          aria-label="Escribe tu idea de negocio de comida"
          placeholder={`Ej: ${EJEMPLOS[ej]}`}
          className="w-full rounded-2xl border-2 border-orange-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-200 outline-none p-4 text-lg text-stone-800 bg-white/90 resize-none transition"
        />
        <div className="flex justify-between gap-3 mt-1 min-h-6">
          <p className="text-sm font-semibold text-stone-600">
            {aviso && (
              <>
                <span className="mr-1">{aviso.icono}</span>
                {aviso.texto}
              </>
            )}
          </p>
          <span className="text-xs text-stone-500 shrink-0">{texto.length}/300</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-stone-500 text-sm font-bold">
        <span className="h-px flex-1 bg-stone-300" />
        o toca una opción
        <span className="h-px flex-1 bg-stone-300" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tarjetas.map((op) => (
          <Tarjeta
            key={op.id}
            op={op}
            activa={elegidaId === op.id}
            mostrarPct={mostrarPct}
            onClick={() => elegir(op.id)}
          />
        ))}
      </div>

      {!MOSTRAR_ANTES_DE_VOTAR && (
        <p className="text-center text-xs text-stone-500">
          Los resultados se ven después de votar 👀
        </p>
      )}

      {error && <p className="text-red-600 text-sm text-center font-semibold">{error}</p>}

      <motion.button
        onClick={enviar}
        disabled={!puedeEnviar}
        whileTap={puedeEnviar ? { scale: 0.94 } : {}}
        className={`rounded-2xl py-4 font-extrabold text-xl transition-colors ${
          puedeEnviar
            ? "bg-gradient-to-r from-orange-600 to-rose-600 text-white shadow-lg shadow-rose-400/40 cursor-pointer"
            : "bg-stone-200 text-stone-400 cursor-not-allowed"
        }`}
      >
        {enviando ? "Enviando..." : !uid ? "Conectando..." : "Enviar mi voto"}
      </motion.button>
    </motion.div>
  );
}
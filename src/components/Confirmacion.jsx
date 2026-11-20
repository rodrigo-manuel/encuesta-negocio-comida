import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { playSuccess } from "../sound";
import Resultados from "./Resultados";
import { UMBRAL_NUEVA_OPCION } from "../votos";

const COLORES = ["#FF7A45", "#E63946", "#EF9F27", "#3B6D11", "#7F77DD", "#4ECDC4"];
const COMIDAS = ["🍕", "🍔", "🌮", "🍗", "🍩"];

function generarConfeti() {
  return Array.from({ length: 40 }, (_, i) => ({
    id: i,
    emoji: i % 4 === 0 ? COMIDAS[i % COMIDAS.length] : null,
    x: (Math.random() - 0.5) * 380,
    y: 140 + Math.random() * 300,
    r: Math.random() * 720 - 360,
    color: COLORES[i % COLORES.length],
    delay: Math.random() * 0.25,
  }));
}

export default function Confirmacion({ resultado, lista, total, otras, porId }) {
  const [copiado, setCopiado] = useState(false);
  const [confeti] = useState(generarConfeti);
  const yaVoto = resultado?.yaVoto;
  const url = window.location.origin + window.location.pathname;
  const mensaje = `Ayúdanos a decidir qué negocio de comida montar 🍽️ Vota en 10 segundos, sin registro: ${url}`;

  useEffect(() => {
    if (!yaVoto) playSuccess();
  }, [yaVoto]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (e) {
      console.error(e);
    }
  }

  const votosDeMiOpcion = resultado?.id ? porId.get(resultado.id)?.votes || 0 : 0;
  const esVisible = resultado?.id ? lista.some((o) => o.id === resultado.id) : false;

  let subtitulo = "Puede ser la idea que nos ayude a decidir el negocio 🍽️";
  if (yaVoto) {
    subtitulo = "Solo se permite un voto por dispositivo. Mira cómo va la votación:";
  } else if (resultado?.escrita && !esVisible && votosDeMiOpcion < UMBRAL_NUEVA_OPCION) {
    subtitulo = `Tu idea «${resultado.label}» quedó registrada. Si otra persona la propone, se vuelve una opción para votar 🌟`;
  } else if (resultado?.label) {
    subtitulo = `Tu voto por ${resultado.emoji} ${resultado.label} ya cuenta.`;
  }

  return (
    <motion.div
      className="vidrio relative rounded-3xl w-full max-w-md p-6 sm:p-8 flex flex-col items-center text-center gap-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {!yaVoto && (
        <div className="absolute top-16 left-1/2 pointer-events-none z-20">
          {confeti.map((c) => (
            <motion.span
              key={c.id}
              className={c.emoji ? "absolute text-2xl" : "absolute w-2.5 h-4 rounded-sm"}
              style={c.emoji ? {} : { backgroundColor: c.color }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: c.x, y: c.y, opacity: 0, rotate: c.r }}
              transition={{ duration: 1.7, delay: c.delay, ease: "easeOut" }}
            >
              {c.emoji}
            </motion.span>
          ))}
        </div>
      )}

      <motion.div
        className="text-7xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 12 }}
      >
        {yaVoto ? "🙌" : "✅"}
      </motion.div>

      <h2 className="font-display text-4xl font-extrabold text-stone-800">
        {yaVoto ? "¡Ya habías votado!" : "¡Gracias por tu idea!"}
      </h2>
      <p className="text-stone-600">{subtitulo}</p>

      <Resultados lista={lista} total={total} otras={otras} destacadoId={resultado?.id} />

      <p className="text-sm font-bold text-stone-700 mt-1">Comparte y ayúdanos a llegar a más gente 👇</p>

      <div className="flex flex-col gap-3 w-full">
        <motion.a
          href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noreferrer"
          whileTap={{ scale: 0.94 }}
          className="bg-green-600 text-white font-bold rounded-2xl py-3 shadow-md"
        >
          Compartir por WhatsApp
        </motion.a>

        <motion.a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer"
          whileTap={{ scale: 0.94 }}
          className="bg-blue-600 text-white font-bold rounded-2xl py-3 shadow-md"
        >
          Compartir en Facebook
        </motion.a>

        <motion.button
          onClick={copiar}
          whileTap={{ scale: 0.94 }}
          className="border-2 border-stone-300 text-stone-800 font-semibold rounded-2xl py-3 bg-white cursor-pointer"
        >
          {copiado ? "¡Link copiado!" : "Copiar link"}
        </motion.button>
      </div>
    </motion.div>
  );
}
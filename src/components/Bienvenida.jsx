import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playPop, haptic } from "../sound";
import Numero from "./Numero";

const COMIDAS = ["🍔", "🍕", "🌮", "🍖", "🦐", "🍗", "🍣", "🥙", "🍩", "🍜"];
const PASTILLAS = ["⏱️ 10 segundos", "🔒 Anónimo, sin registro", "🗳️ Tu voto cuenta"];

export default function Bienvenida({ onStart, total }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % COMIDAS.length), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="vidrio rounded-3xl w-full max-w-md p-7 sm:p-9 flex flex-col items-center text-center gap-5"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.97 }}
      transition={{ duration: 0.5 }}
    >
      <div className="h-28 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={i}
            className="text-8xl"
            initial={{ scale: 0, rotate: -40, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 40, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 320, damping: 14 }}
          >
            {COMIDAS[i]}
          </motion.span>
        </AnimatePresence>
      </div>

      <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-[1.05] bg-gradient-to-r from-orange-600 via-rose-600 to-purple-700 bg-clip-text text-transparent">
        ¿Qué negocio de comida le hace falta por aquí?
      </h1>

      <p className="text-stone-600 text-base sm:text-lg">
        Cuéntanos qué te gustaría encontrar. Tu idea puede convertirse en el próximo negocio 🚀
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {PASTILLAS.map((p) => (
          <span
            key={p}
            className="text-xs sm:text-sm font-bold text-stone-700 bg-white rounded-full px-3 py-1 border border-stone-200"
          >
            {p}
          </span>
        ))}
      </div>

      <motion.button
        onClick={() => {
          playPop();
          haptic(15);
          onStart();
        }}
        className="w-full bg-gradient-to-r from-orange-600 to-rose-600 text-white font-extrabold text-xl rounded-2xl py-4 shadow-lg shadow-rose-400/40 cursor-pointer"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.94 }}
      >
        Quiero opinar
      </motion.button>

      {total > 0 && (
        <p className="text-sm font-bold text-stone-600">
          🔥 <Numero valor={total} /> {total === 1 ? "persona ya opinó" : "personas ya opinaron"}
        </p>
      )}
    </motion.div>
  );
}
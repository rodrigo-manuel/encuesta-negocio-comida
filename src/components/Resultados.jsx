import { motion } from "framer-motion";
import Numero from "./Numero";
import { MIN_VOTOS_PORCENTAJE } from "../votos";

export default function Resultados({ lista, total, otras, destacadoId }) {
  const top = [...lista]
    .filter((o) => o.votes > 0)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 6);
  const pocos = total < MIN_VOTOS_PORCENTAJE || top.length === 0;

  return (
    <div className="rounded-2xl bg-white/80 border border-stone-200 p-4 text-left w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-extrabold text-lg text-stone-800">📊 Así va la votación</h3>
        <span className="text-xs font-bold text-stone-500">
          {total} {total === 1 ? "voto" : "votos"}
        </span>
      </div>

      {pocos ? (
        <p className="text-sm text-stone-600">
          Aún hay muy pocos votos. ¡Comparte y ayúdanos a llegar a más gente!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {top.map((o, i) => {
            const mio = o.id === destacadoId;
            return (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="flex justify-between text-sm font-bold text-stone-800">
                  <span>
                    {o.emoji} {o.label}
                    {mio && (
                      <span className="ml-2 text-xs bg-rose-100 text-rose-700 rounded-full px-2 py-0.5">
                        tu voto
                      </span>
                    )}
                  </span>
                  <span>
                    <Numero valor={o.pct} />%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-stone-200 overflow-hidden mt-1">
                  <motion.div
                    className={`h-full rounded-full ${
                      mio
                        ? "bg-gradient-to-r from-rose-500 to-fuchsia-600"
                        : "bg-gradient-to-r from-orange-400 to-orange-600"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${o.pct}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            );
          })}
          {otras > 0 && (
            <p className="text-xs text-stone-500">
              💡 Otras ideas escritas: {Math.round((otras / total) * 100)}%
            </p>
          )}
        </div>
      )}
    </div>
  );
}
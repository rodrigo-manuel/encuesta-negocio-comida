import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { useOpciones, armarLista } from "./votos";
import { isMuted, setMuted } from "./sound";
import Fondo from "./components/Fondo";
import Bienvenida from "./components/Bienvenida";
import Pregunta from "./components/Pregunta";
import Confirmacion from "./components/Confirmacion";

export default function App() {
  const [pantalla, setPantalla] = useState("bienvenida");
  const [uid, setUid] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [silencio, setSilencio] = useState(isMuted());

  const docs = useOpciones();
  const datos = useMemo(() => armarLista(docs), [docs]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        signInAnonymously(auth).catch((e) => console.error(e));
      }
    });
    return unsub;
  }, []);

  return (
    <div className="fondo-animado min-h-dvh relative overflow-x-hidden">
      <Fondo />

      <button
        onClick={() => {
          const v = !silencio;
          setMuted(v);
          setSilencio(v);
        }}
        aria-label={silencio ? "Activar sonido" : "Silenciar"}
        className="vidrio fixed top-3 right-3 z-20 rounded-full w-11 h-11 flex items-center justify-center text-xl cursor-pointer"
      >
        {silencio ? "🔇" : "🔊"}
      </button>

      <div className="relative z-10 min-h-dvh flex items-center justify-center px-4 pt-20 pb-10">
        <AnimatePresence mode="wait">
          {pantalla === "bienvenida" && (
            <Bienvenida key="b" total={datos.total} onStart={() => setPantalla("pregunta")} />
          )}
          {pantalla === "pregunta" && (
            <Pregunta
              key="p"
              uid={uid}
              lista={datos.lista}
              total={datos.total}
              porId={datos.porId}
              onDone={(r) => {
                setResultado(r);
                setPantalla("confirmacion");
              }}
            />
          )}
          {pantalla === "confirmacion" && (
            <Confirmacion
              key="c"
              resultado={resultado}
              lista={datos.lista}
              total={datos.total}
              otras={datos.otras}
              porId={datos.porId}
            />
          )}
        </AnimatePresence>
      </div>
      <footer className="fixed bottom-0 inset-x-0 z-20 text-center py-2 text-xs font-semibold text-white/80" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}>
         Creado por Rodrigo Mnuel Alfaro Giraldo, futuro Ingeniero de software 2027
       </footer>
    </div>
  );
}
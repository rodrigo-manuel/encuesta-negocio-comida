import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

export default function Numero({ valor }) {
  const [n, setN] = useState(0);
  const previo = useRef(0);

  useEffect(() => {
    const control = animate(previo.current, valor, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => setN(Math.round(v)),
    });
    previo.current = valor;
    return () => control.stop();
  }, [valor]);

  return <>{n}</>;
}
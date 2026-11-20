# Encuesta para un negocio de comida

Aplicación web para que los clientes de un emprendimiento de comida de un amigo votaran qué tipo de comida querían que vendiera. Los votos se guardan en tiempo real y las ideas nuevas que escribe la gente se convierten en opciones cuando varias personas coinciden.

**En línea:** https://encuesta-negocio-comida.web.app

## Funciones

- Votación con resultados en tiempo real (Firestore `onSnapshot`).
- Cada voto se guarda con el usuario anónimo de Firebase Authentication, y la respuesta y el contador se escriben en una sola transacción (se guardan los dos o ninguno).
- Ideas libres: el texto se normaliza (minúsculas, sin tildes, singular y una lista de sinónimos) y, cuando varias personas escriben la misma idea, aparece como nueva tarjeta.
- Porcentajes visibles solo a partir de un mínimo de votos, para no sesgar a los primeros votantes.
- Animaciones con Framer Motion, efectos de sonido con opción de silencio y diseño adaptable a celular.

## Tecnologías

React 19, Vite, Tailwind CSS 4, Framer Motion, Firebase (Firestore, Authentication y Hosting), Oxlint.

## Ejecutar

```bash
npm install
cp .env.example .env.local   # completar con la configuración web del proyecto de Firebase
npm run dev
npm run build && firebase deploy   # publicar en Firebase Hosting
```

## Autor

Rodrigo Manuel Alfaro Giraldo · [github.com/rodrigo-manuel](https://github.com/rodrigo-manuel)

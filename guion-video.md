# Guion del video — AI Ticket It

**Duración objetivo:** 8 a 9 minutos (la consigna pide entre 5 y 10).
**Flujo elegido:** *Compra de entradas y su ciclo de vida*: comprar → pagar → cancelar → reembolsar.

Por qué este flujo: cubre los CU 12 (comprar sin superar el cupo), 1 (ver mis compras y días restantes), 7 y 8 (cancelar) y 2 (vista del organizador). Además muestra lo más interesante del diseño: la máquina de estados, el dominio con comportamiento y la UI que no duplica las reglas.

---

## Plan de grabación (2 partes)

| Parte | Qué grabás | Herramienta | Duración final |
| --- | --- | --- | --- |
| A | La app en el celular recorriendo el flujo, **sin hablar** | Grabador de pantalla del celular | 2 a 3 min (después se acelera o recorta) |
| B | Vos en Zoom compartiendo pantalla: código + explicación + el video A | Grabación local de Zoom | 6 a 7 min |

Después se edita: dentro de B se inserta A, o se reproduce A en B mientras narrás (ver Tips).

---

## Parte A: qué grabar en el celular

> Antes de grabar: **reiniciá el backend** (`npm start`) para tener el seed limpio. Los datos viven en memoria.

Hacelo despacio y con pausas de 1 a 2 segundos en cada pantalla (después recortás). Si te equivocás, seguí: se corta en la edición.

### Escena A1: Comprador (Ana)
1. **Login:** tocá la tarjeta "Ana Compradora" y después **Entrar**.
2. **Catálogo:**
   - Escribí "rock" en el buscador y borralo (se ve la búsqueda en vivo).
   - Tocá el chip **Música** y volvé a **Todas**.
   - Tocá **Precio** para ordenar y tocá de nuevo para invertir (↑/↓).
3. Abrí **Rock Night Buenos Aires**:
   - Deslizá la galería de imágenes (1/2 → 2/2).
   - Mostrá **Quedan 19** en VIP (con el seed limpio). Anotalo.
4. Elegí **VIP**, subí la cantidad a **2** y mostrá el **Total: $70.000**.
   - *(Opcional)* Mantené el **+** hasta que se deshabilite al llegar al cupo.
5. **Comprar** → **Reservar** en el diálogo.
6. Pantalla **Compra**:
   - Banner "Reservamos tus entradas…" y estado **Pendiente de pago**.
   - Historial con 1 paso. Pausa.
7. **Pagar** → confirmar.
   - Estado **Confirmada**, **"Faltan 20 días"** y historial con 2 pasos. Pausa.
8. *(Opcional, 15 s)* **Chat** → escribí "¿Hay estacionamiento?" → enviar → volver.
9. **Cancelar compra** → confirmar.
   - Estado **Cancelada**, texto "El organizador está procesando tu reembolso" y historial con 3 pasos.
10. Pestaña **Mis compras**:
    - Tocá el filtro **Cancelada** y después **Todas**.
    - Mostrá una **Confirmada** con "Faltan X días" y la **Pendiente de pago** de Hamlet.

### Escena A2: Organizador (Luis)
11. **Salir** → confirmar → login con **Luis Organizador**.
12. **Mis eventos** → **Rock Night Buenos Aires**:
    - Mostrá **Entradas por tipo**: VIP volvió a **19 disponibles** (lo mismo que antes de la compra de Ana), porque cancelar libera el cupo.
13. Filtro **Cancelada** → en la compra de Ana se ve **"Reembolso pendiente"**.
14. **Marcar reembolsada** → confirmar. Estado **Reembolsada**.
15. **Detalle** de esa compra:
    - Historial completo de 4 pasos (Pendiente → Confirmada → Cancelada → Reembolsada), con quién y cuándo.
    - Mostrá que ya **no hay botones de acción**.

### Escena A3 (opcional, 20 s): Regla de negocio que bloquea
16. Logueado como Ana → **Mis compras** → la compra de **Maratón Solidaria** (evento pasado, utilizada).
    - No aparece **Cancelar**, porque el evento ya se realizó.

---

## Parte B: guion hablado (Zoom)

> Los tiempos son orientativos. Las frases son una base: decilas con tus palabras, no las leas.
> Abrí los archivos **antes** de grabar, en pestañas en este orden, para no buscarlos en vivo.

### 0:00 – 0:40 · Introducción
**Pantalla:** el README o la app abierta.

> "Hola, soy [nombre]. Les presento AI Ticket It, una plataforma para publicar eventos y vender entradas, hecha como TP individual de Desarrollo con IA.
> El backend es Node con Express, con persistencia en memoria, y el frontend es React Native con Expo, que corre en el celular.
> De todos los flujos, elegí mostrar el **ciclo de vida de una compra**: comprar, pagar, cancelar y que el organizador registre el reembolso. Es el flujo que mejor muestra las reglas de negocio."

### 0:40 – 2:40 · Recorrido en la interfaz (video A)
**Pantalla:** reproducí el video del celular (acelerado ×1.5 donde no hay nada importante). Narrá encima:

- **Catálogo:** "Como compradora puedo buscar por texto (ignora acentos y mayúsculas), filtrar por categoría y ordenar por precio, fecha o puntaje del organizador."
- **Detalle:** "Elijo **un** tipo de entrada, como en el modelo de la consigna, y una cantidad. El selector no me deja pasar del cupo disponible."
- **Comprar:** "Al comprar, la compra queda **pendiente de pago** y el cupo ya queda reservado, así dos personas no pueden comprar la misma entrada."
- **Pagar:** "Al pagar pasa a **confirmada** y me muestra cuántos días faltan para el evento."
- **Cancelar:** "Puedo cancelar porque todavía no se usó la entrada y el evento no ocurrió. Las entradas vuelven al cupo."
- **Organizador:** "Del lado del organizador veo las compras del evento por estado y cuántas entradas quedan de cada tipo. Como esta compra estaba pagada, me aparece **Marcar reembolsada**."
- **Historial:** "Cada cambio de estado queda registrado con quién lo hizo y cuándo: es la clase `CambioEstadoCompra` del diagrama."

### 2:40 – 5:30 · Backend
**Pantalla:** VS Code. Seguí el pedido HTTP "de afuera hacia adentro".

1. **Rutas**, [compraRoutes.js:13](backend/src/routes/compraRoutes.js:13):
   > "Cada acción es un POST: `/compras/:id/pagar`, `/cancelar`, `/reembolsar`. Todas pasan por `requireAuth`, que valida el JWT."
2. **Controller**, [compraController.js:20](backend/src/controllers/compraController.js:20):
   > "El controller es mínimo: un handler genérico `comando('pagar')` que llama al service y devuelve el JSON. No tiene try/catch."
3. **Service**, [compraService.js:33](backend/src/services/compraService.js:33):
   > "El service busca la compra, verifica que el usuario participe y le pide **a la compra** que ejecute el comando. No tiene reglas de negocio: solo orquesta."
4. **Dominio: el corazón.** En [Compra.js](backend/src/domain/Compra.js) mostrá:
   - `Compra.crear` (línea 45): valida rol y fecha, y **reserva el cupo** con `tipoEntrada.reservar()`.
   - `pagar` (108), `cancelar` (113, que libera el cupo en 116) y `marcarReembolsada` (119).
   - `#validarReembolso` (176): "Solo el organizador, y solo si la compra **fue pagada**. Si cancelás una pendiente no hay nada que reembolsar."
   - `#actualizarEstado` (207): "Primero valida la transición y recién después cambia el estado y registra el historial. Así un error no deja datos a medias."
   > "Elegí un **modelo de dominio rico**: las reglas viven en las clases, no en los services. Es lo que propone el diagrama, con métodos como `actualizarEstado` y `hayCupoPara`."
5. **Máquina de estados**, [EstadoCompra.js:15](backend/src/domain/EstadoCompra.js:15):
   > "Las transiciones permitidas están en una tabla. Por ejemplo, de Utilizada no se puede volver a Cancelada."
6. **Acciones disponibles**, `accionesPara` en [Compra.js:86](backend/src/domain/Compra.js:86) y [compraPresenter.js:34](backend/src/presenters/compraPresenter.js:34):
   > "El backend le dice al front qué acciones puede hacer **este** usuario sobre **esta** compra. Así la interfaz no repite las reglas."
7. **Errores**, [app.js:27](backend/src/app.js:27):
   > "Si una regla falla, el dominio lanza un `AppError` con su código HTTP, y un único middleware lo convierte en `{ error }`."
8. **Tests** (15 s): mostrá la terminal con `npm test` → **28 pass**. Podés abrir [compra.test.js:93](backend/test/domain/compra.test.js:93).
   > "Las reglas tienen tests unitarios y también hay un test que recorre el flujo completo por HTTP."

### 5:30 – 7:00 · Frontend
1. **Cliente HTTP**, [client.js:81](frontend/src/api/client.js:81):
   > "Todas las llamadas pasan por una función `api` que agrega el token y traduce los errores."
2. **Comprar**, [EventoDetalleScreen.js:69](frontend/src/screens/EventoDetalleScreen.js:69):
   > "Pido confirmación, creo la compra y navego al detalle de la compra recién creada."
3. **Detalle de compra**, [CompraDetalleScreen.js:123](frontend/src/screens/CompraDetalleScreen.js:123) y [CompraDetalleScreen.js:168](frontend/src/screens/CompraDetalleScreen.js:168):
   > "Muestra estado, días restantes y el historial. Los botones salen del componente `AccionesCompra`."
4. **Acciones**, [AccionesCompra.js:12](frontend/src/components/AccionesCompra.js:12) y [AccionesCompra.js:70](frontend/src/components/AccionesCompra.js:70):
   > "Este componente solo muestra los botones que el backend habilitó, cada uno con su confirmación. Sirve igual para el comprador y para el organizador."
5. **Accesibilidad** (20 s):
   > "Cuidé la accesibilidad: cada botón tiene nombre y estado para lectores de pantalla, las áreas táctiles son de al menos 44 px y los estados se muestran con texto e ícono, no solo con color."

### 7:00 – 9:00 · Conclusión sobre el uso de IA
> ⚠️ Esta parte tiene que ser **tuya**. Abajo hay disparadores con cosas que **realmente pasaron** en este proyecto. Elegí 2 o 3 por punto y contalas con tu experiencia. Usá la frase al pie de cada uno como punto de partida.

**Ventajas**
- Velocidad: en poco tiempo tuve backend, frontend, seed y tests.
- Me sirvió para aprender un stack nuevo (Expo, React Navigation) sin leer toda la documentación de entrada.
- Para auditar: le pedí un análisis del proyecto contra la consigna y encontró desvíos y bugs.

> *"Lo que más me sirvió fue…"*

**Desventajas y riesgos**
- **Se desvía del enunciado sin avisar:** generó compras con varios tipos de entrada cuando la consigna pedía uno, y agregó código "de compatibilidad" que nadie pidió.
- **Bugs sutiles:** pagar dos veces descontaba cupo de más, y cancelar una compra *pendiente* la marcaba como *reembolsada*. Compilaba y "andaba", pero las reglas estaban mal.
- **Diseño pobre por defecto:** el primer modelo era anémico (objetos planos y funciones sueltas), no el modelo con comportamiento del diagrama.
- **Conocimiento desactualizado:** Expo cambia mucho entre versiones (el mismo template lo advierte), y hubo cosas que en web no funcionaban, como los `Alert` con botones.
- **Riesgo de no entender lo que se entrega:** si no revisás, entregás código que no sabés explicar.

> *"Me di cuenta de que…"*

**Dificultades**
- El frontend quedó en un repositorio git anidado y casi se pierde el trabajo. *(Si lo resolviste, contá cómo.)*
- Probar en el celular real: la IP de la PC y el firewall. *(Ajustá a lo que te pasó.)*

**Aprendizajes**
- La IA es muy buena ejecutando, pero **las decisiones de diseño tienen que ser mías**: un tipo por compra, reembolso como acción del organizador, dominio rico.
- Pedir un **plan antes de ejecutar** y revisarlo me ahorró retrabajo.
- Los **tests** fueron la forma de confiar en lo generado.

**Valoración personal**
> *"En productividad, … En calidad, el resultado fue bueno **porque** revisé y corregí; sin eso habría entregado algo que funcionaba pero no cumplía la consigna."*
> Cerrá con una frase propia y **"Gracias"**.

---

## Tips

### Preparación
- [ ] Celular y PC en la **misma red Wi-Fi**. Si el celular no conecta al backend, Windows Defender suele estar bloqueando el puerto **3001**: aceptá el aviso del firewall la primera vez que corre `node` (red privada) o agregá una regla de entrada.
- [ ] **Reiniciá el backend** justo antes de grabar la parte A, para tener el seed limpio.
- [ ] Modo **No molestar**, batería cargada y brillo alto.
- [ ] Android: activá **Opciones de desarrollador → Mostrar toques**, así se ve dónde tocás.
- [ ] Cerrá el menú de desarrollo de Expo si aparece.
- [ ] Ensayá el recorrido A una vez sin grabar.

### Grabar el celular (parte A)
- **Android:** panel rápido → *Grabar pantalla*, sin audio. **iPhone:** Centro de control → *Grabación de pantalla*.
- **Alternativa (Android):** [scrcpy](https://github.com/Genymobile/scrcpy) espeja el celular en la PC por USB. Así grabás **todo en una sola toma de Zoom**, con la ventana del celular al lado de VS Code y sin editar después.

### Grabar la explicación (parte B, Zoom)
- Creá una reunión sola → **Compartir pantalla** → **Grabar en esta computadora**. La grabación local sale en mejor calidad que la de la nube.
- En Zoom, activá *Optimizar para video* solo si reproducís el video A dentro de Zoom.
- En VS Code:
  - Zoom de fuente con `Ctrl` + `+` (2 o 3 veces).
  - Tema claro u oscuro, pero con buen contraste.
  - Ocultá la barra lateral (`Ctrl` + `B`) cuando muestres código.
  - Cerrá las pestañas que no uses.
- Para ir directo a una línea: `Ctrl` + `P` → nombre del archivo → `:45`.
- Cámara opcional: un recuadro chico con tu cara le da cercanía.
- Usá auriculares con micrófono, en un lugar silencioso.
- **No leas:** tené este guion en el celular o en una segunda pantalla, solo con los títulos.

### Edición
- En Windows 11 ya tenés **Clipchamp** (gratis): poné el video de Zoom en la línea de tiempo y, en el minuto 0:40, insertá el video del celular. Se puede acelerar ×1.5 y recortar las pausas.
- También podés poner el video del celular **en un costado** (picture-in-picture) mientras hablás.
- Controlá que el total quede **entre 5 y 10 minutos**. Si te pasás, recortá primero la parte de frontend: la consigna pide explicarlo, pero con 1 minuto alcanza.
- Exportá en 1080p.

### Errores comunes
- Pasar el código muy rápido: quedate **3 o 4 segundos** en cada fragmento y señalá con el cursor.
- Mostrar demasiados archivos: con los 8 o 10 de este guion alcanza.
- Olvidarse de la conclusión: es parte de la consigna y de lo que más se valora ("criterio y reflexión crítica").

# ACPM — Manual de Usuario

## Altas Capacidades Project Manager v1.0.0

> Plataforma de gestión de proyectos informáticos diseñada específicamente para equipos con Altas Capacidades Cognitivas (AACC).

---

## Índice

01.  [Introducción y conceptos clave](#1-introducci%C3%B3n-y-conceptos-clave)
02.  [Acceso al sistema](#2-acceso-al-sistema)
03.  [Navegación general](#3-navegaci%C3%B3n-general)
04.  [Dashboard — Panel principal](#4-dashboard--panel-principal)
05.  [Proyectos](#5-proyectos)
06.  [Kanban AACC](#6-kanban-aacc)
07.  [Tareas](#7-tareas)
08.  [Sesiones cognitivas y Flujo Profundo](#8-sesiones-cognitivas-y-flujo-profundo)
09.  [Sprint cognitivo](#9-sprint-cognitivo)
10.  [Bienestar cognitivo](#10-bienestar-cognitivo)
11.  [Base de conocimiento](#11-base-de-conocimiento)
12.  [Perfil de usuario](#12-perfil-de-usuario)
13.  [Administración de usuarios](#13-administraci%C3%B3n-de-usuarios)
14.  [Glosario AACC](#14-glosario-aacc)

---

## 1\. Introducción y conceptos clave

ACPM adapta los flujos de trabajo, interfaces y métricas para potenciar las fortalezas únicas de las personas con pensamiento divergente, hipersensibilidad y procesamiento multidimensional. El sistema protege el tiempo de flujo profundo, elimina la fricción burocrática y ofrece visibilidad cognitiva real del equipo.

### 1.1 ¿Qué hace diferente a ACPM?

A diferencia de un gestor de proyectos convencional, ACPM incorpora conceptos diseñados para perfiles AACC:

**Puntos de Complejidad Cognitiva (PCC)**: Sustituyen los "story points" tradicionales. Miden la carga cognitiva real de una tarea usando la escala de Fibonacci (1, 2, 3, 5, 8, 13, 21). Las tareas con PCC alto (≥ 5) requieren un contexto estratégico que explique _por qué_ la tarea importa, ya que las personas AACC necesitan comprender el impacto real para comprometerse.

**Tipos cognitivos**: Cada tarea se clasifica según el tipo de esfuerzo mental que requiere:

*   🟣 **Deep Focus** — Trabajo de concentración profunda. Requiere bloques largos sin interrupciones.
*   🟠 **Creativo** — Ideación, diseño, exploración de soluciones innovadoras.
*   🔵 **Rutina** — Tareas recurrentes o administrativas. Bajo esfuerzo cognitivo.
*   🟢 **Colaborativo** — Trabajo en equipo, reuniones, code review.
*   🟣 **Exploratorio** — Investigación, spikes técnicos, aprendizaje.

**Índice de Carga Cognitiva (ICC)**: Métrica que mide la carga cognitiva acumulada de cada miembro del equipo. Un ICC elevado durante varios días consecutivos activa alertas de sobrecarga o riesgo de burnout.

**Flujo Profundo (Hyperfocus Shield)**: Un modo especial que señala al equipo que un miembro está en estado de flujo y no debe ser interrumpido. Se activa al iniciar una sesión cognitiva de trabajo.

**Contexto estratégico**: Campo obligatorio para tareas con PCC ≥ 5 que responde a la pregunta "¿por qué es importante esta tarea?". Los perfiles AACC necesitan entender el impacto real para comprometerse con una tarea compleja.

**Definition of Done (DoD)**: Lista de criterios verificables que deben cumplirse para considerar una tarea completada. El sistema bloquea el paso a "Done" hasta que todos los criterios estén marcados.

### 1.2 Roles de usuario

ACPM define roles especializados que reflejan las dinámicas de un equipo AACC:

| Rol | Emoji | Descripción |
| --- | --- | --- |
| **Admin** | 🛡️ | Administrador del sistema. Puede gestionar usuarios, asignar roles y acceder a todas las funciones. |
| **Architect-Lead** | 👑 | Líder técnico y arquitecto. Define la visión técnica del proyecto. |
| **Deep Contributor** | 🔬 | Contribuidor especializado en trabajo profundo y tareas de alta complejidad. |
| **Connector** | 🔗 | Nexo entre equipos y áreas. Facilita la comunicación y la colaboración. |
| **Flow Guardian** | 🎯 | Protector del flujo del equipo. Vigila la carga cognitiva y los bloqueos. |
| **Product Visionary** | 🚀 | Responsable de la visión de producto y priorización estratégica. |
| **DevOps Integrator** | ⚙️ | Integrador de infraestructura, CI/CD y operaciones. |
| **Quality Auditor** | 👁️ | Auditor de calidad. Revisa código, estándares y procesos. |
| **Stakeholder** | 📊 | Parte interesada. Tiene visibilidad del progreso sin gestión directa. |

### 1.3 Metodologías soportadas

| Metodología | Descripción |
| --- | --- |
| **Kanban AACC** | Flujo continuo adaptado para AACC con columna de "Exploración" para ideas sin compromiso. |
| **Sprint Adaptado** | Sprints flexibles con planificación basada en carga cognitiva, no solo velocidad. |
| **Async Deep** | Trabajo asíncrono profundo. Ideal para equipos distribuidos con preferencia por concentración sin interrupciones. |
| **Híbrido** | Combina elementos de las tres metodologías anteriores según las necesidades del proyecto. |

---

## 2\. Acceso al sistema

### 2.1 Iniciar sesión

Al acceder a la aplicación ( `http://localhost:3000` ) verás la pantalla de login.

**Pasos:**

01.  Introduce tu **email** y **contraseña** en el formulario.
02.  Pulsa **"Acceder al sistema"**.
03.  Si las credenciales son correctas, serás redirigido al **Dashboard**.

En la parte inferior de la pantalla de login se muestran los **usuarios demo** disponibles. Puedes hacer clic en cualquiera de ellos para rellenar automáticamente el formulario con sus credenciales (contraseña: `acpm2026` ).

### 2.2 Recuperar contraseña

Si olvidaste tu contraseña:

01.  En la pantalla de login, pulsa **"¿Olvidaste tu contraseña?"**.
02.  Introduce tu **email** en el formulario que aparece.
03.  Pulsa **"Enviar instrucciones"**.
04.  Recibirás un enlace por correo electrónico para restablecer tu contraseña.
05.  El enlace te llevará al formulario de **"Restablecer contraseña"**, donde podrás introducir y confirmar tu nueva contraseña (mínimo 6 caracteres).
06.  Una vez restablecida, volverás automáticamente al login con un mensaje de confirmación.

> **Nota:** Por seguridad, el sistema siempre muestra el mismo mensaje de confirmación independientemente de si el email existe o no en la base de datos.

### 2.3 Cerrar sesión

Para cerrar sesión, pasa el cursor sobre tu información de usuario en la parte inferior del **menú lateral** y pulsa el botón **✕** que aparecerá.

---

## 3\. Navegación general

### 3.1 Menú lateral (Sidebar)

El menú lateral izquierdo es el punto de navegación principal. Siempre está visible y contiene:

| Icono | Sección | Descripción |
| --- | --- | --- |
| ⌘ | **Dashboard** | Panel principal con KPIs, tareas del día y actividad reciente. |
| ◈ | **Proyectos** | Lista y gestión de proyectos. |
| ⊞ | **Kanban** | Tablero Kanban adaptado para AACC. |
| ◐ | **Bienestar** | Centro de bienestar cognitivo del equipo. |
| ⧖ | **Sprint** | Planificador de sprint cognitivo. |
| ◉ | **Conocimiento** | Base de conocimiento del equipo (ADRs, lecciones, patrones). |
| 🛡 | **Usuarios** | Gestión de usuarios (solo visible para administradores). |

La sección activa se resalta con fondo púrpura y un borde lateral izquierdo del mismo color.

**Zona de usuario (parte inferior del sidebar):**

*   Muestra tu avatar (con tus iniciales), nombre y rol.
*   **Haz clic en tu nombre/avatar** para acceder a tu **perfil** y poder cambiar tu contraseña.
*   Pasa el cursor sobre tu zona para ver el botón de **cerrar sesión** (✕).

### 3.2 Barra superior (Topbar)

La barra horizontal superior muestra:

*   **Título de la sección actual** (izquierda): Cambia según la página en la que te encuentres.
*   **Indicador de energía** (centro-derecha): Cinco puntos que representan tu nivel de energía actual. Si tienes una sesión de flujo activa, aparece la insignia **"🛡 Flujo Activo"** en color teal.
*   **Buscador** (derecha): Campo de búsqueda rápida con el atajo `⌘K`.

---

## 4\. Dashboard — Panel principal

El Dashboard es la página de inicio tras hacer login. Ofrece una visión global de tu trabajo y el estado del equipo.

### 4.1 Saludo personalizado

La cabecera muestra un saludo adaptado a la hora del día:

*   ☀️ **Buenos días** (antes de las 13h)
*   🌤 **Buenas tardes** (13h – 19h)
*   🌙 **Buenas noches** (después de las 19h)

### 4.2 Botones de acción rápida

En la esquina superior derecha hay dos botones:

#### 🧠 Brain Dump

Abre un modal para **vaciar tu mente rápidamente**. Es una herramienta diseñada para perfiles AACC que a menudo tienen múltiples ideas simultáneas:

01.  Pulsa **"🧠 Brain Dump"**.
02.  Selecciona el **proyecto** donde quieres añadir las tareas.
03.  Escribe tus ideas, **una por línea**. Cada línea se convertirá en una tarea independiente.
04.  El contador inferior te indica cuántas tareas se crearán.
05.  Pulsa **"Crear X tarea(s)"** para añadirlas al backlog del proyecto seleccionado.

Todas las tareas creadas mediante Brain Dump se añaden con estado **"Backlog"**, prioridad **"Media"**, tipo cognitivo **"Rutina"** y PCC **3**.

#### ▶ Iniciar Sesión de Flujo

Permite comenzar rápidamente una sesión de trabajo profundo (ver sección 8).

### 4.3 Tarjetas de KPIs

Cuatro tarjetas muestran las métricas más importantes:

| KPI | Descripción |
| --- | --- |
| **PCC · Sprint activo** | Puntos de complejidad cognitiva totales del sprint en curso. Incluye tendencia respecto al sprint anterior. |
| **Tiempo en flujo** | Porcentaje de tiempo dedicado a sesiones de flujo profundo durante la semana. |
| **ICC medio equipo** | Índice de Carga Cognitiva medio del equipo. Si hay alertas activas, se indica con ⚠. De lo contrario, muestra "✓ Todo OK". |
| **Tareas bloqueadas** | Número de tareas actualmente bloqueadas que requieren atención. |

### 4.4 Alertas activas

Si existen alertas de bienestar cognitivo sin resolver, aparecen justo debajo de los KPIs con código de colores:

*   🔴 **Crítica** — Fondo rojo. Requiere acción inmediata.
*   ⚠️ **Aviso** — Fondo ámbar. Situación a vigilar.
*   ℹ️ **Informativa** — Fondo púrpura. Para conocimiento del equipo.

Cada alerta incluye un enlace **"Ver →"** que lleva al Centro de Bienestar.

### 4.5 Proyectos activos

Tarjeta que muestra los **4 proyectos activos más recientes** con:

*   Nombre del proyecto (enlace al detalle).
*   Tipo de proyecto y metodología utilizada.
*   Barra de progreso visual (gradiente púrpura → teal).
*   Indicador de estado con punto de color (🟢 >75%, 🟡 40-75%, 🔴 \<40%).
*   Número de tareas y nivel de complejidad cognitiva (CC X/10).

Un enlace **"Ver todos →"** lleva a la lista completa de proyectos.

### 4.6 Mis tareas — Hoy

Lista las **5 tareas más importantes** asignadas a ti para hoy, ordenadas por energía óptima:

*   Punto de color del tipo cognitivo (izquierda).
*   Título de la tarea (enlace al detalle).
*   Nombre del proyecto.
*   Badge de PCC con código de color (derecha).

### 4.7 Actividad reciente

Muestra las **5 últimas acciones** realizadas en el sistema:

*   Nombre del actor y descripción de la acción.
*   Fecha y hora.
*   Badge de estado asociado.

---

## 5\. Proyectos

### 5.1 Lista de proyectos

Accede a tus proyectos desde el menú lateral **◈ Proyectos**.

**Filtros disponibles:**

*   **Todos** — Muestra todos los proyectos a los que tienes acceso.
*   **Activos** — Solo proyectos en curso.
*   **Pausados** — Proyectos temporalmente detenidos.
*   **Completados** — Proyectos finalizados.

Cada proyecto se muestra como una tarjeta con:

*   **Nombre y descripción** del proyecto.
*   **Etiquetas** (hasta 4 visibles como badges).
*   **Barra de progreso** — Porcentaje calculado automáticamente por tareas completadas.
*   **Tipo de proyecto** — Exploración, Entrega, Investigación, Mantenimiento o Innovación.
*   **Metodología** — Kanban AACC, Sprint Adaptado, Async Deep o Híbrido.
*   **Complejidad cognitiva** — Representada como 10 cuadrados (rellenos/vacíos), de 1 a 10.

### 5.2 Crear un proyecto

01.  Pulsa **"+ Nuevo Proyecto"** en la esquina superior derecha.
02.  Rellena el formulario:

| Campo | Obligatorio | Descripción |
| --- | --- | --- |
| Nombre del proyecto | ✅ | Nombre descriptivo. Ejemplo: "Motor de IA Cognitiva". |
| Descripción | — | Contexto y objetivo del proyecto. |
| Tipo | ✅ | Exploración, Entrega, Investigación, Mantenimiento o Innovación. |
| Metodología | ✅ | Kanban AACC, Sprint Adaptado, Async Deep o Híbrido. |
| Complejidad cognitiva | ✅ | Slider de 1 a 10. Indica la exigencia cognitiva global del proyecto. |
| Etiquetas | — | Palabras clave separadas por comas (ej: "AI, TypeScript, PostgreSQL"). |

01.  Pulsa **"Crear Proyecto"**. El proyecto se crea en estado **"Activo"** y tú eres añadido como **Architect-Lead**.

### 5.3 Detalle de un proyecto

Al hacer clic en un proyecto de la lista, accedes a su vista de detalle con:

**Cabecera:**

*   Nombre del proyecto, descripción completa y etiquetas.
*   Botones de acción: **⊞ Kanban** (abre el Kanban filtrado por este proyecto) y **\+ Nueva Tarea**.

**Panel de estadísticas (5 columnas):**

| Métrica | Descripción |
| --- | --- |
| **Progreso** | Porcentaje completado (X/Y tareas). |
| **PCC Total** | Suma de PCC de todas las tareas, con PCC completados. |
| **Bloqueadas** | Número de tareas bloqueadas. Se resalta en rojo si hay alguna. |
| **En Progreso** | Tareas activas actualmente. |
| **CC Global** | Complejidad cognitiva del proyecto (X/10). |

**Pestañas:**

*   **Tareas** — Lista completa de tareas del proyecto. Cada fila muestra: título (enlace al detalle), tipo cognitivo con color, sprint asignado, asignado, PCC y estado.
*   **Sprints** — Todos los sprints del proyecto con su nombre, objetivo, estado, rango de fechas y progreso de PCC.
*   **Equipo** — Miembros del proyecto con su avatar, nombre y rol dentro del proyecto.

---

## 6\. Kanban AACC

El tablero Kanban es la vista central de trabajo diario. Accede desde **⊞ Kanban** en el menú lateral.

### 6.1 Barra de herramientas

**Selector de proyecto (izquierda):**

*   Desplegable para filtrar por un proyecto específico o ver "Todos los proyectos".

**Filtros por tipo cognitivo:**

*   Botones para filtrar tareas según su tipo cognitivo: Todos, Deep Focus, Creativo, Rutina, Colaborativo, Exploratorio.
*   Pulsa un filtro para activarlo; pulsa de nuevo para desactivarlo.

**Acciones (derecha):**

*   **\+ Nueva Tarea** — Crea una tarea directamente en el proyecto seleccionado.

### 6.2 Columnas del tablero

El Kanban tiene **6 columnas** que representan el flujo de trabajo:

| Columna | Icono | Color | Propósito |
| --- | --- | --- | --- |
| **Exploración** | ◌ | Púrpura | Ideas y tareas sin compromiso de fecha ni asignación. Exclusiva de la metodología AACC — permite a los perfiles con pensamiento divergente explorar sin presión. |
| **Por Hacer** | ○ | Gris azulado | Tareas definidas y listas para comenzar. |
| **En Progreso** | ◈ | Púrpura | Tareas en las que se está trabajando activamente. |
| **En Revisión** | ◉ | Ámbar | En proceso de revisión de código o calidad. |
| **Bloqueada** | ⊗ | Rojo | Tareas que no pueden avanzar por un impedimento externo. |
| **Completada** | ✓ | Teal | Tareas finalizadas con todos los criterios de DoD cumplidos. |

Cada columna muestra a la derecha del título el **número de tareas** que contiene.

### 6.3 Tarjetas de tarea

Cada tarjeta del Kanban muestra:

*   **Badge "🛡 En Flujo Profundo"** (teal) — Indica que alguien está trabajando en esta tarea en modo flujo y no debe ser interrumpido.
*   **Badge "🔴 Bloqueada"** (rojo) — Indica que la tarea tiene un impedimento.
*   **Título de la tarea** (hasta 3 líneas).
*   **Etiquetas** (hasta 2 visibles).
*   **Fila inferior:**
    -   Avatar del asignado (si hay).
    -   Contador de subtareas (X/Y completadas).
    -   Badge de PCC con código de color.
    -   **Menú de mover (⋮)** — Aparece al pasar el cursor. Al pulsar, muestra un desplegable con todas las columnas disponibles para mover la tarea.

**Borde lateral izquierdo:** Cada tarjeta tiene un borde de 3px con el color del tipo cognitivo de la tarea, para identificar rápidamente la naturaleza del trabajo.

### 6.4 Mover tareas entre columnas

01.  Pasa el cursor sobre una tarjeta.
02.  Pulsa el icono **⋮** (tres puntos verticales) que aparece.
03.  Se despliega un menú con todas las columnas (excepto la actual).
04.  Selecciona la columna destino para mover la tarea inmediatamente.

**Importante:** Si la tarea tiene una Definition of Done, no podrá moverse a "Completada" hasta que todos los criterios estén marcados como cumplidos.

---

## 7\. Tareas

### 7.1 Crear una tarea

Accede al formulario de creación desde:

*   **"+ Nueva Tarea"** en la vista de detalle de un proyecto.
*   **"+ Nueva Tarea"** en la barra de herramientas del Kanban.
*   O directamente navegando a `/tasks/new`.

**Campos del formulario:**

| Campo | Obligatorio | Descripción |
| --- | --- | --- |
| **Proyecto** | ✅ | Proyecto al que pertenece la tarea. |
| **Sprint** | — | Sprint al que asignar la tarea. Si se deja vacío, queda en backlog/exploración. |
| **Título** | ✅ | Describe la tarea con precisión. |
| **Tipo de tarea** | ✅ | Implementación, Investigación, Spike, Revisión, Experimento, Documentación, Bug o Refactor. |
| **Tipo cognitivo** | ✅ | Deep Focus, Creativo, Rutina, Colaborativo o Exploratorio. |
| **Prioridad** | ✅ | ⚡ Crítica, ⬆ Alta, → Media, ⬇ Baja, ◌ Algún día. |
| **PCC** | ✅ | Puntos de Complejidad Cognitiva. Selecciona un valor Fibonacci: 1, 2, 3, 5, 8, 13 o 21. |
| **Contexto estratégico** | Si PCC ≥ 5 | Explica por qué es importante esta tarea y qué impacto tiene. **Obligatorio cuando el PCC es 5 o superior.** |
| **Descripción** | — | Alcance técnico, criterios de aceptación, referencias. Soporta Markdown. |
| **Asignar a** | — | Miembro del equipo responsable de la tarea. |
| **Definition of Done** | — | Lista de criterios de aceptación. Puedes añadir/eliminar criterios con "+ Añadir criterio" y "✕". |
| **Etiquetas** | — | Palabras clave separadas por comas. |

> **⚠️ Nota AACC:** Cuando seleccionas un PCC ≥ 5, el sistema muestra una advertencia y el campo "Contexto Estratégico" pasa a ser obligatorio. Esto se debe a que las personas con altas capacidades necesitan comprender el impacto real de las tareas complejas para comprometerse con ellas.

### 7.2 Vista de detalle de una tarea

Al hacer clic en cualquier tarea (desde el Kanban, la lista de proyectos, o "Mis Tareas"), accedes a su vista de detalle completa.

**Zona principal (izquierda):**

*   **Título** — Editable. Haz clic para modificarlo, y al hacer clic fuera se guarda automáticamente.
*   **Badges informativos** — Tipo cognitivo, prioridad, estado, PCC, tipo de tarea.
*   **Contexto estratégico** — Si existe, se muestra en un recuadro destacado con icono 🎯 y etiqueta "CONTEXTO ESTRATÉGICO".
*   **Descripción** — Texto con soporte Markdown.
*   **Definition of Done** — Lista interactiva de criterios:
    -   Cada criterio tiene un checkbox que puedes marcar/desmarcar.
    -   El contador muestra "X/Y" criterios completados.
    -   Los criterios cumplidos aparecen tachados y atenuados.
    -   Si no están todos completos, el botón "Marcar Done" permanece deshabilitado.
*   **Sesiones de trabajo** — Historial de todas las sesiones cognitivas realizadas sobre esta tarea (ver sección 8).
*   **Comentarios** — Hilo de conversación asociado a la tarea.

**Panel lateral (derecha):**

*   **"▶ Iniciar Sesión de Flujo"** — Botón para comenzar una sesión cognitiva en esta tarea.
*   **"✓ Marcar Done"** — Completa la tarea. Solo disponible cuando todos los criterios de DoD están marcados (o si no hay DoD definido).
*   **Metadatos editables:**
    -   Estado — Desplegable para cambiar entre: Backlog, Por Hacer, En Progreso, En Revisión, Bloqueada, Completada, Cancelada.
    -   Prioridad — Desplegable.
    -   PCC — Desplegable con valores Fibonacci.
*   **Información de solo lectura:**
    -   Asignado (avatar + nombre).
    -   Fecha de creación.
    -   Última actualización.
*   **Etiquetas** de la tarea.

### 7.3 Comentarios

En la parte inferior del detalle de una tarea puedes añadir comentarios:

01.  Escribe tu comentario en el campo de texto. Se soporta **Markdown**.
02.  **(Opcional)** Marca la casilla **"💭 Pensamiento en voz alta"** si tu comentario es una reflexión interna, no una comunicación directa. Estos comentarios se muestran con un estilo visual diferente (borde ámbar) para distinguirlos claramente.
03.  Pulsa **"Comentar"**.

El modo **"Pensamiento en voz alta"** es una funcionalidad AACC que permite a los miembros del equipo externalizar su proceso de razonamiento sin que se confunda con comunicación formal. Esto es especialmente útil para perfiles con procesamiento multidimensional que necesitan "pensar hacia fuera".

---

## 8\. Sesiones cognitivas y Flujo Profundo

El sistema de sesiones cognitivas es el núcleo de la funcionalidad AACC de la aplicación. Permite registrar y proteger los periodos de trabajo profundo.

### 8.1 Iniciar una sesión

01.  Desde el **detalle de una tarea**, pulsa **"▶ Iniciar Sesión de Flujo"**.
02.  Se abre un diálog donde debes indicar:
    -   **Nivel de energía** (1 a 5 puntos) — Tu estado actual de energía. Se representa con 5 puntos; selecciona los que correspondan.
    -   **Activar Flujo Profundo** — Casilla opcional. Si la activas, el equipo verá una insignia "🛡 En Flujo Profundo" en tu tarjeta del Kanban, indicando que no debes ser interrumpido.
03.  Pulsa **"Iniciar Sesión"**.

### 8.2 Durante la sesión

Mientras una sesión está activa:

*   En la **barra superior** aparece la insignia **"🛡 Flujo Activo"** en color teal.
*   En el **Kanban**, la tarjeta de la tarea muestra **"🛡 En Flujo Profundo"**.
*   La duración se registra automáticamente desde el momento de inicio.

### 8.3 Finalizar una sesión

01.  Vuelve al detalle de la tarea (el botón ahora dirá **"🛡 Sesión Activa"**).
02.  Pulsa el botón para finalizar la sesión.
03.  Puedes opcionalmente indicar:
    -   **Calidad percibida** (1 a 5) — Tu valoración subjetiva de la calidad del trabajo.
    -   **Notas** — Cualquier observación sobre la sesión.

### 8.4 Historial de sesiones

En el detalle de una tarea, la sección **"Sesiones de trabajo"** muestra todas las sesiones realizadas, con:

*   Avatar y nombre del trabajador.
*   Insignia "🛡 Flujo" si se activó el modo de flujo profundo.
*   Fecha y hora de inicio.
*   Duración total (ej: "2h 15min").
*   Barras de nivel de energía y calidad percibida (5 puntos cada una).

---

## 9\. Sprint cognitivo

El Planificador de Sprint Cognitivo permite organizar el trabajo respetando la carga cognitiva del equipo. Accede desde **⧖ Sprint** en el menú lateral.

### 9.1 Seleccionar proyecto y sprint

01.  En la esquina superior derecha, selecciona el **proyecto** con el desplegable.
02.  Debajo aparecen los **sprints existentes** como botones. El sprint activo se resalta.
03.  Puedes crear un nuevo sprint con el botón **"+ Nuevo Sprint"**.

### 9.2 Información del sprint

Al seleccionar un sprint se muestra:

*   **Nombre y objetivo** del sprint.
*   **PCC total** del sprint (número grande en púrpura).
*   **Distribución cognitiva** — Chips de colores mostrando cuántos PCC hay de cada tipo cognitivo.

### 9.3 Alertas de distribución cognitiva

El planificador analiza automáticamente la composición del sprint y muestra advertencias adaptadas a perfiles AACC:

| Alerta | Condición | Significado |
| --- | --- | --- |
| ✅ **Distribución equilibrada** | Mezcla variada de tipos | La composición es saludable. |
| ⚠️ **Exceso de tareas rutinarias** | \>50% del sprint es tipo "Rutina" | Riesgo de desmotivación AACC. Las personas con altas capacidades necesitan desafíos cognitivos variados. |
| ⚠️ **Exceso de concentración sin anclaje** | \>80% del sprint es tipo "Deep Focus" | Riesgo de dispersión. Demasiado trabajo profundo sin tareas de "anclaje" (rutinarias o colaborativas) puede causar desgaste. |

> **Distribución ideal recomendada:** 40% deep focus / 40% creativo / 20% rutina.

### 9.4 Panel dual: Backlog ↔ Sprint

El planificador muestra dos columnas lado a lado:

**Columna izquierda — "BACKLOG DISPONIBLE":**

*   Lista las tareas del proyecto que no están asignadas a ningún sprint (estado: backlog).
*   Cada tarea muestra su PCC (con código de color), tipo cognitivo y título.
*   Para **añadir una tarea al sprint**, pulsa el botón **"→ Sprint"** que aparece a la derecha de cada tarea.

**Columna derecha — "EN SPRINT":**

*   Lista las tareas ya incluidas en el sprint seleccionado.
*   Muestra el **PCC total acumulado** en la cabecera.
*   Cada tarea muestra PCC, título, avatar del asignado (si hay) y un botón **"✕"** para devolverla al backlog.

El PCC total del sprint se actualiza en tiempo real conforme añades o quitas tareas.

---

## 10\. Bienestar cognitivo

El Centro de Bienestar Cognitivo monitoriza la salud cognitiva del equipo. Accede desde **◐ Bienestar** en el menú lateral.

### 10.1 Visión general

La cabecera muestra:

*   Número de **miembros monitorizados**.
*   Número de **alertas activas** sin resolver.
*   Botones de acción: **📊 Informe Mensual** y **🔄 Rebalancear Carga**.

### 10.2 Alertas activas

Si hay alertas sin resolver, se muestran destacadas en la parte superior:

| Tipo de alerta | Icono | Descripción |
| --- | --- | --- |
| **Sobrecarga** | 🔴 | Un miembro tiene un ICC peligrosamente alto durante varios días. |
| **Hiperfoco prolongado** | ⚠️ | Sesiones de flujo excesivamente largas sin descanso. |
| **Bloqueo por perfeccionismo** | ⚠️ | Una tarea lleva demasiado tiempo en revisión sin avanzar. |
| **Contexto faltante** | ℹ️ | Tareas de alta complejidad sin contexto estratégico definido. |
| **Rutina consecutiva** | ⚠️ | Demasiadas tareas rutinarias asignadas consecutivamente a un perfil AACC. |
| **Riesgo de burnout** | 🔴 | Múltiples indicadores negativos combinados. |

Cada alerta tiene un botón **"Resolver"** para marcarla como gestionada.

### 10.3 Mapa de calor cognitivo

Una tabla visual que muestra el **Índice de Carga Cognitiva (ICC)** de cada miembro del equipo para la semana actual (Lun-Vie):

| Color | ICC | Estado |
| --- | --- | --- |
| 🟢 Verde | \< 6 | Zona óptima de rendimiento. |
| 🟡 Amarillo | 6 – 8 | Carga elevada. Vigilar. |
| 🔴 Rojo | ≥ 8 | Sobrecarga. Requiere intervención. |

Haz clic en cualquier fila para ver el detalle del miembro.

### 10.4 Panel de detalle de miembro

Al seleccionar un miembro del mapa de calor, se despliega un panel con:

**Estadísticas de los últimos 7 días:**

*   ⏱ **Sesiones** — Número total de sesiones de trabajo.
*   🛡 **Sesiones de flujo** — Sesiones con modo flujo activo.
*   ⚡ **Energía media** — Nivel medio de energía al iniciar sesiones.
*   ◉ **PCC activos** — PCC asignados actualmente.

**Perfil cognitivo:**

*   **Cronotipo** — Mañana, Tarde o Noche. Indica las horas de máximo rendimiento.
*   **Umbral de sobrecarga** — De 1 a 10. El nivel a partir del cual el ICC genera alertas.
*   **Bloque mínimo de concentración** — Minutos mínimos necesarios para entrar en estado de flujo.

---

## 11\. Base de conocimiento

La Base de Conocimiento permite al equipo documentar decisiones, patrones y lecciones aprendidas. Accede desde **◉ Conocimiento** en el menú lateral.

### 11.1 Tipos de nodos

| Tipo | Icono | Uso |
| --- | --- | --- |
| **ADR** | 📐 | Architecture Decision Record. Documenta decisiones técnicas de arquitectura. |
| **Lección** | 💡 | Lecciones aprendidas durante el desarrollo. |
| **Patrón** | ⬡ | Patrones de diseño o soluciones reutilizables. |
| **Decisión** | ⚖️ | Decisiones generales de producto o proceso. |

### 11.2 Explorar el conocimiento

La vista se divide en dos paneles:

**Panel izquierdo — Lista de nodos:**

*   Selector de proyecto (filtrar por proyecto).
*   Filtros por tipo de nodo (Todos, ADR, Lección, Patrón, Decisión).
*   Cada nodo muestra: tipo, etiquetas (hasta 3), título, extracto del contenido (2 líneas), autor y fecha de actualización.
*   Haz clic en un nodo para ver su contenido completo en el panel derecho.

**Panel derecho — Detalle del nodo:**

*   Tipo de nodo (badge).
*   Título completo.
*   Etiquetas.
*   Contenido completo con formato.
*   Autor y fecha de última actualización.
*   Botón "✕" para cerrar el panel de detalle.

### 11.3 Crear un nodo de conocimiento

01.  Pulsa **"+ Nuevo Nodo"**.
02.  Rellena el formulario:

| Campo | Obligatorio | Descripción |
| --- | --- | --- |
| **Tipo** | ✅ | ADR, Lección, Patrón o Decisión. |
| **Título** | ✅ | Ejemplo: "ADR-002: Elección de motor de embeddings". |
| **Contenido** | ✅ | Contexto, decisión tomada, alternativas consideradas... |
| **Etiquetas** | — | Separadas por comas (ej: "architecture, decision, AI"). |

01.  Pulsa **"Guardar"** para crear el nodo.

---

## 12\. Perfil de usuario

Accede a tu perfil haciendo clic sobre **tu nombre o avatar** en la parte inferior del menú lateral.

### 12.1 Editar información de perfil

La parte superior de la página muestra tu avatar (con color de rol), nombre, email y rol actual.

**Campos editables:**

| Campo | Descripción |
| --- | --- |
| **Nombre completo** | Tu nombre como se muestra en la aplicación. |
| **Zona horaria** | Se usa para mostrar fechas correctamente y determinar tu cronotipo. Opciones: Europe/Madrid, Europe/London, America/New\_York, America/Los\_Angeles, Asia/Tokyo, UTC. |

El **email** y el **rol** no se pueden cambiar desde el perfil. Contacta a un administrador para modificarlos.

Pulsa **"Guardar Cambios"** para aplicar los cambios. Verás un mensaje de confirmación en verde.

### 12.2 Cambiar contraseña

En la segunda tarjeta de la página de perfil puedes cambiar tu contraseña:

01.  Introduce tu **contraseña actual**.
02.  Introduce la **nueva contraseña** (mínimo 6 caracteres).
03.  **Confirma** la nueva contraseña.
04.  Pulsa **"Cambiar Contraseña"**.

Si las contraseñas no coinciden o la contraseña actual es incorrecta, se mostrará un mensaje de error en rojo.

---

## 13\. Administración de usuarios

> **⚠️ Sección exclusiva para usuarios con rol Admin.**

La gestión de usuarios solo es visible y accesible para los usuarios con rol **Admin** (🛡️). Aparece como **"🛡 Usuarios"** en la parte inferior del menú lateral.

### 13.1 Lista de usuarios

La tabla muestra todos los usuarios registrados con las siguientes columnas:

| Columna | Descripción |
| --- | --- |
| **Usuario** | Avatar (con iniciales y color de rol), nombre completo y última actividad ("Visto DD/MM" o "Sin actividad"). |
| **Email** | Dirección de correo electrónico. |
| **Rol** | Rol actual del usuario. Haz clic para cambiar (ver 13.2). |
| **Estado** | Badge "Activo" (teal) o "Inactivo" (rojo). |
| **Acciones** | Botón para activar/desactivar el usuario. |

### 13.2 Cambiar el rol de un usuario

01.  En la columna **"Rol"**, haz clic en el rol actual del usuario.
02.  Se despliega un selector con todos los roles disponibles.
03.  **Selecciona el nuevo rol**. El cambio se aplica inmediatamente.

Los roles disponibles son: Admin, Architect-Lead, Deep Contributor, Connector, Flow Guardian, Product Visionary, DevOps Integrator, Quality Auditor, Stakeholder.

### 13.3 Activar o desactivar un usuario

En la columna **"Acciones"** de cada usuario (excepto tú mismo):

*   Si el usuario está **activo**: Pulsa el botón **"⏻"** (rojo) para **desactivarlo**. El usuario no podrá iniciar sesión.
*   Si el usuario está **inactivo**: Pulsa el botón **"↺"** (teal) para **reactivarlo**.

> **Nota de seguridad:** No puedes desactivarte a ti mismo. Esto evita que el sistema se quede sin administradores.

### 13.4 Crear un nuevo usuario

01.  Pulsa **"+ Nuevo Usuario"** en la esquina superior derecha.
02.  Rellena el formulario:

| Campo | Obligatorio | Descripción |
| --- | --- | --- |
| **Nombre completo** | ✅ | Nombre y apellidos (mín. 2 caracteres). |
| **Email** | ✅ | Dirección de correo electrónico única. |
| **Contraseña** | ✅ | Contraseña inicial (mín. 6 caracteres). |
| **Rol** | ✅ | Rol asignado desde el inicio. Por defecto: Deep Contributor. |

01.  Pulsa **"Crear Usuario"**. Si el email ya existe, se mostrará un error.

---

## 14\. Glosario AACC

| Término | Definición |
| --- | --- |
| **AACC** | Altas Capacidades Cognitivas. Perfil intelectual con pensamiento divergente, procesamiento rápido y alta sensibilidad. |
| **PCC** | Puntos de Complejidad Cognitiva. Escala Fibonacci (1-21) que mide la carga cognitiva de una tarea. |
| **ICC** | Índice de Carga Cognitiva. Métrica acumulativa que mide la carga cognitiva de un miembro del equipo a lo largo del tiempo. |
| **Flujo Profundo** | Estado de concentración máxima donde la productividad es óptima. ACPM protege estos periodos señalizándolos al equipo. |
| **Hyperfocus Shield** | Mecanismo de protección del flujo profundo. Cuando un miembro activa el modo flujo, se le protege de interrupciones. |
| **Cronotipo** | Patrón biológico de actividad/descanso de una persona (mañana, tarde, noche). Determina las horas de máximo rendimiento cognitivo. |
| **Brain Dump** | Técnica de descarga mental. Permite externalizar múltiples ideas rápidamente sin estructura, para procesarlas después. |
| **DoD** | Definition of Done. Lista de criterios que deben cumplirse para considerar una tarea como completada. |
| **ADR** | Architecture Decision Record. Documento que captura una decisión de arquitectura importante junto con su contexto y alternativas. |
| **CC** | Complejidad Cognitiva. Métrica de 1-10 que indica la exigencia intelectual global de un proyecto. |
| **Contexto estratégico** | Explicación del "por qué" de una tarea compleja. Obligatorio para PCC ≥ 5 en perfiles AACC. |
| **Pensamiento en voz alta** | Modo de comentario que permite externalizar el proceso de razonamiento sin confundirlo con comunicación formal. |

---

_ACPM v1.0.0 — Marzo 2026_  
_Sistema de gestión especializado para equipos con Altas Capacidades Cognitivas._

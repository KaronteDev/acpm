# 🎨 Temas Personalizables + 🔊 Text-to-Speech

## ✨ Características Implementadas

### 1️⃣ **Tres Esquemas de Colores**

#### 🌞 **Tema Claro** (light)
- Fondo blanco y colores suaves
- Ideal para ambientes bien iluminados
- Contraste moderado

#### 🌙 **Alto Contraste** (high_contrast)
- Colores vibrantes (amarillo, magenta, cian)
- Cumple con WCAG AAA
- Máxima legibilidad

#### 🎨 **Amigable Daltonismo** (colorblind)
- Optimizado para deuteranopia
- Colores: azules, naranjas, grises
- Accesibilidad para daltónicos

---

### 2️⃣ **Preferencias Persistentes**

✅ Guardadas en la base de datos PostgreSQL
✅ Caché en localStorage para carga rápida
✅ Auto-cargan en cada sesión
✅ Seleccionables en `/preferences`

---

### 3️⃣ **Text-to-Speech (TTS)**

#### En Notificaciones:
- 🔊 Icono de altavoz en cada notificación
- ▶️ Leer esta notificación una por una
- ⏸️ Pausa/Stop con click
- 📢 Botón "Leer todas" para secuencia completa

#### Configuración:
- ⚙️ Habilitar/deshabilitar TTS
- 🎚️ Control de velocidad (0.5x - 2.0x)
- 🌐 Compatible con navegadores modernos

---

## 📋 Cómo Usar

### Cambiar Tema
1. Click en avatar en la esquina inferior izquierda
2. Seleccionar "⚙️ Preferencias"
3. Elegir uno de los 3 esquemas
4. Se guarda automáticamente

### Usar Text-to-Speech
1. En las notificaciones, verás un icono 🔊
2. Click para leer esa notificación
3. O usa "🔊 Leer todas" para leer todas seguidas
4. Ajusta la velocidad en Preferencias

---

## 🔧 Arquitectura Técnica

### Backend
```
Routes:
  ✓ GET /api/user/preferences
  ✓ PATCH /api/user/preferences
  ✓ GET /api/user/profile

Database:
  ✓ users.theme_preference (VARCHAR)
  ✓ users.text_to_speech_enabled (BOOLEAN)
  ✓ users.tts_voice (VARCHAR)
  ✓ users.tts_rate (DECIMAL)
```

### Frontend
```
Hooks:
  ✓ useTheme() - Gestiona tema actual
  ✓ useTextToSpeech() - Web Speech API

Componentes:
  ✓ ThemeProvider - Envuelve la app
  ✓ PreferencesPanel - UI de preferencias
  ✓ UserMenu - Acceso a preferencias
  ✓ NotificationBell - Botones de TTS

CSS:
  ✓ Variables dinámicas por tema
  ✓ Tailwind integrado
```

---

## 📱 Experiencia de Usuario

### Antes
❌ Todo en tema oscuro (sin opciones)
❌ Sin síntesis de voz
❌ Colores no accesibles

### Ahora
✅ Elige tu tema preferido
✅ Persistente entre sesiones
✅ Lee notificaciones en voz
✅ Control de velocidad de voz
✅ Accesible para daltónicos
✅ Alto contraste disponible

---

## 🚀 Próximos Pasos (Opcionales)

- [ ] Más voces de síntesis (español, inglés, etc)
- [ ] Protesinas personalizadas de tema
- [ ] Exportar/importar preferencias
- [ ] TTS para más contenido (tareas, comentarios)
- [ ] Temas personalizados por usuario

---

## 📚 Archivos Modificados

**Backend:**
- ✏️ `backend/src/index.ts`
- ✏️ `backend/src/routes/notifications.ts`
- ✨ `backend/src/routes/user.ts` (NUEVA)
- ✨ `backend/src/db/migrations/004_add_user_preferences.sql` (NUEVA)

**Frontend:**
- ✏️ `frontend/src/app/layout.tsx`
- ✏️ `frontend/src/app/globals.css`
- ✏️ `frontend/tailwind.config.js`
- ✏️ `frontend/src/lib/api.ts`
- ✏️ `frontend/src/components/NotificationBell.tsx`
- ✏️ `frontend/src/app/(app)/layout.tsx`
- ✨ `frontend/src/lib/useTheme.ts` (NUEVA)
- ✨ `frontend/src/lib/useTextToSpeech.ts` (NUEVA)
- ✨ `frontend/src/components/ThemeProvider.tsx` (NUEVA)
- ✨ `frontend/src/components/PreferencesPanel.tsx` (NUEVA)
- ✨ `frontend/src/app/preferences/page.tsx` (NUEVA)

---

## ✅ Status

- [x] Base de datos migrada
- [x] API endpoints implementados
- [x] Hooks de React creados
- [x] Componentes de UI implementados
- [x] Persistencia en localStorage
- [x] Text-to-speech integrado
- [x] Sin errores TypeScript
- [x] Listo para testing

---

**Nota:** Los cambios se sincronizarán a todos los servidores en el próximo deploy.

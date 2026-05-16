# EMAI-APP — Frontend

App móvil en React Native + Expo para el sistema de seguimiento de exámenes institucionales.

## Stack
- **Expo SDK 54** — plataforma de desarrollo móvil
- **React Native 0.81** — framework UI
- **Expo Router 6** — navegación basada en archivos
- **TypeScript** — tipado estático
- **Expo Camera** — captura de imágenes para OCR
- **Expo Secure Store** — almacenamiento seguro de tokens JWT
- **Expo Image Manipulator** — preprocesamiento de imágenes
- **React Native Reanimated** — animaciones fluidas
- **XLSX** — generación de reportes en Excel

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar la URL del backend
# Editar src/constants/index.ts:
# API_BASE_URL = 'http://192.168.X.X:8000/api/v1'

# 3. Iniciar en modo desarrollo
npm start

# 4. Abrir en dispositivo con Expo Go (escanear QR)
# O correr en emulador:
npm run android
npm run ios
```

## Conectar con el backend

1. El celular y el PC deben estar en la **misma red WiFi**
2. Obtén la IP de tu PC: `ipconfig` (Windows) o `ifconfig` (macOS/Linux)
3. En `src/constants/index.ts`: `API_BASE_URL = 'http://192.168.X.X:8000/api/v1'`
4. El backend debe iniciar con `--host 0.0.0.0`

## Estructura

```
emai-app-sdk54/
├── app/                        # Rutas (Expo Router — file-based)
│   ├── _layout.tsx             # Layout raíz con AuthProvider
│   ├── auth/
│   │   ├── login.tsx           # Pantalla de inicio de sesión
│   │   ├── redeem-token.tsx    # Canjear token de institución
│   │   └── data-terms.tsx      # Términos y condiciones
│   ├── (admin)/                # Rutas del rol Administrador
│   │   ├── index.tsx           # Dashboard admin
│   │   ├── tokens.tsx          # Gestión de tokens de institución
│   │   ├── admins.tsx          # Gestión de administradores
│   │   └── soporte.tsx         # Bandeja de soporte
│   ├── (directivo)/            # Rutas del rol Directivo
│   │   ├── index.tsx           # Dashboard directivo
│   │   ├── usuarios/           # Gestión de usuarios
│   │   ├── cursos.tsx          # Gestión de cursos
│   │   ├── materias.tsx        # Gestión de materias
│   │   ├── supervision.tsx     # Supervisión de docentes
│   │   └── institucion.tsx     # Datos de la institución
│   └── (docente)/              # Rutas del rol Docente
│       ├── index.tsx           # Dashboard docente
│       ├── cursos.tsx          # Mis cursos
│       ├── crear-examen.tsx    # Crear nuevo examen
│       ├── escanear.tsx        # **Escanear examen con cámara**
│       ├── revision-examen.tsx # Revisar y corregir resultados
│       ├── estudiante.tsx      # Perfil de estudiante
│       └── reportes.tsx        # Estadísticas y exportar Excel
├── src/
│   ├── components/             # Componentes reutilizables
│   │   ├── DashboardCard.tsx
│   │   ├── TopBar.tsx
│   │   └── ui/
│   ├── constants/
│   │   └── index.ts            # API_BASE_URL, colores, storage keys
│   ├── context/                # AuthContext, ThemeContext
│   ├── hooks/                  # Hooks personalizados
│   ├── screens/                # Componentes de pantalla adicionales
│   └── types/                  # Tipos TypeScript globales
├── assets/                     # Imágenes, fuentes, íconos
├── app.json                    # Configuración de Expo
├── package.json
└── tsconfig.json
```

## Roles y pantallas

| Rol | Acceso |
|-----|--------|
| **Admin** | Tokens de institución, gestión de admins, bandeja de soporte |
| **Directivo** | Usuarios, cursos, materias, supervisión, datos de institución |
| **Docente** | Cursos propios, crear exámenes, escanear, reportes |

## Flujo de escaneo OCR

1. El docente abre la pantalla **Escanear** y captura 1–3 fotos del examen
2. Las imágenes se envían en **base64** al endpoint `/docente/examenes/escanear`
3. El backend aplica OCR con Tesseract y califica automáticamente
4. El docente revisa los resultados en **Revisión de examen** y ajusta si es necesario
5. La nota final se calcula en escala colombiana **(1.0 – 5.0)**

## Variables de entorno / Configuración

No se usa un archivo `.env` en Expo. Toda la configuración está en:

```ts
// src/constants/index.ts
export const API_BASE_URL = 'http://TU_IP:8000/api/v1';
```

> Recuerda no subir esta URL de producción a GitHub si usa un dominio privado o ngrok.

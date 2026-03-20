# 🥄 La Cuchara — Inteligencia Artificial para la Hostelería en AZCA

![Status](https://img.shields.io/badge/Status-Beta-brightgreen)
![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black)
![Azure](https://img.shields.io/badge/Cloud-Azure%20Services-blue)

**La Cuchara** es una solución tecnológica avanzada diseñada para optimizar la experiencia gastronómica y la gestión operativa en la zona empresarial de **Azca (Madrid)**. El proyecto combina Inteligencia Artificial, Visión por Computador y Análisis de Datos para reducir la merma en restaurantes y mejorar la toma de decisiones del cliente final.

---

## 🚀 La Solución

La plataforma ofrece una experiencia dual para equilibrar la oferta y la demanda en tiempo real:

1.  **Para el Oficinista:** Una aplicación web moderna para explorar los menús del día, filtrar por preferencias dietéticas (celiacos, veganos, etc.) y consultar un semáforo de afluencia para evitar colas.
2.  **Para el Hostelero:** Digitalización instantánea de menús mediante OCR y predicción inteligente de demanda basada en variables externas (clima, eventos en el Bernabéu, festivos, etc.).

---

## 🛠️ Tecnologías Utilizadas

### Frontend & App
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** para un diseño premium y responsivo.
- **Framer Motion** para micro-animaciones fluidas.
- **Lucide React** para iconografía moderna.

### Inteligencia Artificial (AI Pipeline) 🤖
- **Azure Document Intelligence:** Extracción de texto de fotos de menús (OCR).
- **Azure OpenAI (GPT-4o-mini):** Procesamiento de lenguaje natural para estructurar menús e inferir ingredientes.
- **XGBoost Regressor:** Modelo de Machine Learning para la predicción de raciones vendidas.

### Infraestructura & Datos
- **Azure SQL Database:** Almacenamiento relacional de alta disponibilidad.
- **Azure ML Studio / AI Foundry:** Despliegue del endpoint de predicción.
- **SQLAlchemy:** ORM para la comunicación con la base de datos (Python).

---

## 📂 Estructura del Proyecto

El repositorio está organizado para separar la aplicación principal de la infraestructura de IA:

-   `src/`, `public/`, `app/` — Código fuente de la aplicación **Next.js**.
-   `ai_pipeline/` — Contiene toda la lógica de datos y modelos:
    -   `scripts/` — Generación de datos sintéticos y procesamiento OCR.
    -   `src/db/` — Modelos de base de datos y scripts de conexión.
    -   `models/` — Pipeline de entrenamiento del modelo de demanda.
-   `.env.example` — Plantilla de configuración de variables de entorno (Azure, SQL).

---

## 🔧 Configuración e Instalación

### Requisitos Previos
- Node.js 18+
- Python 3.9+ (para el AI Pipeline)
- Credenciales de Azure (se requiere acceso a OpenAI y SQL Database)

### Instalación de la App
```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

### Variables de Entorno
Crea un archivo `.env.local` basado en `.env.example` con tus claves de Azure y base de datos. **Nunca subas este archivo a GitHub.**

---

## 📈 Impacto del Proyecto (Smart Match & Smart Inventory)

-   **Zero Friction:** Los hosteleros no cambian su flujo de trabajo; simplemente hacen una foto a su menú de pizarra.
-   **Sostenibilidad:** Reducción drástica del desperdicio alimentario mediante predicciones precisas basadas en el clima y eventos locales.
-   **User Experience:** Eliminación de la "incertidumbre del menú" para miles de trabajadores de la zona Azca.

---

*Proyecto desarrollado como parte del Máster en IA & Big Data.*

# Guía Paso a Paso para la Configuración en Azure

Esta guía detalla exactamente dónde hacer clic y qué configurar en el portal de Azure para preparar la infraestructura de Inteligencia Artificial del proyecto "La Cuchara".

---

## 🚀 1. Modelo de Machine Learning (Azure AI Foundry / ML Studio)

**Objetivo:** Crear un modelo de Machine Learning que prediga la demanda (`cantidad_vendida`) basándose en los datos de la base de datos SQL.

### Paso 1.1: Crear el Entorno de Trabajo (Workspace)
1. Entra en el [Portal de Azure](https://portal.azure.com/).
2. En la barra de búsqueda superior, escribe **"Azure Machine Learning"** y selecciona el servicio.
3. Haz clic en el botón azul **"+ Crear"** > **"Nueva área de trabajo" (New workspace)**.
4. Rellena los datos:
   * **Suscripción:** La tuya (ej. Azure for Students o Pay-as-you-go).
   * **Grupo de recursos:** Crea uno nuevo llamado `LaCuchara-RG`.
   * **Nombre del área de trabajo:** `LaCuchara-MLWorkspace`.
   * **Región:** `West Europe` (o la que te pille más cerca).
   * Deja el resto por defecto y dale a **"Revisar y crear" (Review + Create)** y luego a **"Crear"**.
5. Cuando termine de implementarse, haz clic en **"Ir al recurso"**.
6. En la pantalla del recurso, verás un botón que dice **"Iniciar Studio" (Launch studio)**. Haz clic. ¡Aquí es donde ocurre la magia!

### Paso 1.2: Conectar los Datos (Azure SQL a ML Studio)
1. Una vez dentro de ML Studio, en el menú de la izquierda, busca la sección **"Datos" (Data)** bajo "Activos".
2. Ve a la pestaña **"Almacenes de datos" (Datastores)**.
3. Haz clic en **"+ Nuevo almacén de datos" (+ New datastore)**.
4. Rellena así:
   * **Nombre de almacén de datos:** `lacucharasqldb`
   * **Tipo de almacén de datos:** Selecciona **Azure SQL Database**.
   * Y aquí metes los datos de nuestro `.env` (Nombre del servidor `lacucharaserver.database.windows.net`, Nombre de la BBDD, Usuario administrador y Contraseña).
5. Dale a **"Guardar" (Save)**. (El Firewall de tu BBDD debe permitir el acceso a servicios de Azure para que esto funcione).

### Paso 1.3: Entrenar el Modelo con AutoML
¡Vamos a hacer que Azure pruebe los algoritmos por nosotros!
1. En ML Studio, menú izquierdo, ve a **"ML Automatizado" (Automated ML)**.
2. Haz clic en **"+ Nuevo trabajo de ML automatizado"**.
3. **Paso 1: Configurar la tarea.**
   * Nombre del experimento: `Prediccion_Demanda_Restaurantes`.
4. **Paso 2: Tipo de tarea.**
   * Selecciona **Regresión** (queremos predecir un número exacto: las raciones).
5. **Paso 3: Seleccionar datos.**
   * Dale a **"Crear"** > "Desde el almacén de datos" > Elige el `lacuchara_sqldb` que acabas de crear.
   * Te pedirá que escribas una consulta SQL para extraer los datos. Pega exactamente esto:
     ```sql
     SELECT 
         hv.cantidad_vendida,
         hv.dia_semana,
         hv.clima,
         hv.festivo,
         hv.evento_bernabeu,
         p.categoria as plato_categoria,
         r.aforo_maximo as restaurante_aforo
     FROM HistoricoVentas hv
     JOIN Plato p ON hv.plato_id = p.id
     JOIN Restaurante r ON hv.restaurante_id = r.id;
     ```
   * Sigue y **selecciona `cantidad_vendida` como la "Columna de destino" (Target column)**.
6. **Paso 4: Proceso (Compute).**
   * Azure necesita un ordenador para entrenar. Dale a "Crear un clúster de proceso". Selecciona la máquina más barata y configúralo (ej. Máximo de nodos: 1 o 2).
7. Haz clic en **"Enviar" (Cerrar y entrenar)**. ¡El modelo empezará a entrenarse solo probando XGBoost, Random Forest, etc.! Tardará unos minutos.

### Paso 1.4: Desplegar el Modelo (Ponerlo en Producción)
1. Cuando termine el trabajo de AutoML, haz clic en él. Te dirá el "Mejor modelo" encontrado (Best model resumen). Haz clic en él.
2. Arriba verás un botón que dice **"Implementar" (Deploy)**. Selecciona **"Punto de conexión en tiempo real" (Real-time endpoint)**.
3. Ponle un nombre fácil (ej. `lacuchara-demand-endpoint`).
4. Selecciona un tipo de máquina básica (puedes ajustar a la más barata por si las dudas) y dale a **"Implementar"**.
5. ¡Listo! Cuando termine, ve a "Puntos de conexión" (Endpoints) en el menú izquierdo, busca el que has creado y envíame:
   * **El Punto de conexión de REST (`REST endpoint`)**
   * **La Clave principal (`Primary key`)** (está en la pestaña "Consumir" o "Consume").

---

## 📷 2. Modelo OCR (Azure AI Document Intelligence)

**Objetivo:** Crear un servicio cognitivo capaz de leer cualquier foto de un menú y devolvernos un JSON estructurado.

### Paso 2.1: Crear el Recurso
1. Vuelve al [Portal de Azure](https://portal.azure.com/).
2. Busca **"Document Intelligence"** en la barra superior.
3. Haz clic en **"+ Crear"**.
4. Rellena los datos:
   * **Suscripción y Grupo de Recursos:** Usa `LaCuchara-RG`.
   * **Región:** `West Europe`
   * **Nombre:** `lacuchara-ocr`
   * **Plan de tarifa:** Busca la opción **Gratuita `F0`** (con esto nos sobra para el máster). Si no te deja, usa la Estándar `S0`.
5. Dale a **"Revisar y crear"** y luego "Crear".

### Paso 2.2: El flujo Híbrido OCR + Inteligencia Artificial (LLM)
Olvídate de dibujar "cajetines" o intentar entrenar modelos "Custom" que fallan si el restaurante cambia el diseño. Vamos a usar la arquitectura **"Leer y Pensar"**, la más puntera ahora mismo:

1. **La parte del "Músculo" (Lectura):** Tu clave del *Document Intelligence* se conectará por código a su modelo `prebuilt-read`. Este modelo no clasifica, solo mira la foto y "escupe" un enorme bloque de texto crudo con todas las palabras (y el orden en el que las ha leído, normalmente de arriba a abajo o guiándose por los saltos de línea y tabulaciones de la foto).
2. **La parte del "Cerebro" (Clasificación):** Yo (desde Python) cogeré ese texto en bruto de la foto y se lo pasaré a un LLM (como OpenAI/GPT) añadiéndole de contexto *exactamente cómo es el esquema de vuestra Base de Datos*.
3. **El resultado:** El LLM será quien, razonando, sabrá distinguir que un "Salmorejo" va a Primeros, una "Lubina" a Segundos y los extraerá en formato JSON puro directamente a las tablas `MenuDiario` y `Plato`.

Todo lo que tenéis que hacer en este recurso es **pasarme las credenciales** a mí.

### Paso 2.3: Pasarme las Credenciales
Estés en la opción que estés, desde el portal de Azure, en el recurso `lacuchara-ocr`:
1. En el menú izquierdo, ve a **"Claves y punto de conexión" (Keys and Endpoint)**.
2. Copia y pégamelos:
   * **Punto de conexión (Endpoint)**
   * **CLAVE 1 (KEY 1)**

---

## ✅ Resumen de tareas para ti

### 1) Para Machine Learning:
* Crear Workspace en ML Studio y conectar Base de Datos.
* Lanzar el trabajo automático (AutoML).
* Desplegar el mejor modelo (Deploy).
* **Entregarme API REST y Key.**

### 2) Para Visión (OCR Híbrido):
* Crear recurso "Azure AI Document Intelligence" (Plan F0 o S0).
* **Entregarme Endpoint y Key.** *(Sáltate el Studio, todo el procesamiento y clasificación lo programaré yo conectándolo con ChatGPT).*

*El código de integración y el backend final ya es cosa mía 😉 ¡A tu ritmo!*

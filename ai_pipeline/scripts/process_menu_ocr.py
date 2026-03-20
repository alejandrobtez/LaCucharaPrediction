import os
import sys
import json
import urllib.parse
from datetime import date
from pydantic import BaseModel, Field
from typing import List

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Importar modelos de base de datos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.db.models import Restaurante, Plato, MenuDiario

# Imports para Azure y OpenAI
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from openai import AzureOpenAI

load_dotenv()

# --- Configuración Base de Datos ---
DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_DRIVER = os.getenv("DB_DRIVER", "{ODBC Driver 17 for SQL Server}")

if not all([DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD]):
    print("Error: Faltan credenciales SQL en .env")
    sys.exit(1)

params = urllib.parse.quote_plus(f"{DB_PASSWORD}")
engine = create_engine(f"mssql+pymssql://{DB_USER}:{params}@{DB_SERVER}/{DB_NAME}")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Configuración APIs OCR e IA ---
AZURE_OCR_ENDPOINT = os.getenv("AZURE_OCR_ENDPOINT")
AZURE_OCR_KEY = os.getenv("AZURE_OCR_KEY")

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini") # Nombre de tu despliegue en Azure

if not all([AZURE_OCR_ENDPOINT, AZURE_OCR_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY]):
    print("⚠️ Faltan credenciales de Azure OCR o Azure OpenAI en el archivo .env.")
    sys.exit(1)

document_analysis_client = None
azure_openai_client = None
try:
    document_analysis_client = DocumentAnalysisClient(
        endpoint=AZURE_OCR_ENDPOINT, credential=AzureKeyCredential(AZURE_OCR_KEY)
    )
    azure_openai_client = AzureOpenAI(
        azure_endpoint=AZURE_OPENAI_ENDPOINT,
        api_key=AZURE_OPENAI_KEY,
        api_version="2024-08-01-preview" # Versión de API para soporte de Structured Outputs (Parsing)
    )
except Exception as e:
    print(f"Error al iniciar clientes API de Azure: {e}")
    sys.exit(1)


# --- Esquemas de Validación Pydantic (Para estructurar la salida del LLM) ---
class PlatoExtraido(BaseModel):
    nombre: str = Field(description="Nombre completo del plato tal y como sale en el menú")
    categoria: str = Field(description="EXACTAMENTE uno de estos valores: 'Primero', 'Segundo', 'Postre'")
    ingredientes_principales: str = Field(description="Lista separada por comas de ingredientes deducidos por ti. Ej: 'patata, huevo, atún'")

class MenuEstructurado(BaseModel):
    precio: float = Field(description="Precio total del menú (número con decimales)")
    platos: List[PlatoExtraido] = Field(description="Lista de todos los platos clasificados")


# --- Funciones Principales ---
def extraer_texto_azure_ocr(image_path: str) -> str:
    """Usa Azure Document Intelligence para extraer todo el texto en bruto de la imagen"""
    print(f"📷 Enviando {image_path} a Azure OCR...")
    with open(image_path, "rb") as f:
        poller = document_analysis_client.begin_analyze_document("prebuilt-read", document=f)
    result = poller.result()
    
    texto_completo = ""
    for page in result.pages:
        for line in page.lines:
            texto_completo += line.content + "\n"
            
    print(f"✅ Texto leído con éxito ({len(texto_completo)} caracteres).")
    return texto_completo


def estructurar_menu_con_llm(texto_ocr: str) -> MenuEstructurado:
    """Envía el texto desordenado a ChatGPT para que use la lógica y estructure los datos"""
    print("🧠 Enviando texto a OpenAI (gpt-4o-mini) para estructuración...")
    
    prompt = f"""
    Eres un experto en menús de bares y restaurantes españoles.
    El siguiente texto fue extraído por un OCR del texto de un menú del día. El OCR lee de arriba a abajo y de izquierda a derecha.

    REGLAS DE CLASIFICACIÓN - DEBES SEGUIRLAS EN ESTE ORDEN:
    1. POSICIÓN PRIMERO: El ORDEN DE APARICIÓN en el texto es la pista más importante. 
       Los platos que aparecen PRIMERO en el texto son "Primero", los que aparecen DESPUÉS son "Segundo".
       No uses tu conocimiento culinario para mover platos de categoría.
    2. SEPARADORES: Si ves una línea en blanco, un guión largo "---" o un cambio de sección, 
       ese es el punto de división entre Primeros y Segundos.
    3. En un menú del día español típico, suele haber entre 3 y 7 platos por categoría.
    4. Clasifica como "Postre" solo si el texto menciona explícitamente postres concretos (ej. "Flan", "Helado").
       Si solo dice "Postre incluido" sin listar platos, no crees registros de tipo Postre.
    5. NUNCA cambies la categoría de un plato basándote en tu opinión culinaria. 
       Un plato de "Lentejas" que aparece en la primera mitad del texto es un "Primero".

    Para cada plato que identifiques:
    - nombre: transcríbelo tal como aparece en el texto.
    - categoria: "Primero", "Segundo" o "Postre" según las reglas anteriores.
    - ingredientes_principales: infiere los ingredientes más representativos separados por comas.

    TEXTO DEL MENÚ (leído de arriba a abajo):
    {texto_ocr}
    """

    # Forzamos la salida estructurada usando el nuevo framework de llamadas a funciones de Azure OpenAI
    try:
        response = azure_openai_client.beta.chat.completions.parse(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": "Eres un asistente de volcado de datos que siempre responde en JSON exacto según el esquema pedido. Tu trabajo es estructurar menús de restaurantes españoles respetando el orden de aparición de los platos en el texto."},
                {"role": "user", "content": prompt}
            ],
            response_format=MenuEstructurado,
        )
        
        datos_json = response.choices[0].message.parsed
        print(f"✅ Menú estructurado inteligentemente:")
        print(f"   Precio: {datos_json.precio}€ | Platos encontrados: {len(datos_json.platos)}")
        return datos_json
    except Exception as e:
        print(f"❌ Error al consultar a Azure OpenAI: {e}")
        return None



def guardar_menu_en_bd(restaurante_id: int, datos_menu: MenuEstructurado, fecha_aplicacion: date = date.today(), imagen_url: str = ""):
    """Guarda en Azure SQL el Precio en MenuDiario y todos los Platos"""
    print(f"💾 Guardando datos en Azure SQL Server...")
    db = SessionLocal()
    try:
        # 1. Crear el Menú
        nuevo_menu = MenuDiario(
            restaurante_id=restaurante_id,
            fecha=fecha_aplicacion,
            precio=datos_menu.precio,
            imagen_ocr_url=imagen_url
        )
        db.add(nuevo_menu)
        db.flush() # Para obtener su ID
        
        # 2. Procesar e insertar los Platos detectados
        for plato_llm in datos_menu.platos:
            nuevo_plato = Plato(
                nombre=plato_llm.nombre,
                categoria=plato_llm.categoria,
                ingredientes_principales=plato_llm.ingredientes_principales
            )
            db.add(nuevo_plato)
            db.flush() # Obtenemos el ID del plato
            
            # 3. Vincular el Plato al Menú de hoy (Tabla M:N menu_plato_assoc)
            nuevo_menu.platos.append(nuevo_plato)
            
        db.commit()
        print(f"🎉 ¡ÉXITO! Menú completo guardado en BBDD (ID Menú: {nuevo_menu.id}).")
    except Exception as e:
        db.rollback()
        print(f"❌ Error al insertar en base de datos: {e}")
    finally:
        db.close()

def eliminar_menu_en_bd(menu_id: int):
    """Elimina un MenuDiario y sus relaciones de la base de datos."""
    print(f"🗑️ Eliminando Menú ID {menu_id}...")
    db = SessionLocal()
    try:
        menu = db.query(MenuDiario).filter(MenuDiario.id == menu_id).first()
        if menu:
            from src.db.models import menu_plato_assoc
            db.execute(menu_plato_assoc.delete().where(menu_plato_assoc.c.menu_id == menu_id))
            db.delete(menu)
            db.commit()
            print("✅ Menú eliminado con éxito.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error al eliminar: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Procesa una imagen de un menú con Azure OCR + ChatGPT")
    parser.add_argument("imagen", help="Ruta de la foto del menú a leer")
    parser.add_argument("--restaurante", type=int, default=1, help="ID del restaurante en tu SQL (Por defecto: 1)")
    args = parser.parse_args()

    if not os.path.exists(args.imagen):
        print(f"La imagen {args.imagen} no existe.")
        sys.exit(1)

    # 1. Pipeline de lectura
    texto_bruto = extraer_texto_azure_ocr(args.imagen)
    
    # 2. Pipeline de inferencia y estructuración
    if texto_bruto.strip():
        datos_estructurados = estructurar_menu_con_llm(texto_bruto)
        
        # 3. Pipeline de guardado BBDD
        if datos_estructurados:
            guardar_menu_en_bd(args.restaurante, datos_estructurados)
    else:
        print("El OCR no detectó ningún texto en la imagen.")

import os
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# ==========================================
# OPCIÓN A: AZURE SQL 
# ==========================================
DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

params = urllib.parse.quote_plus(f"{DB_PASSWORD}")
# Usamos pymssql en lugar de pyodbc para evitar instalar drivers ODBC genéricos del sistema en Linux
connection_string = f"mssql+pymssql://{DB_USER}:{params}@{DB_SERVER}/{DB_NAME}"
engine = create_engine(connection_string)

# ==========================================
# OPCIÓN B: SQLITE (Para desarrollo local)
# ==========================================
# DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "database.sqlite")
# connection_string = f"sqlite:///{DB_PATH}"

# Instanciar el motor de BD
engine = create_engine(connection_string, echo=False)

# Crear clase SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para definir los modelos ORM
Base = declarative_base()

# Función para obtener la sesión en otros scripts
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

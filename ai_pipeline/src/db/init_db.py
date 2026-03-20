import os
import sys

# Añadir el directorio raíz al sys.path para poder importar como módulo
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.db.database import engine
from src.db.models import Base

def init_db():
    print("Conectando a la base de datos y verificando/creando tablas...")
    try:
        # Esto crea las tablas definidas en models.py en Azure SQL si no existen
        Base.metadata.create_all(bind=engine)
        print("¡Operación completada con éxito! Las tablas están listas.")
    except Exception as e:
        print(f"Error al conectar o crear tablas: {e}")

if __name__ == "__main__":
    init_db()

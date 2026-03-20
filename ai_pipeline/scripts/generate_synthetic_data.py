import os
import sys
import random
import urllib.parse
from datetime import date, timedelta
from faker import Faker
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Añadir el directorio raíz al path para importaciones
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.db.models import (
    Restaurante, Plato, Usuario, MenuDiario, HistoricoVentas, 
    Base, Calificacion
)
from dotenv import load_dotenv

load_dotenv()

# Configuración de Azure SQL Database
DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_DRIVER = os.getenv("DB_DRIVER", "{ODBC Driver 17 for SQL Server}")

if not all([DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD]):
    print("Error: Faltan credenciales en .env para conectar a Azure SQL.")
    sys.exit(1)

params = urllib.parse.quote_plus(
    f"DRIVER={DB_DRIVER};SERVER={DB_SERVER};DATABASE={DB_NAME};UID={DB_USER};PWD={DB_PASSWORD}"
)
connection_string = f"mssql+pyodbc:///?odbc_connect={params}"
engine = create_engine(connection_string, fast_executemany=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

fake = Faker('es_ES')

# Constantes de configuración
NUM_USUARIOS = 150
DIAS_HISTORICO = 180 # 6 meses de datos

def clear_db(db: Session):
    print("Vaciando base de datos existente en Azure SQL...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def generar_datos_sinteticos(db: Session):
    print("Iniciando generación de datos sintéticos en la Nube...")
    
    # 1. Crear 70 Restaurantes (Zona Azca, Orense, General Perón, Castellana)
    nombres_restaurantes = [
        "El Capataz", "Petit Azca", "Nigola", "Petit Comité Azca", "Sushi Fusion Azca", 
        "Miss Sushi - Avenida de Brasil", "Madame Sushita", "Sumo Azca", "Lang City", 
        "Aroy Thai Comandante Zorita", "Shan Hai City", "La Cochinita Loca - Tetuán", 
        "La Leñera", "El Barril de Orense", "Rita Restaurante", "La Cazuela Calle Orense", 
        "La Tagliatella Orense", "Gaman", "El Telégrafo", "Envasium", "El Qüenco de Pepa", 
        "La Tasquería", "Pabblo", "Restaurante L'Albufera", "Garten", "Tony Roma's Orense", 
        "Foster's Hollywood Orense", "VIPS Orense", "SUMO Restaurante", "Café Mies", 
        "La Mar Madrid", "Restaurante Viavélez", "Taberna La Trebede", "Lateral Castellana", 
        "Goiko Grill Azca", "Honest Greens Castellana", "Ginos Orense", "Muxia", 
        "Mesón Txistu", "Asador Donostiarra", "Restaurante Samm", "Tierra Burrito Bar Azca",
        "McDonald's General Perón", "Burger King Orense", "KFC Azca", "Carl's Jr. Castellana",
        "Oven Mozzarella Castellana", "La Máquina Castellana", "Tatel Madrid", "Amazónico",
        "Numa Pompilio", "Quintín", "El Paraguas", "Ten con Ten", "Marieta", "Habanera",
        "Pipa & Co", "Perrachica", "Lamucca de Castellana", "Grosso Napoletano Azca",
        "100 Montaditos Orense", "Rodilla Castellana", "Viena Capellanes Azca", 
        "Cafetería HD", "El Brillante Azca", "Txirimiri", "Llaollao Orense", 
        "Smash Bros Burger", "Juicy Avenue Azca", "Maki Orense"
    ]
    
    nombres_restaurantes = list(set(nombres_restaurantes))[:70] # Asegurar 70
    
    restaurantes = []
    calles_azca = ["Av. General Perón", "Calle de Orense", "Paseo de la Castellana", "Plaza de Carlos Trías Bertrán", "Calle Raimundo Fernández Villaverde"]
    
    for nombre in nombres_restaurantes:
        rest = Restaurante(
            nombre=nombre,
            direccion=f"{random.choice(calles_azca)} {random.randint(1, 100)}, Azca, Madrid",
            aforo_maximo=random.randint(40, 150),
            latitud=40.449 + random.uniform(0.001, 0.005),
            longitud=-3.693 - random.uniform(0.001, 0.005)
        )
        db.add(rest)
        restaurantes.append(rest)
    
    db.commit()
    print(f"ok Creados {len(restaurantes)} restaurantes en Azure SQL.")

    # 2. Crear Platos
    platos_primeros = ["Ensalada Mixta", "Salmorejo", "Lentejas", "Sopa de Fideos", "Macarrones con Tomate", "Crema de Verduras", "Ensalada César", "Garbanzos con Espinacas", "Sopa Castellana", "Judías Verdes rehogadas", "Gazpacho Andaluz", "Puré de Calabacín", "Risotto de Setas", "Espaguetis Carbonara", "Menestra de Verduras"]
    platos_segundos = ["Filete de Ternera", "Pollo Asado", "Salmón a la Plancha", "Merluza a la Romana", "Hamburguesa con Patatas", "Lasaña de Carne", "Albóndigas en Salsa", "Pimientos Rellenos", "Bacalao con Tomate", "Jamoncitos de Pollo", "Secreto Ibérico confitado", "Chuletillas de Cordero", "Entrecot a la parrilla", "Lomo de Cerdo asado", "Lubina al horno"]
    platos_postres = ["Tarta de Queso", "Flan casero", "Fruta del tiempo", "Yogur natural", "Tarta de Chocolate", "Natillas", "Helado", "Melón en su jugo", "Arroz con Leche", "Profiteroles", "Tarta de Manzana", "Cuajada con miel"]
    
    platos = []
    for nombre in platos_primeros:
        plato = Plato(nombre=nombre, categoria="Primero", ingredientes_principales="Sal, aceite, etc.")
        db.add(plato)
        platos.append(plato)
    for nombre in platos_segundos:
        plato = Plato(nombre=nombre, categoria="Segundo", ingredientes_principales="Carne, pescado, etc.")
        db.add(plato)
        platos.append(plato)
    for nombre in platos_postres:
        plato = Plato(nombre=nombre, categoria="Postre", ingredientes_principales="Azúcar, leche, etc.")
        db.add(plato)
        platos.append(plato)
        
    db.commit()
    print(f"ok Creados {len(platos)} platos en el catálogo.")

    # 3. Crear Usuarios
    empresas = ["Deloitte", "EY", "KPMG", "Google", "BBVA", "Accenture", "NTT Data", "PwC", "Sacyr", "Generali"]
    usuarios = []
    for i in range(NUM_USUARIOS):
        usuario = Usuario(
            nombre=fake.name(),
            preferencias_dieteticas=random.choice(["Ninguna", "Vegano", "Vegetariano", "Celiaco", "Sin lactosa", "Ninguna", "Ninguna"]),
            empresa_cercana=random.choice(empresas)
        )
        db.add(usuario)
        usuarios.append(usuario)
    db.commit()
    print(f"ok Creados {NUM_USUARIOS} usuarios (oficinistas).")

    # 4. Generar Histórico de Ventas masivo intert
    fecha_inicio = date.today() - timedelta(days=DIAS_HISTORICO)
    climas = ["Soleado", "Lluvia", "Frío"]
    
    total_ventas = 0
    total_calificaciones = 0
    
    print("Pre-generando ventas en memoria (bulk insert a Azure)...")
    
    ventas_batch = []
    menus_batch = []
    calif_batch = []
    
    for dia in range(DIAS_HISTORICO):
        fecha_actual = fecha_inicio + timedelta(days=dia)
        dia_semana_num = fecha_actual.weekday()
        
        es_fin_semana = dia_semana_num >= 5
        clima_dia = random.choice(climas)
        evento_bernabeu = random.random() < 0.1
        festivo = random.random() < 0.05
        
        for rest in restaurantes:
            p1 = random.choice([p for p in platos if p.categoria == "Primero"])
            p2 = random.choice([p for p in platos if p.categoria == "Segundo"])
            postre = random.choice([p for p in platos if p.categoria == "Postre"])
            platos_dia = [p1, p2, postre]

            menu_dia = MenuDiario(
                restaurante_id=rest.id,
                fecha=fecha_actual,
                precio=random.uniform(10.5, 15.5),
                imagen_ocr_url="https://ejemplo.com/menu.jpg"
            )
            menu_dia.platos.extend(platos_dia)
            db.add(menu_dia) # Añadiremos el menu individualmente ya que gestiona relaciones intermedias M:N
            
            for plato_dia in platos_dia:
                cantidad = random.randint(3, 15) 
                
                if es_fin_semana or festivo: 
                    cantidad = max(0, cantidad - 12)
                else:
                    if clima_dia == "Frío" and plato_dia.nombre in ["Lentejas", "Sopa de Fideos", "Garbanzos con Espinacas", "Sopa Castellana"]:
                        cantidad += random.randint(10, 20)
                    elif clima_dia == "Soleado" and plato_dia.nombre in ["Ensalada Mixta", "Salmorejo", "Ensalada César", "Gazpacho Andaluz"]:
                        cantidad += random.randint(10, 20)
                    elif clima_dia == "Lluvia":
                        cantidad -= random.randint(0, 5)
                        
                    if evento_bernabeu:
                        cantidad += random.randint(5, 10)

                    if dia_semana_num == 4 and plato_dia.categoria == "Postre":
                        cantidad += random.randint(5, 15)
                
                cantidad_final = max(0, int(cantidad * (rest.aforo_maximo/100.0))) 

                venta = HistoricoVentas(
                    fecha=fecha_actual,
                    restaurante_id=rest.id,
                    plato_id=plato_dia.id,
                    cantidad_vendida=cantidad_final,
                    clima=clima_dia,
                    dia_semana=dia_semana_num,
                    festivo=festivo,
                    evento_bernabeu=evento_bernabeu
                )
                ventas_batch.append(venta)
                total_ventas += 1

                if cantidad_final > 0 and random.random() < 0.03:
                    calif = Calificacion(
                        usuario_id=random.choice(usuarios).id,
                        plato_id=plato_dia.id,
                        restaurante_id=rest.id,
                        puntuacion=random.randint(3, 5) if cantidad_final > 10 else random.randint(1, 4),
                        fecha=fecha_actual
                    )
                    calif_batch.append(calif)
                    total_calificaciones += 1
                
        # Guardado por bloques cada 10 días para no saturar memoria ni red
        if dia > 0 and dia % 10 == 0:
            db.commit() # Consolida los Menús y sus relaciones
            
            print(f"Progreso: {dia}/{DIAS_HISTORICO} días. Insertando {len(ventas_batch)} ventas temporales a Azure...")
            
            # Insertar las ventas y calificaciones acumuladas en estos 10 días
            try:
                if ventas_batch:
                    db.bulk_save_objects(ventas_batch)
                if calif_batch:
                    db.bulk_save_objects(calif_batch)
                db.commit()
                
            except Exception as e:
                db.rollback()
                print(f"Fallo durante el bulk insert en el día {dia}: {e}")
            
            # ¡CRÍTICO! Vaciar las listas de Python para liberar RAM
            ventas_batch.clear()
            calif_batch.clear()

    # --- FUERA DEL BUCLE PRINCIPAL ---

    # Guardar los últimos días que no entraron en el múltiplo de 10
    try:
        db.commit() # Menús restantes
        if ventas_batch:
            db.bulk_save_objects(ventas_batch)
        if calif_batch:
            db.bulk_save_objects(calif_batch)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Fallo en el remate final: {e}")
        
        
    print(f"ok Creados {total_ventas} registros en histórico de ventas (Target para Azure ML).")
    print(f"ok Creadas {total_calificaciones} calificaciones (Feedback).")
    print("¡Generación en Azure completada con éxito!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        clear_db(db)
        generar_datos_sinteticos(db)
    finally:
        db.close()

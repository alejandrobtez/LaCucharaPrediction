from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey, Table
from sqlalchemy.orm import relationship
from .database import Base

# Tabla M:N para Menú - Plato
menu_plato_assoc = Table(
    'MenuPlato',
    Base.metadata,
    Column('menu_id', Integer, ForeignKey('MenuDiario.id'), primary_key=True),
    Column('plato_id', Integer, ForeignKey('Plato.id'), primary_key=True)
)

class Restaurante(Base):
    __tablename__ = 'Restaurante'
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    direccion = Column(String(255))
    aforo_maximo = Column(Integer)
    latitud = Column(Float)
    longitud = Column(Float)

    menus = relationship("MenuDiario", back_populates="restaurante")
    historico_ventas = relationship("HistoricoVentas", back_populates="restaurante")
    calificaciones = relationship("Calificacion", back_populates="restaurante")

class Plato(Base):
    __tablename__ = 'Plato'
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    categoria = Column(String(50)) # 'Primero', 'Segundo', 'Postre'
    ingredientes_principales = Column(String)

    historico_ventas = relationship("HistoricoVentas", back_populates="plato")
    calificaciones = relationship("Calificacion", back_populates="plato")

class MenuDiario(Base):
    __tablename__ = 'MenuDiario'
    id = Column(Integer, primary_key=True, autoincrement=True)
    restaurante_id = Column(Integer, ForeignKey('Restaurante.id'))
    fecha = Column(Date, nullable=False, index=True)
    precio = Column(Float)
    imagen_ocr_url = Column(String)

    restaurante = relationship("Restaurante", back_populates="menus")
    platos = relationship("Plato", secondary=menu_plato_assoc)

class Usuario(Base):
    __tablename__ = 'Usuario'
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))
    preferencias_dieteticas = Column(String(500))
    empresa_cercana = Column(String(100))

    calificaciones = relationship("Calificacion", back_populates="usuario")

class Calificacion(Base):
    __tablename__ = 'Calificacion'
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey('Usuario.id'))
    plato_id = Column(Integer, ForeignKey('Plato.id'))
    restaurante_id = Column(Integer, ForeignKey('Restaurante.id'))
    puntuacion = Column(Integer)
    fecha = Column(Date)

    usuario = relationship("Usuario", back_populates="calificaciones")
    plato = relationship("Plato", back_populates="calificaciones")
    restaurante = relationship("Restaurante", back_populates="calificaciones")

class HistoricoVentas(Base):
    __tablename__ = 'HistoricoVentas'
    id = Column(Integer, primary_key=True, autoincrement=True)
    restaurante_id = Column(Integer, ForeignKey('Restaurante.id'))
    plato_id = Column(Integer, ForeignKey('Plato.id'))
    fecha = Column(Date, nullable=False, index=True)
    cantidad_vendida = Column(Integer, nullable=False)
    clima = Column(String(50))
    dia_semana = Column(Integer)
    festivo = Column(Boolean)
    evento_bernabeu = Column(Boolean)

    restaurante = relationship("Restaurante", back_populates="historico_ventas")
    plato = relationship("Plato", back_populates="historico_ventas")

-- schema.sql
-- Script de Creación de Tablas para Azure SQL Database - Proyecto La Cuchara

-- Opcional: Para resetear la BD si es necesario durante el desarrollo (descomentad esto con cuidado)
-- DROP TABLE IF EXISTS HistoricoVentas;
-- DROP TABLE IF EXISTS Calificacion;
-- DROP TABLE IF EXISTS MenuPlato;
-- DROP TABLE IF EXISTS MenuDiario;
-- DROP TABLE IF EXISTS Usuario;
-- DROP TABLE IF EXISTS Plato;
-- DROP TABLE IF EXISTS Restaurante;

-- 1. Tabla de Restaurantes
CREATE TABLE Restaurante (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    direccion NVARCHAR(255),
    aforo_maximo INT,
    latitud FLOAT,
    longitud FLOAT
);

-- 2. Tabla de Platos (Catálogo General)
CREATE TABLE Plato (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    categoria NVARCHAR(50), -- 'Primero', 'Segundo', 'Postre'
    ingredientes_principales NVARCHAR(MAX) -- Para la predicción de inventario
);

-- 3. Tabla de Menús Diarios (asociada a los restaurantes)
CREATE TABLE MenuDiario (
    id INT IDENTITY(1,1) PRIMARY KEY,
    restaurante_id INT FOREIGN KEY REFERENCES Restaurante(id),
    fecha DATE NOT NULL,
    precio DECIMAL(6,2),
    imagen_ocr_url NVARCHAR(MAX) -- URL en Azure Blob Storage
);

-- 4. Tabla Intermedia: Relación Menú - Plato (N:M)
CREATE TABLE MenuPlato (
    menu_id INT FOREIGN KEY REFERENCES MenuDiario(id),
    plato_id INT FOREIGN KEY REFERENCES Plato(id),
    PRIMARY KEY (menu_id, plato_id)
);

-- 5. Tabla de Usuarios (Oficinistas en Azca)
CREATE TABLE Usuario (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    preferencias_dieteticas NVARCHAR(500), -- JSON o string ("Vegano, Celiaco")
    empresa_cercana NVARCHAR(100)
);

-- 6. Tabla de Calificaciones (Feedback del usuario)
CREATE TABLE Calificacion (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT FOREIGN KEY REFERENCES Usuario(id),
    plato_id INT FOREIGN KEY REFERENCES Plato(id),
    restaurante_id INT FOREIGN KEY REFERENCES Restaurante(id),
    puntuacion INT CHECK (puntuacion >= 1 AND puntuacion <= 5),
    fecha DATE DEFAULT GETDATE()
);

-- 7. Tabla del Histórico de Ventas (Target del Modelo de Machine Learning)
CREATE TABLE HistoricoVentas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    restaurante_id INT FOREIGN KEY REFERENCES Restaurante(id),
    plato_id INT FOREIGN KEY REFERENCES Plato(id),
    fecha DATE NOT NULL,
    cantidad_vendida INT NOT NULL, -- Target Y a predecir
    -- Variables (Features) que afectan a la predicción
    clima NVARCHAR(50), -- 'Soleado', 'Lluvia', 'Frio'
    dia_semana INT, -- 1=Lunes, 7=Domingo
    festivo BIT, -- 0=No, 1=Sí
    evento_bernabeu BIT -- 0=No, 1=Sí (muy relevante en Azca)
);

-- Indices recomendados para mejorar velocidad en el ML y visualización
CREATE INDEX idx_fecha ON HistoricoVentas(fecha);
CREATE INDEX idx_restaurante_fecha ON MenuDiario(restaurante_id, fecha);

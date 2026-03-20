import os
import sys
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.db.database import engine

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

def fetch_data():
    print("Obteniendo datos de la base de datos...")
    query = """
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
    JOIN Restaurante r ON hv.restaurante_id = r.id
    """
    df = pd.read_sql(query, engine)
    return df

def train_and_evaluate(df):
    print(f"Dataset cargado con {len(df)} registros.")
    
    # Separar Features (X) y Target (y)
    X = df.drop(columns=['cantidad_vendida'])
    y = df['cantidad_vendida']
    
    # Categorizar datos
    numeric_features = ['dia_semana', 'restaurante_aforo']
    categorical_features = ['clima', 'plato_categoria']
    boolean_features = ['festivo', 'evento_bernabeu']
    
    for col in boolean_features:
        X[col] = X[col].astype(int)
        numeric_features.append(col)
        
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ]
    )
    
    # Pipeline con XGBoost
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', xgb.XGBRegressor(
            n_estimators=100, 
            learning_rate=0.1, 
            max_depth=5, 
            random_state=42,
            objective='reg:squarederror'
        ))
    ])
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Entrenando el modelo XGBoost...")
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    preds = np.maximum(0, preds)
    
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)
    
    print("\n--- Resultados de la Evaluación ---")
    print(f"MAE (Error Absoluto Medio): {mae:.2f} raciones")
    print(f"RMSE (Raíz Error Cuadrático): {rmse:.2f} raciones")
    print(f"R2 Score: {r2:.4f}")
    
    return model

def save_model(model):
    model_path = os.path.join(MODEL_DIR, "xgboost_demand_model.joblib")
    joblib.dump(model, model_path)
    print(f"Modelo guardado exitosamente en: {model_path}")

if __name__ == "__main__":
    df = fetch_data()
    model = train_and_evaluate(df)
    save_model(model)

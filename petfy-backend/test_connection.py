# backend/test_connection.py
from sqlalchemy import text
from database import engine

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()
        print("Conexión exitosa a la Base de Datos PostgreSQL")
        print(f"   Versión: {version[0]}")

        # Ver las tablas del esquema petfy_db
        result = conn.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'petfy_db'
            ORDER BY table_name;
        """))
        tablas = [row[0] for row in result]
        print(f"\n Tablas encontradas ({len(tablas)}):")
        for t in tablas:
            print(f"   - {t}")

        # Ver los tipos de documento
        result = conn.execute(text(
            "SELECT idtipodoc, nomtipodoc FROM petfy_db.tipodocumento ORDER BY idtipodoc;"
        ))
        print("\n Tipos de documento en la BD:")
        for row in result:
            print(f"   [{row[0]}] {row[1]}")

except Exception as e:
    print("❌ Error de conexión:")
    print(e)

result = conn.execute(text("SELECT * FROM petfy_db.usuarios;"))
for row in result:
    print(row)
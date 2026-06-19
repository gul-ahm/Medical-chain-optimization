import asyncio
import asyncpg
import os

async def create_db():
    user = "admin"
    password = "password"
    host = "localhost"
    port = "5432"
    
    # Connect to default postgres DB
    conn = await asyncpg.connect(user=user, password=password, host=host, port=port, database="postgres")
    try:
        await conn.execute("CREATE DATABASE supply_chain")
        print("Database supply_chain created successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_db())

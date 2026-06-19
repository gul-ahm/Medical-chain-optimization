import asyncio
import asyncpg

async def reset():
    conn = await asyncpg.connect(user='admin', password='password', host='localhost', port='5432', database='postgres')
    try:
        await conn.execute('DROP DATABASE IF EXISTS supply_chain')
        await conn.execute('CREATE DATABASE supply_chain')
        print('DB Reset Complete')
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(reset())

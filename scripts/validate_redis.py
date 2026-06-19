import asyncio
import json
import os
from redis.asyncio import Redis

async def validate():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis = Redis.from_url(redis_url, decode_responses=True)
    
    print("--- REDIS FEATURE STORE VALIDATION ---")
    
    # List keys
    keys = await redis.keys("feature:medicine:*")
    print(f"Medicine Risk keys found: {len(keys)}")
    
    if keys:
        val = await redis.get(keys[0])
        print(f"Sample Risk Feature ({keys[0]}): {val}")
        
    demand_keys = await redis.keys("demand:WH-001:*")
    print(f"Historical Demand keys found: {len(demand_keys)}")
    
    if demand_keys:
        val = await redis.get(demand_keys[0])
        print(f"Sample Demand Feature ({demand_keys[0]}): {val}")
        
    # Check TTL
    if keys:
        ttl = await redis.ttl(keys[0])
        print(f"Key {keys[0]} TTL: {ttl} seconds")

if __name__ == "__main__":
    asyncio.run(validate())

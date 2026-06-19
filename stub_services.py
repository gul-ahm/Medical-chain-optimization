from fastapi import FastAPI
import uvicorn
import multiprocessing

def run_stub(name, port):
    app = FastAPI(title=f"Stub {name} Service")
    @app.get("/")
    async def index():
        return {"status": "alive", "service": name, "message": "This is a local stub service for the platform command center."}
    uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    p1 = multiprocessing.Process(target=run_stub, args=("Grafana", 3001))
    p2 = multiprocessing.Process(target=run_stub, args=("Prometheus", 9090))
    p1.start()
    p2.start()
    p1.join()
    p2.join()

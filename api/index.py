from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base

# --- IMPORTAMOS TODOS LOS ROUTERS ---
from .routers import (
    auth_routes,
    programs,
    modules,
    lecturers,
    rooms,
    groups,
    specializations,
    constraints,
    availabilities,
    semesters,        # El de Shayan
    offered_modules   # ✅ EL TUYO (Faltaba incluirlo aquí)
)

# Crear las tablas en la BD si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuración de CORS (Permitir que React hable con Python)
origins = [
    "http://localhost:3000",
    "https://icss-icss-team-sage.vercel.app",  # URL de producción aproximada
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONECTAMOS LOS ROUTERS A LA APP PRINCIPAL ---
app.include_router(auth_routes.router)
app.include_router(programs.router)
app.include_router(modules.router)
app.include_router(lecturers.router)
app.include_router(rooms.router)
app.include_router(groups.router)
app.include_router(specializations.router)
app.include_router(constraints.router)
app.include_router(availabilities.router)
app.include_router(semesters.router)

# ✅ AQUÍ ESTABA EL PROBLEMA: Faltaba esta línea
app.include_router(offered_modules.router) 

@app.get("/")
def read_root():
    return {"message": "Welcome to ICSS Scheduler API"}
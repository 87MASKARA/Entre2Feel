FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias esenciales del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Actualizar pip para evitar problemas de compatibilidad
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código de la aplicación
COPY . .

# Exponer el puerto por defecto
EXPOSE 8080

# Comando para iniciar la aplicación usando la variable de puerto asignada por Railway
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]

#!/usr/bin/env python3
"""
Entre2Fit — Google Sheets Setup Utility
Este script configura automáticamente las pestañas y columnas correctas
en tu nueva Google Sheet para la tienda Entre2Fit.
"""

import os
import sys
import json
import time

try:
    import gspread
    from google.oauth2.service_account import Credentials as GSCredentials
except ImportError:
    print("[ERROR] Error: gspread o google-auth no están instalados.")
    print("Por favor instala las dependencias ejecutando: pip install gspread google-auth")
    sys.exit(1)

def load_dotenv_manually():
    """Carga variables desde .env si existe."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars, env_path

def save_dotenv_manually(env_vars, env_path):
    """Guarda las variables de entorno de vuelta en el archivo .env."""
    lines = []
    # Leer el .env existente para preservar comentarios
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                original_line = line.strip()
                if original_line and not original_line.startswith("#") and "=" in original_line:
                    key = original_line.split("=", 1)[0].strip()
                    if key in env_vars:
                        lines.append(f"{key}={env_vars[key]}")
                        del env_vars[key]
                    else:
                        lines.append(original_line)
                else:
                    lines.append(line.rstrip())
    
    # Escribir las variables nuevas sobrantes al final
    for key, val in env_vars.items():
        lines.append(f"{key}={val}")
        
    with open(env_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

def main():
    print("=" * 60)
    print("      *** ASISTENTE DE CONFIGURACIÓN DE GOOGLE SHEETS ***")
    print("=" * 60)
    
    # 1. Cargar archivo de credenciales
    base_dir = os.path.dirname(os.path.abspath(__file__))
    creds_path = os.path.join(base_dir, "credentials.json")
    
    if not os.path.exists(creds_path):
        print("[ERROR] Error: No se encontró el archivo 'credentials.json' en esta carpeta.")
        print("Por favor, asegúrate de colocar las credenciales de tu Service Account de Google.")
        sys.exit(1)
        
    with open(creds_path, "r", encoding="utf-8") as f:
        creds_info = json.load(f)
    
    service_account_email = creds_info.get("client_email", "")
    print(f"Cuenta de Servicio de Google: {service_account_email}")
    print("-" * 60)
    print("IMPORTANTE ANTES DE SEGUIR:")
    print("1. Abre tu nueva Google Sheet ('Ventas') en tu navegador.")
    print(f"2. Haz clic en el botón 'Compartir' (Share) arriba a la derecha.")
    print(f"3. Agrega este correo de servicio: \033[1;32m{service_account_email}\033[0m")
    print("4. Asígnale el rol de 'Editor' y haz clic en Guardar.")
    print("-" * 60)
    
    # Cargar .env
    env_vars, env_path = load_dotenv_manually()
    
    # 2. Solicitar ID de la hoja de cálculo
    current_sheet_id = env_vars.get("GOOGLE_SHEET_ID", "")
    
    print(f"ID actual en el .env: {current_sheet_id if current_sheet_id else 'Ninguno'}")
    sheet_id_input = input("Introduce el ID de tu NUEVA Google Sheet (deja vacío para usar el ID actual): ").strip()
    
    new_sheet_id = sheet_id_input if sheet_id_input else current_sheet_id
    if not new_sheet_id:
        print("[ERROR] Error: Debes ingresar el ID de la hoja de cálculo para continuar.")
        sys.exit(1)
        
    print(f"\nConectando a la hoja con ID: {new_sheet_id}...")
    
    # 3. Autenticación con Google Sheets
    scopes = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]
    creds = GSCredentials.from_service_account_file(creds_path, scopes=scopes)
    gc = gspread.authorize(creds)
    
    try:
        sh = gc.open_by_key(new_sheet_id)
        print(f"[OK] ¡Conexión exitosa a la Google Sheet: '{sh.title}'!")
    except Exception as e:
        print("[ERROR] Error al abrir la hoja de cálculo. Por favor verifica:")
        print(f"   a. Que el ID '{new_sheet_id}' sea correcto.")
        print(f"   b. Que hayas compartido la hoja con el correo de servicio: {service_account_email}")
        print(f"   Detalles del error: {e}")
        sys.exit(1)
        
    # 4. Configurar Pestaña 1: "Inventario"
    print("\nConfigurando pestaña de 'Inventario' (Productos)...")
    
    # Buscar si ya existe la primera pestaña o crearla
    inventory_ws = None
    worksheets = sh.worksheets()
    
    # Intentar buscar "Inventario" o "Productos" o usar la primera hoja (index 0)
    for title in ["Inventario", "Productos", "inventario"]:
        try:
            inventory_ws = sh.worksheet(title)
            print(f"   -> Encontrada pestaña existente: '{inventory_ws.title}'")
            break
        except Exception:
            continue
            
    if not inventory_ws:
        # Si no existe, usamos la pestaña index 0 y la renombramos a "Inventario"
        inventory_ws = worksheets[0]
        try:
            inventory_ws.update_title("Inventario")
            print("   -> Renombrada primera pestaña a 'Inventario'")
        except Exception as e:
            print(f"   -> Usando pestaña principal: '{inventory_ws.title}'")
            
    # Escribir encabezados de Inventario
    inventory_headers = ["ID", "Name", "Category", "Price", "OriginalPrice", "Stock", "Description", "Image", "Certificate", "Featured"]
    inventory_ws.clear()
    inventory_ws.update(range_name='A1', values=[inventory_headers])
    print("   [OK] Encabezados de Inventario configurados correctamente.")
    
    # Insertar productos iniciales de Entre2Fit
    initial_products = [
        [
            "E2F-KIT", 
            "Kit Protocolo Integral BALANCE FEEL", 
            "peptides", 
            180000, 
            415000, 
            100, 
            "El protocolo completo que te ayuda a desinflamar tu cuerpo, eliminar la retención de líquidos y encender nuevamente tu metabolismo sin dietas extremas ni rebotes. Incluye: Gotas Lipo Drean Complex, Protocolo Detox, Sal Rosada del Himalaya, Guía de Alimentación Antiinflamatoria y Plan de Ejercicios en PDF.", 
            "https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/axN0gPIgxQr8rG0tyPSN/media/69ab5b56b3fc00ce6534f016.jpeg", 
            "", 
            "TRUE"
        ],
        [
            "E2F-GOTAS", 
            "Gotas Lipo Drean Complex", 
            "peptides", 
            130000, 
            200000, 
            100, 
            "Nuestra fórmula estrella concentrada para ayudarte a regular la ansiedad de picar dulces, desinflamar el organismo y reparar progresivamente tu metabolismo.", 
            "https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/axN0gPIgxQr8rG0tyPSN/media/69ab5a2cb2a2741dd0d43850.jpeg", 
            "", 
            "TRUE"
        ],
        [
            "E2F-SAL", 
            "Sal Rosada del Himalaya", 
            "accessories", 
            25000, 
            35000, 
            100, 
            "Sal pura rosada del Himalaya para aportar los minerales y electrolitos esenciales necesarios para una correcta hidratación celular sin inflamarte.", 
            "https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/axN0gPIgxQr8rG0tyPSN/media/69ab5b56b3fc00ce6534f016.jpeg", 
            "", 
            "FALSE"
        ],
        [
            "E2F-DETOX", 
            "Protocolo Detox", 
            "peptides", 
            45000, 
            65000, 
            100, 
            "Limpia tu organismo desde las primeras 24 horas y prepara tu cuerpo para absorber correctamente los nutrientes y comenzar la desinflamación.", 
            "https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/axN0gPIgxQr8rG0tyPSN/media/69ab5b56b3fc00ce6534f016.jpeg", 
            "", 
            "FALSE"
        ]
    ]
    inventory_ws.update(range_name='A2', values=initial_products)
    print("   [OK] Productos iniciales de Entre2Fit agregados al Inventario.")
    
    # Obtener el gid (ID de la pestaña de inventario)
    inventario_gid = inventory_ws.id
    
    # 5. Configurar Pestaña 2: "Órdenes"
    print("\nConfigurando pestaña de 'Órdenes' (Ventas)...")
    orders_ws = None
    
    # Buscar si ya existe la pestaña de órdenes
    for title in ["Órdenes", "Ordenes", "ordenes", "órdenes"]:
        try:
            orders_ws = sh.worksheet(title)
            print(f"   -> Encontrada pestaña existente: '{orders_ws.title}'")
            break
        except Exception:
            continue
            
    if not orders_ws:
        # Crear pestaña nueva
        try:
            orders_ws = sh.add_worksheet(title="Órdenes", rows=1000, cols=20)
            print("   -> Creada nueva pestaña: 'Órdenes'")
        except Exception as e:
            print(f"   -> Error creando pestaña, intentando sobreescribir...: {e}")
            orders_ws = sh.get_worksheet(1) if len(sh.worksheets()) > 1 else sh.add_worksheet(title="Órdenes", rows=1000, cols=20)
            
    # Escribir encabezados de Órdenes
    orders_headers = ["ID", "Timestamp", "Nombre", "Apellido", "Email", "Teléfono", "Dirección", "Ciudad", "Departamento", "País", "Total", "Items", "URL Pago", "Estado", "Notas"]
    orders_ws.clear()
    orders_ws.update(range_name='A1', values=[orders_headers])
    print("   [OK] Encabezados de Órdenes configurados correctamente.")
    
    # 6. Actualizar el archivo .env
    print("\nActualizando archivo de configuración local (.env)...")
    
    # Calcular la URL pública del CSV de inventario
    sheet_csv_url = f"https://docs.google.com/spreadsheets/d/{new_sheet_id}/gviz/tq?tqx=out:csv&gid={inventario_gid}"
    
    env_vars["GOOGLE_SHEET_ID"] = new_sheet_id
    env_vars["SHEET_CSV_URL"] = sheet_csv_url
    
    try:
        save_dotenv_manually(env_vars, env_path)
        print("   [OK] ¡Archivo .env actualizado exitosamente!")
        print(f"      - ID de Google Sheet: {new_sheet_id}")
        print(f"      - URL de lectura CSV: {sheet_csv_url}")
    except Exception as e:
        print(f"   [ERROR] Error al guardar el archivo .env: {e}")
        
    print("\n" + "=" * 60)
    print("   *** CONFIGURACIÓN COMPLETADA SATISFACTORIAMENTE! ***")
    print("   Tu hoja de cálculo ya está vinculada y lista para operar.")
    print("=" * 60)

if __name__ == "__main__":
    main()

"""
Entre2Fit — Backend API (FastAPI)
Migración completa: Checkout, Mercado Pago, Google Sheets, Telegram, Email.
"""

import os
import csv
import json
import smtplib
import asyncio
import datetime
from io import StringIO
from typing import Optional, List, Any
from concurrent.futures import ThreadPoolExecutor

import httpx

# Imports opcionales — el servidor arranca aunque no estén instalados
try:
    import mercadopago
    _MP_AVAILABLE = True
except ImportError:
    _MP_AVAILABLE = False

try:
    import gspread
    from google.oauth2.service_account import Credentials as GSCredentials
    _GSPREAD_AVAILABLE = True
except ImportError:
    _GSPREAD_AVAILABLE = False

try:
    from google import genai
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False
from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
if not _GSPREAD_AVAILABLE:
    Credentials = None  # placeholder
from pydantic import BaseModel
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ── Load environment ──────────────────────────────────────────────────────────
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Mercado Pago
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "")
MP_PUBLIC_KEY   = os.getenv("MP_PUBLIC_KEY", "")

# Notificaciones — Admin
ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_CHAT_ID   = os.getenv("TELEGRAM_CHAT_ID", "").strip()

# SMTP (Email)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

# Google Sheets
GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID", "1-vsPu_yUAU0xPJMqwPupB3KP5daTx73PbpzfNyvRhl0")
SHEET_CSV_URL   = os.getenv(
    "SHEET_CSV_URL",
    "https://docs.google.com/spreadsheets/d/1-vsPu_yUAU0xPJMqwPupB3KP5daTx73PbpzfNyvRhl0/gviz/tq?tqx=out:csv&gid=1581422793"
)

# Meta Webhooks
META_VERIFY_TOKEN = os.getenv("META_VERIFY_TOKEN", "entre2fit2026")
FB_PAGE_TOKEN = os.getenv("FB_PAGE_TOKEN", "")
IG_PAGE_TOKEN = os.getenv("IG_PAGE_TOKEN", "")

# Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
AI_BOT_ACTIVE = os.getenv("AI_BOT_ACTIVE", "true").lower() == "true"
_gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY and _GENAI_AVAILABLE else None

# URL pública del sitio (para back_urls de MP y notificaciones)
SITE_URL = os.getenv("SITE_URL", "http://localhost:8000")

# Admin API Key (protección de endpoints administrativos)
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "entre2fit")

# Thread pool para operaciones síncronas (SMTP, Sheets)
executor = ThreadPoolExecutor(max_workers=4)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Entre2Fit API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.entre2fit.com",
        "https://entre2fit.com",
        "https://www.entre2fit.co",
        "https://entre2fit.co",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Admin Auth ────────────────────────────────────────────────────────────────
async def verify_admin_key(x_admin_key: str = Header(None)):
    """Verifica la API key del admin en el header X-Admin-Key."""
    if not x_admin_key or x_admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="No autorizado — API key inválida.")
    return True

# Servir archivos estáticos
app.mount("/css",    StaticFiles(directory=os.path.join(BASE_DIR, "css")),    name="css")
app.mount("/js",     StaticFiles(directory=os.path.join(BASE_DIR, "js")),     name="js")
app.mount("/images", StaticFiles(directory=os.path.join(BASE_DIR, "images")), name="images")
app.mount("/videos", StaticFiles(directory=os.path.join(BASE_DIR, "videos")), name="videos")

# ── Pydantic Models ───────────────────────────────────────────────────────────
class CartItem(BaseModel):
    id:    Any
    name:  str
    price: float
    qty:   int = 1
    image: Optional[str] = None

class CheckoutData(BaseModel):
    fname:   str
    lname:   str
    email:   str
    phone:   str
    address: str
    city:    str
    state:   str
    zip:     str
    country: str = "CO"
    company: Optional[str] = None
    notes:   Optional[str] = None
    items:   List[dict]
    total:   float
    timestamp: Optional[str] = None

class AbandonedCartData(BaseModel):
    event:        str
    cart_items:   List[dict]
    cart_total:   str
    recovery_url: str
    timestamp:    Optional[str] = None

class InventoryUpdateData(BaseModel):
    product_id: str
    stock:      int

# ── Google Sheets (Write) ─────────────────────────────────────────────────────
def get_gspread_client():
    """Devuelve un cliente gspread autenticado."""
    try:
        scopes = [
            "https://spreadsheets.google.com/feeds",
            "https://www.googleapis.com/auth/drive"
        ]
        creds_json_str = os.environ.get("GOOGLE_CREDENTIALS_JSON")
        if creds_json_str:
            import json
            # Railway puede escapar los newlines — manejar ambos formatos
            try:
                creds_info = json.loads(creds_json_str)
            except json.JSONDecodeError:
                creds_json_str = creds_json_str.replace('\\n', '\n')
                creds_info = json.loads(creds_json_str)
            # Asegurar que private_key tenga newlines reales
            if 'private_key' in creds_info:
                creds_info['private_key'] = creds_info['private_key'].replace('\\n', '\n')
            print(f"[Sheets] Credenciales cargadas OK — project: {creds_info.get('project_id', '?')}")
            creds = GSCredentials.from_service_account_info(creds_info, scopes=scopes)
        else:
            creds_path = os.path.join(BASE_DIR, "credentials.json")
            if not os.path.exists(creds_path):
                print("[Sheets] No se encontró GOOGLE_CREDENTIALS_JSON ni credentials.json")
                return None
            creds = GSCredentials.from_service_account_file(creds_path, scopes=scopes)
        return gspread.authorize(creds)
    except Exception as e:
        print(f"[Sheets] Error cargando credenciales: {e}")
        import traceback
        traceback.print_exc()
        return None

def _get_orders_worksheet(client):
    """Busca la pestaña de órdenes con nombre flexible (con/sin acentos)."""
    sh = client.open_by_key(GOOGLE_SHEET_ID)
    for name in ["Órdenes", "Ordenes", "ordenes", "órdenes"]:
        try:
            return sh.worksheet(name)
        except Exception:
            continue
    raise Exception(f"No se encontró pestaña de órdenes en el Sheet. Pestañas disponibles: {[ws.title for ws in sh.worksheets()]}")

def _save_order_sync(order: dict):
    """Escribe una orden en la hoja 'Órdenes' (síncrono — corre en executor).
    Columnas: ID | Timestamp | Nombre | Apellido | Email | Teléfono | Dirección | Ciudad | Departamento | País | Total | Items | URL Pago | Estado | Notas
    """
    client = get_gspread_client()
    if not client:
        print("[Sheets] Sin credentials.json — orden NO guardada en Sheets.")
        return False
    try:
        worksheet = _get_orders_worksheet(client)
        items_str = " | ".join(
            f"{i.get('name','?')} (${i.get('price',0)}) x{i.get('qty',1)}" for i in order.get("items", [])
        )
        worksheet.append_row([
            order.get("order_id", ""),       # A: ID
            order.get("timestamp", ""),      # B: Timestamp
            order.get("fname", ""),          # C: Nombre
            order.get("lname", ""),          # D: Apellido
            order.get("email", ""),          # E: Email
            order.get("phone", ""),          # F: Teléfono
            order.get("address", ""),        # G: Dirección
            order.get("city", ""),           # H: Ciudad
            order.get("state", ""),          # I: Departamento
            order.get("country", ""),        # J: País
            str(order.get("total", 0)),      # K: Total
            items_str,                       # L: Items
            order.get("payment_url") or "",  # M: URL Pago
            order.get("mp_status", "Pending"),# N: Estado
            order.get("notes") or "",        # O: Notas
        ])
        print(f"[Sheets] Orden {order.get('order_id')} guardada correctamente.")
        return True
    except Exception as e:
        print(f"[Sheets] Error guardando orden: {e}")
        return False

async def save_order_to_sheets(order: dict):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, _save_order_sync, order)

# ── Telegram ──────────────────────────────────────────────────────────────────
async def send_telegram(message: str):
    """Envía un mensaje por Telegram al chat del admin."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("[Telegram] No configurado — omitiendo notificación.")
        return
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with httpx.AsyncClient() as client:
            payload = {
                "chat_id":    TELEGRAM_CHAT_ID,
                "text":       message.replace("_", "\\_"),
                "parse_mode": "Markdown"
            }
            resp = await client.post(url, json=payload)
            if resp.status_code == 400 and "parse entities" in resp.text.lower():
                # Fallback sin Markdown si el usuario metió caracteres que lo rompen
                payload["parse_mode"] = None
                payload["text"] = message
                resp = await client.post(url, json=payload)
            resp.raise_for_status()
        print("[Telegram] Notificación enviada.")
    except Exception as e:
        print(f"[Telegram] Error: {e}")

# ── Email (SMTP) ──────────────────────────────────────────────────────────────
def _send_email_sync(to_email: str, subject: str, body_html: str):
    if not SMTP_USER or not SMTP_PASS:
        print("[Email] SMTP no configurado — omitiendo.")
        return
    try:
        msg              = MIMEMultipart("alternative")
        msg["From"]      = SMTP_USER
        msg["To"]        = to_email
        msg["Subject"]   = subject
        msg.attach(MIMEText(body_html, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        print(f"[Email] Enviado a {to_email}.")
    except Exception as e:
        print(f"[Email] Error: {e}")

async def send_email(to_email: str, subject: str, body_html: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, _send_email_sync, to_email, subject, body_html)

# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

# ── GET /api/products ─────────────────────────────────────────────────────────
@app.get("/api/products")
async def get_products():
    """Obtiene productos desde Google Sheets (o fallback CSV local)."""
    try:
        csv_content = None
        if SHEET_CSV_URL:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(SHEET_CSV_URL)
                    resp.raise_for_status()
                    csv_content = resp.text
            except Exception as e:
                print(f"[Products] Error fetching CSV: {e}")

        products = []
        
        def process_reader(reader):
            for row in reader:
                image_url = row.get("Image", "")
                if "drive.google.com/file/d/" in image_url:
                    file_id   = image_url.split("/file/d/")[1].split("/")[0]
                    image_url = f"https://lh3.googleusercontent.com/d/{file_id}"
                elif not image_url:
                    image_url = "https://placehold.co/400x300/E8F7FA/1A8FA0?text=Entre2Fit"

                cert_url = row.get("Certificate", "")
                if "drive.google.com/file/d/" in cert_url:
                    cert_id  = cert_url.split("/file/d/")[1].split("/")[0]
                    cert_url = f"https://lh3.googleusercontent.com/d/{cert_id}"

                def to_int(val, default=0):
                    try:   return int(val) if val and str(val).strip().isdigit() else default
                    except: return default

                products.append({
                    "id":            str(row.get("ID", "")).strip(),
                    "name":          str(row.get("Name", "")).strip(),
                    "category":      str(row.get("Category", "peptides")).lower().strip(),
                    "price":         to_int(row.get("Price")),
                    "originalPrice": to_int(row.get("OriginalPrice")) or None,
                    "stock":         to_int(row.get("Stock")),
                    "description":   str(row.get("Description", "")).strip(),
                    "image":         image_url,
                    "certificate":   cert_url,
                    "featured":      str(row.get("Featured", "")).strip().upper() == "TRUE"
                })

        if csv_content:
            reader = csv.DictReader(StringIO(csv_content))
            process_reader(reader)
        else:
            csv_path = os.path.join(BASE_DIR, "inventario_final.csv")
            with open(csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                process_reader(reader)

        return products

    except Exception as e:
        return {"error": str(e)}

# ── POST /api/checkout ────────────────────────────────────────────────────────
@app.post("/api/checkout")
async def create_checkout(data: CheckoutData):
    """
    Flujo completo de checkout:
    1. Crea preferencia en Mercado Pago
    2. Guarda la orden en Google Sheets (async)
    3. Notifica al admin por Telegram y Email (async)
    4. Devuelve { payment_url, order_id }
    """
    if not data.items:
        raise HTTPException(status_code=400, detail="El carrito está vacío.")

    order_id  = f"E2F-{int(datetime.datetime.now().timestamp())}"
    timestamp = data.timestamp or datetime.datetime.now().isoformat()

    # ── 1. Mercado Pago ───────────────────────────────────────────────────────
    payment_url = None

    if not MP_ACCESS_TOKEN:
        # Sin token → modo simulado (útil para desarrollo)
        print("[MP] ACCESS_TOKEN no configurado — usando modo simulado.")
        payment_url = f"{SITE_URL}/payment-pending.html?order_id={order_id}&mock=true"
    else:
        try:
            sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

            mp_items = [
                {
                    "title":      item.get("name", "Kit Entre2Fit BALANCE FEEL"),
                    "quantity":   int(item.get("qty", 1)),
                    "unit_price": float(item.get("price", 0)),
                    "currency_id": "COP"
                }
                for item in data.items
            ]

            preference_payload = {
                "items": mp_items,
                "payer": {
                    "name":    data.fname,
                    "surname": data.lname,
                    "email":   data.email,
                    "phone":   {"area_code": "", "number": data.phone},
                    "address": {
                        "street_name": data.address,
                        "city":        data.city,
                        "zip_code":    data.zip
                    }
                },
                "back_urls": {
                    "success": f"{SITE_URL}/payment-success.html",
                    "failure": f"{SITE_URL}/payment-failure.html",
                    "pending": f"{SITE_URL}/payment-pending.html"
                },
                "auto_return":          "approved",
                "external_reference":   order_id,
                "statement_descriptor": "ENTRE2FIT",
                "notification_url":     f"{SITE_URL}/api/mp-webhook"
            }

            response   = sdk.preference().create(preference_payload)
            preference = response["response"]

            if response["status"] != 201:
                raise HTTPException(
                    status_code=500,
                    detail=f"Mercado Pago rechazó la preferencia: {preference}"
                )

            payment_url = preference.get("init_point")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error MP: {str(e)}")

    # ── 2. Preparar registro de orden ─────────────────────────────────────────
    order_record = {
        "order_id":   order_id,
        "timestamp":  timestamp,
        "fname":      data.fname,
        "lname":      data.lname,
        "email":      data.email,
        "phone":      data.phone,
        "address":    data.address,
        "city":       data.city,
        "state":      data.state,
        "country":    data.country,
        "total":      data.total,
        "items":      data.items,
        "payment_url": payment_url,
        "notes":      data.notes or "",
    }

    # ── 3–5. Notificaciones (no bloquean la respuesta) ────────────────────────
    def _item_html(i):
        try:
            p = float(str(i.get('price', 0)).replace('$', '').replace(',', '').replace('.', '').strip())
            q = int(i.get('qty', 1))
            return f"<li>{i.get('name','?')} × {q} = ${p * q:,.0f} COP</li>"
        except:
            return f"<li>{i.get('name','?')} × {i.get('qty',1)}</li>"

    items_list_html = "".join(_item_html(i) for i in data.items)
    email_body = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#7B5BFF">🛒 Nuevo Pedido Entre2Fit — {order_id}</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px"><b>Cliente:</b></td><td>{data.fname} {data.lname}</td></tr>
        <tr><td style="padding:6px"><b>Email:</b></td><td>{data.email}</td></tr>
        <tr><td style="padding:6px"><b>Teléfono:</b></td><td>{data.phone}</td></tr>
        <tr><td style="padding:6px"><b>Dirección:</b></td><td>{data.address}, {data.city}, {data.state}</td></tr>
        <tr><td style="padding:6px"><b>Total:</b></td><td><strong>${data.total:,.0f} COP</strong></td></tr>
        <tr><td style="padding:6px"><b>Pago:</b></td><td><a href="{payment_url}">{payment_url}</a></td></tr>
      </table>
      <h3>Productos:</h3><ul>{items_list_html}</ul>
      {"<p><i>Nota: " + data.notes + "</i></p>" if data.notes else ""}
    </div>
    """
    items_tg = "\n".join(
        f"  • {i.get('name','?')} × {i.get('qty',1)}" for i in data.items
    )
    telegram_msg = (
        f"📦 *Nuevo Pedido Entre2Fit — {order_id}*\n\n"
        f"*Cliente:* {data.fname} {data.lname}\n"
        f"*Email:* {data.email}\n"
        f"*Teléfono:* {data.phone}\n"
        f"*Dirección:* {data.address}\n"
        f"*Ciudad:* {data.city}, {data.state}\n"
        f"*Total:* ${data.total:,.0f} COP\n\n"
        f"*Productos:*\n{items_tg}\n\n"
        f"[🔗 Link de Pago]({payment_url})"
    )

    asyncio.create_task(save_order_to_sheets(order_record))
    asyncio.create_task(send_telegram(telegram_msg))
    if ADMIN_EMAIL:
        asyncio.create_task(
            send_email(ADMIN_EMAIL, f"[Entre2Fit] Nuevo Pedido {order_id} — {data.fname} {data.lname}", email_body)
        )

    return {"payment_url": payment_url, "order_id": order_id}

# ── POST /api/mp-webhook ──────────────────────────────────────────────────────
@app.post("/api/mp-webhook")
async def mp_webhook(request: Request):
    """
    Recibe notificaciones de pago de Mercado Pago (IPN).
    Busca la orden en Google Sheets para enviar datos completos por Telegram.
    """
    body = await request.json()
    topic = body.get("type") or body.get("topic", "")

    if topic == "payment":
        payment_id = body.get("data", {}).get("id") or body.get("id")
        print(f"[MP Webhook] Pago recibido — ID: {payment_id}")

        # Consultar estado real del pago
        if MP_ACCESS_TOKEN and payment_id:
            try:
                sdk    = mercadopago.SDK(MP_ACCESS_TOKEN)
                result = sdk.payment().get(payment_id)
                payment = result.get("response", {})
                status  = payment.get("status", "unknown")
                order_id = payment.get("external_reference", "")
                payer_email = payment.get("payer", {}).get("email", "")
                amount  = payment.get("transaction_amount", 0)

                print(f"[MP Webhook] Orden {order_id} — Estado: {status}")

                # Intentar buscar la orden en Sheets para obtener datos completos
                order_details = ""
                try:
                    def _lookup_order():
                        gc = get_gspread_client()
                        if not gc:
                            return None
                        ws = _get_orders_worksheet(gc)
                        rows = ws.get_all_records()
                        for r in rows:
                            if str(r.get("ID", "")) == str(order_id):
                                return r
                        return None
                    loop = asyncio.get_event_loop()
                    row = await loop.run_in_executor(executor, _lookup_order)
                    if row:
                        order_details = (
                            f"\n*Cliente:* {row.get('Nombre','')} {row.get('Apellido','')}"
                            f"\n*Teléfono:* {row.get('Teléfono','')}"
                            f"\n*Ciudad:* {row.get('Ciudad','')}, {row.get('Departamento','')}"
                            f"\n*Dirección:* {row.get('Dirección','')}"
                            f"\n*Productos:* {row.get('Items','N/A')}"
                        )
                except Exception as lookup_err:
                    print(f"[MP Webhook] No se pudo buscar la orden: {lookup_err}")

                # Notificar al admin con datos completos
                asyncio.create_task(send_telegram(
                    f"💳 *Pago {status.upper()}*\n\n"
                    f"*Orden:* {order_id}\n"
                    f"*Email MP:* {payer_email}\n"
                    f"*Monto:* ${amount:,.0f} COP\n"
                    f"*ID Pago:* {payment_id}"
                    f"{order_details}"
                ))
            except Exception as e:
                print(f"[MP Webhook] Error procesando pago: {e}")

    return {"status": "ok"}

# ── POST /api/contact ─────────────────────────────────────────────────────────
class ContactData(BaseModel):
    name:    str
    email:   str
    phone:   Optional[str] = None
    subject: Optional[str] = "consulta"
    message: str

@app.post("/api/contact")
async def contact_form(data: ContactData):
    """
    Recibe mensajes del formulario de contacto.
    Notifica al admin por Telegram y Email.
    """
    telegram_msg = (
        f"📩 *Nuevo Mensaje de Contacto*\n\n"
        f"*Nombre:* {data.name}\n"
        f"*Email:* {data.email}\n"
        f"*Teléfono:* {data.phone or 'No indicado'}\n"
        f"*Asunto:* {data.subject}\n\n"
        f"*Mensaje:*\n{data.message}"
    )
    email_body = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#7B5BFF">📩 Nuevo Mensaje — Entre2Fit</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px"><b>Nombre:</b></td><td>{data.name}</td></tr>
        <tr><td style="padding:6px"><b>Email:</b></td><td><a href="mailto:{data.email}">{data.email}</a></td></tr>
        <tr><td style="padding:6px"><b>Teléfono:</b></td><td>{data.phone or 'No indicado'}</td></tr>
        <tr><td style="padding:6px"><b>Asunto:</b></td><td>{data.subject}</td></tr>
      </table>
      <h3>Mensaje:</h3>
      <p style="background:#f8f9fa;padding:1rem;border-radius:8px;line-height:1.7">{data.message}</p>
      <p style="font-size:0.85rem;color:#888">Responde directamente a: <a href="mailto:{data.email}">{data.email}</a></p>
    </div>
    """
    asyncio.create_task(send_telegram(telegram_msg))
    if ADMIN_EMAIL:
        asyncio.create_task(
            send_email(ADMIN_EMAIL, f"[Entre2Fit] Contacto: {data.subject} — {data.name}", email_body)
        )
    return {"status": "received"}

# ── POST /api/abandoned-cart ──────────────────────────────────────────────────
@app.post("/api/abandoned-cart")
async def abandoned_cart(data: AbandonedCartData):
    """Recibe eventos de carrito abandonado del frontend y notifica al admin."""
    msg = (
        f"🛒 *Carrito Abandonado*\n\n"
        f"*Total estimado:* ${data.cart_total} COP\n"
        f"*Productos:* {len(data.cart_items)} ítem(s)\n"
        f"*Recuperar:* {data.recovery_url}"
    )
    asyncio.create_task(send_telegram(msg))
    return {"status": "received"}

# ── POST /api/inventory/update ────────────────────────────────────────────────
@app.post("/api/inventory/update")
async def update_inventory(data: InventoryUpdateData):
    """
    Actualiza el stock de un producto en Google Sheets.
    Requiere credentials.json (Google Service Account).
    """
    client = get_gspread_client()
    if not client:
        return {"status": "skipped", "message": "credentials.json no encontrado."}

    try:
        sh        = client.open_by_key(GOOGLE_SHEET_ID)
        worksheet = sh.get_worksheet(0)
        records   = worksheet.get_all_records()

        for i, record in enumerate(records):
            if str(record.get("ID")) == str(data.product_id):
                keys    = list(record.keys())
                if "Stock" not in keys:
                    raise HTTPException(status_code=500, detail="Columna 'Stock' no encontrada.")
                col_num = keys.index("Stock") + 1
                row_num = i + 2  # +1 encabezado, +1 índice 1
                worksheet.update_cell(row_num, col_num, data.stock)
                return {"status": "updated", "product_id": data.product_id, "new_stock": data.stock}

        raise HTTPException(status_code=404, detail=f"Producto {data.product_id} no encontrado.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── GET /api/health ───────────────────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    """Muestra el estado de configuración de cada servicio."""
    return {
        "status":           "ok",
        "version":          "2.0.0",
        "mercadopago":      bool(MP_ACCESS_TOKEN),
        "telegram":         bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID),
        "email_smtp":       bool(SMTP_USER and SMTP_PASS),
        "sheets_write":     bool(os.environ.get("GOOGLE_CREDENTIALS_JSON")) or os.path.exists(os.path.join(BASE_DIR, "credentials.json")),
        "google_sheet_id":  GOOGLE_SHEET_ID[:10] + "..." if GOOGLE_SHEET_ID else "NO CONFIGURADO",
        "site_url":         SITE_URL,
        "gemini_api":       bool(GEMINI_API_KEY),
        "ai_bot_active":    AI_BOT_ACTIVE
    }

# ── GET /api/debug/sheets (TEMPORAL — DIAGNÓSTICO) ────────────────────────────
@app.get("/api/debug/sheets")
async def debug_sheets(_auth: bool = Depends(verify_admin_key)):
    """Endpoint temporal para diagnosticar problemas con Google Sheets."""
    try:
        loop = asyncio.get_event_loop()
        def _debug():
            gc = get_gspread_client()
            if not gc:
                has_env = bool(os.environ.get("GOOGLE_CREDENTIALS_JSON"))
                env_len = len(os.environ.get("GOOGLE_CREDENTIALS_JSON", ""))
                return {"error": "No se pudo crear el cliente de gspread", "has_env_var": has_env, "env_var_length": env_len}
            sh = gc.open_by_key(GOOGLE_SHEET_ID)
            worksheets = []
            for ws in sh.worksheets():
                try:
                    row_count = ws.row_count
                    all_vals = ws.get_all_values()
                    data_rows = len(all_vals) - 1 if len(all_vals) > 0 else 0
                    headers = all_vals[0] if all_vals else []
                    worksheets.append({
                        "title": ws.title,
                        "title_repr": repr(ws.title),
                        "total_rows": row_count,
                        "data_rows": data_rows,
                        "headers": headers,
                        "sample_row": all_vals[1] if len(all_vals) > 1 else None
                    })
                except Exception as e:
                    worksheets.append({"title": ws.title, "error": str(e)})
            return {
                "sheet_id": GOOGLE_SHEET_ID,
                "sheet_title": sh.title,
                "worksheets": worksheets
            }
        return await loop.run_in_executor(None, _debug)
    except Exception as e:
        return {"error": str(e)}

# ── GET /api/orders ────────────────────────────────────────────────────────────
@app.get("/api/orders")
async def get_orders(_auth: bool = Depends(verify_admin_key)):
    """Lee las órdenes desde la pestaña 'Órdenes' de Google Sheets.
    Columnas: ID | Timestamp | Nombre | Apellido | Email | Teléfono | Dirección | Ciudad | Departamento | País | Total | Items | URL Pago | Estado | Notas
    """
    if not GOOGLE_SHEET_ID:
        raise HTTPException(status_code=503, detail="Google Sheets no configurado")
    try:
        loop = asyncio.get_event_loop()
        def _read():
            gc     = get_gspread_client()
            if not gc:
                return []
            ws     = _get_orders_worksheet(gc)
            rows   = ws.get_all_records()
            orders = []
            for r in rows:
                # Parsear ítems: formato "Nombre x1 | Nombre x2"
                items_raw = str(r.get("Items", r.get("Productos", "")))
                items_list = []
                if items_raw:
                    for part in items_raw.split(" | "):
                        if not part.strip():
                            continue
                        import re
                        m = re.match(r"^(.*?)(?:\s*\(\$?([\d\.]+)\))?\s*x(\d+)$", part.strip())
                        if m:
                            name = m.group(1).strip()
                            price = float(m.group(2)) if m.group(2) else 0
                            qty = int(m.group(3))
                            items_list.append({"name": name, "qty": qty, "price": price})
                        else:
                            segments = part.rsplit(" x", 1)
                            if len(segments) == 2 and segments[1].strip().isdigit():
                                items_list.append({"name": segments[0].strip(), "qty": int(segments[1].strip()), "price": 0})
                            elif segments[0].strip():
                                items_list.append({"name": segments[0].strip(), "qty": 1, "price": 0})

                # Timestamp seguro (puede ser int o string desde Sheets)
                ts = str(r.get("Timestamp", ""))
                date_str = ts[:10] if len(ts) >= 10 else ts

                total_raw = str(r.get("Total", "0")).replace("$", "").replace(",", "").replace(" ", "").strip()
                # Handle possible periods used as thousands separators in Spanish locale (e.g. 1.500.000)
                if total_raw.count(".") > 1:
                    total_raw = total_raw.replace(".", "")
                elif total_raw.count(".") == 1 and len(total_raw.split(".")[1]) == 3:
                    # If it looks like 1.500, treat the period as a thousands separator
                    total_raw = total_raw.replace(".", "")
                
                try:
                    total_val = float(total_raw)
                except ValueError:
                    total_val = 0

                orders.append({
                    "id":     str(r.get("ID", "")),
                    "date":   date_str,
                    "status": r.get("Estado", "Pending"),
                    "total":  total_val,
                    "customer": {
                        "fname":   str(r.get("Nombre", "")),
                        "lname":   str(r.get("Apellido", "")),
                        "email":   str(r.get("Email", "")),
                        "phone":   str(r.get("Teléfono", r.get("Telefono", ""))),
                        "address": str(r.get("Dirección", r.get("Direccion", ""))),
                        "city":    str(r.get("Ciudad", "")),
                        "state":   str(r.get("Departamento", "")),
                        "zip":     "",
                        "country": str(r.get("País", r.get("Pais", "CO")))
                    },
                    "items":  items_list,
                    "notes":  str(r.get("Notas", ""))
                })
            return orders
        return await loop.run_in_executor(None, _read)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── POST /api/orders/{order_id}/status ────────────────────────────────────────
class OrderStatusUpdate(BaseModel):
    status: str

@app.post("/api/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, _auth: bool = Depends(verify_admin_key)):
    client = get_gspread_client()
    if not client:
        raise HTTPException(status_code=503, detail="Google Sheets no configurado")
    try:
        def _update():
            gc = get_gspread_client()
            if not gc: return False
            sh = gc.open_by_key(GOOGLE_SHEET_ID)
            ws = _get_orders_worksheet(gc)
            records = ws.get_all_records()
            for i, record in enumerate(records):
                if str(record.get("ID", "")) == str(order_id):
                    keys = list(record.keys())
                    if "Estado" not in keys:
                        raise Exception("Columna 'Estado' no encontrada")
                    col_num = keys.index("Estado") + 1
                    row_num = i + 2
                    ws.update_cell(row_num, col_num, data.status)
                    return True
            return False
        
        loop = asyncio.get_event_loop()
        found = await loop.run_in_executor(executor, _update)
        if not found:
            raise HTTPException(status_code=404, detail="Orden no encontrada")
        return {"status": "ok", "new_status": data.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /api/admin/config ─────────────────────────────────────────────────────
class AdminConfig(BaseModel):
    mp_token:       Optional[str] = None
    mp_public_key:  Optional[str] = None
    tg_token:       Optional[str] = None
    tg_chat:        Optional[str] = None
    smtp_user:      Optional[str] = None
    smtp_pass:      Optional[str] = None
    admin_email:    Optional[str] = None
    fb_token:       Optional[str] = None
    ig_token:       Optional[str] = None
    wa_token:       Optional[str] = None
    site_url:       Optional[str] = None
    gemini_api_key: Optional[str] = None
    ai_bot_active:  Optional[bool] = None

@app.post("/api/admin/config")
async def save_admin_config(cfg: AdminConfig, _auth: bool = Depends(verify_admin_key)):
    """Guarda la configuración de APIs en el archivo .env"""
    env_path = os.path.join(BASE_DIR, ".env")
    try:
        # Read existing
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

        updates = {}
        if cfg.mp_token:      updates["MP_ACCESS_TOKEN"]    = cfg.mp_token
        if cfg.mp_public_key: updates["MP_PUBLIC_KEY"]      = cfg.mp_public_key
        if cfg.tg_token:      updates["TELEGRAM_BOT_TOKEN"] = cfg.tg_token
        if cfg.tg_chat:       updates["TELEGRAM_CHAT_ID"]   = cfg.tg_chat
        if cfg.smtp_user:     updates["SMTP_USER"]          = cfg.smtp_user
        if cfg.smtp_pass:     updates["SMTP_PASS"]          = cfg.smtp_pass
        if cfg.admin_email:   updates["ADMIN_EMAIL"]        = cfg.admin_email
        if cfg.site_url:      updates["SITE_URL"]           = cfg.site_url
        if cfg.fb_token:      updates["FB_PAGE_TOKEN"]      = cfg.fb_token
        if cfg.ig_token:      updates["IG_PAGE_TOKEN"]      = cfg.ig_token
        if cfg.gemini_api_key is not None: updates["GEMINI_API_KEY"] = cfg.gemini_api_key
        if cfg.ai_bot_active is not None:  updates["AI_BOT_ACTIVE"]  = "true" if cfg.ai_bot_active else "false"

        # Update existing lines or append
        updated_keys = set()
        new_lines = []
        for line in lines:
            key = line.split("=")[0].strip()
            if key in updates:
                new_lines.append(f"{key}={updates[key]}\n")
                updated_keys.add(key)
            else:
                new_lines.append(line)

        for key, val in updates.items():
            if key not in updated_keys:
                new_lines.append(f"{key}={val}\n")

        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)

        # Actualizar variables globales en memoria
        global MP_ACCESS_TOKEN, MP_PUBLIC_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SMTP_USER, SMTP_PASS, ADMIN_EMAIL, SITE_URL, FB_PAGE_TOKEN, IG_PAGE_TOKEN, GEMINI_API_KEY, AI_BOT_ACTIVE
        if cfg.mp_token:      MP_ACCESS_TOKEN = cfg.mp_token
        if cfg.mp_public_key: MP_PUBLIC_KEY   = cfg.mp_public_key
        if cfg.tg_token:      TELEGRAM_BOT_TOKEN = cfg.tg_token
        if cfg.tg_chat:       TELEGRAM_CHAT_ID = cfg.tg_chat
        if cfg.smtp_user:     SMTP_USER = cfg.smtp_user
        if cfg.smtp_pass:     SMTP_PASS = cfg.smtp_pass
        if cfg.admin_email:   ADMIN_EMAIL = cfg.admin_email
        if cfg.site_url:      SITE_URL = cfg.site_url
        if cfg.fb_token:      FB_PAGE_TOKEN = cfg.fb_token
        if cfg.ig_token:      IG_PAGE_TOKEN = cfg.ig_token
        if cfg.gemini_api_key is not None:
            GEMINI_API_KEY = cfg.gemini_api_key
            global _gemini_client
            _gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY and _GENAI_AVAILABLE else None
        if cfg.ai_bot_active is not None:
            AI_BOT_ACTIVE = cfg.ai_bot_active

        return {"status": "saved", "updated": list(updates.keys())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── GET /api/config/public ─────────────────────────────────────────────────────
@app.get("/api/config/public")
async def get_public_config():
    """Devuelve la clave pública de Mercado Pago para inicializar el Brick."""
    return {"mp_public_key": MP_PUBLIC_KEY or None}

# ── POST /api/process_payment ──────────────────────────────────────────────────
class ProcessPaymentData(BaseModel):
    token:          Optional[str] = None
    issuer_id:      Optional[str] = None
    payment_method_id: str
    transaction_amount: float
    installments:   Optional[int] = None
    payer:          dict
    # Datos del cliente (para guardar la orden)
    fname:          str
    lname:          str
    email:          str
    phone:          str
    address:        str
    city:           str
    state:          str
    zip:            str
    country:        str = "CO"
    notes:          Optional[str] = None
    items:          List[dict]
    total:          float

@app.post("/api/process_payment")
async def process_payment(data: ProcessPaymentData):
    """
    Procesa un pago generado por Checkout Bricks.
    Recibe el token de tarjeta y crea el pago directamente en Mercado Pago.
    """
    if not _MP_AVAILABLE:
        raise HTTPException(status_code=503, detail="Mercado Pago no disponible (instala mercadopago).")
    if not MP_ACCESS_TOKEN:
        raise HTTPException(status_code=400, detail="MP_ACCESS_TOKEN no configurado.")

    order_id  = f"E2F-{int(datetime.datetime.now().timestamp())}"
    timestamp = datetime.datetime.now().isoformat()

    try:
        sdk = mercadopago.SDK(MP_ACCESS_TOKEN.strip())

        payer_data = data.payer
        if "email" not in payer_data or not payer_data["email"]:
            payer_data["email"] = data.email

        # Sanitizar identification — debe tener AMBOS type y number, o no enviar
        if "identification" in payer_data:
            ident = payer_data["identification"]
            if not ident.get("type") or not ident.get("number"):
                del payer_data["identification"]

        # Mercado Pago a veces requiere que sea float explícito
        tx_amount = float(data.transaction_amount)
        
        payer_data["first_name"] = data.fname
        payer_data["last_name"] = data.lname

        payment_payload = {
            "transaction_amount": tx_amount,
            "description":        f"Pedido Entre2Fit {order_id}",
            "payment_method_id":  data.payment_method_id,
            "payer":              payer_data,
            "external_reference": order_id,
        }

        if data.token:
            payment_payload["token"] = data.token
        if data.installments:
            payment_payload["installments"] = int(data.installments)
        if data.issuer_id:
            payment_payload["issuer_id"] = data.issuer_id

        # Omitimos notification_url por ahora para evitar errores de validación
        # if SITE_URL and SITE_URL.startswith("http"):
        #     payment_payload["notification_url"] = f"{SITE_URL.rstrip('/')}/api/mp-webhook"


        print(f"[MP] Payload enviado: {payment_payload}")

        response = sdk.payment().create(payment_payload)
        payment  = response["response"]

        print(f"[MP] Respuesta status={response['status']}: {payment}")

        if response["status"] not in (200, 201):
            cause = payment.get("cause", [])
            error_msg = payment.get('message', 'Error desconocido')
            if cause:
                error_msg += f" | Detalles: {cause}"
            
            print(f"[MP] Error procesando pago: {error_msg}")
            status = "rejected"
            status_detail = error_msg
            payment_id = "FAILED"
        else:
            status        = payment.get("status")          # approved / in_process / rejected
            status_detail = payment.get("status_detail", "")
            payment_id    = payment.get("id")

    except Exception as e:
        print(f"[MP] Exception during payment: {str(e)}")
        status = "rejected"
        status_detail = f"Exception: {str(e)}"
        payment_id = "ERROR"

    # ── Guardar orden ─────────────────────────────────────────────────────────
    order_record = {
        "order_id":    order_id,
        "timestamp":   timestamp,
        "fname":       data.fname,
        "lname":       data.lname,
        "email":       data.email,
        "phone":       data.phone,
        "address":     data.address,
        "city":        data.city,
        "state":       data.state,
        "country":     data.country,
        "total":       data.total,
        "items":       data.items,
        "payment_id":  payment_id,
        "mp_status":   {"approved": "Paid", "rejected": "Cancelled"}.get(status, "Pending"),
        "payment_url": None,
        "notes":       data.notes or "",
    }

    def _item_html(i):
        try:
            p = float(str(i.get('price', 0)).replace('$', '').replace(',', '').replace('.', '').strip())
            q = int(i.get('qty', 1))
            return f"<li>{i.get('name','?')} × {q} = ${p * q:,.0f} COP</li>"
        except:
            return f"<li>{i.get('name','?')} × {i.get('qty',1)}</li>"

    items_list_html = "".join(_item_html(i) for i in data.items)
    email_body = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#7B5BFF">🛒 Nuevo Pedido Bricks — {order_id}</h2>
      <p><b>Estado MP:</b> {status} ({status_detail})</p>
      <p><b>ID Pago:</b> {payment_id}</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px"><b>Cliente:</b></td><td>{data.fname} {data.lname}</td></tr>
        <tr><td style="padding:6px"><b>Email:</b></td><td>{data.email}</td></tr>
        <tr><td style="padding:6px"><b>Teléfono:</b></td><td>{data.phone}</td></tr>
        <tr><td style="padding:6px"><b>Dirección:</b></td><td>{data.address}, {data.city}, {data.state}</td></tr>
        <tr><td style="padding:6px"><b>Total:</b></td><td><strong>${data.total:,.0f} COP</strong></td></tr>
      </table>
      <h3>Productos:</h3><ul>{items_list_html}</ul>
      {("<p><i>Nota: " + data.notes + "</i></p>") if data.notes else ""}
    </div>
    """
    items_tg2 = "\n".join(
        f"  • {i.get('name','?')} × {i.get('qty',1)}" for i in data.items
    )
    telegram_msg = (
        f"💳 *Pago Bricks Entre2Fit — {order_id}*\n"
        f"*Estado:* {status} ({status_detail})\n"
        f"*ID:* {payment_id}\n"
        f"*Cliente:* {data.fname} {data.lname}\n"
        f"*Email:* {data.email}\n"
        f"*Teléfono:* {data.phone}\n"
        f"*Dirección:* {data.address}, {data.city}, {data.state}\n"
        f"*Total:* ${data.total:,.0f} COP\n\n"
        f"*Productos:*\n{items_tg2}"
    )

    asyncio.create_task(save_order_to_sheets(order_record))
    asyncio.create_task(send_telegram(telegram_msg))
    if ADMIN_EMAIL:
        asyncio.create_task(send_email(
            ADMIN_EMAIL,
            f"[Entre2Fit] Pago Bricks {order_id} — {status}",
            email_body
        ))

    # Retornar resultado al frontend
    redirect_map = {
        "approved":   f"/payment-success.html?order_id={order_id}&payment_id={payment_id}",
        "in_process": f"/payment-pending.html?order_id={order_id}&payment_id={payment_id}",
        "rejected":   f"/payment-failure.html?order_id={order_id}&payment_id={payment_id}",
    }
    redirect_url = redirect_map.get(status, f"/payment-pending.html?order_id={order_id}")

    return {
        "status":        status,
        "status_detail": status_detail,
        "payment_id":    payment_id,
        "order_id":      order_id,
        "redirect_url":  redirect_url,
    }

# ── POST /api/admin/test-telegram ─────────────────────────────────────────────
@app.post("/api/admin/test-telegram")
async def test_telegram(_auth: bool = Depends(verify_admin_key)):
    """Envía un mensaje de prueba al chat de Telegram configurado."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        raise HTTPException(status_code=400, detail="Telegram no configurado")
    await send_telegram("✅ *Prueba exitosa* — Entre2Fit Admin conectado correctamente.")
    return {"status": "sent"}

# ── POST /api/admin/test-email ────────────────────────────────────────────────
@app.post("/api/admin/test-email")
async def test_email(_auth: bool = Depends(verify_admin_key)):
    """Envía un email de prueba al Admin configurado."""
    if not SMTP_USER or not SMTP_PASS or not ADMIN_EMAIL:
        raise HTTPException(status_code=400, detail="Email no configurado completamente")
    
    body = "<div style='font-family:sans-serif;'><h2>¡Prueba Exitosa!</h2><p>El servidor Entre2Fit está conectado a tu Gmail correctamente y listo para enviarte notificaciones.</p></div>"
    
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(executor, _send_email_sync, ADMIN_EMAIL, "✅ Entre2Fit Admin — Prueba Exitosa", body)
        return {"status": "sent"}
    except Exception as e:
        print(f"[Email Test] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── AI SALES SUPPORT CHATBOT ────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_with_ai(req: ChatRequest):
    if not GEMINI_API_KEY or not AI_BOT_ACTIVE or not _gemini_client:
        return {"reply": "Lo siento, el asistente virtual no está disponible en este momento."}
        
    try:
        prompt = f"""Eres un asesor experto de ventas y soporte al cliente de Entre2Fit, una marca especializada en bienestar y salud metabólica en Colombia.
Tu único objetivo es promover y resolver dudas sobre nuestro producto estrella: el **Protocolo Integral BALANCE FEEL**.

=== DETALLES DEL PRODUCTO ===
Nombre: Protocolo Integral BALANCE FEEL
Precio en Oferta: $180.000 COP (Valor real: $415.000 COP) - ¡Envío incluido por hoy!

¿Qué incluye el Kit?
1. Gotas Lipo Drean Complex: Fórmula estrella para controlar la ansiedad por picar y reparar el metabolismo desde adentro.
2. Protocolo Detox + Sal Rosada: Limpia el organismo desde el primer día y aporta minerales esenciales para hidratación.
3. Guía de Alimentación Antiinflamatoria: Recetas fáciles y deliciosas sin dietas extremas.
4. Plan de Ejercicios: Rutinas en PDF diseñadas para acelerar la quema de grasa de forma amigable.

Beneficios principales:
- Menos ansiedad de comer dulces y harinas durante el día.
- Reducción visible de inflamación y retención de líquidos.
- Mejor digestión, más energía y ligereza.
- Resultados visibles en báscula y medidas entre los primeros 15 a 20 días de uso constante.

Envíos: Despachos a toda Colombia. Llega en 2 a 4 días hábiles.
Pagos: Aceptamos Mercado Pago (tarjeta de crédito, débito, PSE, efecty).

SITIO WEB: https://entre2fit.com

Objetivo: Responde de forma amable, profesional y persuasiva. Resalta los beneficios del kit (especialmente el control de ansiedad y desinflamación) y anima al cliente a realizar su pedido. Mantén las respuestas cortas y enfocadas (máximo 1-2 párrafos).

Mensaje del cliente: "{req.message}"
        """
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            executor,
            lambda: _gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
        )
        ai_text = response.text.strip()
        return {"reply": ai_text}
    except Exception as e:
        print(f"[Gemini Error] {e}")
        return {"reply": "Tuvimos un inconveniente técnico al conectar con la IA. Por favor, intenta de nuevo más tarde."}

# ── HTML Routes ───────────────────────────────────────────────────────────────

@app.get("/")
async def read_index():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

@app.get("/{filename}.html")
async def read_html(filename: str):
    file_path = os.path.join(BASE_DIR, f"{filename}.html")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "Archivo no encontrado"}

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    # Nota: en Windows usa 127.0.0.1 sin reload para evitar problemas de binding
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=False)

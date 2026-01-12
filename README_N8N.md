# Sistema de Chatbot con PDFs - n8n

Sistema completo para cargar manuales PDF en un vector store de Supabase y consultarlos mediante un chatbot con IA.

## 📦 Archivos Incluidos

- `1_upload_pdf.json` - Workflow para subir PDFs
- `2_chatbot_query.json` - Workflow del chatbot
- `setup_supabase.sql` - Script para configurar Supabase
- `start-n8n.ps1` - Script PowerShell para ejecutar n8n con Docker
- `.env.n8n` - Variables de entorno de ejemplo

## 🚀 Inicio Rápido

### 1. Configurar Supabase

Ejecuta `setup_supabase.sql` en el Editor SQL de Supabase.

### 2. Ejecutar n8n

```powershell
.\start-n8n.ps1
```

### 3. Importar Workflows

1. Abre http://localhost:5678
2. Importa `1_upload_pdf.json`
3. Importa `2_chatbot_query.json`
4. Configura credenciales de Supabase y OpenAI
5. Activa ambos workflows

### 4. Probar

**Subir PDF:**
```powershell
curl -X POST http://localhost:5678/webhook/upload-pdf -F "data=@manual.pdf"
```

**Consultar:**
```powershell
curl -X POST http://localhost:5678/webhook/chat -H "Content-Type: application/json" -d '{\"question\": \"Tu pregunta\"}'
```

## 📚 Documentación Completa

Ver `walkthrough.md` en la carpeta `.gemini/antigravity/brain/...` para la guía completa paso a paso.

## 🔧 Requisitos

- Docker Desktop
- Cuenta Supabase
- API Key de OpenAI
- PowerShell (Windows)

## 🌐 URLs

- n8n Editor: http://localhost:5678
- Upload Webhook: http://localhost:5678/webhook/upload-pdf
- Chat Webhook: http://localhost:5678/webhook/chat

## ⚙️ Configuración

### Credenciales n8n

1. **Supabase**: URL del proyecto + Service Role Key
2. **OpenAI**: API Key

### CORS

El script `start-n8n.ps1` ya configura CORS para `http://localhost:5173`.
Si tu app React usa otro puerto, edita el script.

## 🛠️ Comandos Útiles

```powershell
# Ver logs de n8n
docker logs -f n8n

# Detener n8n
docker stop n8n

# Reiniciar n8n
docker restart n8n
```

## 📝 Notas

- La primera carga de PDF puede tardar 30-60 segundos
- Usa PDFs pequeños (<5MB) para las pruebas iniciales
- Los embeddings se generan con OpenAI (consumo de tokens)

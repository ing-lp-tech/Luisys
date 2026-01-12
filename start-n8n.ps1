# Iniciar n8n con Docker y CORS
# Ejecutar este script en PowerShell

Write-Host "🚀 Iniciando Audaces Cerebro con Docker..." -ForegroundColor Green

# Detener contenedor anterior si existe
Write-Host "Deteniendo contenedor anterior..." -ForegroundColor Yellow
docker stop audaces-cerebro 2>$null
docker rm audaces-cerebro 2>$null

# Ejecutar n8n con CORS habilitado
Write-Host "Ejecutando Audaces Cerebro en puerto 5678..." -ForegroundColor Yellow
docker run -d `
  --name audaces-cerebro `
  -p 5678:5678 `
  -e N8N_CORS_ORIGIN="http://localhost:5173" `
  -v audaces_cerebro_data:/home/node/.n8n `
  n8nio/n8n

# Esperar a que n8n inicie
Write-Host "Esperando a que inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar estado
$status = docker ps --filter "name=audaces-cerebro" --format "{{.Status}}"

if ($status) {
    Write-Host "✅ Audaces Cerebro está corriendo!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Editor n8n: http://localhost:5678" -ForegroundColor Cyan
    Write-Host "📍 Webhook Upload: http://localhost:5678/webhook/upload-pdf" -ForegroundColor Cyan
    Write-Host "📍 Webhook Chat: http://localhost:5678/webhook/chat" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ver logs: docker logs -f audaces-cerebro" -ForegroundColor Gray
} else {
    Write-Host "❌ Error al iniciar Audaces Cerebro" -ForegroundColor Red
    Write-Host "Ver logs: docker logs audaces-cerebro" -ForegroundColor Gray
}

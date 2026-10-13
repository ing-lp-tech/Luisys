-- ==============================================================================
-- 08b: Restaurar ventas que ya estaban PAGADAS antes de la migración 07
-- ==============================================================================
-- La migración 07 dejó en "pendiente" ventas que estaban pagadas. Este script
-- registra un pago por el saldo de las ventas cuyas series pongas en la lista.
--
-- 1) Revisá la lista: son las ventas que figuraban como PAGADO antes del cambio
--    (sacadas de la captura del 09/10). Agregá o quitá series según corresponda.
-- 2) Ejecutalo en el SQL Editor de Supabase.
--
-- También podés hacerlo venta por venta desde la app: botón $ → "Saldar todo".
-- ==============================================================================

INSERT INTO sale_payments (item_id, installment_number, payment_date, amount, currency, notes)
SELECT i.id,
       1,
       COALESCE(i.sale_date, CURRENT_DATE),
       (CASE i.sale_currency WHEN 'USD' THEN i.sale_price_usd ELSE i.sale_price_ars END) - COALESCE(i.amount_paid, 0),
       i.sale_currency,
       'Pago total restaurado (estaba marcado como pagado antes de la migración)'
FROM inventory_items i
WHERE i.status = 'sold'
  AND i.serial_number IN (
    '25s050672',  -- edson gonzales
    '25t057623',  -- gabriel benedetto
    '25t057691'   -- Rudy mendoza huanca
    -- , 'OTRA_SERIE'
  )
  AND (CASE i.sale_currency WHEN 'USD' THEN i.sale_price_usd ELSE i.sale_price_ars END) - COALESCE(i.amount_paid, 0) > 0;

-- Verificación
SELECT serial_number, client_name, sale_currency, sale_price_usd, sale_price_ars, amount_paid, payment_status
FROM inventory_items
WHERE status = 'sold'
ORDER BY sale_date DESC;

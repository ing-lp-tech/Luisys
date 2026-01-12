import React, { useMemo, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Grid,
  Paper,
  Divider,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Box,
  Card,
  CardContent,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  AttachMoney,
  Calculate,
  ExpandMore,
  Description,
  CloudDownload,
  LocalShipping,
  Security,
  Inventory,
  Straighten,
  Percent,
} from "@mui/icons-material";

function formatMoney(n) {
  return Number(n || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function round2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function calcular(input) {
  const {
    cantidadProductos,
    precioUnitario,
    metrosCubicos,
    fletePorMetro,
    seguroPct,
    derechoPct,
    tasaEstPct,
    ivaPct,
    percIvaPct,
    percGanPct,
    percIibbPct,
    digitalizacion,
    gastosOper,
    honorarios,
    certificaciones,
    unidades,
    multiplicador,
    precioVentaManual,
    unidadesMes,
    dumpingPct,
    valorCriterio,
    tributosExtra,
  } = input;

  const fob = cantidadProductos * precioUnitario;
  const flete = metrosCubicos * fletePorMetro;
  const seguro = fob * (seguroPct / 100);

  const cif = fob + flete + seguro;
  const derecho = cif * derechoPct;
  const tasaEst = cif * tasaEstPct;

  const baseParaTributos =
    valorCriterio && valorCriterio > 0
      ? valorCriterio
      : cif + derecho + tasaEst;

  const iva = baseParaTributos * ivaPct;
  const percIVA = baseParaTributos * percIvaPct;
  const percGan = baseParaTributos * percGanPct;
  const percIIBB = baseParaTributos * percIibbPct;

  const dumping = baseParaTributos * dumpingPct;
  const extras = tributosExtra || 0;

  const total =
    fob +
    flete +
    seguro +
    derecho +
    tasaEst +
    iva +
    percIVA +
    percGan +
    percIIBB +
    digitalizacion +
    gastosOper +
    honorarios +
    certificaciones +
    dumping +
    extras;

  const creditoRI = iva + percIVA + percGan;
  const costoFinalRI = total - creditoRI;
  const costoFinalMono = total;

  const costoUnitRI = unidades > 0 ? costoFinalRI / unidades : costoFinalRI;
  const costoUnitMono =
    unidades > 0 ? costoFinalMono / unidades : costoFinalMono;

  const precioSugeridoSinIVA =
    precioVentaManual && precioVentaManual > 0
      ? precioVentaManual
      : costoUnitRI * multiplicador;
  const precioSugeridoConIVA = precioSugeridoSinIVA * (1 + ivaPct);

  const debitoMensual = precioSugeridoSinIVA * ivaPct * unidadesMes;
  const mesesAbsorcion =
    debitoMensual > 0 ? Math.ceil(creditoRI / debitoMensual) : null;

  return {
    fob,
    flete,
    seguro,
    cif,
    derecho,
    tasaEst,
    baseParaTributos,
    iva,
    percIVA,
    percGan,
    percIIBB,
    dumping,
    extras,
    total,
    creditoRI,
    costoFinalRI,
    costoFinalMono,
    costoUnitRI,
    costoUnitMono,
    precioSugeridoSinIVA,
    precioSugeridoConIVA,
    debitoMensual,
    mesesAbsorcion,
  };
}

function NumberField({
  label,
  value,
  onChange,
  step = 0.01,
  note,
  icon,
  adornment,
  ...props
}) {
  return (
    <TextField
      label={label}
      type="number"
      variant="outlined"
      size="small"
      fullWidth
      value={value}
      onChange={(e) => onChange(Number(e.target.value || 0))}
      InputProps={{
        startAdornment: icon && (
          <InputAdornment position="start">{icon}</InputAdornment>
        ),
        endAdornment: adornment && (
          <InputAdornment position="end">{adornment}</InputAdornment>
        ),
        inputProps: { step },
      }}
      helperText={note}
      {...props}
    />
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <Box mb={3}>
      <Box display="flex" alignItems="center" mb={1}>
        {icon}
        <Typography variant="h5" component="h2" ml={1}>
          {title}
        </Typography>
      </Box>
      {subtitle && (
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

export default function ImportCalculator() {
  const [input, setInput] = useState({
    cantidadProductos: 200,
    precioUnitario: 51.5,
    metrosCubicos: 5.15,
    fletePorMetro: 400,
    seguroPct: 1,
    derechoPct: 0.2,
    tasaEstPct: 0.03,
    ivaPct: 0.21,
    percIvaPct: 0.2,
    percGanPct: 0.06,
    percIibbPct: 0.03,
    digitalizacion: 30,
    gastosOper: 400,
    honorarios: 450,
    certificaciones: 350,
    unidades: 200,
    multiplicador: 1.3,
    precioVentaManual: 0,
    unidadesMes: 50,
    dumpingPct: 0,
    valorCriterio: 0,
    tributosExtra: 0,
  });

  const data = useMemo(() => calcular(input), [input]);

  function setField(k) {
    return (v) => setInput((s) => ({ ...s, [k]: v }));
  }

  const handleMultiplierPreset = (m) => {
    setInput((s) => ({ ...s, multiplicador: m }));
  };

  const handleExport = () => {
    const rows = [];
    rows.push(["Campo", "Valor"]);
    Object.entries(input).forEach(([k, v]) => rows.push([k, String(v)]));
    rows.push([]);
    Object.entries(data).forEach(([k, v]) => rows.push([k, String(v)]));
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resultado_importacion.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Calculate fontSize="large" color="primary" />
        <Typography variant="h4" component="h1" ml={1}>
          Calculadora de Importación
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <SectionTitle
              icon={<Inventory color="primary" />}
              title="Datos de la Importación"
              subtitle="Complete los detalles de su importación"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <NumberField
                  label="Cantidad de productos"
                  value={input.cantidadProductos}
                  onChange={setField("cantidadProductos")}
                  step={1}
                  icon={<Straighten />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <NumberField
                  label="Precio unitario (USD)"
                  value={input.precioUnitario}
                  onChange={setField("precioUnitario")}
                  icon={<AttachMoney />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <NumberField
                  label="Metros cúbicos totales"
                  value={input.metrosCubicos}
                  onChange={setField("metrosCubicos")}
                  icon={<Straighten />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <NumberField
                  label="Flete por m³ (USD)"
                  value={input.fletePorMetro}
                  onChange={setField("fletePorMetro")}
                  icon={<LocalShipping />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <NumberField
                  label="Seguro internacional (%)"
                  value={input.seguroPct}
                  onChange={setField("seguroPct")}
                  icon={<Security />}
                  adornment="%"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <SectionTitle
              icon={<Description color="primary" />}
              title="Tributos e Impuestos"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <NumberField
                  label="Derecho de importación (%)"
                  value={input.derechoPct}
                  onChange={setField("derechoPct")}
                  step={0.01}
                  adornment="%"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <NumberField
                  label="Tasa estadística (%)"
                  value={input.tasaEstPct}
                  onChange={setField("tasaEstPct")}
                  step={0.01}
                  adornment="%"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <NumberField
                  label="IVA (%)"
                  value={input.ivaPct}
                  onChange={setField("ivaPct")}
                  step={0.01}
                  adornment="%"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <NumberField
                  label="Percepción IVA (%)"
                  value={input.percIvaPct}
                  onChange={setField("percIvaPct")}
                  step={0.01}
                  adornment="%"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <NumberField
                  label="Percepción Ganancias (%)"
                  value={input.percGanPct}
                  onChange={setField("percGanPct")}
                  step={0.01}
                  adornment="%"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <NumberField
                  label="Percepción IIBB (%)"
                  value={input.percIibbPct}
                  onChange={setField("percIibbPct")}
                  step={0.01}
                  adornment="%"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <NumberField
                  label="Dumping (si aplica, %)"
                  value={input.dumpingPct}
                  onChange={setField("dumpingPct")}
                  step={0.01}
                  adornment="%"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <NumberField
                  label="Valor criterio (si aplica)"
                  value={input.valorCriterio}
                  onChange={setField("valorCriterio")}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <SectionTitle
              icon={<AttachMoney color="primary" />}
              title="Otros Gastos"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <NumberField
                  label="Digitalización (USD)"
                  value={input.digitalizacion}
                  onChange={setField("digitalizacion")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <NumberField
                  label="Gastos operativos (USD)"
                  value={input.gastosOper}
                  onChange={setField("gastosOper")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <NumberField
                  label="Honorarios (USD)"
                  value={input.honorarios}
                  onChange={setField("honorarios")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <NumberField
                  label="Certificaciones (USD)"
                  value={input.certificaciones}
                  onChange={setField("certificaciones")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <NumberField
                  label="Tributos extra (USD)"
                  value={input.tributosExtra}
                  onChange={setField("tributosExtra")}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <SectionTitle
              icon={<Calculate color="primary" />}
              title="Cálculo Comercial"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <NumberField
                  label="Unidades importadas"
                  value={input.unidades}
                  onChange={setField("unidades")}
                  step={1}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <NumberField
                  label="Unidades vendidas/mes"
                  value={input.unidadesMes}
                  onChange={setField("unidadesMes")}
                  step={1}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <NumberField
                  label="Multiplicador sugerido"
                  value={input.multiplicador}
                  onChange={setField("multiplicador")}
                  step={0.1}
                  note="Multiplicador sobre costo para precio de venta"
                />
                <ButtonGroup sx={{ mt: 1 }}>
                  <Button onClick={() => handleMultiplierPreset(1.5)}>
                    x1.5
                  </Button>
                  <Button onClick={() => handleMultiplierPreset(2)}>x2</Button>
                  {/*  <Button onClick={() => handleMultiplierPreset(3)}>x3</Button> */}
                </ButtonGroup>
              </Grid>
              <Grid item xs={12} sm={6}>
                <NumberField
                  label="Precio venta sin IVA (manual)"
                  value={input.precioVentaManual}
                  onChange={setField("precioVentaManual")}
                  note="Dejar en 0 para usar cálculo automático"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <SectionTitle
              icon={<Description color="primary" />}
              title="Resumen de Costos"
            />

            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>FOB (Mercadería)</TableCell>
                    <TableCell align="right">{formatMoney(data.fob)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Flete internacional</TableCell>
                    <TableCell align="right">
                      {formatMoney(data.flete)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Seguro internacional</TableCell>
                    <TableCell align="right">
                      {formatMoney(data.seguro)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CIF (FOB + Flete + Seguro)</TableCell>
                    <TableCell align="right">{formatMoney(data.cif)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Derecho de importación</TableCell>
                    <TableCell align="right">
                      {formatMoney(data.derecho)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tasa estadística</TableCell>
                    <TableCell align="right">
                      {formatMoney(data.tasaEst)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Base para tributos</TableCell>
                    <TableCell align="right">
                      {formatMoney(data.baseParaTributos)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>IVA importación</TableCell>
                    <TableCell align="right">{formatMoney(data.iva)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Percepción IVA</TableCell>
                    <TableCell align="right">
                      {formatMoney(data.percIVA)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Percepción Ganancias</TableCell>
                    <TableCell align="right">
                      {formatMoney(data.percGan)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Percepción IIBB</TableCell>
                    <TableCell align="right">
                      {formatMoney(data.percIIBB)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Dumping</TableCell>
                    <TableCell align="right">
                      {formatMoney(data.dumping)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Otros gastos</TableCell>
                    <TableCell align="right">
                      {formatMoney(
                        input.digitalizacion +
                          input.gastosOper +
                          input.honorarios +
                          input.certificaciones +
                          input.tributosExtra
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ "& td": { fontWeight: "bold" } }}>
                    <TableCell>Total importación</TableCell>
                    <TableCell align="right">
                      {formatMoney(data.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box mt={3}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<CloudDownload />}
                onClick={handleExport}
              >
                Exportar a CSV
              </Button>
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <SectionTitle
              icon={<Calculate color="primary" />}
              title="Comparativa Fiscal"
            />

            <List dense>
              <ListItem>
                <ListItemText
                  primary="Crédito fiscal estimado"
                  secondary={formatMoney(data.creditoRI)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Costo final (Responsable Inscripto)"
                  secondary={formatMoney(data.costoFinalRI)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Costo final (Monotributo)"
                  secondary={formatMoney(data.costoFinalMono)}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Costo unitario (RI)"
                  secondary={formatMoney(data.costoUnitRI)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Costo unitario (Mono)"
                  secondary={formatMoney(data.costoUnitMono)}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Precio sugerido sin IVA"
                  secondary={formatMoney(data.precioSugeridoSinIVA)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Precio sugerido con IVA"
                  secondary={formatMoney(data.precioSugeridoConIVA)}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Débito fiscal mensual estimado"
                  secondary={formatMoney(data.debitoMensual)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Meses para absorber crédito"
                  secondary={data.mesesAbsorcion ?? "—"}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Box mt={3}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Guía para explicar a un tercero</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Si sos <b>Responsable Inscripto</b>, el IVA que pagás en la
              importación es <b>crédito fiscal</b> y podés descontarlo del IVA
              que cobrás en tus ventas (débito fiscal). Si sos{" "}
              <b>Monotributista</b>, ese IVA no se recupera y por tanto aumenta
              tu costo.
            </Typography>

            <Typography variant="h6">Pasos simplificados</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="1. Importás y la aduana liquida: derechos, tasas, IVA, percepciones (Ganancias, IIBB), etc." />
              </ListItem>
              <ListItem>
                <ListItemText primary="2. Si sos RI: el IVA y percepciones de IVA son créditos que usás mes a mes. Las percepciones de Ganancias e IIBB son anticipos que se computan en Ganancias anual o IIBB mensual." />
              </ListItem>
              <ListItem>
                <ListItemText primary="3. Si vendés con IVA (21%), ese IVA generado (débito) se usa para absorber el crédito. Si vendés mucho, lo absorbés rápido; si vendés poco, te queda saldo a favor." />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Si te queda saldo a favor: podés compensarlo con otros impuestos o gestionar devolución (solo en casos y trámites específicos)." />
              </ListItem>
            </List>

            <Typography variant="h6">Diferencias clave</Typography>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Concepto</TableCell>
                    <TableCell>RI</TableCell>
                    <TableCell>Monotributo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>¿Recupera IVA en compra?</TableCell>
                    <TableCell>Sí</TableCell>
                    <TableCell>No</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Declaraciones</TableCell>
                    <TableCell>IVA mensual, Ganancias anual</TableCell>
                    <TableCell>Cuota mensual simplificada</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mejor para</TableCell>
                    <TableCell>
                      Empresas que facturan a otras empresas
                    </TableCell>
                    <TableCell>
                      Pequeños comerciantes/vendedores a consumidores
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6">Consejos prácticos</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Confirmá NCM con el despachante porque cambia derechos." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Preguntá por valor criterio y medidas antidumping: si aplican, afectan tu costo." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Solicitá exclusión de percepciones si aplicás (reduce inmovilizado de capital)." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Planificá ventas para generar débito fiscal y absorber crédito." />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box mt={2}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Notas sobre Dumping y Valor Criterio</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              <b>Dumping / Antidumping:</b> si la mercadería es objeto de
              medidas antidumping, la autoridad puede aplicar derechos
              adicionales. Esto se traduce en un costo adicional en aduana.
              Consultá con tu despachante para confirmar.
            </Typography>
            <Typography variant="body2" paragraph>
              <b>Valor criterio:</b> la aduana puede imponer un valor criterio
              si considera que el valor declarado es subvaluado. En ese caso, la
              base para calcular derechos e IVA puede cambiar. Por eso en la app
              hay un campo "Valor criterio" — si el despachante confirma un
              valor criterio, ingresalo y la app recalcula con esa base.
            </Typography>
            <Typography variant="body2">
              <b>Otras restricciones:</b> licencias no automáticas,
              certificaciones, cupos y barreras técnicas pueden generar costos y
              demoras. Incluí estos montos en "Tributos extra" o en
              honorarios/certificaciones.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Container>
  );
}

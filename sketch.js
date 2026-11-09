// Pentagoni da Google Sheet: la distanza di ogni vertice dall'origine dipende dai valori della tabella
async function preload() {  
    myTable= loadTable("assets/famines.csv", "csv", "header");
}

let NAME_COLUMN = "nome";
let VALUE_COLUMNS = ["v1", "v2", "v3", "v4", "v5"];
let FILL_COLUMN = "riempimento";
let STROKE_COLUMN = "contorno";
let DEFAULT_FILL = "rgba(255, 255, 255, 0.5)";
let DEFAULT_STROKE = "#ffffff";
let MIN_RATIO = 0.2;
let MAX_RATIO = 0.42;
let SAMPLE_ROWS = [
  { name: "Alfa", values: [8, 3, 6, 9, 4], fillColor: "rgba(230, 57, 70, 0.55)", strokeColor: "#e63946" },
  { name: "Beta", values: [5, 7, 2, 6, 8], fillColor: "rgba(244, 162, 97, 0.55)", strokeColor: "#f4a261" },
  { name: "Gamma", values: [9, 9, 7, 3, 5], fillColor: "rgba(233, 196, 106, 0.55)", strokeColor: "#e9c46a" },
  { name: "Delta", values: [2, 4, 8, 5, 7], fillColor: "rgba(42, 157, 143, 0.55)", strokeColor: "#2a9d8f" },
  { name: "Epsilon", values: [6, 6, 6, 6, 6], fillColor: "rgba(69, 123, 157, 0.55)", strokeColor: "#457b9d" },
  { name: "Zeta", values: [3, 8, 4, 2, 9], fillColor: "rgba(142, 84, 189, 0.55)", strokeColor: "#8e54bd" }
];

let N = VALUE_COLUMNS.length;
let cosA = new Array(N);
let sinA = new Array(N);
let items = [];
let points = [];
let centers = [];
let cellSize = 0;
let refRadius = 0;
let status = "Caricamento dati...";

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  for (let i = 0; i < N; i++) {
    let a = -HALF_PI + (TWO_PI * i) / N;
    cosA[i] = cos(a);
    sinA[i] = sin(a);
  }
  if (SHEET_URL === "") {
    useSample("Dati di esempio (SHEET_URL vuoto)");
    return;
  }
  loadTable(SHEET_URL, "csv", "header", onLoaded, onError);
}

function onLoaded(table) {
  items = [];
  for (let r of table.getRows()) {
    let values = VALUE_COLUMNS.map((c) => parseFloat(String(r.getString(c)).replace(",", ".")));
    if (values.every(Number.isFinite)) {
      items.push({
        name: r.getString(NAME_COLUMN),
        values: values,
        fillColor: r.getString(FILL_COLUMN) || DEFAULT_FILL,
        strokeColor: r.getString(STROKE_COLUMN) || DEFAULT_STROKE
      });
    }
  }
  if (items.length === 0) {
    useSample("Nessuna riga valida nel foglio: dati di esempio");
    return;
  }
  status = "Dati dal foglio: " + items.length + " righe";
  buildLayout();
}

function onError() {
  useSample("Foglio non raggiungibile: dati di esempio");
}

function useSample(message) {
  items = SAMPLE_ROWS;
  status = message;
  buildLayout();
}

function buildLayout() {
  let n = items.length;
  let cols = Math.max(1, Math.ceil(Math.sqrt((n * width) / height)));
  let rowCount = Math.ceil(n / cols);
  cellSize = Math.min(width / cols, height / rowCount);
  let offX = (width - cellSize * cols) / 2;
  let offY = (height - cellSize * rowCount) / 2;

  let vMin = Infinity;
  let vMax = -Infinity;
  for (let it of items) {
    for (let v of it.values) {
      vMin = Math.min(vMin, v);
      vMax = Math.max(vMax, v);
    }
  }
  let span = vMax - vMin;

  points = new Array(n * N * 2);
  centers = new Array(n * 2);
  refRadius = cellSize * MAX_RATIO;
  for (let k = 0; k < n; k++) {
    let cx = offX + ((k % cols) + 0.5) * cellSize;
    let cy = offY + (Math.floor(k / cols) + 0.5) * cellSize;
    centers[k * 2] = cx;
    centers[k * 2 + 1] = cy;
    for (let i = 0; i < N; i++) {
      let t = span > 0 ? (items[k].values[i] - vMin) / span : 1;
      let d = cellSize * lerp(MIN_RATIO, MAX_RATIO, t);
      let idx = (k * N + i) * 2;
      points[idx] = cx + d * cosA[i];
      points[idx + 1] = cy + d * sinA[i];
    }
  }
}

function draw() {
  background(26);
  if (items.length === 0) {
    noStroke();
    fill(255);
    text(status, width / 2, height / 2);
    return;
  }
  textSize(Math.max(10, cellSize * 0.07));
  for (let k = 0; k < items.length; k++) {
    let cx = centers[k * 2];
    let cy = centers[k * 2 + 1];

    noFill();
    stroke(89);
    strokeWeight(1);
    beginShape();
    for (let i = 0; i < N; i++) {
      vertex(cx + refRadius * cosA[i], cy + refRadius * sinA[i]);
    }
    endShape(CLOSE);

    fill(items[k].fillColor);
    stroke(items[k].strokeColor);
    strokeWeight(2);
    beginShape();
    for (let i = 0; i < N; i++) {
      let idx = (k * N + i) * 2;
      vertex(points[idx], points[idx + 1]);
    }
    endShape(CLOSE);

    noStroke();
    fill(230);
    text(items[k].name, cx, cy + cellSize * 0.46);
  }
  textAlign(LEFT, BOTTOM);
  fill(153);
  text(status, 10, height - 8);
  textAlign(CENTER, CENTER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (items.length > 0) {
    buildLayout();
  }
}

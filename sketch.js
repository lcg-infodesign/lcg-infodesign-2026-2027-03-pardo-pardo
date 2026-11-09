
let myTable;

let NAME_COLUMN = "nome";
let VALUE_COLUMNS = ["v1", "v2", "v3", "v4", "v5"];

// Etichette personalizzabili del pentagono introduttivo
let ETICHETTE = ["%FG", "%FT", "TRB", "AST", "REC"];

let FILL_COLUMN = "riempimento";
let STROKE_COLUMN = "contorno";
let DEFAULT_FILL = "rgba(255, 255, 255, 0.5)";
let DEFAULT_STROKE = "#ffffff";

let MIN_RATIO = 0.2;
let MAX_RATIO = 0.42;

let N = VALUE_COLUMNS.length;
let cosA = new Array(N);
let sinA = new Array(N);

let maxValori = new Array(N).fill(-Infinity);
let minValori = new Array(N).fill(Infinity);

let nPentagoni = 0;


// SETUP
async function setup() {
    createCanvas(windowWidth, windowHeight);

    // Caricamento CSV (p5.js 2.x)
    try {
        myTable = await loadTable("assets/a.csv", ";", "header");
    } catch (errore) {
        console.error("Errore nel caricamento del CSV:", errore);
        return;
    }

    textAlign(CENTER, CENTER);

    for (let i = 0; i < N; i++) {
        let a = -HALF_PI + (TWO_PI * i) / N;
        cosA[i] = cos(a);
        sinA[i] = sin(a);
    }

    analizzaTabella();

    console.log("CSV caricato correttamente");
    console.log("pentagoni:", nPentagoni);
    console.log("valori minimi:", minValori);
    console.log("valori massimi:", maxValori);
}


// DRAW
function draw() {
    background(26);

    // Pentagono introduttivo
    disegnaPentagonoLegenda();

    if (nPentagoni === 0) return;

    let colonne = Math.max(1, Math.ceil(Math.sqrt((nPentagoni * windowWidth) / windowHeight)));
    let righe = Math.ceil(nPentagoni / colonne);
    let larghezza = windowWidth / colonne;
    let altezza = windowHeight / righe;
    let cellSize = Math.min(larghezza, altezza);

    // Spazio riservato al pentagono introduttivo
    let spazioLegenda = 500;
    let offX = (windowWidth - cellSize * colonne) / 2;
    let offY = spazioLegenda + (windowHeight - spazioLegenda - cellSize * righe) / 2;

    textSize(Math.max(10, cellSize * 0.07));

    let posizione = 0;

    for (let numRiga = 0; numRiga < myTable.getRowCount(); numRiga++) {
        if (rigaValida(numRiga)) {
            let posx = offX + ((posizione % colonne) + 0.5) * cellSize;
            let posy = offY + (Math.floor(posizione / colonne) + 0.5) * cellSize;

            noFill();
            stroke(89);
            strokeWeight(1);
            beginShape();

            for (let i = 0; i < N; i++) {
                vertex(
                    posx + cellSize * MAX_RATIO * cosA[i],
                    posy + cellSize * MAX_RATIO * sinA[i]
                );
            }

            endShape(CLOSE);

            fill(myTable.getString(numRiga, FILL_COLUMN) || DEFAULT_FILL);
            stroke(myTable.getString(numRiga, STROKE_COLUMN) || DEFAULT_STROKE);
            strokeWeight(2);
            beginShape();

            for (let i = 0; i < N; i++) {
                let valore = leggiValore(numRiga, VALUE_COLUMNS[i]);

                // Normalizzazione indipendente per ogni asse
                let raggio = cellSize * MAX_RATIO;

                if (maxValori[i] > minValori[i]) {
                    raggio = map(
                        valore,
                        minValori[i],
                        maxValori[i],
                        cellSize * MIN_RATIO,
                        cellSize * MAX_RATIO
                    );
                }

                vertex(
                    posx + raggio * cosA[i],
                    posy + raggio * sinA[i]
                );
            }

            endShape(CLOSE);

            let nome = myTable.getString(numRiga, NAME_COLUMN);

            noStroke();
            fill(230);
            text(nome, posx, posy + cellSize * 0.46);

            posizione = posizione + 1;
        }
    }
}


// PENTAGONO INTRODUTTIVO CON ETICHETTE PERSONALIZZABILI
function disegnaPentagonoLegenda() {
    let centroX = width / 2;
    let centroY = 100;
    let raggio = 45;

    noFill();
    stroke(255);
    strokeWeight(1.5);

    beginShape();

    for (let i = 0; i < N; i++) {
        vertex(
            centroX + raggio * cosA[i],
            centroY + raggio * sinA[i]
        );
    }

    endShape(CLOSE);

    // Testi sui vertici
    noStroke();
    fill(255);
    textSize(12);
    textAlign(CENTER, CENTER);

    for (let i = 0; i < N; i++) {
        let x = centroX + (raggio + 15) * cosA[i];
        let y = centroY + (raggio + 15) * sinA[i];

        text(ETICHETTE[i], x, y);
    }
}


// LETTURA VALORI CSV
function leggiValore(numRiga, colonna) {
    let dato = myTable.getString(numRiga, colonna);

    if (dato === null || dato === undefined || String(dato).trim() === "") {
        return NaN;
    }

    return parseFloat(String(dato).replace(",", "."));
}


// CONTROLLO RIGHE VALIDE
function rigaValida(numRiga) {
    for (let i = 0; i < N; i++) {
        if (!Number.isFinite(leggiValore(numRiga, VALUE_COLUMNS[i]))) {
            return false;
        }
    }

    return true;
}


// ANALISI TABELLA
function analizzaTabella() {
    nPentagoni = 0;

    minValori = new Array(N).fill(Infinity);
    maxValori = new Array(N).fill(-Infinity);

    for (let numRiga = 0; numRiga < myTable.getRowCount(); numRiga++) {
        if (rigaValida(numRiga)) {
            nPentagoni = nPentagoni + 1;

            for (let i = 0; i < N; i++) {
                let valore = leggiValore(numRiga, VALUE_COLUMNS[i]);

                if (valore > maxValori[i]) {
                    maxValori[i] = valore;
                }

                if (valore < minValori[i]) {
                    minValori[i] = valore;
                }
            }
        }
    }
}


// RIDIMENSIONAMENTO FINESTRA
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

/* This is probably some of the worst JavaScript ever written, don't look too hard. */
const gateCountValue = document.querySelector("#gateCount");
const depthInput = document.querySelector("#depth");

const qubitCountValue = document.querySelector("#qubitCount");
const qubitInput = document.querySelector("#qubitNo");

gateCountValue.textContent = "Gate Count: ".concat(depthInput.value);
qubitCountValue.textContent = "Qubit Count: ".concat(qubitInput.value);

depthInput.addEventListener("input", (event) => {
  gateCountValue.textContent = "Gate Count: ".concat(event.target.value);
});

qubitInput.addEventListener("input", (event) => {
  qubitCountValue.textContent = "Qubit Count: ".concat(event.target.value);
});

const gateSet = [
  "x",
  "cx",
  "h",
]; /* List of gates available for circuit construction */

var statevector_steps = [];

var statevector = null; /* Holds final output statevector of the circuit */

function generateCircuit() {
  statevector_steps = [];
  document.getElementById("circuit").innerHTML = "<p>No Circuit!</p>";
  let gateNo = depthInput.value;
  let qubitNo = qubitInput.value;

  circuit = new QuantumCircuit(qubitNo);

  var gateApplicator = [];

  for (let i = 0; i < Math.min(qubitNo, gateNo); i++) {
    selGate = gateSet[Math.floor(Math.random() * gateSet.length)];
    while (i == 0 && selGate == "cx") {
      selGate = gateSet[Math.floor(Math.random() * gateSet.length)];
    }
    if (selGate != "cx") {
      gateApplicator.push([selGate, [i]]);
    } else {
      var target = -1;
      while (target == -1 || target == i) {
        target = Math.floor(Math.random() * qubitNo);
      }
      gateApplicator.push([selGate, [i, target]]);
    }
  }

  var control = Math.min(qubitNo, gateNo);
  while (gateApplicator.length < gateNo) {
    selGate = gateSet[Math.floor(Math.random() * gateSet.length)];
    while (selGate == gateApplicator[gateApplicator.length - qubitNo][0]) {
      selGate = gateSet[Math.floor(Math.random() * gateSet.length)];
    }
    if (selGate != "cx") {
      gateApplicator.push([selGate, [control % qubitNo]]);
    } else if (qubitNo > 1) {
      var target = -1;
      while (target == -1 || target == control % qubitNo) {
        target = Math.floor(Math.random() * qubitNo);
      }
      gateApplicator.push([selGate, [control % qubitNo, target]]);
    }
    control++;
  }

  for (let i = 0; i < gateApplicator.length; i++) {
    var nextGate = gateApplicator[i];
    if (nextGate[0] != "cx") {
      circuit.appendGate(nextGate[0], nextGate[1][0]);
    } else {
      circuit.appendGate(nextGate[0], nextGate[1]);
    }
    circuit.run();
    if (nextGate != "cx") {
      statevector_steps.push([
        nextGate[0].concat(`[${nextGate[1][0]}]`),
        circuit.stateAsString(true),
      ]);
    } else {
      statevector_steps.push([
        nextGate[0].concat(`[${nextGate[1][0]}, ${nextGate[1][1]}]`),
        circuit.stateAsString(true),
      ]);
    }
  }

  for (let i = 0; i < qubitNo; i++) {
    /* Append measurement at end of circuit for easier readability */
    circuit.addMeasure(i);
  }

  circuit.run();
  statevector =
    circuit.stateAsString(
      true,
    ); /* "Executes" the circuit and saves probabilities */

  document.getElementById("circuit").innerHTML = circuit.exportSVG(true);
  var circuitSVG =
    document.getElementsByClassName(
      "qc-circuit",
    )[0]; /* Generate SVG image of circuit */
  circuitSVG.setAttribute(
    "height",
    circuitSVG.getBBox().height + 55,
  ); /* quantum-circuit package is busted and creates SVGs of insane heights, this is a bandaid solution */
  document.getElementById("statevector_steps").innerHTML = "...";
}

function revealSteps() {
  /* Reveals the compute steps to the user when they want to verify */
  document.getElementById("statevector_steps").innerHTML = "";
  let sv_string = [];
  for (let i = 0; i < statevector_steps.length; i++) {
    sv_string.push(
      `Step ${i + 1} - Apply ${statevector_steps[i][0].toUpperCase()}: <br />`,
    );
    let step = statevector_steps[i][1].split("%");
    for (let j = 0; j < step.length - 1; j++) {
      sv_string[i] = sv_string[i].concat(step[j]).concat("%<br />");
    }
    document.getElementById("statevector_steps").innerHTML = document
      .getElementById("statevector_steps")
      .innerHTML.concat(sv_string[i])
      .concat("<br />");
  }
}

document.getElementById("generate").onclick = generateCircuit;
document.getElementById("execute").onclick = revealSteps;

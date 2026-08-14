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
}); /* List of gates available for circuit construction */

/* Reverse bitstring into little endian format (Thanks Sebastian Stewart for implementing this!!) */
function reverseQubitState(state) {
  return state
    .split("\n")
    .map((line) => {
      if (!line) return line;

      const [coeff, rest] = line.split("|");
      const [bits, prob] = rest.split(">");

      // Reverse the bits
      const reversedBits = bits.split("").reverse().join("");

      // Reassemble
      return `${coeff}|${reversedBits}>${prob}`;
    })
    .join("\n");
}

var statevector_steps = [];

var statevector = null; /* Holds final output statevector of the circuit */

function generateCircuit() {
  if (qubitInput.value == 1) {
    var gateSet = ["x", "h"];
  }
  else {
    var gateSet = ["x", "cx", "h"];
  }

  if (document.querySelector("#phases").checked) {
    gateSet.push("t");
    gateSet.push("s");
  }

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
    while (
      selGate == gateApplicator[gateApplicator.length - qubitNo][0] ||
      (selGate == "cx" &&
        selGate == gateApplicator[gateApplicator.length - 1][0])
    ) {
      selGate = gateSet[Math.floor(Math.random() * gateSet.length)];
    }
    if (selGate != "cx") {
      gateApplicator.push([selGate, [control % qubitNo]]);
      control++;
    } else if (qubitNo > 1) {
      var target = -1;
      while (target == -1 || target == control % qubitNo) {
        target = Math.floor(Math.random() * qubitNo);
      }
      if (qubitNo == 3 && control % qubitNo == 2 && target == 1) {
        gateApplicator.push(["Barrier", [0]]);
      }
    }
    gateApplicator.push([selGate, [control % qubitNo, target]]);
    if (control % qubitNo == qubitNo - 1) {
      control++;
    }
  }

  for (let i = 0; i < gateApplicator.length; i++) {
    var nextGate = gateApplicator[i];
    if (nextGate[0] != "cx") {
      circuit.appendGate(nextGate[0], nextGate[1][0]);
      circuit.run();
      statevector_steps.push([
        nextGate[0].concat(`[${nextGate[1][0]}]`),
        reverseQubitState(circuit.stateAsString(true)),
      ]);
    } else {
      circuit.appendGate(nextGate[0], nextGate[1]);
      circuit.run();
      statevector_steps.push([
        nextGate[0].concat(`[${nextGate[1][0]}, ${nextGate[1][1]}]`),
        reverseQubitState(circuit.stateAsString(true)),
      ]);
    }
  }

  for (let i = 0; i < qubitNo; i++) {
    /* Append measurement at end of circuit for ease of readability */
    circuit.addMeasure(i);
  }

  circuit.run();
  statevector = reverseQubitState(
    circuit.stateAsString(true),
  ); /* "Executes" the circuit and saves probabilities */

  document.getElementById("circuit").innerHTML = circuit.exportSVG(true);
  var circuitSVG =
    document.getElementsByClassName(
      "qc-circuit",
    )[0]; /* Generate SVG image of circuit */


  var qubitSVGSpacing = 74;

  circuitSVG.setAttribute(
    "height",
    qubitInput.value * qubitSVGSpacing + 34,
  ); /* quantum-circuit package is busted and creates SVGs of insane heights, this is a bandaid solution */

  var scalar = Math.min(1 / (circuitSVG.getBBox().width / ((document.getElementById("circuit-diagram").offsetWidth) * 0.95)), 1);
  circuitSVG.setAttribute(
    "style",
    "-webkit-transform: scale(" + scalar + "," + scalar + ")"
  );

  var diagramBoxHeight = document.getElementById("diagram-title").offsetHeight + (qubitInput.value * qubitSVGSpacing + 34) * scalar;
  document.getElementsByClassName("stretchBox")[0].setAttribute("style", "height: " + diagramBoxHeight + "px");

  document.getElementById("statevector_steps").innerHTML = "...";
  generated = true;
}

function revealSteps() {
  /* Reveals the compute steps to the user when they want to verify */
  if (!generated) {
    return
  }
  document.getElementById("statevector_steps").innerHTML = "";
  let sv_string = [];
  for (let i = 0; i < statevector_steps.length; i++) {
    sv_string.push(
      `<b>Step ${i + 1} - Apply ${statevector_steps[i][0].toUpperCase()}:</b> <br />`,
    );
    let step = statevector_steps[i][1].split("%");
    for (let j = 0; j < step.length - 1; j++) {
      let substep = step[j].split(">")
      sv_string[i] = sv_string[i].concat(`<p>${substep[0]}></p><p class="probabilities">${substep[1]}%</p><br />`);
    }
    document.getElementById("statevector_steps").innerHTML = document
      .getElementById("statevector_steps")
      .innerHTML.concat(sv_string[i]);
  }
}

var generated = false;

document.getElementById("generate").onclick = generateCircuit;
document.getElementById("execute").onclick = revealSteps;

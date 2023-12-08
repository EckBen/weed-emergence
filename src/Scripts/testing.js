function thermalConductivity(BD, waterContent, clay, temp) {
  const ga = 0.088;
  const thermalConductivitysolid = 2.5;
  const atmPressure = 1000;
  const q = 7.25 * clay + 2.52;
  const xwo = 0.33 * clay + 0.078;
  const solidContent = BD / 2.65; // Assumes particle density of 2650 Mg/m3
  const porosity = 1 - solidContent;
  const gasPorosity = porosity - waterContent > 0 ? porosity - waterContent : 0;
  const temperatureK = temp + 273.16;
  const Lv = 45144 - 48 * temp;
  const svp = 0.611 * Math.exp((17.502 * temp) / (temp + 240.97));
  const slope = (17.502 * 240.97 * svp) / (240.97 + temp) ** 2.0;
  const Dv =
    0.0000212 * (101.3 / atmPressure) * (temperatureK / 273.16) ** 1.75;
  const rhoair = 44.65 * (atmPressure / 101.3) * (273.16 / temperatureK);
  const stcor = 1 - svp / atmPressure > 0.3 ? 1 - svp / atmPressure : 0.3;
  const thermalConductivitywater = 0.56 + 0.0018 * temp;
  const wf =
    waterContent < 0.01 * xwo ? 0 : 1 / (1 + (waterContent / xwo) ** -q);
  const thermalConductivitygas =
    0.0242 +
    0.00007 * temp +
    (wf * Lv * rhoair * Dv * slope) / (atmPressure * stcor);
  const gc = 1 - 2 * ga;
  const thermalConductivityfluid =
    thermalConductivitygas +
    (thermalConductivitywater - thermalConductivitygas) *
      (waterContent / porosity) ** 2.0;
  const ka =
    (2 / (1 + (thermalConductivitygas / thermalConductivityfluid - 1) * ga) +
      1 / (1 + (thermalConductivitygas / thermalConductivityfluid - 1) * gc)) /
    3;
  const kw =
    (2 / (1 + (thermalConductivitywater / thermalConductivityfluid - 1) * ga) +
      1 /
        (1 + (thermalConductivitywater / thermalConductivityfluid - 1) * gc)) /
    3;
  const ks =
    (2 / (1 + (thermalConductivitysolid / thermalConductivityfluid - 1) * ga) +
      1 /
        (1 + (thermalConductivitysolid / thermalConductivityfluid - 1) * gc)) /
    3;
  const thermalConductivity =
    (kw * thermalConductivitywater * waterContent +
      ka * thermalConductivitygas * gasPorosity +
      ks * thermalConductivitysolid * solidContent) /
    (kw * waterContent + ka * gasPorosity + ks * solidContent);
  return thermalConductivity;
}

const constants = {
  bucketDepth: 36,
  topBucket: 6,
  bottomBucket: function() { return this.bucketDepth - this.topBucket; },

  laminarThickness: 0.00001,

  intercept: 0.10,
  p: 0.3,
  TAW: 2 * (2/3),
  
  F: 0.5,
  G: function() { return 1 - this.F; },

  SL: 24,
  M: 20,
  DT: 3600,

  Kc: 1.0,

  TB: 10
};

function createSoilTempConstants(laminarThickness, M) {
  const z = Array.from({ length: M }, () => null);
  z[0] = 0;
  z[1] = laminarThickness;
  const inches = {
    1: [],
    2: [],
    4: [],
    8: [],
    20: [],
  };

  for (let i = 1; i <= M; i++) {
    z[i + 1] = z[i] + 0.005 * 1.5 ** (i - 1); // geometric progression of soil depth nodes.  More near surface fewer at depth.

    const past = z[i - 1] / 0.0254;
    const current = z[i] / 0.0254;

    if (past <= 1 && current > 1) {
      inches[1].push([i - 1, 1 - (1 - past) / (current - past)]);
      inches[1].push([i, 1 - (current - 1) / (current - past)]);
    }
    if (past <= 2 && current > 2) {
      inches[2].push([i - 1, 1 - (2 - past) / (current - past)]);
      inches[2].push([i, 1 - (current - 2) / (current - past)]);
    }
    if (past <= 4 && current > 4) {
      inches[4].push([i - 1, 1 - (4 - past) / (current - past)]);
      inches[4].push([i, 1 - (current - 4) / (current - past)]);
    }
    if (past <= 8 && current > 8) {
      inches[8].push([i - 1, 1 - (8 - past) / (current - past)]);
      inches[8].push([i, 1 - (current - 8) / (current - past)]);
    }
    if (past <= 20 && current > 20) {
      inches[20].push([i - 1, 1 - (20 - past) / (current - past)]);
      inches[20].push([i, 1 - (current - 20) / (current - past)]);
    }
  }

  return { inches, z };
}

function testThis(bulkDensity, vwc, clay, depthProfile, z) {
  const K = Array.from(
    { length: constants.M },
    () => 0.025 / constants.laminarThickness
  );
  const CP = Array.from({ length: constants.M }, () => null);
  
  for (let i = 1; i <= constants.M; i++) {
    if (i === 1) {
      CP[i] = (1200 * (z[i + 1] - z[i - 1])) / (2 * constants.DT);
    } else {
      CP[i] =
        (((2400000 * bulkDensity) / 2.65 +
          4180000 * vwc +
          (1 - bulkDensity / 2.65 - vwc) * 1200) *
          (z[i + 1] - z[i - 1])) /
        (2 * constants.DT);
      K[i] =
        thermalConductivity(
          bulkDensity,
          vwc,
          clay,
          depthProfile[i]
        ) /
        (z[i + 1] - z[i]);
    }
  }

  return { CP, K };
}


const { z } = createSoilTempConstants(
  constants.laminarThickness,
  constants.M
);

const depthProfile = Array.from(
  { length: constants.M + 2 },
  () => constants.TB
);



const clay = 0.126;
const bulkDensity = 1.362;

const results = {
  CP: [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
  K: [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
};
Array.from({ length: constants.M }, () => null);
for (let vwc = 0; vwc <= 1; vwc += 0.10) {
  console.log('--------------------------');
  console.log('VWC = ', vwc);
  const { CP, K } = testThis(bulkDensity, vwc, clay, depthProfile, z);

  for (let j = 0; j < constants.M; j++) {
    results.CP[j].push(CP[j]);
    results.K[j].push(K[j]);
  }
}

console.log('--------------K results------------------');
for (let i = 0; i < constants.M; i++) {
  console.log(results.K[i].join(','));
}
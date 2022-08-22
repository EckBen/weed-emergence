import { differenceInCalendarDays, format, addDays } from 'date-fns';

function round(value, step) {
  step || (step = 1.0);
  var inv = 1.0 / step;
  return Math.round(value * inv) / inv;
}

const getDateAdjustment = (etData, tempPrcpData, year) => {
  const etParts = etData.dates_pet[0].split('/');
  return differenceInCalendarDays(new Date(year, parseInt(etParts[0]) - 1, etParts[1]), new Date(tempPrcpData[0][0].split('-')));
};

const thermalConductivity = (BD, waterContent, clay, temp) => {
  const ga = 0.088;
  const thermalConductivitysolid = 2.5;
  const atmPressure = 1000;
  const q = 7.25*clay + 2.52;
  const xwo = 0.33*clay + 0.078;
  const solidContent = BD/2.650;   // Assumes particle density of 2650 Mg/m3
  const porosity = 1-solidContent;
  const gasPorosity =  porosity-waterContent > 0 ? porosity-waterContent : 0;
  const temperatureK = temp + 273.16;
  const Lv = 45144-48*temp;
  const svp = 0.611 * Math.exp(17.502 * temp / (temp + 240.97));
  const slope = 17.502 * 240.97 * svp/ (240.97 + temp)**2.0;
  const Dv = 0.0000212 * (101.3 / atmPressure) * (temperatureK / 273.16)**1.75;
  const rhoair = 44.65 * (atmPressure / 101.3) * (273.16/temperatureK);
  const stcor = 1-svp/atmPressure > 0.3 ? 1-svp/atmPressure : 0.3;
  const thermalConductivitywater = 0.56 + 0.0018 * temp;
  const wf = waterContent< 0.01*xwo ? 0 : 1 / (1 + (waterContent / xwo)**(-q));
  const thermalConductivitygas = (0.0242 + 0.00007 * temp + wf * Lv * rhoair * Dv * slope / (atmPressure * stcor));
  const gc = 1- 2 * ga;
  const thermalConductivityfluid = (thermalConductivitygas + (thermalConductivitywater-thermalConductivitygas)*(waterContent/ porosity)**2.0);
  const ka = (2 / (1 + (thermalConductivitygas / thermalConductivityfluid - 1) * ga ) + 1 / (1 + (thermalConductivitygas / thermalConductivityfluid - 1) * gc)) /3;
  const kw = (2 / (1 + (thermalConductivitywater / thermalConductivityfluid - 1) * ga) + 1 / (1 + (thermalConductivitywater / thermalConductivityfluid - 1) * gc)) /3;
  const ks = (2 / (1 + (thermalConductivitysolid / thermalConductivityfluid - 1) * ga) + 1 / (1 + (thermalConductivitysolid / thermalConductivityfluid - 1) * gc)) / 3;
  const thermalConductivity = ((kw * thermalConductivitywater * waterContent + ka * thermalConductivitygas * gasPorosity + ks * thermalConductivitysolid * solidContent) / (kw * waterContent + ka * gasPorosity + ks * solidContent));
  return thermalConductivity;
};

const adjustWVTop = (constants, wvTop, pet, prcp, topMax) => {
  const deficitIn = -1 * (wvTop - topMax);
  const Ks = (deficitIn <= (constants.p * constants.TAW) ? 1 : 
    Math.max(0, ((constants.TAW - deficitIn)/((1 - constants.p) * constants.TAW))));
  const etIn = pet * constants.Kc;
  const prcpAdj = prcp <= constants.intercept ? 0 : prcp - constants.intercept;
  return wvTop - (etIn * Ks) + prcpAdj;
};

const soil2InchModel = (constants, TA, AM, wvTopPerInch, wvBottomPerInch, buckets, depthProfile, inches, z) => {
  const K = Array.from({length: constants.M}, () => 0.025 / constants.laminarThickness);
  const CP = Array.from({length: constants.M}, () => null);
  const A = Array.from({length: constants.M}, () => null);
  const B = Array.from({length: constants.M}, () => null);
  const C = Array.from({length: constants.M}, () => null);
  const D = Array.from({length: constants.M}, () => null);

  const TN = depthProfile.map(v => v);
  let TI = 0;

  for (let i = 1; i <= constants.M; i++) {
    if (i === 1) {
      CP[i]= 1200 * (z[i+1] - z[i - 1]) / (2 * constants.DT);
    } else if (i > 1 && i <= 9) {
      CP[i]=(2400000 * buckets.top.bulkDensity / 2.65 + 4180000 * wvTopPerInch + (1-(buckets.top.bulkDensity / 2.65)-wvTopPerInch)*1200) * (z[i+1] - z[i - 1]) / (2* constants.DT);
      K[i] = thermalConductivity(buckets.top.bulkDensity,wvTopPerInch,buckets.top.clayProportion,depthProfile[i])/ (z[i + 1] - z[i]);		
    } else {
      CP[i]=(2400000 * buckets.bottom.bulkDensity / 2.65 + 4180000 * wvBottomPerInch+(1-(buckets.bottom.bulkDensity / 2.65)-wvBottomPerInch)*1200) * (z[i + 1] - z[i - 1]) / (2* constants.DT);
      K[i] = thermalConductivity(buckets.bottom.bulkDensity,wvBottomPerInch,buckets.bottom.clayProportion,depthProfile[i]) / (z[i + 1] - z[i]);
    }
  }

  // let st1inAvg = 0;
  let st2inAvg = 0;
  // let st4inAvg = 0;

  for (let i = 0; i < constants.SL; i++) {
    TI = TI + constants.DT / 3600;
    TN[0] = TA + AM * Math.sin(0.261799 * (TI - 6));

    
    for (let j = 1; j <= constants.M; j++) {
      C[j] = -K[j] * constants.F;
      A[j+1] = C[j];
      B[j] = constants.F * (K[j-1] + K[j]) + CP[j];
      D[j] = constants.G() * K[j-1] * depthProfile[j-1] + (CP[j] - constants.G() * (K[j] + K[j-1])) * depthProfile[j] + constants.G() * K[j] * depthProfile[j+1];
    }

    D[1] = D[1] + constants.F * K[0] * TN[0];
    D[constants.M] = D[constants.M] + K[constants.M] * constants.F * TN[constants.M+1];
    
    for (let j = 1; j < constants.M; j++) {
      C[j] = C[j] / B[j];
      D[j] = D[j] / B[j];
      B[j+1] = B[j+1] - A[j+1] * C[j];
      D[j+1] = D[j+1] - A[j+1] * D[j];
    }
    
    TN[constants.M] = constants.TB;
    
    for (let j = constants.M - 1; j > 0; j--) {
      TN[j] = D[j] - C[j] * TN[j+1];
    }

    // st1inAvg = st1inAvg + inches[1][0][1]*TN[inches[1][0][0]]+ inches[1][1][1]*TN[inches[1][1][0]];
    st2inAvg = st2inAvg + inches[2][0][1]*TN[inches[2][0][0]]+ inches[2][1][1]*TN[inches[2][1][0]];
    // st4inAvg = st4inAvg + inches[4][0][1]*TN[inches[4][0][0]]+ inches[4][1][1]*TN[inches[4][1][0]];

    for (let j = 0; j <= constants.M; j++) {
      depthProfile[j] = TN[j];
    }
  }

  return {
    newDepthProfile: TN,
    // oneInchSoil: st1inAvg/constants.SL,
    twoInchSoil: st2inAvg/constants.SL,
    // fourInchSoil: st4inAvg/constants.SL
  };
};

const createConstants = (laminarThickness, M) => {
  const z = Array.from({length: M}, () => null);
  z[0] = 0;
  z[1] = laminarThickness;
  const inches = {
    1: [],
    2: [],
    4: [],
    8: [],
    20: []
  };

  for (let i = 1; i <= M; i++) {
    z[i+1]= z[i] + 0.005 * 1.5**(i - 1);   // geometric progression of soil depth nodes.  More near surface fewer at depth.

    const past = z[i-1] / 0.0254;
    const current = z[i] / 0.0254;

    if (past <= 1 && current > 1) {
      inches[1].push([ i - 1, 1 - ((1 - past) / (current - past)) ]);
      inches[1].push([ i, 1 - ((current - 1) / (current - past)) ]);
    }
    if (past <= 2 && current > 2) {
      inches[2].push([ i - 1, 1 - ((2 - past) / (current - past)) ]);
      inches[2].push([ i, 1 - ((current - 2)/(current - past)) ]);
    }
    if (past <= 4 && current > 4) {
      inches[4].push([ i - 1, 1 - ((4 - past)/(current - past)) ]);
      inches[4].push([ i, 1 - ((current - 4)/(current - past)) ]);
    }
    if (past <= 8 && current > 8) {
      inches[8].push([ i - 1, 1 - ((8 - past)/(current - past)) ]);
      inches[8].push([ i, 1 - ((current - 8)/(current - past)) ]);
    }
    if (past <= 20 && current > 20) {
      inches[20].push([ i - 1, 1 - ((20 - past)/(current - past)) ]);
      inches[20].push([ i, 1 - ((current - 20)/(current - past)) ]);
    }
  }

  return { inches, z };
};

// const calcSoilTemps = (dpInit, etData, tempPrcpData, buckets, year, wvMax, maxTAdj, TB, laminarThickness, thermalConductivitysolid) => {
const calcSoilTemps = (year, etData, tempPrcpData, buckets, constants) => {
  const wvMax = round((buckets.top.wvMax + buckets.bottom.wvMax) / 2, 0.001);

  const sDate = new Date(year,1,27);

  const { inches, z } = createConstants(constants.laminarThickness, constants.M);

  let DA;
  if (etData !== null) {
    DA = getDateAdjustment(etData, tempPrcpData, year);
    
    if (DA > 0) {
      const currentDateIdx = tempPrcpData.findIndex(arr => arr[1] === -999 || arr[2] === -999 || arr[3] === -999);
      tempPrcpData = tempPrcpData.slice(DA, currentDateIdx >= 0 ? currentDateIdx : tempPrcpData.length);
      etData = etData.pet;
    } else if (DA < 0) {
      etData = etData.pet.slice(Math.abs(DA));
    } else {
      etData = etData.pet;
    }
  } else {
    DA = 0;
  }


  // let depthProfile = Array.from({length: constants.M + 2}, () => dpInit);
  let depthProfile = Array.from({length: constants.M + 2}, () => constants.TB);
  
  const topMax = constants.topBucket * wvMax;
  const bottomMax = constants.bottomBucket() * wvMax;
  
  let wvTop = topMax;
  let wvBottom = bottomMax;

  const results = {
    dates: [],
    // airTemps: [],
    // prcp: [],
    // et: [],
    // one: [],
    two: [],
    // four: [],
    // wvs: [[],[]],
    // topMax,
    // bottomMax
  };

  for (let i = 0 ; i < tempPrcpData.length; i++) {
    const date = addDays(sDate, i + DA);
    const tempsAndPrcp = tempPrcpData[i];
    
    const maxTC = (tempsAndPrcp[1] - 32) * (5/9);
    const minTC = (tempsAndPrcp[2] - 32) * (5/9);
    
    const TA = (maxTC + minTC) / 2;
    const AM = (maxTC - minTC);

    wvTop = adjustWVTop(constants, wvTop, etData[i], tempsAndPrcp[3], topMax);
    
    wvBottom = wvTop < 0 ? wvBottom + wvTop : wvBottom;
    if (wvTop > topMax) wvBottom = wvBottom + (wvTop - topMax);
    if (wvTop < 0) wvTop = 0;

    if (wvTop > topMax) wvTop = topMax;

    if (wvBottom > bottomMax) wvBottom = bottomMax;
    if (wvBottom < 0) wvBottom = 0.01;

    let {
      newDepthProfile,
      // oneInchSoil,
      twoInchSoil,
      // fourInchSoil
    } = soil2InchModel(constants, TA, AM, wvTop/constants.topBucket, wvBottom/constants.bottomBucket(), buckets, depthProfile, inches, z);


    depthProfile = newDepthProfile;

    results.dates.push(format(date, 'yyyy-MM-dd'));
    // results.airTemps.push((tempsAndPrcp[2] + tempsAndPrcp[1]) / 2);
    // results.et.push(etData === null ? 0 : etData[i]);
    // results.prcp.push(tempsAndPrcp[3]);
    // results.wvs[0].push(wvTop);
    // results.wvs[1].push(wvBottom);

    // results.one.push((9/5) * oneInchSoil + 32);
    results.two.push((9/5) * twoInchSoil + 32);
    // results.four.push((9/5) * fourInchSoil + 32);
  }

  return results;
};

export default calcSoilTemps;
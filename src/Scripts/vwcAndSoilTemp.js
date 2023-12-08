import { getSoilCapacityFromTexture } from './getSoilData';

// Using 6in soil column
export const SOIL_DATA = {
  soilmoistureoptions: {
    6: {
      low: {
        wiltingpoint: 0.4,
        prewiltingpoint: 0.64,
        stressthreshold: 0.8,
        fieldcapacity: 1.2,
        saturation: 2.6
      },
      medium: {
          wiltingpoint: 0.6,
          prewiltingpoint: 0.945,
          stressthreshold: 1.175,
          fieldcapacity: 1.75,
          saturation: 2.9
      },
      high: {
          wiltingpoint: 0.85,
          prewiltingpoint: 1.30,
          stressthreshold: 1.6,
          fieldcapacity: 2.35,
          saturation: 3.25
      }
    },
    12: {
      low: {
        wiltingpoint: 0.8,
        prewiltingpoint: 1.28,
        stressthreshold: 1.6,
        fieldcapacity: 2.4,
        saturation: 5.2
      },
      medium: {
          wiltingpoint: 1.2,
          prewiltingpoint: 1.89,
          stressthreshold: 2.35,
          fieldcapacity: 3.5,
          saturation: 5.8
      },
      high: {
          wiltingpoint: 1.7,
          prewiltingpoint: 2.6,
          stressthreshold: 3.2,
          fieldcapacity: 4.7,
          saturation: 6.5
      }
    },
    18: {
      low: {
        wiltingpoint: 1.2,
        prewiltingpoint: 1.92,
        stressthreshold: 2.4,
        fieldcapacity: 3.6,
        saturation: 7.8
      },
      medium: {
          wiltingpoint: 1.8,
          prewiltingpoint: 2.835,
          stressthreshold: 3.525,
          fieldcapacity: 5.25,
          saturation: 8.7
      },
      high: {
          wiltingpoint: 2.55,
          prewiltingpoint: 3.9,
          stressthreshold: 4.8,
          fieldcapacity: 7.05,
          saturation: 9.75
      }
    },
    kc: 1.0,
    p: 0.5
  },
  soildrainageoptions: {
    low: { daysToDrainToFcFromSat: 0.125 },
    medium: { daysToDrainToFcFromSat: 1.0 },
    high: { daysToDrainToFcFromSat: 2.0 },
  }
};

// Derived from Brian's csf-waterdef code
function getPotentialDailyDrainage(soilCharacteristics, drainagecap) {
  // -----------------------------------------------------------------------------------------
  // Calculate potential daily drainage of soil
  // -----------------------------------------------------------------------------------------
  return (
    (soilCharacteristics.saturation -
      soilCharacteristics.fieldcapacity) /
    drainagecap
  );
}

function getTawForPlant(soilCharacteristics) {
  // -----------------------------------------------------------------------------------------
  // Calculate total available water (TAW) for plant, defined here as:
  // soil moisture at field capacity minus soil moisture at wilting point
  // -----------------------------------------------------------------------------------------
  return soilCharacteristics.fieldcapacity - soilCharacteristics.wiltingpoint;
}

function getWaterStressCoeff(Dr, TAW, p) {
  // -----------------------------------------------------------------------------------------
  // Calculate coefficient for adjusting ET when accounting for decreased ET during water stress conditions.
  // Refer to FAO-56 eq 84, pg 169
  // Dr  : the antecedent water deficit (in)
  // TAW : total available (in) water for the plant (soil moisture at field capacity minus soil moisture at wilting point).
  // p   : at what fraction between field capacity and wilting point do we start applying this water stress factor.
  // Ks  : water stress coefficient
  // -----------------------------------------------------------------------------------------
  let Ks = null;
  Dr = -1 * Dr;
  Ks = Dr <= p * TAW ? 1 : (TAW - Dr) / ((1 - p) * TAW);
  Ks = Math.max(Ks, 0);
  return Ks;
}

function dailyWaterDeficitCalculations(soilcap, soil_options, vwcDepthInches, dayPet, dayPrecip, currentDeficit, lastDeficit, drainageRate) {
  let deficit = currentDeficit;
  
  // Total water available to plant
  const TAW = getTawForPlant(soil_options[vwcDepthInches][soilcap]);
  // Water stress coefficient, calculated using antecedent deficit, used to reduce ET as soil dries out
  const Ks = getWaterStressCoeff(lastDeficit, TAW, soil_options.p);

  // We already know what the daily total is for Precip and ET, ET gets adjusted by the water stress coefficient
  const totalDailyPET = -1 * dayPet * soil_options.kc * Ks;
  const totalDailyPrecip = dayPrecip;

  // Convert daily rates to hourly rates. For this simple model, rates are constant throughout the day.
  // For precip   : this assumption is about all we can do without hourly observations
  // For PET      : this assumption isn't great. Something following diurnal cycle would be best.
  // For drainage : this assumption is okay
  // ALL HOURLY RATES POSITIVE
  const hourlyPrecip = totalDailyPrecip / 24;
  const hourlyPET = (-1 * totalDailyPET) / 24;
  const hourlyPotentialDrainage = drainageRate / 24;

  /////////////////
  // Hourly Loop //
  /////////////////
  for (let hr = 1; hr <= 24; hr++) {
    // Calculate hourly drainage estimate. It is bounded by the potential drainage rate and available
    // water in excess of the field capacity. We assume drainage does not occur below field capacity.
    let hourlyDrainage = 0;
    if (deficit > 0) {
      hourlyDrainage = Math.min(deficit, hourlyPotentialDrainage);
    }

    // Adjust deficit based on hourly water budget.
    // deficit is bound by saturation (soil can't be super-saturated). This effectively reduces deficit by hourly runoff as well.
    deficit = Math.min(
      deficit + hourlyPrecip - hourlyPET - hourlyDrainage,
      soil_options[vwcDepthInches][soilcap].saturation -
        soil_options[vwcDepthInches][soilcap].fieldcapacity
    );

    // deficit is bound by wilting point, but calculations should never reach wilting point based on this model. We bound it below for completeness.
    // In the real world, deficit is able to reach wilting point. The user should note that deficit values NEAR the wilting point
    // from this model should be interpreted as 'danger of wilting exists'.
    deficit = Math.max(
      deficit,
      -1 *
        (soil_options[vwcDepthInches][soilcap].fieldcapacity -
          soil_options[vwcDepthInches][soilcap].wiltingpoint)
    );
  }

  return deficit;
}

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

function soil2InchModel(
  constants,
  maxTC,
  minTC,
  vwc,
  bulkDensity,
  clay,
  depthProfile,
  inches,
  z
) {
  const TA = (maxTC + minTC) / 2;
  const AM = maxTC - minTC;
  const K = Array.from(
    { length: constants.M },
    () => 0.025 / constants.laminarThickness
  );
  const CP = Array.from({ length: constants.M }, () => null);
  const A = Array.from({ length: constants.M }, () => null);
  const B = Array.from({ length: constants.M }, () => null);
  const C = Array.from({ length: constants.M }, () => null);
  const D = Array.from({ length: constants.M }, () => null);

  const TN = depthProfile.map((v) => v);
  let TI = 0;

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

  let st2inAvg = 0;

  for (let i = 0; i < constants.SL; i++) {
    TI = TI + constants.DT / 3600;
    TN[0] = TA + AM * Math.sin(0.261799 * (TI - 6));

    for (let j = 1; j <= constants.M; j++) {
      C[j] = -K[j] * constants.F;
      A[j + 1] = C[j];
      B[j] = constants.F * (K[j - 1] + K[j]) + CP[j];
      D[j] =
        constants.G() * K[j - 1] * depthProfile[j - 1] +
        (CP[j] - constants.G() * (K[j] + K[j - 1])) * depthProfile[j] +
        constants.G() * K[j] * depthProfile[j + 1];
    }

    D[1] = D[1] + constants.F * K[0] * TN[0];
    D[constants.M] =
      D[constants.M] + K[constants.M] * constants.F * TN[constants.M + 1];

    for (let j = 1; j < constants.M; j++) {
      C[j] = C[j] / B[j];
      D[j] = D[j] / B[j];
      B[j + 1] = B[j + 1] - A[j + 1] * C[j];
      D[j + 1] = D[j + 1] - A[j + 1] * D[j];
    }

    TN[constants.M] = constants.TB;

    for (let j = constants.M - 1; j > 0; j--) {
      TN[j] = D[j] - C[j] * TN[j + 1];
    }

    st2inAvg =
      st2inAvg +
      inches[2][0][1] * TN[inches[2][0][0]] +
      inches[2][1][1] * TN[inches[2][1][0]];

    for (let j = 0; j <= constants.M; j++) {
      depthProfile[j] = TN[j];
    }
  }

  return {
    newDepthProfile: TN,
    newSoilTemp: st2inAvg / constants.SL,
  };
}

export function calcVwcAndSoilTemp(
  weatherData,
  soilCharacteristics,
  selectedSoilTexture,
  constants,
  initDeficit
) {
  // -----------------------------------------------------------------------------------------
  // Calculate daily water deficit (inches) from daily precipitation, evapotranspiration, soil drainage and runoff.
  //
  // The water deficit is calculated relative to field capacity (i.e. the amount of water available to the plant).
  // Therefore, the water deficit is:
  //    - zero when soil moisture is at field capacity
  //    - a negative value when soil moisture is between field capacity and the wilting point
  //    - a positive value when soil moisture is between field capacity and saturation
  //    - bounded below by the wilting point ( = soil moisture at wilting point minus soil moisture at field capacity )
  //    - bounded above by saturation ( = soil moisture at saturation minus soil moisture at field capacity)
  //
  //  precip         : daily precipitation array (in) : (NRCC ACIS grid 3)
  //  pet            : daily potential evapotranspiration array (in) : (grass reference PET obtained from NRCC MORECS model output)
  //  soilcap        : soil water capacity ('high','medium','low')
  //  initDeficit    : water deficit used to initialize the model
  //
  // -----------------------------------------------------------------------------------------
  const { dates, pet, precip, mintC, maxtC } = weatherData;
  // console.log(dates, precip, pet, soilCharacteristics, constants, initDeficit);
  const { bulkDensity, clay } = soilCharacteristics;
  const waterCapacity = getSoilCapacityFromTexture(selectedSoilTexture);
  const VWC_DEPTH_INCHES = 18;

  /////////////////////////////
  // Initialize dependencies //
  /////////////////////////////
  const soil_options = SOIL_DATA.soilmoistureoptions;

  // generate constants used in soil temperature calculations
  const { inches, z } = createSoilTempConstants(
    constants.laminarThickness,
    constants.M
  );

  // for running tally of depth profile used in temperature calculations
  let depthProfile = Array.from(
    { length: constants.M + 2 },
    () => constants.TB
  );
 
  // for running tally of deficit as days loop
  let deficit = initDeficit;
    
  // Calculate daily drainage rate that occurs when soil water content is between saturation and field capacity
  const dailyPotentialDrainageRate = getPotentialDailyDrainage(soil_options[VWC_DEPTH_INCHES][waterCapacity], SOIL_DATA.soildrainageoptions[waterCapacity].daysToDrainToFcFromSat);

  ////////////////////////
  // Initialize returns //
  ////////////////////////
  // return for water deficit (difference from field capacity in inches), initializes with initial deficit in first day position
  const deficitDaily = [];
  deficitDaily.push(deficit);

  // return for volumetric water content (inches of water / inches of soil) in decimal form, initializes with initial VWC in first day position
  const vwcs = [];
  vwcs.push((soil_options[VWC_DEPTH_INCHES][waterCapacity].fieldcapacity + deficit) / VWC_DEPTH_INCHES);

  // return for 2" soil temperatures (degrees C), initializes with initial temp in first day position
  const soilTemps = [];
  let { newDepthProfile, newSoilTemp } = soil2InchModel(
    constants,
    maxtC[0],
    mintC[0],
    vwcs[0],
    bulkDensity,
    clay,
    depthProfile,
    inches,
    z
  );
  depthProfile = newDepthProfile;
  soilTemps.push(newSoilTemp);

  ////////////////
  // Daily loop //
  ////////////////
  // start with the second day (we already have the deficit for the initial day from model initialization)
  for (let idx = 1; idx < pet.length; idx++) {
    // Run calculations to balance deficit
    deficit = dailyWaterDeficitCalculations(waterCapacity, soil_options, VWC_DEPTH_INCHES, pet[idx], precip[idx], deficit, deficitDaily[idx - 1], dailyPotentialDrainageRate);

    // Add new deficit to return array
    deficitDaily.push(deficit);

    // Add new VWC to return array
    const newVwc = (soil_options[VWC_DEPTH_INCHES][waterCapacity].fieldcapacity + deficit) / VWC_DEPTH_INCHES;
    vwcs.push(newVwc);

    // Calculate soil temperature, update depthProfile, add temp to return array
    let { newDepthProfile, newSoilTemp } = soil2InchModel(
      constants,
      maxtC[idx],
      mintC[idx],
      newVwc,
      bulkDensity,
      clay,
      depthProfile,
      inches,
      z
    );
    depthProfile = newDepthProfile;
    soilTemps.push(newSoilTemp);
  }

  return {
    vwcs,
    dates,
    soilTempC: soilTemps
  };
}
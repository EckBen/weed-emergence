class SoilHorizon {
  constructor(horizon) {
    const [ clayProportion, sandProportion, bulkDensity, wvMax, hTop, hBot, percentage, name ] = horizon;
    const hTopCm = parseFloat(hTop);
    const hBotCm = parseFloat(hBot);

    this.name = name;
    this.percentOfArea = parseFloat(percentage);
    this.clay = parseFloat(clayProportion) / 100;
    this.sand = parseFloat(sandProportion) / 100;
    this.wvMax = parseFloat(wvMax) / 100;
    this.bulkDensity = parseFloat(bulkDensity);
    this.topCm = hTopCm;
    this.topIn = hTopCm / 2.54;
    this.bottomCm = hBotCm;
    this.bottomIn = hBotCm / 2.54;
  }

  percentOfBucketDepth(bTopIn, bBotIn) {
    if (this.topIn >= bBotIn || this.bottomIn <= bTopIn) {
      return 0;
    } else if (this.topIn <= bTopIn && this.bottomIn >= bBotIn) {
      return 1;
    } else {
      const partTop = Math.max(this.topIn, bTopIn);
      const partBot = Math.min(this.bottomIn, bBotIn);

      const maxIn = bBotIn - bTopIn;
      const partIn = partBot - partTop;

      return partIn / maxIn;
    }
  }
}

class SoilType {
  constructor(horizons) {
      this.horizons = horizons.map(h => new SoilHorizon(h));
      this.name = this.horizons[0].name;
      this.percentOfArea = this.horizons[0].percentOfArea;
  }

  calcCharacteristicsInBucket(bTopIn, bBotIn, propertiesOfInterest) {
    const bucketArrs = this.horizons.reduce((acc, h) => {
      const weight = h.percentOfBucketDepth(bTopIn, bBotIn);
      propertiesOfInterest.forEach(propName => {
        if (!Object.keys(acc).includes(propName)) acc[propName] = [];
        acc[propName].push([weight, h[propName]]);
      });
      return acc;
    }, {});

    return Object.entries(bucketArrs).reduce((acc, [propName, arr]) => {
      let weightSum = 0;
      let valueSum = 0;
      arr.forEach(([w, v]) => {
        weightSum += w;
        valueSum += (w * v);
      });
      acc[propName] = valueSum / weightSum;
      return acc;
    }, { percentArea: this.percentOfArea });
  }
}

class SoilColumn {
  propertiesOfInterest = ['clay', 'sand', 'bulkDensity', 'wvMax'];

  constructor(soilTable) {
    const soilTypes = soilTable.reduce((acc, horizon) => {
      if (horizon.includes(null)) return acc;
      if (!(horizon[7] in acc)) acc[horizon[7]] = [];
      acc[horizon[7]].push(horizon);
      return acc;
    }, {});
    this.soilTypes = Object.values(soilTypes).map(horizons => new SoilType(horizons));
  }

  calcColumnAvgBucket(bTopIn, bBotIn) {
    const soilTypeBuckets = this.soilTypes.map(soilType => soilType.calcCharacteristicsInBucket(bTopIn, bBotIn, this.propertiesOfInterest));
    const columnAvgBucket = soilTypeBuckets.reduce((acc, stb, i) => {
      acc.pAreaSum += stb.percentArea;
      this.propertiesOfInterest.forEach(poi => {
        if (!Object.keys(acc).includes(poi)) acc[poi] = 0;
        acc[poi] += (stb[poi] * stb.percentArea);

        if (i === soilTypeBuckets.length - 1) {
          acc[poi] = acc[poi] / acc.pAreaSum;
        }
      });
      return acc;
    }, { pAreaSum: 0 });
    delete columnAvgBucket.pAreaSum;
    return columnAvgBucket;
  }

  calcSoilTexture(bTopIn, bBotIn) {
    const { clay, sand } = this.calcColumnAvgBucket(bTopIn, bBotIn);
    return classifySoil(clay, sand);
  }
}

// water capacity categories from https://ucanr.edu/sites/UrbanHort/Water_Use_of_Turfgrass_and_Landscape_Plant_Materials/Soil_Water_Holding_Characteristics/
const soilTextureOptions = [
  {
    name: 'Sand',
    value: 'sand',
    waterCapacity: 'low',
    vwcToWaterPotential: (v) => (-0.73*(v/0.37)**(-1.69))*0.001
  },
  {
    name: 'Loamy Sand',
    value: 'loamy sand',
    waterCapacity: 'low',
    vwcToWaterPotential: (v) => (-0.87*(v/0.38)**(-2.11))*0.001
  },
  {
    name: 'Sandy Loam',
    value: 'sandy loam',
    waterCapacity: 'medium',
    vwcToWaterPotential: (v) => (-1.47*(v/0.41)**(-3.11))*0.001
  },
  {
    name: 'Loam',
    value: 'loam',
    waterCapacity: 'medium',
    vwcToWaterPotential: (v) => (-1.12*(v/0.43)**(-4.55))*0.001
  },
  {
    name: 'Silt Loam',
    value: 'silt loam',
    waterCapacity: 'medium',
    vwcToWaterPotential: (v) => (-2.08*(v/0.43)**(-4.74))*0.001
  },
  {
    name: 'Silt',
    value: 'silt',
    waterCapacity: 'medium',
    vwcToWaterPotential: (v) => (-2.6*(v/0.44)**(-4.23))*0.001
  },
  {
    name: 'Sandy Clay Loam',
    value: 'sandy clay loam',
    waterCapacity: 'high',
    vwcToWaterPotential: (v) => (-2.81*(v/0.41)**(-4.00))*0.001
  },
  {
    name: 'Clay Loam',
    value: 'clay loam',
    waterCapacity: 'high',
    vwcToWaterPotential: (v) => (-2.59*(v/0.45)**(-5.15))*0.001
  },
  {
    name: 'Silty Clay Loam',
    value: 'silty clay loam',
    waterCapacity: 'high',
    vwcToWaterPotential: (v) => (-3.26*(v/0.46)**(-6.62))*0.001
  },
  {
    name: 'Sandy Clay',
    value: 'sandy clay',
    waterCapacity: 'high',
    vwcToWaterPotential: (v) => (-2.92*(v/0.44)**(-5.95))*0.001
  },
  {
    name: 'Silty Clay',
    value: 'silty clay',
    waterCapacity: 'high',
    vwcToWaterPotential: (v) => (-3.42*(v/0.51)**(-7.87))*0.001
  },
  {
    name: 'Clay',
    value: 'clay',
    waterCapacity: 'high',
    vwcToWaterPotential: (v) => (-3.73*(v/0.5)**(-7.63))*0.001
  }
];

const classifySoil = (clayDec, sandDec) => {
  const clay = clayDec * 100;
  const sand = sandDec * 100;
  const silt = Math.abs(100 - (clay + sand));
  if (clay + sand + silt > 100) {
    throw 'Soil components add to over 100%';
  } else if (sand >= 85 && (silt + (1.5 * clay)) <= 15) {
    return soilTextureOptions[0].value;
  } else if (((sand >= 85 && sand <= 90 && (silt + (1.5 * clay)) >= 15)) || (sand >= 70 && sand <= 85 && (silt + (2 * clay)) <= 30)) {
    return soilTextureOptions[1].value;
  } else if ((clay <= 20 && (silt + (2 * clay)) > 30 && sand >= 52) || (clay < 7 && silt < 50 && sand >= 43 && sand <= 52)) {
    return soilTextureOptions[2].value;
  } else if (clay >= 7 && clay <= 27 && silt >= 28 && silt <= 50 && sand < 52) {
    return soilTextureOptions[3].value;
  } else if ((silt >= 50 && clay >= 12 && clay <= 27) || (silt >= 50 && silt <= 80 && clay <= 12)) {
    return soilTextureOptions[4].value;
  } else if (silt >= 80 && clay < 12) {
    return soilTextureOptions[5].value;
  } else if (clay >= 20 && clay <= 35 && silt < 28 && sand >= 45) {
    return soilTextureOptions[6].value;
  } else if (clay >= 27 && clay <= 40 && sand >= 20 && sand <= 45) {
    return soilTextureOptions[7].value;
  } else if (clay >= 27 && clay <= 40 && sand < 20) {
    return soilTextureOptions[8].value;
  } else if (clay >= 35 && sand >= 45) {
    return soilTextureOptions[9].value;
  } else if (clay >= 40 && silt >= 40) {
    return soilTextureOptions[10].value;
  } else if (clay >= 40 && sand < 45 && silt < 40) {
    return soilTextureOptions[11].value;
  } else {
    return 'na';
  }
};

function getSoilCapacityFromTexture(textureName) {
  return soilTextureOptions.find(s => s.value === textureName).waterCapacity;
}

const fetchSoilDataViaPostRest = (
  loc,
  topDepthInches,
  bottomDepthInches
) => {
  let query = `SELECT claytotal_r, sandtotal_r, dbthirdbar_r, wthirdbar_r, hzdept_r, hzdepb_r, comppct_r, compname
    FROM mapunit AS mu
    LEFT OUTER JOIN component AS c ON mu.mukey = c.mukey
    INNER JOIN chorizon AS ch ON c.cokey = ch.cokey
    WHERE mu.mukey IN (SELECT * from SDA_Get_Mukey_from_intersection_with_WktWgs84('point (${loc})'))`;

  let results = fetch(
    'https://sdmdataaccess.sc.egov.usda.gov/tabular/post.rest',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format: 'JSON',
        query: query,
      }),
    }
  )
    .then((res) => res.json())
    .then((jData) => jData.Table)
    .then((table) => {
      const soilColumn = new SoilColumn(table);
      const { clay, sand, bulkDensity } = soilColumn.calcColumnAvgBucket(topDepthInches, bottomDepthInches);
      const texture = classifySoil(clay, sand);
      const waterCapacity = getSoilCapacityFromTexture(texture);
      return {
        clay,
        bulkDensity,
        texture,
        waterCapacity
      };
    })
    .catch((e) => {
      console.warn('failed soil data...');
      console.error(e);
    });

  return results;
};






////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
// Above: Soil texture functions
// Below: Soil moisture and temperature functions
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////







// Soil moisture constants calculate for use with 6in soil column
const SOIL_DATA = {
  soilmoistureoptions: {
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
    },
    kc: 1.0,
    p: 0.5,
    vwcDepthInches: 6
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

function dailyWaterDeficitCalculations(soilcap, soil_options, dayPet, dayPrecip, currentDeficit, lastDeficit, drainageRate) {
  let deficit = currentDeficit;
  
  // Total water available to plant
  const TAW = getTawForPlant(soil_options[soilcap]);
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
      soil_options[soilcap].saturation -
        soil_options[soilcap].fieldcapacity
    );

    // deficit is bound by wilting point, but calculations should never reach wilting point based on this model. We bound it below for completeness.
    // In the real world, deficit is able to reach wilting point. The user should note that deficit values NEAR the wilting point
    // from this model should be interpreted as 'danger of wilting exists'.
    deficit = Math.max(
      deficit,
      -1 *
        (soil_options[soilcap].fieldcapacity -
          soil_options[soilcap].wiltingpoint)
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

function calcVwcAndSoilTemp(
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
  const { bulkDensity, clay } = soilCharacteristics;
  const waterCapacity = getSoilCapacityFromTexture(selectedSoilTexture);

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
  const dailyPotentialDrainageRate = getPotentialDailyDrainage(soil_options[waterCapacity], SOIL_DATA.soildrainageoptions[waterCapacity].daysToDrainToFcFromSat);

  ////////////////////////
  // Initialize returns //
  ////////////////////////
  // return for water deficit (difference from field capacity in inches), initializes with initial deficit in first day position
  const deficitDaily = [];
  deficitDaily.push(deficit);

  // return for volumetric water content (inches of water / inches of soil) in decimal form, initializes with initial VWC in first day position
  const vwcs = [];
  vwcs.push((soil_options[waterCapacity].fieldcapacity + deficit) / soil_options.vwcDepthInches);

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
    deficit = dailyWaterDeficitCalculations(waterCapacity, soil_options, pet[idx], precip[idx], deficit, deficitDaily[idx - 1], dailyPotentialDrainageRate);

    // Add new deficit to return array
    deficitDaily.push(deficit);

    // Add new VWC to return array
    const newVwc = (soil_options[waterCapacity].fieldcapacity + deficit) / soil_options.vwcDepthInches;
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

export { fetchSoilDataViaPostRest, soilTextureOptions, calcVwcAndSoilTemp };
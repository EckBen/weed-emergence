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

const classifySoil2 = (clayDec, sandDec) => {
  const clay = clayDec * 100;
  const sand = sandDec * 100;
  const silt = Math.abs(100 - (clay + sand));
  if (clay + sand + silt > 100) {
    throw 'Soil components add to over 100%';
  } else if (sand >= 85 && (silt + (1.5 * clay)) <= 15) {
    return { texture: soilTextureOptions[0].value, waterCapacity: soilTextureOptions[0].waterCapacity};
  } else if (((sand >= 85 && sand <= 90 && (silt + (1.5 * clay)) >= 15)) || (sand >= 70 && sand <= 85 && (silt + (2 * clay)) <= 30)) {
    return { texture: soilTextureOptions[1].value, waterCapacity: soilTextureOptions[1].waterCapacity};
  } else if ((clay <= 20 && (silt + (2 * clay)) > 30 && sand >= 52) || (clay < 7 && silt < 50 && sand >= 43 && sand <= 52)) {
    return { texture: soilTextureOptions[2].value, waterCapacity: soilTextureOptions[2].waterCapacity};
  } else if (clay >= 7 && clay <= 27 && silt >= 28 && silt <= 50 && sand < 52) {
    return { texture: soilTextureOptions[3].value, waterCapacity: soilTextureOptions[3].waterCapacity};
  } else if ((silt >= 50 && clay >= 12 && clay <= 27) || (silt >= 50 && silt <= 80 && clay <= 12)) {
    return { texture: soilTextureOptions[4].value, waterCapacity: soilTextureOptions[4].waterCapacity};
  } else if (silt >= 80 && clay < 12) {
    return { texture: soilTextureOptions[5].value, waterCapacity: soilTextureOptions[5].waterCapacity};
  } else if (clay >= 20 && clay <= 35 && silt < 28 && sand >= 45) {
    return { texture: soilTextureOptions[6].value, waterCapacity: soilTextureOptions[6].waterCapacity};
  } else if (clay >= 27 && clay <= 40 && sand >= 20 && sand <= 45) {
    return { texture: soilTextureOptions[7].value, waterCapacity: soilTextureOptions[7].waterCapacity};
  } else if (clay >= 27 && clay <= 40 && sand < 20) {
    return { texture: soilTextureOptions[8].value, waterCapacity: soilTextureOptions[8].waterCapacity};
  } else if (clay >= 35 && sand >= 45) {
    return { texture: soilTextureOptions[9].value, waterCapacity: soilTextureOptions[9].waterCapacity};
  } else if (clay >= 40 && silt >= 40) {
    return { texture: soilTextureOptions[10].value, waterCapacity: soilTextureOptions[10].waterCapacity};
  } else if (clay >= 40 && sand < 45 && silt < 40) {
    return { texture: soilTextureOptions[11].value, waterCapacity: soilTextureOptions[11].waterCapacity};
  } else {
    return 'na';
  }
};

function getSoilCapacityFromTexture(textureName) {
  return soilTextureOptions.find(s => s.value === textureName).waterCapacity;
}

const fetchSoilDataViaPostRest = (
  loc,
  topBucketDepths,
  bottomBucketDepths
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
      const topBucket = soilColumn.calcColumnAvgBucket(topBucketDepths.top, topBucketDepths.bottom);
      const bottomBucket = soilColumn.calcColumnAvgBucket(bottomBucketDepths.top, bottomBucketDepths.bottom);
      const texture = soilColumn.calcSoilTexture(topBucketDepths.top, bottomBucketDepths.bottom);
      
      const { clay, sand, bulkDensity } = soilColumn.calcColumnAvgBucket(topBucketDepths.top, bottomBucketDepths.bottom);
      const { texture: fullColumnTexture, waterCapacity } = classifySoil2(clay, sand);
      return {
        top: topBucket,
        bottom: bottomBucket,
        texture,
        vwcAndTempValues: {
          clay,
          bulkDensity,
          texture: fullColumnTexture,
          waterCapacity
        }
      };
    })
    .catch((e) => {
      console.error(e);
      console.warn('failed soil data...');
    });

  return results;
};

export { fetchSoilDataViaPostRest, soilTextureOptions, getSoilCapacityFromTexture };
import { soilTextureOptions } from './getSoilData';

// amaranthus alba - prostrate pigweed - AMAAL
// s pumila/clauca - yellow foxtail - SETLU

//// amaranthus hybridus - smooth pigweed
//// amaranthus retroflexus- redroot pigweed
//// ambrosia art - common ragweed
//// abuth - velvetleaf
//// digitaria sanguinalis large crabgrass
//// s. faberi - giant foxtail
//// S viridis - green foxtail
//// ch album - lambsquarters
//// amaranthus palmeri - palmer amaranth
//// ipomoea hederaceae ivy-leaved morning glory
//// Hibiscus trionum venice mallow

const models = [
  'NRCC',
  'Weedcast',
  'Mohsen'
];

const modelsBase = (model) => {
  return (gddAcc) => {
    if (gddAcc === 0) return 0;
    return model(gddAcc);
  };
};

















// name: 'Smooth Pigweed',
// b: 4.09997196191081,
// lag: 12.6749114326069,
// c: 0.176380081641461,
// tb: 13.5,
// wb: -15

// name: 'Ragweed',
// b: 0.0383995690158795,
// lag: 77.475678149824,
// c: 0.333432447116857,
// tb: 5.8,
// wb: -1

// name: 'Green Foxtail',
// b: 0.15326116799951,
// lag: 62.9617363392501,
// c: 0.31887300248063,
// tb: 9.68333333333333,
// wb: -15

// name: 'Ivy-Leaved Morning Glory',
// b: 0.0675469510634423,
// lag: 173.58504621903,
// c: 0.273530868930169,
// tb: 10,
// wb: -15










const weedSpecies = [
  {
    id: 'pigweed',
    name: 'Pigweed',
    color: '#2caffe',
    nrcc: (gddAcc) => 100 / (1 + Math.exp(20.06 - 3.12 * Math.log(gddAcc))),
    weedcast: (gddAcc) => Math.exp(-7 * Math.exp(-0.01 * gddAcc)) * 100,
    mohsen: null
  // },{
  //   id: 'prostratePigweed',
  //   name: 'Prostrate Pigweed',
  //   color: '#544fc5',
  //   nrcc: null,
  //   weedcast: null,
  //   mohsen: null
  },{
    id: 'smoothPigweed',
    name: 'Smooth Pigweed',
    color: '#00e272',
    nrcc: null,
    weedcast: null,
    mohsen: {
      b: 4.09997196191081,
      lag: 12.6749114326069,
      c: 0.176380081641461,
      tb: 13.5,
      wb: -15
    }
  },{
    id: 'redRootPigweed',
    name: 'Red Root Pigweed',
    color: '#fe6a35',
    nrcc: null,
    weedcast: null,
    mohsen: {
      b: 0.00450936702846497,
      lag: 0,
      c: 0.9907883816929,
      tb: 10.82,
      wb: -15
    }
  },{
    id: 'ragweed',
    name: 'Ragweed',
    color: '#6b8abc',
    nrcc: (gddAcc) => 100 / (1 + Math.exp(12.93 - 2.63 * Math.log(gddAcc))),
    weedcast: (gddAcc) => Math.exp(-6 * Math.exp(-0.015 * gddAcc)) * 100,
    mohsen: {
      b: 0.0383995690158795,
      lag: 77.475678149824,
      c: 0.333432447116857,
      tb: 5.8,
      wb: -1
    }
  },{
    id: 'velvetLeaf',
    name: 'Velvet Leaf',
    color: '#d568fb',
    nrcc: (gddAcc) => 100 / (1 + Math.exp(18.86 - 3.21 * Math.log(gddAcc))),
    weedcast: (gddAcc) => Math.exp(-6 * Math.exp(-0.011 * gddAcc)) * 100,
    mohsen: {
      b: 0.00695281427669189,
      lag: 0,
      c: 0.650873716144459,
      tb: 8.33333333333333,
      wb: -15
    }
  },{
    id: 'largeCrabgrass',
    name: 'Large Crabgrass',
    color: '#2ee0ca',
    nrcc: null,
    weedcast: (gddAcc) => Math.exp(-6 * Math.exp(-0.011 * gddAcc)) * 100,
    mohsen: {
      b: 0.00439394741417554,
      lag: 14.1748689067769,
      c: 0.88144054728983,
      tb: 11.6333333333333,
      wb: -0.5
    }
  },{
    id: 'foxtail',
    name: 'Foxtail',
    color: '#fa4b42',
    nrcc: (gddAcc) => 100 / (1 + Math.exp(19.46 - 3.31 * Math.log(gddAcc))),
    weedcast: (gddAcc) => Math.exp(-6 * Math.exp(-0.009 * gddAcc)) * 100,
    mohsen: null
  },{
    id: 'giantFoxtail',
    name: 'Giant Foxtail',
    color: '#feb56a',
    nrcc: null,
    weedcast: null,
    mohsen: {
      b: 0.00354895875892669,
      lag: 0,
      c: 1.41254915950857,
      tb: 8,
      wb: -15
    }
  // },{
  //   id: 'yellowFoxtail',
  //   name: 'Yellow Foxtail',
  //   color: '#91e8e1',
  //   nrcc: null,
  //   weedcast: null,
  //   mohsen: null
  },{
    id: 'greenFoxtail',
    name: 'Green Foxtail',
    color: '#2916d6',
    nrcc: null,
    weedcast: null,
    mohsen: {
      b: 0.15326116799951,
      lag: 62.9617363392501,
      c: 0.31887300248063,
      tb: 9.68333333333333,
      wb: -15
    }
  },{
    id: 'lambsquarter',
    name: 'Lambsquarter',
    color: '#0f6b2e',
    nrcc: (gddAcc) => 100 / (1 + Math.exp(11.69 - 1.9 * Math.log(gddAcc))),
    weedcast: (gddAcc) => Math.exp(-6 * Math.exp(-0.011 * gddAcc)) * 100,
    mohsen: {
      b: 0.00429548920322263,
      lag: 11.1118719936504,
      c: 0.637585333366167,
      tb: 5.125,
      wb: -15
    }
  },{
    id: 'palmerAmaranth',
    name: 'Palmer Amaranth',
    color: '#130709',
    nrcc: null,
    weedcast: null,
    mohsen: {
      b: 0.00439278087090956,
      lag: 0,
      c: 0.964354917594612,
      tb: 10,
      wb: -15
    }
  },{
    id: 'ivyLeavedMorningGlory',
    name: 'Ivy-Leaved Morning Glory',
    color: '#b3c50c',
    nrcc: null,
    weedcast: null,
    mohsen: {
      b: 0.0675469510634423,
      lag: 173.58504621903,
      c: 0.273530868930169,
      tb: 10,
      wb: -15
    }
  },{
    id: 'veniceMallow',
    name: 'Venice Mallow',
    color: '#7c0f92',
    nrcc: null,
    weedcast: null,
    mohsen: {
      b: 0.00176631226974847,
      lag: 69.8704068113112,
      c: 0.818270286560912,
      tb: 9,
      wb: -15
    }
  }
];

const createInitEmergencesObj = () => {
  return models.reduce((acc, model) => {
    const modelName = model.toLowerCase();
    acc[modelName] = {};
    weedSpecies.forEach(w => acc[modelName][w.id] = []);
    return acc;
  }, {});
};

const createInitShowWeedsObj = (initValue) => {
  return weedSpecies.reduce((acc, { id }) => {
    acc[id] = initValue;
    return acc;
  }, {});
};

const calcGDDAccumulations = (soilTemps, depth) => {
  if (Object.keys(soilTemps).length === 0) return [];

  let sum = 0;
  return soilTemps[depth].map((soilTemp, i) => {
    const date = soilTemps.dates[i];

    // If tillDates should affect accumulation, need to pass them in again
    // if (tillDates.includes(date)) {
    //   sum = 0;
    // } else {
    //   sum += Math.max(0, soilTemp - 50);
    // }
    
    
    sum += Math.max(0, soilTemp - 50);
    
    return [date, sum];
  });
};

const calcHydroThermalTime = (soilTemps, waterPotentials, weedConstants) => {
  const { tb, wb } = weedConstants;
  const htts = [];
  let httSum = 0;
  for (let i = 0; i < soilTemps.length; i++) {
    const soilTemp = soilTemps[i];
    const waterPotential = waterPotentials[i];
    if (soilTemp > tb && waterPotential > wb) {
      httSum += (soilTemp - tb);
    }
    htts.push(httSum);
  }
  return htts;
};

const mohsensPWeibul = (htt, weedConstants) => {
  const { lag, b: scale, c: shape } = weedConstants;
  const time = htt - lag;
  if (time < 0) return 0;
  return 1 - Math.exp(-((scale * time) ** shape));
};

const calcEmergences = (soilTemps, depth, selectedSoilTexture, tillDates) => {
  const emergences = createInitEmergencesObj();
  const gddModels = models.filter(m => m !== 'Mohsen');
  const gdds = calcGDDAccumulations(soilTemps, depth, tillDates);
  gdds.forEach(gdd => {
    gddModels.forEach(model => {
      const modelName = model.toLowerCase();
      weedSpecies.forEach(weedObj => {
        emergences[modelName][weedObj.id].push(weedObj[modelName] === null ? null : modelsBase(weedObj[modelName])(gdd[1]));
      });
    });
  });
  
  const vwcToWaterPotential = soilTextureOptions.find(sto => sto.value === selectedSoilTexture).vwcToWaterPotential;
  const waterPotentials = soilTemps.topVwc.map(vwc => vwcToWaterPotential(vwc));
  const soilTempsC = soilTemps.two.map(t => (t - 32) * (5 / 9));
  console.log(soilTemps.topVwc, soilTempsC, waterPotentials);
  weedSpecies.forEach(weedObj => {
    if (weedObj.mohsen === null) {
      emergences['mohsen'][weedObj.id] = null;
    } else {
      const htts = calcHydroThermalTime(soilTempsC, waterPotentials, weedObj.mohsen);
      console.log(weedObj.name, htts);
      emergences['mohsen'][weedObj.id] = htts.map(htt => Math.round(mohsensPWeibul(htt, weedObj.mohsen) * 100));
      // console.log(weedObj.name, weedObj.mohsen, htts, emergences['mohsen'][weedObj.id]);
    }
  });

  return emergences;
};

// Inputs: arr- Array, targetLength- number, fillValue- any value valid to place in an Array, append- optional, boolean, defaults to true
// Adds targetLength number of fillValue to beginning or end (determined by optional append bollean) of arr
function fillWith(arr, targetLength, fillValue, append=true) {
  const diff = targetLength - arr.length;
  if (diff <= 0) return arr;

  const newPortion = new Array(diff).fill(fillValue);
  return append ? arr.concat(newPortion) : newPortion.concat(arr);
}

function constructSeries(data, isThisYear, showWeeds, lastTillIdx) {
  return models.reduce((acc, model) => {
    const modelName = model.toLowerCase();
    const modelWeeds = weedSpecies.filter(w => showWeeds[w.id] && w[modelName] !== null);
    acc[model] = modelWeeds.map(weedObj => {
      const thisData = data[modelName][weedObj.id];
      const seriesId = modelName + '-' + weedObj.id;
      const baseObj = {
        name: weedObj.name,
        color: weedObj.color,
        isForecast: false,
        id: seriesId,
        zoneAxis: 'x',
        zones: [{
          color: 'rgb(200,200,200)',
          fillColor: 'rgb(200,200,200)',
          value: lastTillIdx
        }]
      };
  
      if (isThisYear) {
        return [{
          ...baseObj,
          data: thisData.slice(0,-2),
        },{
          ...baseObj,
          data: fillWith(thisData.slice(-2), thisData.length, null, false),
          dashStyle: 'ShortDot',
          linkedTo: seriesId,
          id: seriesId + '-forecast',
          isForecast: true
        }];
      } else {
        return [{
          ...baseObj,
          data: thisData
        }];
      }
    }).reduce((acc, arr) => acc.concat(arr), []);
    return acc;
  }, {});
}

export { calcEmergences, createInitEmergencesObj, constructSeries, createInitShowWeedsObj, models, weedSpecies };
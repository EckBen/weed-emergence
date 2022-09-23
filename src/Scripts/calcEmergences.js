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

const pigweedNRCC = (gddAcc) => {
  if (gddAcc === 0) return 0;
  return 100 / (1 + Math.exp(20.06 - 3.12 * Math.log(gddAcc)));
};
const pigweedWeedcast = (gddAcc) => {
  if (gddAcc === 0) return 0;
  return Math.exp(-7 * Math.exp(-0.01 * gddAcc)) * 100;
};

const ragweedNRCC = (gddAcc) => {
  if (gddAcc === 0) return 0;
  return 100 / (1 + Math.exp(12.93 - 2.63 * Math.log(gddAcc)));
};
const ragweedWeedcast = (gddAcc) => {
  if (gddAcc === 0) return 0;
  return Math.exp(-6 * Math.exp(-0.015 * gddAcc)) * 100;
};

const velvetLeafNRCC = (gddAcc) => {
  if (gddAcc === 0) return 0;
  return 100 / (1 + Math.exp(18.86 - 3.21 * Math.log(gddAcc)));
};
const velvetLeafWeedcast = (gddAcc) => {
  if (gddAcc === 0) return 0;
  return Math.exp(-6 * Math.exp(-0.011 * gddAcc)) * 100;
};

const largeCrabgrassWeedcast = (gddAcc) => {
  if (gddAcc === 0) return 0;
  return Math.exp(-6 * Math.exp(-0.011 * gddAcc)) * 100;
};

const foxtailNRCC = (gddAcc) => {
  if (gddAcc === 0) return 0;
  return 100 / (1 + Math.exp(19.46 - 3.31 * Math.log(gddAcc)));
};
const foxtailWeedcast = (gddAcc) => {
  if (gddAcc === 0) return 0;
  return Math.exp(-6 * Math.exp(-0.009 * gddAcc)) * 100;
};

const lambsquartersNRCC = (gddAcc) => {
  if (gddAcc === 0) return 0;
  return 100 / (1 + Math.exp(11.69 - 1.9 * Math.log(gddAcc)));
};

const lambsquartersWeedcast = (gddAcc) => {
  if (gddAcc === 0) return 0;
  return Math.exp(-6 * Math.exp(-0.011 * gddAcc)) * 100;
};


const calcEmergences = (soilTemps, depth, tillDates) => {
  const gdds = calcGDDAccumulations(soilTemps, depth, tillDates);

  const models = {
    nrcc: {
      pigweed: [],
      ragweed: [],
      velvetLeaf: [],
      foxtail: [],
      lambsquarter: []
    },
    weedcast: {
      pigweed: [],
      ragweed: [],
      velvetLeaf: [],
      largeCrabgrass: [],
      foxtail: [],
      lambsquarter: []
    }
  };
  
  gdds.forEach(gdd => {
    models.nrcc.pigweed.push(pigweedNRCC(gdd[1]));
    models.nrcc.ragweed.push(ragweedNRCC(gdd[1]));
    models.nrcc.velvetLeaf.push(velvetLeafNRCC(gdd[1]));
    models.nrcc.foxtail.push(foxtailNRCC(gdd[1]));
    models.nrcc.lambsquarter.push(lambsquartersNRCC(gdd[1]));

    models.weedcast.pigweed.push(pigweedWeedcast(gdd[1]));
    models.weedcast.ragweed.push(ragweedWeedcast(gdd[1]));
    models.weedcast.velvetLeaf.push(velvetLeafWeedcast(gdd[1]));
    models.weedcast.largeCrabgrass.push(largeCrabgrassWeedcast(gdd[1]));
    models.weedcast.foxtail.push(foxtailWeedcast(gdd[1]));
    models.weedcast.lambsquarter.push(lambsquartersWeedcast(gdd[1]));
  });

  return models;
};


export default calcEmergences;
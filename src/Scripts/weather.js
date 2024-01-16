async function fetchAcisObs(lat, lon, eDate) {
  const response = await fetch('https://grid2.rcc-acis.org/GridData', {
    method: 'POST',
    body: JSON.stringify({
      loc: `${lon},${lat}`,
      grid: 'nrcc-model',
      sDate: `${eDate.slice(0,4)}-03-01`,
      eDate,
      elems: [{ name: 'pcpn' },{ name: 'maxt' },{ name: 'mint' }]
    }),
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const results = (await response.json()).data;
  while (results[results.length - 1].includes(-999)) {
    results.pop();
  }
  return results;
}

function convertHrlyToDaily(hourArrs, valueIdx, transform='sum', initObj={ sum: 0, count: 0 }) {
  // Loop hourly data summing values at given index through 7:00am
  // then start a new daily sum by storing the current total and resetting to 0
  if (transform === 'maxmin' && Object.keys(initObj).includes('sum')) {
    initObj = { min: 999, max: -999 };
  }

  const returnArr = [];
  hourArrs.forEach(hour => {
    let value = hour[valueIdx];
    if (transform === 'maxmin') {
      if (value !== 'M') {
        value = parseFloat(value);
        if (value > initObj.max) initObj.max = value;
        if (value < initObj.min) initObj.min = value;
      }
    } else if (transform === 'sum' || transform === 'avg') {
      if (value === 'M') {
        value = 0;
      } else {
        value = parseFloat(value);
      }
      initObj.sum += value;
      initObj.count += 1;
    }

    if (hour[0].slice(11,13) === '07') {
      if (transform === 'sum' || transform === 'avg') {
        returnArr.push([hour[0].slice(0,10), transform === 'sum' ? initObj.sum : (initObj.count > 0 ? (initObj.sum / initObj.count) : 0)]);
        initObj={ sum: 0, count: 0 };
      } else if (transform === 'maxmin') {
        returnArr.push([hour[0].slice(0,10), initObj.max, initObj.min === 999 ? -999 : initObj.min]);
        initObj={ min: 999, max: -999 };
      }
    }
  });

  return {returnArr, remainder: initObj};
}

function calcDailyFromHrly(dataObj, obsIdx, foreIdx, sumOrAvg) {
  // Sum observed hourly in daily and get the remaining sum to intialize forecast hourly with
  const {returnArr: obsArr, remainder} = convertHrlyToDaily(dataObj.hrlyData, obsIdx, sumOrAvg);
  
  // Cap forecast hourly at 72hrs and calculate the rest of the forecast from it
  const endIdx = Math.min(72, dataObj.fcstData.findIndex(arr => arr[11] === 'M'));
  const { returnArr: foreArr } = convertHrlyToDaily(dataObj.fcstData.slice(0, endIdx), foreIdx, sumOrAvg, remainder);
  
  return obsArr.concat(foreArr);
}

async function fetchLocHourlyFore(lat, lon, sDate) {
  // Make start date one day earlier to ensure full coverage
  let date = new Date(sDate + 'T00:00');
  date.setDate((date.getDate() - 1));
  const strDate = date.toISOString().slice(0,10).replace('-','').replace('-','') + '08';
  
  const response = await fetch('https://hrly.nrcc.cornell.edu/locHrly', {
    method: 'POST',
    body: JSON.stringify({
      lon: lon,
      lat: lat,
      tzo: -5,
      sdate:  strDate,
      edate: 'now'
    }),
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const results = await response.json();
  const precipDaily = calcDailyFromHrly(results, 2, 11, 'sum');
  const maxminFDaily = calcDailyFromHrly(results, 3, 2, 'maxmin');
  const daily = [];
  for (let i = 0; i < precipDaily.length; i++) {
    daily.push([ ...precipDaily[i], maxminFDaily[i][1], maxminFDaily[i][2] ]);
  }
  return daily;
}

async function fetchPrecipAndTempData(lat, lon, eDate) {
  if (eDate.slice(5) < '03-01') eDate = eDate.slice(0,5) + '10-31';

  const [obs, fore] = await Promise.all([
    fetchAcisObs(lat, lon, eDate),
    fetchLocHourlyFore(lat, lon, eDate)
  ]);


  while (fore.length && obs[obs.length - 1][0] === fore[0][0]) {
    fore.shift();
  }

  console.log(fore);

  return {
    weather: obs.concat(fore),
    weatherFcstLength: fore.length
  };
}

async function fetchPETData(lat, lon, todayStr) {
  const year = todayStr.slice(0,4);
  const response = await fetch(`https://x6xfv2cdrl.execute-api.us-east-1.amazonaws.com/production/irrigation?lat=${lat}&lon=${lon}&year=${year}`);
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const etData = await response.json();
  const dates = etData.dates_pet.concat(etData.dates_pet_fcst);
  const values = etData.pet.concat(etData.pet_fcst);
  const nov1Idx = dates.findIndex(d => d === '11/01');
  const et = values.slice(0, nov1Idx > 0 ? nov1Idx : values.length).map((val,i) => [`${year}-${dates[i].replace('/','-')}`, val]);
  const petFcstLength = Math.max(et.length - etData.pet.length, 0);

  return {
    pet: et,
    petFcstLength
  };
}

export async function getWeatherData({lng: lon, lat}, date) {
  try {
    // fetch PET and precip
    let [
      { weather, weatherFcstLength },
      { pet, petFcstLength }
    ] = await Promise.all([
      fetchPrecipAndTempData(lat, lon, date),
      fetchPETData(lat, lon, date)
    ]);

    // adjust pet and weather to have matching lengths
    const lengthDiff = weather.length - pet.length;
    if (lengthDiff > 0) {
      weatherFcstLength = Math.max(weatherFcstLength - lengthDiff, 0);
      weather = weather.slice(0, weather.length - lengthDiff);
    } else if (lengthDiff < 0) {
      petFcstLength = Math.max(petFcstLength - lengthDiff, 0);
      pet = pet.slice(0, pet.length - lengthDiff);
    }

    // instantiate results obj and determine the number of forecast days that will be in results
    const results = {
      dates: [],
      pet: [],
      precip: [],
      maxtC: [],
      mintC: [],
      fcstLength: Math.max(weatherFcstLength, petFcstLength)
    };

    // loop through data pushing to results obj and ensuring that the dates match
    for (let i = 0; i < Math.min(pet.length, weather.length); i++) {
      const [petDate, petValue] = pet[i];
      const [weatherDate, precipValue, maxtF, mintF] = weather[i];
      
      if (petDate === weatherDate) {
        results.dates.push(petDate);
        results.pet.push(petValue);
        results.precip.push(precipValue);
        results.maxtC.push((maxtF - 32) * (5 / 9));
        results.mintC.push((mintF - 32) * (5 / 9));
      } else {
        throw 'PET, precip, and temp dates do not match';
      }
    }

    return results;
  } catch (e) {
    console.error(e);
    return null;
  }
}
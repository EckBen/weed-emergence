import { fetchSoilDataViaPostRest } from './getSoilData';
import { getWeatherData } from './weatherData';

// import { format } from 'date-fns';
import { format, subDays } from 'date-fns';


const fetchETData = (coords, year) => {
  return fetch(
    `https://x6xfv2cdrl.execute-api.us-east-1.amazonaws.com/production/irrigation?lat=${coords[1]}&lon=${coords[0]}&year=${year}`
  )
    .then((response) => response.json())
    .catch(() => null);
};

const fetchTempPrcpData = (loc, sdate, edate) => {
  return fetch('https://grid2.rcc-acis.org/GridData', {
    method: 'POST',
    body: JSON.stringify({
      loc,
      sdate,
      edate,
      grid: 'nrcc-model',
      elems: [{ name: 'maxt' }, { name: 'mint' }, { name: 'pcpn' }],
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      return response.json();
    })
    .then((data) => data.data);
};

const fetchLocHrly = (coords) => {
  return fetch('https://hrly.nrcc.cornell.edu/locHrly', {
    method: 'POST',
    body: JSON.stringify({
      lon: coords[0],
      lat: coords[1],
      tzo: -5,
      sdate: format(subDays(new Date(), 1), 'yyyyMMdd08'), // Use previous day to avoid API data issues
      edate: 'now',
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      return response.json();
    })
    .then((data) => {
      return data.dlyFcstData.map((arr) => {
        const date = arr[0].slice(0, 10);
        const maxt = Math.round(parseFloat(arr[1]));
        const mint = Math.round(parseFloat(arr[2]));
        return [date, maxt, mint];
      });
    })
    .catch(() => null);
};


const fetchData = async (coords, year, today, constants) => {
  const sDate = `${year}-02-27`; // Feb 27th
  const eDate = `${year}-10-31`; // Oct 31st

  if (today.getFullYear() !== year) {
    today = new Date(year, today.getMonth(), today.getDate());
  }

  let [etData, tempPrcpData, locHrly, buckets, weatherData] = await Promise.all([
    fetchETData(coords, year),
    fetchTempPrcpData(
      coords.join(','),
      sDate,
      eDate
    ),
    fetchLocHrly(coords),
    fetchSoilDataViaPostRest(
      coords.join(' '),
      { top: 0, bottom: constants.topBucket },
      { top: constants.topBucket, bottom: constants.topBucket + constants.bottomBucket() }
    ),
    getWeatherData(coords, format(today, 'yyyy-MM-dd'))
  ]);
    
  return { etData, tempPrcpData, locHrly, buckets, weatherData };
  // return { weatherData, buckets };
};

export default fetchData;

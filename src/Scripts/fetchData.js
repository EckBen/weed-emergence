import { format, subDays } from 'date-fns';

const fetchETData = (coords, year) => {
  return fetch(
    `https://0nakxnhta9.execute-api.us-east-1.amazonaws.com/production/irrigation?lat=${coords[1]}&lon=${coords[0]}&year=${year}`
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

// const fetchSoilDataViaPostRest = (loc, bucketDepth, topBucket, bottomBucket) => {
//   let query = `SELECT claytotal_r, dbthirdbar_r, wthirdbar_r, hzdept_r, hzdepb_r, comppct_r, compname
//     FROM mapunit AS mu
//     LEFT OUTER JOIN component AS c ON mu.mukey = c.mukey
//     INNER JOIN chorizon AS ch ON c.cokey = ch.cokey
//     WHERE mu.mukey IN (SELECT * from SDA_Get_Mukey_from_intersection_with_WktWgs84('point (${loc})'))`;

//   console.log('fetching soil data...');
//   let results = fetch(
//     'https://sdmdataaccess.sc.egov.usda.gov/tabular/post.rest',
//     {
//       method: 'POST',
//       headers: {
//         Accept: 'application/json',
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         format: 'JSON',
//         query: query,
//       }),
//     }
//   )
//     .then((res) => res.json())
//     .then((jData) => {
//       console.log(jData);
//       return jData.Table;
//     })
//     .then((dataList) => {
//       console.log(dataList);
//       const most = Math.max(...dataList.map((arr) => parseFloat(arr[5])));
//       dataList = dataList.filter(
//         (arr) => arr[5] === String(most) && !arr.includes(null)
//       );

//       return dataList.reduce(
//         (buckets, horizon, i) => {
//           const topInches = parseFloat(horizon[3]) / 2.54;
//           let bottomInches = parseFloat(horizon[4]) / 2.54;
//           if (topInches < bucketDepth) {
//             // Handle ending before entire bucketDepth is accounted for or if horizons have more depth than bucketDepth
//             if (
//               (i === dataList.length - 1 && bottomInches < bucketDepth) ||
//               bottomInches > bucketDepth
//             ) {
//               bottomInches = bucketDepth;
//             }

//             // Calculate distance from bucket divider
//             const hTop = topBucket - topInches;
//             const hBottom = topBucket - bottomInches;

//             // Calculate amount of horizon in each bucket
//             let topPart = 0,
//               bottomPart = 0;
//             if (hTop > 0 && hBottom < 0) {
//               // part in each bucket
//               topPart = hTop;
//               bottomPart = Math.abs(hBottom);
//             } else if (hTop >= 0 && hBottom >= 0) {
//               // all in topBucket
//               topPart = hTop - hBottom;
//             } else {
//               // all in bottomBucket
//               bottomPart = Math.abs(hTop - hBottom);
//             }

//             // Add weighted portion of variables to summing obj for each bucket
//             if (topPart) {
//               topPart = topPart / topBucket;
//               buckets.top.clayProportion +=
//                 (parseFloat(horizon[0]) / 100) * topPart;
//               buckets.top.bulkDensity += parseFloat(horizon[1]) * topPart;
//               buckets.top.wvMax += (parseFloat(horizon[2]) / 100) * topPart;
//             }

//             if (bottomPart) {
//               bottomPart = bottomPart / bottomBucket;
//               buckets.bottom.clayProportion +=
//                 (parseFloat(horizon[0]) / 100) * bottomPart;
//               buckets.bottom.bulkDensity += parseFloat(horizon[1]) * bottomPart;
//               buckets.bottom.wvMax +=
//                 (parseFloat(horizon[2]) / 100) * bottomPart;
//             }
//           }

//           return buckets;
//         },
//         {
//           top: {
//             clayProportion: 0,
//             bulkDensity: 0,
//             wvMax: 0,
//           },
//           bottom: {
//             clayProportion: 0,
//             bulkDensity: 0,
//             wvMax: 0,
//           },
//         }
//       );
//     })
//     .catch((e) => {
//       console.log(e);
//       console.log('failed soil data...');
//     });

//   return results;
// };

const convertTableToBuckets = (
  dataList,
  bucketDepth,
  topBucket,
  bottomBucket
) => {
  const most = Math.max(...dataList.map((arr) => parseFloat(arr[5])));
  dataList = dataList.filter(
    (arr) => arr[5] === String(most) && !arr.includes(null)
  );

  const results = dataList.reduce(
    (buckets, horizon, i) => {
      const topInches = parseFloat(horizon[3]) / 2.54;
      let bottomInches = parseFloat(horizon[4]) / 2.54;
      if (topInches < bucketDepth) {
        // Handle ending before entire bucketDepth is accounted for or if horizons have more depth than bucketDepth
        if (
          (i === dataList.length - 1 && bottomInches < bucketDepth) ||
          bottomInches > bucketDepth
        ) {
          bottomInches = bucketDepth;
        }

        // Calculate distance from bucket divider
        const hTop = topBucket - topInches;
        const hBottom = topBucket - bottomInches;

        // Calculate amount of horizon in each bucket
        let topPart = 0,
          bottomPart = 0;
        if (hTop > 0 && hBottom < 0) {
          // part in each bucket
          topPart = hTop;
          bottomPart = Math.abs(hBottom);
        } else if (hTop >= 0 && hBottom >= 0) {
          // all in topBucket
          topPart = hTop - hBottom;
        } else {
          // all in bottomBucket
          bottomPart = Math.abs(hTop - hBottom);
        }

        // Add weighted portion of variables to summing obj for each bucket
        if (topPart) {
          topPart = topPart / topBucket;
          buckets.top.clayProportion +=
            (parseFloat(horizon[0]) / 100) * topPart;
          buckets.top.bulkDensity += parseFloat(horizon[1]) * topPart;
          buckets.top.wvMax += (parseFloat(horizon[2]) / 100) * topPart;
        }

        if (bottomPart) {
          bottomPart = bottomPart / bottomBucket;
          buckets.bottom.clayProportion +=
            (parseFloat(horizon[0]) / 100) * bottomPart;
          buckets.bottom.bulkDensity += parseFloat(horizon[1]) * bottomPart;
          buckets.bottom.wvMax += (parseFloat(horizon[2]) / 100) * bottomPart;
        }
      }

      return buckets;
    },
    {
      top: {
        clayProportion: 0,
        bulkDensity: 0,
        wvMax: 0,
      },
      bottom: {
        clayProportion: 0,
        bulkDensity: 0,
        wvMax: 0,
      },
    }
  );
  return results;
};

const parseXmlToTable = (xmlText) => {
  let xmlDoc;
  if (window.DOMParser) {
    const parser = new window.DOMParser();
    xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  } else {
    xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
    xmlDoc.async = false;
    xmlDoc.loadXML(xmlText);
  }

  return [...xmlDoc.getElementsByTagName('Table')].map((row) => {
    return [...row.childNodes].map((col) => col.textContent);
  });
};

const fetchSoilDataViaSoapProxy = async (
  loc,
  bucketDepth,
  topBucket,
  bottomBucket
) => {
  // Fetch data from proxy server
  const response = await fetch(
    'https://cors-proxy.benlinux915.workers.dev/soil-characteristics',
    {
      method: 'POST',
      headers: {
        Accept: 'application/soap+xml',
        'Content-Type': 'application/soap+xml',
      },
      body: JSON.stringify({
        soapQuery: `<?xml version="1.0" encoding="utf-8"?>
      <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
        <soap12:Body>
          <RunQuery xmlns="http://SDMDataAccess.nrcs.usda.gov/Tabular/SDMTabularService.asmx">
            <Query>SELECT claytotal_r, dbthirdbar_r, wthirdbar_r, hzdept_r, hzdepb_r, comppct_r, compname
          FROM mapunit AS mu
          LEFT OUTER JOIN component AS c ON mu.mukey = c.mukey
          INNER JOIN chorizon AS ch ON c.cokey = ch.cokey
          WHERE mu.mukey IN (SELECT * from SDA_Get_Mukey_from_intersection_with_WktWgs84('point (${loc})'))</Query>
          </RunQuery>
        </soap12:Body>
      </soap12:Envelope>`,
      }),
    }
  );
  const xmlText = await response.text();

  // Parse xml text into table of data
  const table = parseXmlToTable(xmlText);

  // Return buckets after calculating from table
  return convertTableToBuckets(table, bucketDepth, topBucket, bottomBucket);
};

const fetchData = async (coords, year, constants) => {
  const sDate = new Date(year, 1, 27); // Feb 27th
  const today = new Date(year, 9, 31); // Oct 31st

  let [etData, tempPrcpData, locHrly, buckets] = await Promise.all([
    fetchETData(coords, year),
    fetchTempPrcpData(
      coords.join(','),
      format(sDate, 'yyyy-MM-dd'),
      format(today, 'yyyy-MM-dd')
    ),
    fetchLocHrly(coords),
    fetchSoilDataViaSoapProxy(
      coords.join(' '),
      constants.bucketDepth,
      constants.topBucket,
      constants.bottomBucket()
    ),
  ]);

  return { etData, tempPrcpData, locHrly, buckets };
};

export default fetchData;

import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControlLabel,
  Switch,
  TextField
} from '@mui/material';

import Loading from './Components/Loading';
import Chart from './Components/Chart';

import fetchData from './Scripts/fetchData';
import calcSoilTemps from './Scripts/calcSoilTemps';
import calcEmergences from './Scripts/calcEmergences';

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



export default function App() {
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [loc, setLoc] = useState([-75.45499, 38.63609]);
  // eslint-disable-next-line no-unused-vars
  const [year, setYear] = useState(2022);
  const [soilTemps, setSoilTemps] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [emergences, setEmergences] = useState({
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
  });
  const [tillDate, setTillDate] = useState('2022-03-01');
  const [useTillDate, setUseTillDate] = useState(false);
  const [etWarning, setETWarning] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const rawData = await fetchData(loc, year, constants);
      const newSoilTemps = await calcSoilTemps(year, rawData.etData, rawData.tempPrcpData, rawData.buckets, constants);
      setSoilTemps(newSoilTemps);
      setETWarning(rawData.etData === null);
      setLoading(false);
    })();
  }, [loc, year]);

  useEffect(() => {
    if (Object.keys(soilTemps).length > 0) {
      setEmergences(calcEmergences(soilTemps, 'two', useTillDate ? tillDate : null));
    }
  }, [soilTemps, useTillDate, tillDate]);


  return (
    <Box>
      <Box sx={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>Testing in progress...</Box>

      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: 3
      }}>
        <FormControlLabel
          control={
            <Switch
              checked={useTillDate}
              onChange={(e) => setUseTillDate(e.target.checked)}
            />
          }
          labelPlacement='start'
          label='Till event?'
        />
        <TextField
          type='date'
          value={tillDate}
          onChange={(e) => setTillDate(e.target.value)}
          disabled={!useTillDate}
          sx={{ width: 250 }}
        />
      </Box>

      {etWarning && <Box style={{ color: 'red' }}>Warning: Evapotranspiration data was unavailable for this location/time. As a results, the displayed data are not accurate.</Box>}

      {loading ? <Loading /> :
        <>
          <Chart
            categories={soilTemps.dates}
            series={[{
              data: emergences.nrcc.pigweed,
              name: 'Pigweed'
            },{
              data: emergences.nrcc.ragweed,
              name: 'Ragweed'
            },{
              data: emergences.nrcc.velvetLeaf,
              name: 'Velvet Leaf'
            },{
              data: emergences.nrcc.foxtail,
              name: 'Foxtail'
            },{
              data: emergences.nrcc.lambsquarter,
              name: 'Lambsquarter'
            }]}
            options={{
              title: {
                text: 'NRCC Weed Emergence Models'
              }
            }}
          />

          <Chart
            categories={soilTemps.dates}
            series={[{
              data: emergences.weedcast.pigweed,
              name: 'Pigweed'
            },{
              data: emergences.weedcast.ragweed,
              name: 'Ragweed'
            },{
              data: emergences.weedcast.velvetLeaf,
              name: 'Velvet Leaf'
            },{
              data: emergences.weedcast.largeCrabgrass,
              name: 'Large Crabgrass'
            },{
              data: emergences.weedcast.foxtail,
              name: 'Foxtail'
            },{
              data: emergences.weedcast.lambsquarter,
              name: 'Lambsquarter'
            }]}
            options={{
              title: {
                text: 'Weedcast Weed Emergence Models'
              }
            }}
          />
        </>
      }
    </Box>
  );
}
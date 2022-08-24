import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';


import Loading from './Components/Loading';
import Chart from './Components/Chart';
import DataWarning from './Components/DataWarning';
import OptionsPanel from './Components/OptionsPanel';

import fetchData from './Scripts/fetchData';
import calcSoilTemps from './Scripts/calcSoilTemps';
import calcEmergences from './Scripts/calcEmergences';

import { name } from './Components/LocationPicker/LocationVariables';

import {
  constants,
  chartOptions,
  chartStyle,
  initEmergences
} from './AppConfigs';
import Highcharts from 'highcharts';




export default function App() {
  const [selected, setSelected] = useState(JSON.parse(localStorage.getItem(`${name}.selected`)) || '');
  const [locations, setLocations] = useState(() => {
    const stored = localStorage.getItem(`${name}.locations`);
    return stored ? JSON.parse(stored) : {};
  });
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(2022);
  const [soilTemps, setSoilTemps] = useState({});
  const [emergences, setEmergences] = useState(initEmergences);
  const [tillDates, setTillDates] = useState([]);
  const [etWarning, setETWarning] = useState(false);
  const [showOptions, setShowOptions] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const currLoc = locations[selected];
        const rawData = await fetchData([currLoc.lng, currLoc.lat], year, constants);
        const newSoilTemps = await calcSoilTemps(year, rawData.etData, rawData.tempPrcpData, rawData.buckets, constants);
        setSoilTemps(newSoilTemps);
        setETWarning(rawData.etData === null);
      } catch {
        setSoilTemps({});
        setETWarning(true);
      }
      setLoading(false);
    })();
  }, [selected, year]);

  useEffect(() => {
    if (Object.keys(soilTemps).length > 0) {
      setEmergences(calcEmergences(soilTemps, 'two', tillDates));
    } else {
      setEmergences(initEmergences);
    }
  }, [soilTemps, tillDates]);

  useEffect(() => {
    for (var i = 0; i < Highcharts.charts.length; i++) {
      if (Highcharts.charts[i] !== undefined) {
        Highcharts.charts[i].reflow();
      }
    }
  }, [showOptions]);


  return (
    <Box sx={{
      backgroundColor: 'rgb(240,240,240)',
      height: '100vh'
    }}>
      {/* <Box sx={{
        color: 'rgb(200,0,0)',
        fontSize: '14px',
        fontStyle: 'italic',
        textAlign: 'center',
        backgroundColor: 'rgba(200,0,0,0.2)',
        padding: '8px 0px',
        borderBottom: '1px solid rgba(200,0,0,0.1)',
        marginLeft: showOptions ? '175px' : 0
      }}>
        Development in progress...
      </Box> */}

      <OptionsPanel
        selected={selected}
        setSelected={setSelected}
        locations={locations}
        setLocations={setLocations}
        year={year}
        setYear={setYear}
        tillDates={tillDates}
        setTillDates={setTillDates}
        soilTemps={soilTemps}
        show={showOptions}
        setShow={setShowOptions}
      />
        
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100vh',
        minHeight: 860,
        width: `calc(100% - ${showOptions ? '200' : 0}px)`,
        margin: showOptions ? '0px 0px 0px 200px' : '0 auto',
        backgroundColor: 'rgb(240,240,240)',
        '@media (max-width: 600px)': {
          width: '100%',
          margin: '0 auto'
        }
      }}>
        {etWarning && <DataWarning />}
        {loading ? <Loading /> :
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
          }}>
            <Box sx={{
              boxSizing: 'border-box',
              padding: '15px',
              maxWidth: 1400,
              width: '100%',
              margin: '0 auto'
            }}>
              <Chart
                categories={Object.keys(soilTemps).length > 0 ? soilTemps.dates : []}
                series={[{
                  data: emergences.nrcc.foxtail,
                  name: 'Foxtail'
                },{
                  data: emergences.nrcc.lambsquarter,
                  name: 'Lambsquarter'
                },{
                  data: emergences.nrcc.pigweed,
                  name: 'Pigweed'
                },{
                  data: emergences.nrcc.ragweed,
                  name: 'Ragweed'
                },{
                  data: emergences.nrcc.velvetLeaf,
                  name: 'Velvet Leaf'
                }]}
                options={{
                  ...chartOptions(year),
                  colors: ['#D9ED92', '#99D98C', '#34A0A4', '#1A759F', '#184E77'],
                  subtitle: {
                    text: 'NRCC Weed Emergence Models',
                  }
                }}
                sx={chartStyle}
              />
            </Box>
            <Box sx={{
              boxSizing: 'border-box',
              padding: '15px',
              maxWidth: 1400,
              width: '100%',
              margin: '0 auto'
            }}>
              <Chart
                categories={Object.keys(soilTemps).length > 0 ? soilTemps.dates : []}
                series={[{
                  data: emergences.weedcast.foxtail,
                  name: 'Foxtail'
                },{
                  data: emergences.weedcast.lambsquarter,
                  name: 'Lambsquarter'
                },{
                  data: emergences.weedcast.largeCrabgrass,
                  name: 'Large Crabgrass'
                },{
                  data: emergences.weedcast.pigweed,
                  name: 'Pigweed'
                },{
                  data: emergences.weedcast.ragweed,
                  name: 'Ragweed'
                },{
                  data: emergences.weedcast.velvetLeaf,
                  name: 'Velvet Leaf'
                }]}
                options={{
                  ...chartOptions(year),
                  colors: ['#D9ED92', '#99D98C', '#52B69A', '#34A0A4', '#1A759F', '#184E77'],
                  subtitle: {
                    text: 'Weedcast Weed Emergence Models'
                  }
                }}
                sx={chartStyle}
              />
            </Box>
          </Box>
        }
      </Box>
    </Box>
  );
}
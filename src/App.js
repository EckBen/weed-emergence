import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

import Charts from './Components/Charts';

import OptionsPanel from './Components/OptionsPanel';
import LocationPicker from './Components/LocationPicker/LocationPicker';
import { name } from './Components/LocationPicker/LocationVariables';

import fetchData from './Scripts/fetchData';
import calcSoilTemps from './Scripts/calcSoilTemps';
import { calcEmergences, createInitEmergencesObj, createInitShowWeedsObj } from './Scripts/weedModels';

import {
  constants,
  defaultId,
  defaultLocation,
} from './AppConfigs';
import Highcharts from 'highcharts';
import { calcVwcAndSoilTemp } from './Scripts/vwcAndSoilTemp';


const today = new Date();
const latestSeason = today.getFullYear() - (today.getMonth() < 2 ? 1 : 0);

export default function App() {
  const [selected, setSelected] = useState(
    JSON.parse(localStorage.getItem(`${name}.selected`)) || defaultId
  );
  const [locations, setLocations] = useState(() => {
    const stored = localStorage.getItem(`${name}.locations`);
    return stored ? JSON.parse(stored) : defaultLocation;
  });
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(latestSeason);
  const [soilTemps, setSoilTemps] = useState({});
  const [emergences, setEmergences] = useState(createInitEmergencesObj());
  const [tillDates, setTillDates] = useState([]);
  const [etWarning, setETWarning] = useState(false);
  const [showOptions, setShowOptions] = useState(window.innerWidth >= 700);
  const [showCharts, setShowCharts] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [showWeeds, setShowWeeds] = useState(createInitShowWeedsObj(true));
  const [calculatedSoilTexture, setCalculatedSoilTexture] = useState('');
  const [selectedSoilTexture, setSelectedSoilTexture] = useState('');
  const [wdmData, setWDMData] = useState(null);

  // Updates data when new location or time frame are selected
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const currLoc = locations[selected];

        const { etData, tempPrcpData, locHrly, buckets, weatherData } = await fetchData(
          [currLoc.lng, currLoc.lat],
          year,
          today,
          constants
        );

        const newSoilTemps = calcSoilTemps(
          year,
          etData,
          tempPrcpData,
          locHrly,
          buckets,
          constants
        );


        // console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!${year} ${buckets.texture}!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
        // console.log(weatherData.dates);
        // console.log('------------Original---------------');
        // console.log('VWCs: ', newSoilTemps.topVwc);
        // console.log('Soil Temps: ', newSoilTemps.two.map(tempF => (tempF - 32) * (5 / 9)));
        // console.log('Emergence: ', calcEmergences(newSoilTemps, 'two', buckets.texture).mohsen.ragweed);
        // console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

        
        setSoilTemps(newSoilTemps);
        setWDMData({ buckets, weatherData });
        setSelectedSoilTexture(buckets.texture);
        setCalculatedSoilTexture(buckets.texture);
        setETWarning(etData === null);
      } catch (e) {
        console.error(e);
        setSoilTemps({});
        setETWarning(true);
      }
      setLoading(false);
    })();
  }, [selected, year]);

  // Calculates new emergences when data or till events change
  useEffect(() => {
    if (wdmData) {
      const { buckets, weatherData } = wdmData;
      
      const vwcsAndSoilTemps = calcVwcAndSoilTemp(
        weatherData,
        buckets.vwcAndTempValues,
        selectedSoilTexture,
        constants,
        0
      );

      console.log(buckets);

      console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!${year}!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
      console.log('------------Water Deficit---------------');
      console.log('Dates: ', vwcsAndSoilTemps.dates);
      console.log('VWCs: ', vwcsAndSoilTemps.vwcs);
      console.log('Soil Temps: ', vwcsAndSoilTemps.soilTempC);
      const output = calcEmergences({ two: vwcsAndSoilTemps.soilTempC, dates: vwcsAndSoilTemps.dates, topVwc: vwcsAndSoilTemps.vwcs }, 'two', selectedSoilTexture, false);
      Object.entries(output.mohsen).forEach(([name, arr]) => console.log(name, arr));
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    }
    
    
    
    if (Object.keys(soilTemps).length > 0 && selectedSoilTexture) {
      // console.log('fire calc emergences');
      setEmergences(calcEmergences(soilTemps, 'two', selectedSoilTexture));
      // setEmergences(calcEmergences(soilTemps, 'two', selectedSoilTexture, tillDates));
    } else {
      setEmergences(createInitEmergencesObj());
    }
  }, [soilTemps, wdmData, selectedSoilTexture, tillDates]);

  // Ensures that charts fill parent div after options panel opens or closes
  useEffect(() => {
    for (var i = 0; i < Highcharts.charts.length; i++) {
      if (Highcharts.charts[i] !== undefined) {
        Highcharts.charts[i].reflow();
      }
    }
  }, [showOptions]);

  // Coordinates showing and hiding overlays
  const handleShow = (showThis = '') => {
    let opts = showOptions,
      add = showAddressSearch,
      charts = showCharts;
    if (showThis === 'options') {
      opts = true;
      add = false;
    } else if (showThis === 'addressSearch') {
      opts = false;
      add = true;
    } else if (showThis === 'charts') {
      charts = true;
      add = false;
    } else if (showThis === 'map') {
      charts = false;
    } else {
      opts = false;
      add = false;
    }
    setShowOptions(opts);
    setShowAddressSearch(add);
    setShowCharts(charts);
  };

  // Main function for managing locations in state
  const handleChangeLocations = (action, location) => {
    let newLocations = { ...locations };
    let newSelected = selected;
    // Adds timestamp ID to location object and adds it to state
    if (action === 'add') {
      location.id = String(Date.now());
      newLocations[location.id] = { ...location, id: location.id };
    }

    // Removes given location object from state
    if (action === 'remove') {
      delete newLocations[location.id];
    }

    // Handles changing the current location selected in state
    if (action === 'add' || action === 'change') {
      newSelected = location.id;
      handleShow('charts');
    }

    // Handle persisting changes in localStorage and updating state
    localStorage.setItem(`${name}.selected`, JSON.stringify(newSelected));
    localStorage.setItem(`${name}.locations`, JSON.stringify(newLocations));
    setSelected(newSelected);
    setLocations(newLocations);
  };

  const handleToggleWeed = (weedName) => {
    let newShowWeeds;
    if (weedName === 'all') {
      newShowWeeds = createInitShowWeedsObj(true);
    } else if (weedName === 'none') {
      newShowWeeds = createInitShowWeedsObj(false);
    } else {
      newShowWeeds = { ...showWeeds };
      newShowWeeds[weedName] = !newShowWeeds[weedName];
    }
    setShowWeeds(newShowWeeds);
  };

  return (
    <Box
      sx={{
        backgroundColor: 'rgb(240,240,240)',
        height: '100vh',
      }}
    >
      <OptionsPanel
        location={locations[selected].address}
        today={today}
        latestSeason={latestSeason}
        year={year}
        setYear={setYear}
        tillDates={tillDates}
        setTillDates={setTillDates}
        soilTemps={soilTemps}
        show={showOptions}
        setShow={handleShow}
        showCharts={showCharts}
        handleToggleWeed={handleToggleWeed}
        showWeeds={showWeeds}
        soilTexture={{
          calc: calculatedSoilTexture,
          user: selectedSoilTexture,
          handleChangeSelected: setSelectedSoilTexture
        }}
      />

      <LocationPicker
        selected={selected}
        locations={locations}
        newLocationsCallback={(s, l) => handleChangeLocations(s, l)}
        modalZIndex={1}
        showAddressSearch={showAddressSearch}
        setShow={handleShow}
      />

      {showCharts && (
        <Charts
          loading={loading}
          etWarning={etWarning}
          emergences={emergences}
          showOptions={showOptions}
          soilTemps={soilTemps}
          latestSeason={latestSeason}
          year={year}
          tillDates={tillDates}
          showWeeds={showWeeds}
        />
      )}
    </Box>
  );
}

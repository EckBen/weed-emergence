import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

import Charts from './Components/Charts';

import OptionsPanel from './Components/OptionsPanel';
import LocationPicker from './Components/LocationPicker/LocationPicker';
import { name } from './Components/LocationPicker/LocationVariables';

import fetchData from './Scripts/fetchData';
import calcSoilTemps from './Scripts/calcSoilTemps';
import calcEmergences from './Scripts/calcEmergences';

import {
  constants,
  initEmergences,
  defaultId,
  defaultLocation
} from './AppConfigs';
import Highcharts from 'highcharts';



export default function App() {
  const [selected, setSelected] = useState(JSON.parse(localStorage.getItem(`${name}.selected`)) || defaultId);
  const [locations, setLocations] = useState(() => {
    const stored = localStorage.getItem(`${name}.locations`);
    return stored ? JSON.parse(stored) : defaultLocation;
  });
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(2022);
  const [soilTemps, setSoilTemps] = useState({});
  const [emergences, setEmergences] = useState(initEmergences);
  const [tillDates, setTillDates] = useState([]);
  const [etWarning, setETWarning] = useState(false);
  const [showOptions, setShowOptions] = useState(window.innerWidth >= 700);
  const [showCharts, setShowCharts] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);

  // Updates data when new location or time frame are selected
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const currLoc = locations[selected];
        const rawData = await fetchData([currLoc.lng, currLoc.lat], year, constants);
        const newSoilTemps = await calcSoilTemps(year, rawData.etData, rawData.tempPrcpData, rawData.locHrly, rawData.buckets, constants);
        setSoilTemps(newSoilTemps);
        setETWarning(rawData.etData === null);
      } catch {
        setSoilTemps({});
        setETWarning(true);
      }
      setLoading(false);
    })();
  }, [selected, year]);

  // Calculates new emergences when data or till events change
  useEffect(() => {
    if (Object.keys(soilTemps).length > 0) {
      setEmergences(calcEmergences(soilTemps, 'two', tillDates));
    } else {
      setEmergences(initEmergences);
    }
  }, [soilTemps, tillDates]);

  // Ensures that charts fill parent div after options panel opens or closes
  useEffect(() => {
    for (var i = 0; i < Highcharts.charts.length; i++) {
      if (Highcharts.charts[i] !== undefined) {
        Highcharts.charts[i].reflow();
      }
    }
  }, [showOptions]);

  // Coordinates showing and hiding overlays
  const handleShow = (showThis='') => {
    let opts = showOptions, add = showAddressSearch, charts = showCharts;
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
    let newLocations = {...locations};
    let newSelected = selected;
    // Adds timestamp ID to location object and adds it to state
    if (action === 'add') {
      location.id = String(Date.now());
      newLocations[location.id] = { ...location, id: location.id};
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


  return (
    <Box sx={{
      backgroundColor: 'rgb(240,240,240)',
      height: '100vh'
    }}>
      <OptionsPanel
        location={locations[selected].address}
        year={year}
        setYear={setYear}
        tillDates={tillDates}
        setTillDates={setTillDates}
        soilTemps={soilTemps}
        show={showOptions}
        setShow={handleShow}
      />

      <LocationPicker
        selected={selected}
        locations={locations}
        newLocationsCallback={(s, l) => handleChangeLocations(s, l)}
        modalZIndex={1}
        showAddressSearch={showAddressSearch}
        setShow={handleShow}
      />

      {showCharts &&
        <Charts
          loading={loading}
          etWarning={etWarning}
          emergences={emergences}
          showOptions={showOptions}
          soilTemps={soilTemps}
          year={year}
          setShow={handleShow}
          tillDates={tillDates}
        />
      } 
    </Box>
  );
}
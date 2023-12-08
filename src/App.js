/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Highcharts from 'highcharts';
import { format } from 'date-fns';

import Charts from './Components/Charts';
import OptionsPanel from './Components/OptionsPanel';
import LocationPicker from './Components/LocationPicker/LocationPicker';
import { name } from './Components/LocationPicker/LocationVariables';

import { fetchSoilDataViaPostRest, calcVwcAndSoilTemp } from './Scripts/soil';
import { getWeatherData } from './Scripts/weather';
import { calcEmergences, createInitEmergencesObj, createInitShowWeedsObj } from './Scripts/weedModels';

import {
  constants,
  defaultId,
  defaultLocation,
} from './AppConfigs';


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
  const [emergences, setEmergences] = useState(createInitEmergencesObj());
  const [tillDates, setTillDates] = useState([]);
  const [etWarning, setETWarning] = useState(false);
  const [showOptions, setShowOptions] = useState(window.innerWidth >= 700);
  const [showCharts, setShowCharts] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [showWeeds, setShowWeeds] = useState(createInitShowWeedsObj(true));
  const [calculatedSoilTexture, setCalculatedSoilTexture] = useState('');
  const [selectedSoilTexture, setSelectedSoilTexture] = useState('');
  const [modelData, setModelData] = useState(null);

  // Updates data when new location or time frame are selected
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const currLoc = locations[selected];

        const [soilComposition, weatherData] = await Promise.all([
          fetchSoilDataViaPostRest(`${currLoc.lng} ${currLoc.lat}`, 0, 36),
          getWeatherData(currLoc, year + '-' + format(today, 'MM-dd'))
        ]);

        setModelData({ soilComposition, weatherData });

        if (selectedSoilTexture && calculatedSoilTexture && (selectedSoilTexture === calculatedSoilTexture)) {
          setSelectedSoilTexture(soilComposition.texture);
        }
        setCalculatedSoilTexture(soilComposition.texture);
        setETWarning(weatherData === null);
      } catch (e) {
        console.error(e);
        setModelData(null);
        setETWarning(true);
      }
      setLoading(false);
    })();
  }, [selected, year]);

  // Calculates new emergences when data or till events change
  useEffect(() => {
    if (modelData && selectedSoilTexture) {
      try {
        const { soilComposition, weatherData } = modelData;
        
        const vwcsAndSoilTemps = calcVwcAndSoilTemp(
          weatherData,
          soilComposition,
          selectedSoilTexture,
          constants,
          0
        );

        if (!vwcsAndSoilTemps) throw new Error('Could not calculate VWCs and soil temperatures');
        const newEmergences = calcEmergences(vwcsAndSoilTemps, selectedSoilTexture);
        // const newEmergences = calcEmergences(vwcsAndSoilTemps, selectedSoilTexture, tillDates);

        setEmergences(newEmergences);
      } catch (e) {
        console.error(e);
        setEmergences(createInitEmergencesObj());
      }
    } else {
      setEmergences(createInitEmergencesObj());
    }
  }, [modelData, selectedSoilTexture, tillDates]);

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
        tillRange={(modelData && modelData.weatherData) ? [modelData.weatherData.dates[0], modelData.weatherData.dates[modelData.weatherData.dates.length - 1]] : null}
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
          categories={(modelData && modelData.weatherData) ? modelData.weatherData.dates : []}
          latestSeason={latestSeason}
          year={year}
          tillDates={tillDates}
          showWeeds={showWeeds}
        />
      )}
    </Box>
  );
}

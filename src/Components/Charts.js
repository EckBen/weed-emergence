import React from 'react';
import PropTypes from 'prop-types';

import { Box, Button } from '@mui/material';

import Loading from './Loading';
import Chart from './Chart';
import ChartContainer from './ChartContainer';

import { chartOptions } from '../AppConfigs';

// Inputs: arr- Array, targetLength- number, fillValue- any value valid to place in an Array, append- optional, boolean, defaults to true
// Adds targetLength number of fillValue to beginning or end (determined by optional append bollean) of arr
function fillWith(arr, targetLength, fillValue, append=true) {
  const diff = targetLength - arr.length;
  if (diff <= 0) return arr;

  const newPortion = new Array(diff).fill(fillValue);
  return append ? arr.concat(newPortion) : newPortion.concat(arr);
}

function constructSeries(model, names, data) {
  return names.map(([name, color]) => {
    const nameParts = name.split(' ');
    nameParts[0] = nameParts[0].toLowerCase();
    const id = nameParts.join('');
    const thisData = data[model][id]; 

    return [{
      data: thisData.slice(0,-2),
      name,
      color,
      id: model + '-' + id,
      isForecast: false
    },{
      data: fillWith(thisData.slice(-2), thisData.length, null, false),
      name,
      color,
      dashStyle: 'ShortDot',
      linkedTo: model + '-' + id,
      isForecast: true
    }];
  }).reduce((acc, arr) => acc.concat(arr), []);
}



export default function Charts({ loading, etWarning, emergences, showOptions, soilTemps, year, setShow, tillDates }) {
  const categories = Object.keys(soilTemps).length > 0 ? soilTemps.dates : [];
  const plotLines = tillDates.map(date => {
    return {
      className: 'tillLine',
      value: categories.findIndex(el => el === date),
      width: 2,
      color: 'rgb(237, 142, 0)',
      label: {
        text: 'Till Event',
        style: {
          fontSize: 10
        }
      }
    };
  });

  const chartSx = {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: 'translateX(calc(-50% - 260px))',
    zIndex: 4,
    '@media (max-width: 850px)': {
      top: showOptions ? 34 : 10,
      left: showOptions ? 40 : '50%',
      transform: showOptions ? 'translateX(0px)' : 'translateX(calc(-50% - 260px))'
    },
    '@media (max-width: 768px)': {
      top: showOptions ? 54 : 10
    },
    '@media (max-width: 700px)': {
      top: showOptions ? 54 : 34,
      left: 40,
      transform: 'translateX(0px)'
    },
    '@media (max-width: 568px)': {
      top: 54
    },
    '@media (max-width: 358px)': {
      display: 'flex',
      flexDirection: 'column',
      left: 20,
      top: 10
    }
  };
  
  const nrccWeeds = [
    ['Foxtail', '#D9ED92'],
    ['Lambsquarter', '#99D98C'],
    ['Pigweed', '#34A0A4'],
    ['Ragweed', '#1A759F'],
    ['Velvet Leaf', '#184E77']
  ];
  const nrccSeries = constructSeries('nrcc', nrccWeeds, emergences);

  const weedcastWeeds = [
    ['Foxtail', '#D9ED92'],
    ['Lambsquarter', '#99D98C'],
    ['Large Crabgrass', '#52B69A'],
    ['Pigweed', '#34A0A4'],
    ['Ragweed', '#1A759F'],
    ['Velvet Leaf', '#184E77']
  ];
  const weedcastSeries = constructSeries('weedcast', weedcastWeeds, emergences);

  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100vh',
        minHeight: 860,
        width: `calc(100% - ${showOptions ? '200' : 0}px)`,
        paddingLeft: showOptions ? 200 : 0,
        backgroundColor: 'rgb(240,240,240)',
        zIndex: 2,
        '@media (max-width: 600px)': {
          width: '100%',
          margin: '0 auto',
          transition: 'width 0s ease'
        }
      }}
    >
      {loading ? <Loading /> :
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-evenly',
          width: '100%',
          height: '100%'
        }}>
          <Button
            sx={{
              margin: '0 auto',
              width: 'fit-content',
              fontSize: 12,
              backgroundColor: 'rgb(237, 142, 0)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgb(207, 112, 0)'
              }
            }}
            onClick={() => setShow('map')}
          >Hide Charts</Button>

          <ChartContainer
            showWarning={etWarning}
            showInfo={plotLines.length > 0}
            sx={chartSx}
          >
            <Chart
              categories={categories}
              series={nrccSeries}
              options={{
                ...chartOptions(year),
                subtitle: {
                  text: 'NRCC Weed Emergence Models',
                },
                xAxis: { plotLines }
              }}
            />
          </ChartContainer>

          <ChartContainer
            showWarning={etWarning}
            showInfo={plotLines.length > 0}
            sx={chartSx}
          >
            <Chart
              categories={categories}
              series={weedcastSeries}
              options={{
                ...chartOptions(year),
                subtitle: {
                  text: 'Weedcast Weed Emergence Models'
                },
                xAxis: { plotLines }
              }}
            />
          </ChartContainer>
        </Box>
      }
    </Box>
  );
}

Charts.propTypes = {
  loading: PropTypes.bool,
  etWarning: PropTypes.bool,
  emergences: PropTypes.object,
  soilTemps: PropTypes.object,
  year: PropTypes.number,
  showOptions: PropTypes.bool,
  setShow: PropTypes.func,
  tillDates: PropTypes.array
};
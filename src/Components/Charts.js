import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';

import Loading from './Loading';
import Chart from './Chart';
import ChartContainer from './ChartContainer';

import { chartOptions } from '../AppConfigs';
import { constructSeries, models } from '../Scripts/weedModels';







export default function Charts({ loading, etWarning, emergences, showOptions, categories, latestSeason, year, tillDates, showWeeds }) {
  let lastTillIdx = 0;
  const plotLines = tillDates.map(date => {
    const value = categories.findIndex(el => el === date);
    if (value > lastTillIdx) lastTillIdx = value;
    
    return {
      className: 'tillLine',
      value,
      width: 2,
      color: 'rgb(237, 142, 0)',
      label: {
        text: 'Till Event',
        style: {
          fontSize: 10
        },
        verticalAlign: 'bottom',
        y: -60
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
  
  const isThisYear = latestSeason === year;
  const series = constructSeries(emergences, isThisYear, showWeeds, lastTillIdx);
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        // height: '100vh',
        // minHeight: 860,
        minHeight: '100vh',
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
          height: '100%',
          overflow: 'auto'
        }}>
          {models.map(model => 
            <ChartContainer
              key={model}
              showWarning={etWarning}
              showInfo={plotLines.length > 0}
              sx={chartSx}
            >
              <Chart
                categories={categories}
                series={series[model]}
                options={{
                  ...chartOptions(year),
                  subtitle: {
                    text: `${model} Weed Emergence Models`,
                  },
                  xAxis: { plotLines }
                }}
              />
            </ChartContainer>
          )}
        </Box>
      }
    </Box>
  );
}

Charts.propTypes = {
  loading: PropTypes.bool,
  etWarning: PropTypes.bool,
  emergences: PropTypes.object,
  categories: PropTypes.array,
  latestSeason: PropTypes.number,
  year: PropTypes.number,
  showOptions: PropTypes.bool,
  tillDates: PropTypes.array,
  showWeeds: PropTypes.object
};
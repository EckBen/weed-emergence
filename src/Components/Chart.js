import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';


import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
NoDataToDisplay(Highcharts);



export default function Chart({ categories, series, options }) {
  const chartComponent = useRef(null);
  
  return (
    <Box sx={{
      position: 'relative',
      paddingTop: '60px',
      height: 500,
      width: '100%'
    }}>
      <HighchartsReact
        ref={chartComponent}
        highcharts={Highcharts}
        options={{
          credits: { enabled: false },
          chart: {
            zoomType: 'x'
          },
          plotOptions: {
            line: {
              marker: {
                symbol: 'circle',
                radius: 3
              }
            }
          },
          series,
          tooltip: {
            shared: true
          },
          xAxis: {
            categories: categories
          },
          ...options
        }}
      />
    </Box>
  );
}

Chart.propTypes = {
  categories: PropTypes.array,
  series: PropTypes.array,
  options: PropTypes.object
};
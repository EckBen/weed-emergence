import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';


import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import { parseISO, format } from 'date-fns';
NoDataToDisplay(Highcharts);



export default function Chart({ categories, series, options, sx }) {
  const chartComponent = useRef(null);

  return (
    <Box sx={{
      position: 'relative',
      height: 400,
      width: '100%',
      ...sx
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
            categories: categories,
            labels: {
              formatter: function() {
                let label = this.axis.defaultLabelFormatter.call(this);
                try {
                  return format(parseISO(label), 'MMM d');
                } catch {
                  return label;
                }
              }
            },
            crosshair: true
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
  options: PropTypes.object,
  sx: PropTypes.object
};
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, LinearGradient, Stop, Defs, Polyline, Circle } from 'react-native-svg';
import { useTheme } from '@/app/providers/ThemeProvider';

interface ChartData {
  date: string;
  views: number;
  contacts: number;
}

interface AnalyticsChartProps {
  data: ChartData[];
  height?: number;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ 
  data, 
  height = 200 
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width - 64; // Accounting for padding
  
  if (!data || data.length === 0) return null;

  const maxViews = Math.max(...data.map(d => d.views));
  const chartHeight = height - 40;
  
  const getPoints = () => {
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * screenWidth;
      const y = chartHeight - (d.views / maxViews) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
  };

  const getPath = () => {
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * screenWidth;
      const y = chartHeight - (d.views / maxViews) * chartHeight;
      return i === 0 ? `M${x},${y}` : `L${x},${y}`;
    });
    return points.join(' ');
  };

  const getAreaPath = () => {
    const path = getPath();
    return `${path} L${screenWidth},${chartHeight} L0,${chartHeight} Z`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.chartWrapper, { height }]}>
        <Svg width={screenWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.primary.main} stopOpacity="0.2" />
              <Stop offset="1" stopColor={theme.colors.primary.main} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          
          {/* Area under the line */}
          <Path d={getAreaPath()} fill="url(#gradient)" />
          
          {/* Line */}
          <Path
            d={getPath()}
            fill="none"
            stroke={theme.colors.primary.main}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * screenWidth;
            const y = chartHeight - (d.views / maxViews) * chartHeight;
            return (
              <Circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill={theme.colors.surface}
                stroke={theme.colors.primary.main}
                strokeWidth="2"
              />
            );
          })}
        </Svg>
        
        <View style={styles.labelsContainer}>
          {data.map((d, i) => (
            <Text 
              key={i} 
              style={[styles.label, { color: theme.colors.textSecondary }]}
            >
              {d.date}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  chartWrapper: {
    justifyContent: 'flex-end',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

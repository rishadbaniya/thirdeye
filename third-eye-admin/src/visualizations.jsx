import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryLine
} from "victory";

export const BarChart = ({ chart_data, x_label, y_label, headers }) => {
  return (
    <div style={{ height: "600px", width: "100%" }}>
      <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
        <VictoryAxis tickValues={[1, 2, 3, 4]} tickFormat={headers} />
        {/*work on the x data. here it gives ${x}%*/}
        <VictoryAxis dependentAxis tickFormat={(x) => `${x / 1000}%`} />
        <VictoryBar data={chart_data} x={`${x_label}`} y={`${y_label}`} />
      </VictoryChart>
    </div>
  );
};

export const LineChart = ({ chart_data, x_label, y_label, headers }) => {
  return (
    <div style={{ height: "600px", width: "100%" }}>
      <VictoryChart theme={VictoryTheme.material}>
        <VictoryLine data={chart_data} x={"x"} y={"y"} />
      </VictoryChart>
    </div>
  );
};

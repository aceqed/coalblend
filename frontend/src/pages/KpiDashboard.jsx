import PageLayout from "../Layout/pageLayout.jsx"
import { BarChart, LineChart, PieChart } from "lucide-react"

function KpiDashboard() {
  return (
    <PageLayout title="KPI Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center">
          <BarChart className="h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Sales Performance</h3>
          <p className="text-gray-500 text-center">View detailed sales metrics and performance indicators</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center">
          <LineChart className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Growth Trends</h3>
          <p className="text-gray-500 text-center">Analyze growth patterns and market trends</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center">
          <PieChart className="h-12 w-12 text-purple-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Resource Allocation</h3>
          <p className="text-gray-500 text-center">Monitor resource distribution and utilization</p>
        </div>
      </div>
    </PageLayout>
  )
}

export default KpiDashboard

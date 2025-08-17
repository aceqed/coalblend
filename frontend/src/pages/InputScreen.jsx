import PageLayout from "../Layout/pageLayout.jsx"
import { Save, X, Check } from "lucide-react"

function InputScreen() {
  return (
    <PageLayout title="Input Screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-medium mb-4">Material Properties</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter material name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Raw Material</option>
                <option>Processed Material</option>
                <option>Finished Product</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Density (g/cm³)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter density"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Melting Point (°C)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter melting point"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Viscosity (cP)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter viscosity"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">pH Value</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter pH value"
                min="0"
                max="14"
                step="0.1"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Enter any additional information about the material"
            ></textarea>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
            <button className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 ml-auto">
              <Check className="h-4 w-4 mr-2" />
              Submit
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Validation Status</h3>
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-center">
            <Check className="h-5 w-5 mr-2" />
            All input fields are valid
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default InputScreen

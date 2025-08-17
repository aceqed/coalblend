"use client"

import { useState } from "react"
import { ArrowLeft, Download, ChevronDown, ChevronUp } from "lucide-react"

const RunOutput = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("all")
  const [selectedBlends, setSelectedBlends] = useState([0, 1, 2, 3, 4]) // Default select first 5 blends
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" })

  // Sample data for blend results
  const blendResults = [
    {
      id: 1,
      blendPercentage: {
        CDOWN0123B: 12,
        PULCL0323B: 5,
        DAUNIA0922: 17,
        MORAN0323E: 0,
      },
      blendProperties: {
        IM: 0.408,
        VM: 7.401,
        Ash: 2.954,
        FC: 23.153,
        P: 0.015,
        S: 0.147,
        Na2O: 0.098,
      },
      cokeProperties: {
        CSR: 67.5,
        CRI: 23.8,
        M10: 7.2,
      },
      costOfCoal: 185.32,
      viu: 92.4,
    },
    {
      id: 2,
      blendPercentage: {
        CDOWN0123B: 12,
        PULCL0323B: 12,
        DAUNIA0922: 12,
        MORAN0323E: 0,
      },
      blendProperties: {
        IM: 0.408,
        VM: 7.83,
        Ash: 3.198,
        FC: 24.48,
        P: 0.014,
        S: 0.142,
        Na2O: 0.109,
      },
      cokeProperties: {
        CSR: 68.2,
        CRI: 22.5,
        M10: 7.0,
      },
      costOfCoal: 187.65,
      viu: 93.1,
    },
    {
      id: 3,
      blendPercentage: {
        CDOWN0123B: 9,
        PULCL0323B: 13,
        DAUNIA0922: 15,
        MORAN0323E: 0,
      },
      blendProperties: {
        IM: 0.43,
        VM: 8.049,
        Ash: 3.246,
        FC: 25.212,
        P: 0.015,
        S: 0.141,
        Na2O: 0.106,
      },
      cokeProperties: {
        CSR: 67.8,
        CRI: 23.1,
        M10: 7.3,
      },
      costOfCoal: 182.47,
      viu: 91.8,
    },
    {
      id: 4,
      blendPercentage: {
        CDOWN0123B: 6,
        PULCL0323B: 6,
        DAUNIA0922: 31,
        MORAN0323E: 0,
      },
      blendProperties: {
        IM: 0.554,
        VM: 9.365,
        Ash: 3.599,
        FC: 29.44,
        P: 0.02,
        S: 0.176,
        Na2O: 0.105,
      },
      cokeProperties: {
        CSR: 66.9,
        CRI: 24.2,
        M10: 7.5,
      },
      costOfCoal: 179.83,
      viu: 90.5,
    },
    {
      id: 5,
      blendPercentage: {
        CDOWN0123B: 10,
        PULCL0323B: 21,
        DAUNIA0922: 20,
        MORAN0323E: 0,
      },
      blendProperties: {
        IM: 0.59,
        VM: 11.092,
        Ash: 4.477,
        FC: 34.771,
        P: 0.019,
        S: 0.186,
        Na2O: 0.144,
      },
      cokeProperties: {
        CSR: 65.7,
        CRI: 25.8,
        M10: 7.9,
      },
      costOfCoal: 176.21,
      viu: 89.3,
    },
    {
      id: 6,
      blendPercentage: {
        CDOWN0123B: 30,
        PULCL0323B: 5,
        DAUNIA0922: 17,
        MORAN0323E: 0,
      },
      blendProperties: {
        IM: 0.588,
        VM: 11.316,
        Ash: 4.655,
        FC: 35.232,
        P: 0.023,
        S: 0.243,
        Na2O: 0.172,
      },
      cokeProperties: {
        CSR: 64.8,
        CRI: 26.5,
        M10: 8.2,
      },
      costOfCoal: 173.95,
      viu: 88.7,
    },
    {
      id: 7,
      blendPercentage: {
        CDOWN0123B: 9,
        PULCL0323B: 42,
        DAUNIA0922: 7,
        MORAN0323E: 0,
      },
      blendProperties: {
        IM: 0.608,
        VM: 12.598,
        Ash: 5.274,
        FC: 39.457,
        P: 0.017,
        S: 0.174,
        Na2O: 0.177,
      },
      cokeProperties: {
        CSR: 63.5,
        CRI: 27.9,
        M10: 8.6,
      },
      costOfCoal: 171.32,
      viu: 87.2,
    },
  ]

  const toggleBlendSelection = (index) => {
    if (selectedBlends.includes(index)) {
      setSelectedBlends(selectedBlends.filter((i) => i !== index))
    } else {
      setSelectedBlends([...selectedBlends, index])
    }
  }

  const handleSort = (key, category) => {
    let direction = "ascending"
    if (sortConfig.key === `${category}.${key}` && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key: `${category}.${key}`, direction })
  }

  const getSortedData = () => {
    if (!sortConfig.key) return blendResults

    return [...blendResults].sort((a, b) => {
      // Parse the key path (e.g., "blendProperties.VM")
      const [category, key] = sortConfig.key.split(".")

      // Get the values to compare
      const aValue = a[category][key]
      const bValue = b[category][key]

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })
  }

  const sortedData = getSortedData()

  const compareOutputs = () => {
    console.log(
      "Comparing selected blends:",
      selectedBlends.map((index) => blendResults[index]),
    )
    // Implement comparison logic or navigation to comparison view
  }

  const downloadOutput = () => {
    console.log("Downloading output")
    // Implement download logic
  }

  const renderSortIcon = (key, category) => {
    const fullKey = `${category}.${key}`
    if (sortConfig.key !== fullKey) {
      return <ChevronDown className="h-3 w-3 text-gray-400" />
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-3 w-3 text-blue-600" />
    ) : (
      <ChevronDown className="h-3 w-3 text-blue-600" />
    )
  }

  return (
    <div className="bg-gray-50 p-3 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-3 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Run Output</h1>
                <p className="text-xs text-gray-600">View and compare blend recommendation results</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={downloadOutput}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Download Output
              </button>
              <button
                onClick={compareOutputs}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1"
              >
                Compare Outputs
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-3">
          <div className="flex border-b border-gray-200 px-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "all"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("blendPercentage")}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "blendPercentage"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Blend Percentage
            </button>
            <button
              onClick={() => setActiveTab("blendProperties")}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "blendProperties"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Blend Properties
            </button>
            <button
              onClick={() => setActiveTab("cokeProperties")}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "cokeProperties"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Coke Properties
            </button>
            <button
              onClick={() => setActiveTab("costOfCoal")}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "costOfCoal"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Cost of Coal
            </button>
            <button
              onClick={() => setActiveTab("viu")}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "viu"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              VIU
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-gray-500 w-10"></th>
                {activeTab === "all" || activeTab === "blendPercentage" ? (
                  <>
                    <th
                      colSpan={Object.keys(blendResults[0].blendPercentage).length}
                      className="px-2 py-2 text-center font-medium text-gray-500 border-b border-gray-200 bg-gray-100"
                    >
                      Blend Percentage(%)
                    </th>
                  </>
                ) : null}
                {activeTab === "all" || activeTab === "blendProperties" ? (
                  <>
                    <th
                      colSpan={Object.keys(blendResults[0].blendProperties).length}
                      className="px-2 py-2 text-center font-medium text-gray-500 border-b border-gray-200 bg-gray-100"
                    >
                      Blend Properties
                    </th>
                  </>
                ) : null}
                {activeTab === "all" || activeTab === "cokeProperties" ? (
                  <>
                    <th
                      colSpan={Object.keys(blendResults[0].cokeProperties).length}
                      className="px-2 py-2 text-center font-medium text-gray-500 border-b border-gray-200 bg-gray-100"
                    >
                      Coke Properties
                    </th>
                  </>
                ) : null}
                {activeTab === "all" || activeTab === "costOfCoal" ? (
                  <>
                    <th className="px-2 py-2 text-center font-medium text-gray-500 border-b border-gray-200 bg-gray-100">
                      Cost of Coal
                    </th>
                  </>
                ) : null}
                {activeTab === "all" || activeTab === "viu" ? (
                  <>
                    <th className="px-2 py-2 text-center font-medium text-gray-500 border-b border-gray-200 bg-gray-100">
                      VIU
                    </th>
                  </>
                ) : null}
              </tr>
              <tr>
                <th className="px-2 py-2 text-left font-medium text-gray-500"></th>
                {activeTab === "all" || activeTab === "blendPercentage"
                  ? Object.keys(blendResults[0].blendPercentage).map((key) => (
                      <th
                        key={key}
                        className="px-2 py-2 text-center font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(key, "blendPercentage")}
                      >
                        <div className="flex items-center justify-center">
                          {key}
                          {renderSortIcon(key, "blendPercentage")}
                        </div>
                      </th>
                    ))
                  : null}
                {activeTab === "all" || activeTab === "blendProperties"
                  ? Object.keys(blendResults[0].blendProperties).map((key) => (
                      <th
                        key={key}
                        className="px-2 py-2 text-center font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(key, "blendProperties")}
                      >
                        <div className="flex items-center justify-center">
                          {key}%{renderSortIcon(key, "blendProperties")}
                        </div>
                      </th>
                    ))
                  : null}
                {activeTab === "all" || activeTab === "cokeProperties"
                  ? Object.keys(blendResults[0].cokeProperties).map((key) => (
                      <th
                        key={key}
                        className="px-2 py-2 text-center font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(key, "cokeProperties")}
                      >
                        <div className="flex items-center justify-center">
                          {key}
                          {renderSortIcon(key, "cokeProperties")}
                        </div>
                      </th>
                    ))
                  : null}
                {activeTab === "all" || activeTab === "costOfCoal" ? (
                  <th
                    className="px-2 py-2 text-center font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("costOfCoal", "")}
                  >
                    <div className="flex items-center justify-center">
                      $/ton
                      {renderSortIcon("costOfCoal", "")}
                    </div>
                  </th>
                ) : null}
                {activeTab === "all" || activeTab === "viu" ? (
                  <th
                    className="px-2 py-2 text-center font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("viu", "")}
                  >
                    <div className="flex items-center justify-center">
                      Index
                      {renderSortIcon("viu", "")}
                    </div>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((blend, index) => (
                <tr
                  key={blend.id}
                  className={`border-b border-gray-100 ${selectedBlends.includes(index) ? "bg-blue-50" : "hover:bg-gray-50"}`}
                >
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selectedBlends.includes(index)}
                      onChange={() => toggleBlendSelection(index)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  {activeTab === "all" || activeTab === "blendPercentage"
                    ? Object.values(blend.blendPercentage).map((value, i) => (
                        <td key={i} className="px-2 py-2 text-center text-gray-800">
                          {value}
                        </td>
                      ))
                    : null}
                  {activeTab === "all" || activeTab === "blendProperties"
                    ? Object.values(blend.blendProperties).map((value, i) => (
                        <td key={i} className="px-2 py-2 text-center text-gray-800">
                          {value.toFixed(3)}
                        </td>
                      ))
                    : null}
                  {activeTab === "all" || activeTab === "cokeProperties"
                    ? Object.values(blend.cokeProperties).map((value, i) => (
                        <td key={i} className="px-2 py-2 text-center text-gray-800">
                          {value.toFixed(1)}
                        </td>
                      ))
                    : null}
                  {activeTab === "all" || activeTab === "costOfCoal" ? (
                    <td className="px-2 py-2 text-center text-gray-800">{blend.costOfCoal.toFixed(2)}</td>
                  ) : null}
                  {activeTab === "all" || activeTab === "viu" ? (
                    <td className="px-2 py-2 text-center text-gray-800">{blend.viu.toFixed(1)}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Blends Summary */}
        <div className="mt-4 bg-white rounded-lg shadow-md border border-gray-200 p-3">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Blends for Comparison</h3>
          <div className="text-xs text-gray-600">
            {selectedBlends.length > 0 ? (
              <p>
                {selectedBlends.length} blend{selectedBlends.length !== 1 ? "s" : ""} selected. Click "Compare Outputs"
                to view detailed comparison.
              </p>
            ) : (
              <p>No blends selected. Select at least one blend to compare.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RunOutput

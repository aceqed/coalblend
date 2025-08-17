"use client"

import { useState } from "react"
import { ArrowLeft, Save } from "lucide-react"

const ModelConfiguration = ({ onBack }) => {
  // Model Configuration tab state
  const [activeConfigTab, setActiveConfigTab] = useState("objective") // objective, controllable, constraints

  // Objective Parameters for Model Configuration
  const [objectiveParameters, setObjectiveParameters] = useState([
    { key: "fc", label: "FC", selected: true, min: "60", max: "75" },
    { key: "maxFluidityLogC", label: "MaxFluidity logC", selected: false, min: "55", max: "300" },
    { key: "ash", label: "Ash", selected: false, min: "1", max: "10" },
    { key: "vm", label: "VM", selected: false, min: "20", max: "40" },
    { key: "k2o", label: "K2O", selected: false, min: "0", max: "2" },
    { key: "phosphorous", label: "Phosphorous", selected: false, min: "0", max: "0.06" },
    { key: "maxFluidity", label: "Max Fluidity", selected: true, min: "55", max: "150" },
    { key: "na2o", label: "Na2O", selected: true, min: "0", max: "2" },
    { key: "hgi", label: "HGI", selected: true, min: "60", max: "150" },
  ])

  // Controllable Parameters (Coal names from blend recommendation)
  const [controllableParameters, setControllableParameters] = useState([
    { key: "russianPCI", label: "Russian PCI", min: "0", max: "100" },
    { key: "bedfordNorth", label: "Bedford North", min: "0", max: "100" },
    { key: "cavalRidge0223", label: "caval ridge (0223)", min: "0", max: "100" },
    { key: "leer", label: "Leer", min: "0", max: "100" },
    { key: "lowVolHardCoking", label: "LOW VOL HARD COKING COAL0123", min: "0", max: "100" },
    { key: "corboroughDowns", label: "Corborough downs GNRE AUSTRALIAN SEMI HARD 0223", min: "0", max: "100" },
    { key: "stanmoreSemi", label: "Stanmore Semi Hard", min: "0", max: "100" },
    { key: "russianPCIPulcl", label: "Russian PCI (PULCL1122F)", min: "0", max: "100" },
  ])

  // Constraints (same as desired properties but with selection)
  const [constraints, setConstraints] = useState([
    { key: "csr", label: "CSR", selected: true, min: "50", max: "100" },
    { key: "m10", label: "M10", selected: false, min: "0", max: "100" },
    { key: "m20", label: "M20", selected: false, min: "90", max: "100" },
    { key: "volatileMatter", label: "Volatile Matter", selected: false, min: "0", max: "1.3" },
    { key: "phosphorus", label: "Phosphorus", selected: false, min: "0", max: "0.08" },
    { key: "cri", label: "CRI", selected: false, min: "0", max: "35" },
    { key: "fc", label: "FC", selected: false, min: "80", max: "100" },
    { key: "sulphur", label: "Sulphur", selected: false, min: "0", max: "0.8" },
    { key: "ash", label: "Ash", selected: false, min: "0", max: "12" }, 
  ])

  const handleObjectiveParameterChange = (index, field, value) => {
    const updated = [...objectiveParameters]
    if (field === "selected") {
      updated[index] = { ...updated[index], [field]: value }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setObjectiveParameters(updated)
  }

  const handleControllableParameterChange = (index, field, value) => {
    const updated = [...controllableParameters]
    updated[index] = { ...updated[index], [field]: value }
    setControllableParameters(updated)
  }

  const handleConstraintChange = (index, field, value) => {
    const updated = [...constraints]
    if (field === "selected") {
      updated[index] = { ...updated[index], [field]: value }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setConstraints(updated)
  }

  const saveConfiguration = () => {
    console.log("Configuration saved:", {
      objectiveParameters,
      controllableParameters,
      constraints,
    })
    // Add your save logic here
    alert("Configuration saved successfully!")
  }

  return (
    <div className="bg-gray-50 p-3 min-h-screen">
      <div className="max-w-6xl mx-auto">
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
                <h1 className="text-lg font-bold text-gray-800">Model Configuration</h1>
                <p className="text-xs text-gray-600">Configure parameters for model optimization</p>
              </div>
            </div>
            <button
              onClick={saveConfiguration}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 text-sm font-medium rounded flex items-center gap-2 shadow-md"
            >
              <Save className="h-4 w-4" />
              Save Configuration
            </button>
          </div>
        </div>

        {/* Model Configuration Content */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Select Parameters for Model Configuration</h2>

          {/* Configuration Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveConfigTab("objective")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeConfigTab === "objective"
                    ? "border-gray-800 text-gray-800"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Objective Parameters
              </button>
              <button
                onClick={() => setActiveConfigTab("controllable")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeConfigTab === "controllable"
                    ? "border-gray-800 text-gray-800"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Controllable Parameters
              </button>
              <button
                onClick={() => setActiveConfigTab("constraints")}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeConfigTab === "constraints"
                    ? "border-gray-800 text-gray-800"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Constraints
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="overflow-x-auto">
            {activeConfigTab === "objective" && (
              <div>
                {/* <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Select the coke properties you want to optimize and set their target ranges.
                  </p>
                </div> */}
                <div className="grid grid-cols-4 gap-4 mb-3 text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                  <div className="flex items-center">
                    <span>Parameter</span>
                  </div>
                  <div></div>
                  <div className="text-center">Min</div>
                  <div className="text-center">Max</div>
                </div>
                <div className="space-y-3">
                  {objectiveParameters.map((param, index) => (
                    <div key={param.key} className="grid grid-cols-4 gap-4 items-center text-sm">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={param.selected}
                          onChange={(e) => handleObjectiveParameterChange(index, "selected", e.target.checked)}
                          className="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium">{param.label}</span>
                      </div>
                      <div></div>
                      <div>
                        <input
                          type="text"
                          value={param.min}
                          onChange={(e) => handleObjectiveParameterChange(index, "min", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={!param.selected}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={param.max}
                          onChange={(e) => handleObjectiveParameterChange(index, "max", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={!param.selected}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeConfigTab === "controllable" && (
              <div>
                {/* <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    The coal names of the respective batch codes present in the blend recommendation screen and their
                    corresponding ranges.
                  </p>
                </div> */}
                <div className="grid grid-cols-3 gap-4 mb-3 text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                  <div>Coal Name</div>
                  <div className="text-center">Min</div>
                  <div className="text-center">Max</div>
                </div>
                <div className="space-y-3">
                  {controllableParameters.map((param, index) => (
                    <div key={param.key} className="grid grid-cols-3 gap-4 items-center text-sm">
                      <div className="text-gray-700 font-medium">{param.label}</div>
                      <div>
                        <input
                          type="text"
                          value={param.min}
                          onChange={(e) => handleControllableParameterChange(index, "min", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={param.max}
                          onChange={(e) => handleControllableParameterChange(index, "max", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeConfigTab === "constraints" && (
              <div>
                {/* <div className="mb-4">
                  <p className="text-sm text-gray-600">We can check or uncheck any objectives as per user choice.</p>
                </div> */}
                <div className="grid grid-cols-4 gap-4 mb-3 text-sm font-medium text-gray-700 border-b border-gray-200 ">
                  <div className="flex items-center">
                    <span>Constraint</span>
                  </div>
                 <div></div>
                  <div className="text-center">Min</div>
                  <div className="text-center">Max</div>
                </div>
                <div className="space-y-1">
                  {constraints.map((constraint, index) => (
                    <div key={constraint.key} className="grid grid-cols-4 gap-4 items-center text-sm">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={constraint.selected}
                          onChange={(e) => handleConstraintChange(index, "selected", e.target.checked)}
                          className="mr-3 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium">{constraint.label}</span>
                      </div>
                      <div></div>
                      <div>
                        <input
                          type="text"
                          value={constraint.min}
                          onChange={(e) => handleConstraintChange(index, "min", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={!constraint.selected}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={constraint.max}
                          onChange={(e) => handleConstraintChange(index, "max", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={!constraint.selected}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModelConfiguration

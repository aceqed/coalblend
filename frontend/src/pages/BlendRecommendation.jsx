"use client";

import { useState } from "react";
import ModelConfiguration from "../pages/ModelConfiguration.jsx";
import PageLayout from "../Layout/pageLayout.jsx";
import RunOutput from "./RunOutput.jsx";
import Dashboard from "../components/Dashboard.jsx";

const BlendRecommendation = () => {
  // View mode state
  const [viewMode, setViewMode] = useState("recommendation"); // recommendation, modelConfig

  // Desired Coke Properties as array of objects
  const [desiredProperties, setDesiredProperties] = useState([
    { key: "csr", label: "CSR", min: "50", max: "100" },
    { key: "cri", label: "CRI", min: "0", max: "35" },
    { key: "vm", label: "VM", min: "0", max: "40" },
    { key: "fc", label: "FC", min: "60", max: "75" },
    { key: "ash", label: "Ash", min: "0", max: "12" },
    { key: "s", label: "S", min: "0", max: "0.8" },
    { key: "p", label: "P", min: "0", max: "0.08" },
    // { key: "sio2", label: "SiO2", min: "0", max: "10" },
    // { key: "al2o3", label: "Al2O3", min: "0", max: "5" },
    // { key: "fe2o3", label: "Fe2O3", min: "0", max: "5" },
    // { key: "cao", label: "CaO", min: "0", max: "5" },
    // { key: "mgo", label: "MgO", min: "0", max: "5" },
    // { key: "na2o", label: "Na2O", min: "0", max: "2" },
    // { key: "k2o", label: "K2O", min: "0", max: "2" },
    // { key: "tio2", label: "TiO2", min: "0", max: "2" },
    // { key: "mn3o4", label: "Mn3O4", min: "0", max: "2" },
    // { key: "so3", label: "SO3", min: "0", max: "2" },
    // { key: "p2o5", label: "P2O5", min: "0", max: "2" },
    // { key: "bao", label: "BaO", min: "0", max: "2" },
    // { key: "sro", label: "SrO", min: "0", max: "2" },
    // { key: "zno", label: "ZnO", min: "0", max: "2" },
  ]);

  // Coal data
  const [coals, setCoals] = useState([
    { id: "LEER0722A", inventory: "3658.714", date: "", selected: false, min: "0", max: "100" },
    { id: "AUST3H0123", inventory: "8025.582", date: "", selected: false, min: "0", max: "100" },
    { id: "STANM0323A", inventory: "13475.839", date: "", selected: false, min: "0", max: "100" },
    { id: "CAVAL1230", inventory: "4823.389", date: "", selected: false, min: "0", max: "100" },
    { id: "CROWN0123A", inventory: "5.861", date: "", selected: false, min: "0", max: "100" },
    { id: "PULCL1122F", inventory: "1764.974", date: "", selected: false, min: "0", max: "100" },
    { id: "REDFORS323", inventory: "37552.738", date: "", selected: false, min: "0", max: "100" },
    { id: "CROWN0123B", inventory: "5.839", date: "", selected: false, min: "0", max: "100" },
    { id: "AUST0223A", inventory: "4019.557", date: "", selected: false, min: "0", max: "100" },
  ]);

  // Model status
  const [modelStatus, setModelStatus] = useState("notStarted"); // notStarted, initiated, running, completed

  const handlePropertyChange = (index, field, value) => {
    const updatedProperties = [...desiredProperties];
    updatedProperties[index] = { ...updatedProperties[index], [field]: value };
    setDesiredProperties(updatedProperties);
  };

  const handleCoalChange = (index, field, value) => {
    const updatedCoals = [...coals];
    updatedCoals[index] = { ...updatedCoals[index], [field]: value };
    setCoals(updatedCoals);
  };

  const toggleCoalSelection = (index) => {
    const updatedCoals = [...coals];
    updatedCoals[index] = { ...updatedCoals[index], selected: !updatedCoals[index].selected };
    setCoals(updatedCoals);
  };

  const clearAllFields = () => {
    setCoals(coals.map((coal) => ({ ...coal, selected: false, min: "0", max: "100", date: "" })));
  };

  const runConfiguration = () => {
    setModelStatus("initiated");
    setTimeout(() => {
      setModelStatus("running");
      setTimeout(() => {
        setModelStatus("completed");
      }, 3000);
    }, 1500);
  };

  const viewResult = () => {
    // console.log("View result clicked")
    setViewMode("runOutput");
  };

  const handleBackToRecommendation = () => {
    setViewMode("recommendation");
  };

  // Show Model Configuration page
  if (viewMode === "modelConfig") {
    return <ModelConfiguration onBack={handleBackToRecommendation} />;
  }
  if (viewMode == "runOutput") {
    return <RunOutput onBack={handleBackToRecommendation} />;
  }

  // Show Recommendation Run page
  return (
    <PageLayout title="Blend Recommendation">
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gray-200 p-2 mb-3 flex items-center">
            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white px-3 py-1 text-xs font-medium rounded">
                Recommendation Run
              </button>
              <button
                onClick={() => setViewMode("modelConfig")}
                className="bg-gray-300 text-gray-700 px-3 py-1 text-xs font-medium rounded hover:bg-gray-400 transition-colors"
              >
                Model Configuration
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Left Column - Desired Properties */}
            <div className="bg-gray-100 rounded p-3">
              <h2 className="text-sm font-bold text-gray-700 mb-2">Desired Coke Properties</h2>

              <div className="space-y-1">
                {desiredProperties.map((property, index) => (
                  <div key={property.key} className="grid grid-cols-5 gap-1 items-center text-xs">
                    <div className="col-span-2 font-medium text-gray-700">{property.label}</div>
                    <div className="col-span-1">
                      <input
                        type="text"
                        value={property.min}
                        onChange={(e) => handlePropertyChange(index, "min", e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-center"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="text"
                        value={property.max}
                        onChange={(e) => handlePropertyChange(index, "max", e.target.value)}
                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Columns - Run Constraints */}
            <div className="md:col-span-2 bg-white rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-bold text-gray-700">Run Constraints</h2>
                <button
                  onClick={clearAllFields}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-300"
                >
                  Clear All Fields
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-500">
                      <th className="w-6 px-1 py-1"></th>
                      <th className="text-left px-1 py-1">Coal ID</th>
                      <th className="text-right px-1 py-1">Inventory/MT</th>
                      <th className="text-center px-1 py-1">Stock Out Date</th>
                      <th className="text-center px-1 py-1">Min</th>
                      <th className="text-center px-1 py-1">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coals.map((coal, index) => (
                      <tr key={coal.id} className={coal.selected ? "bg-blue-500" : "bg-gray-500"}>
                        <td className="px-1 py-1">
                          <input
                            type="checkbox"
                            checked={coal.selected}
                            onChange={() => toggleCoalSelection(index)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-1 py-1">{coal.id}</td>
                        <td className="text-right px-1 py-1">{coal.inventory}</td>
                        <td className="px-1 py-1">
                          <input
                            type="text"
                            value={coal.date}
                            onChange={(e) => handleCoalChange(index, "date", e.target.value)}
                            placeholder="mm/dd/yy"
                            className="w-full px-1 py-0.5 border border-gray-300 rounded text-center"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="text"
                            value={coal.min}
                            onChange={(e) => handleCoalChange(index, "min", e.target.value)}
                            className="w-full px-1 py-0.5 border border-gray-300 rounded text-center"
                            disabled={!coal.selected}
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="text"
                            value={coal.max}
                            onChange={(e) => handleCoalChange(index, "max", e.target.value)}
                            className="w-full px-1 py-0.5 border border-gray-300 rounded text-center"
                            disabled={!coal.selected}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Progress Indicator */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <button
                    onClick={runConfiguration}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 text-xs font-medium rounded"
                    disabled={modelStatus === "running"}
                  >
                    Run Configuration
                  </button>

                  <div className="flex-1 mx-4">
                    <div className="relative pt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <div
                            className={`w-4 h-4 rounded-full ${
                              modelStatus !== "notStarted" ? "bg-green-500" : "bg-gray-300"
                            } mx-auto`}
                          ></div>
                          <span className="text-xs block mt-1 text-black">Initiated</span>
                        </div>
                        <div className="flex-1 h-0.5 mx-2 bg-gray-200">
                          <div
                            className={`h-0.5 bg-green-500 transition-all duration-500 ${
                              modelStatus === "running" || modelStatus === "completed"
                                ? "w-full"
                                : "w-0"
                            }`}
                          ></div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`w-4 h-4 rounded-full ${
                              modelStatus === "running" || modelStatus === "completed"
                                ? "bg-green-500"
                                : "bg-gray-300"
                            } mx-auto`}
                          ></div>
                          <span className="text-xs block mt-1 text-black">Model Running</span>
                        </div>
                        <div className="flex-1 h-0.5 mx-2 bg-gray-200">
                          <div
                            className={`h-0.5 bg-green-500 transition-all duration-500 ${
                              modelStatus === "completed" ? "w-full" : "w-0"
                            }`}
                          ></div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`w-4 h-4 rounded-full ${
                              modelStatus === "completed" ? "bg-green-500" : "bg-gray-300"
                            } mx-auto`}
                          ></div>
                          <span className="text-xs block mt-1 text-black">Result Available</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={viewResult}
                    className={`bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 text-xs font-medium rounded ${
                      modelStatus !== "completed" ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={modelStatus !== "completed"}
                  >
                    View Result
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default BlendRecommendation;

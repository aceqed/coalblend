"use client";

import { ArrowLeft, Download, Filter, BarChart3 } from "lucide-react";
import PageLayout from "../Layout/pageLayout";
import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const RecommendationsView = ({ simulation, onBack }) => {
  const pdfRef = useRef(null);

  const handleSaveReport = async () => {
    if (!pdfRef.current) return;

    // Show loading state
    const button = document.querySelector('button:has(svg[data-lucide="download"])');
    const originalText = button?.innerHTML;
    if (button) {
      button.innerHTML = "Exporting...";
      button.disabled = true;
    }

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);

      // Add additional pages if content is too long
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = imgHeight;
      let position = 0;

      while (heightLeft > 0) {
        position = heightLeft - pageHeight;
        if (position < 0) break;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`Coal_Blend_Recommendations_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      // Restore button state
      if (button) {
        button.innerHTML = originalText;
        button.disabled = false;
      }
    }
  };

  console.log("RecommendationsView received simulation:", simulation); // Debug log

  if (!simulation) {
    console.log("No simulation data provided"); // Debug log
    return (
      <PageLayout title="Recommendation">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-600">No simulation data found</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Validate required data
  if (!simulation.recommendations || !Array.isArray(simulation.recommendations)) {
    console.log("Invalid recommendations data:", simulation.recommendations); // Debug log
    return (
      <PageLayout title="Recommendation">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Invalid simulation data: Missing recommendations</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  console.log("Raw recommendations from backend:", simulation.recommendations); // Debug log for raw recommendations

  // Group recommendations by blend combination
  const groupedRecommendations = simulation.recommendations.reduce((acc, rec) => {
    console.log("Processing recommendation:", rec); // Debug log for each recommendation
    console.log("Predicted values:", rec); // Debug log for predicted vole.log("Predicted values:", rec.predicted); // Debug log for predicted values
    console.log("Emission data check:", {
      CO2_Emissions: rec.CO2_Emissions,
      CO_Emissions: rec.CO_Emissions,
      SO2_Emissions: rec.SO2_Emissions,
      NO_Emissions: rec.NO_Emissions,
      NO2_Emissions: rec.NO2_Emissions,
      PM_index: rec.PM_index,
      PM10_Emissions: rec.PM10_Emissions,
      PM25_Emissions: rec.PM25_Emissions,
      VOC_index: rec.VOC_index,
      VOC_Emissions: rec.VOC_Emissions,
      PAH_Emissions: rec.PAH_Emissions,
    }); // Debug log for emission data
    console.log("Full rec object keys:", Object.keys(rec)); // Show all available keys
    // Create a unique key for each blend combination based on predicted values
    const key = `${rec.predicted_ash_final}-${rec.predicted_vm_final}-${rec.predicted_csr}-${rec.predicted_cri}`;
    console.log("Generated key for blend:", key); // Debug log for the generated key

    if (!acc[key]) {
      acc[key] = {
        coals: [],
        predicted: {
          ash_final: rec.predicted_ash_final,
          vm_final: rec.predicted_vm_final,
          // fc: rec.predicted_fc,
          // csn: rec.predicted_csn,
          cri: rec.predicted_cri,
          csr: rec.predicted_csr,
        },
        CO2_Emissions: rec.CO2_Emissions,
        CO_Emissions: rec.CO_Emissions,
        SO2_Emissions: rec.SO2_Emissions,
        NO_Emissions: rec.NO_Emissions,
        NO2_Emissions: rec.NO2_Emissions,
        PM_index: rec.PM_index,
        PM10_Emissions: rec.PM10_Emissions,
        PM25_Emissions: rec.PM25_Emissions,
        VOC_index: rec.VOC_index,
        VOC_Emissions: rec.VOC_Emissions,
        PAH_Emissions: rec.PAH_Emissions,
      };
    }

    // Add coal to the blend combination
    acc[key].coals.push({
      name: rec.coal_name,
      percentage: rec.percentage,
    });

    console.log("Current state of grouped recommendations:", acc); // Debug log for the current state
    return acc;
  }, {});

  console.log("Final grouped recommendations:", groupedRecommendations); // Debug log for final grouped data

  return (
    <PageLayout title="Recommendation">
      <div ref={pdfRef} className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-full mx-auto">
          {/* Compact Header Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-3 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-purple-50 px-3 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onBack}
                    className="p-1.5 hover:bg-white/80 rounded-lg transition-all border border-gray-200 shadow-sm hover:shadow-md"
                  >
                    <ArrowLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-lg shadow-md">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-gray-800">
                        Coal Blend Recommendations
                      </h1>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Scenario:</span>
                          <span className="px-2 py-0.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-200">
                            {simulation.scenario_name}
                          </span>
                        </div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Generated:</span>
                          <span className="text-xs font-medium text-gray-700">
                            {new Date(simulation.generated_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 bg-white/80 text-gray-700 rounded-lg hover:bg-white transition-all text-xs font-medium flex items-center gap-1 border border-gray-300 shadow-sm hover:shadow-md">
                    <Filter className="h-3 w-3" />
                    Filter
                  </button>
                  <button
                    onClick={handleSaveReport}
                    className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all text-xs font-medium flex items-center gap-1 shadow-lg hover:shadow-xl"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Statistics Overview */}
            <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200 shadow-sm">
                  <div className="p-1 bg-blue-100 rounded-md">
                    <svg
                      className="w-3 h-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">
                      {Object.keys(groupedRecommendations).length}
                    </div>
                    <div className="text-xs text-gray-500">Total Blends</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200 shadow-sm">
                  <div className="p-1 bg-green-100 rounded-md">
                    <svg
                      className="w-3 h-3 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">
                      {simulation.coke_properties?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500">Coke Properties</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200 shadow-sm">
                  <div className="p-1 bg-purple-100 rounded-md">
                    <svg
                      className="w-3 h-3 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">
                      {simulation.blend_properties?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500">Blend Properties</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200 shadow-sm">
                  <div className="p-1 bg-orange-100 rounded-md">
                    <svg
                      className="w-3 h-3 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">
                      {simulation.status?.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500">Status</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Properties Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            {/* Coke Properties Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Coke Properties</h3>
                    <p className="text-xs text-gray-600">Target quality parameters</p>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {simulation.coke_properties?.map((prop, index) => (
                    <div
                      key={index}
                      className="group p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                          {prop.property_name}
                        </span>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-gray-600 font-medium">Min:</span>
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-xs">
                            {prop.min_value}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-gray-600 font-medium">Max:</span>
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-xs">
                            {prop.max_value}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Blend Properties Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Blend Properties</h3>
                    <p className="text-xs text-gray-600">Target blend parameters</p>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {simulation.blend_properties?.map((prop, index) => (
                    <div
                      key={index}
                      className="group p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:border-green-200 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-green-800 uppercase tracking-wide">
                          {prop.property_name}
                        </span>
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-gray-600 font-medium">Min:</span>
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded font-bold text-xs">
                            {prop.min_value}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-gray-600 font-medium">Max:</span>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">
                            {prop.max_value}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Grid - Compact Split Layout */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Blend Recommendations</h2>
              <p className="text-xs text-gray-600 mt-1">Coal compositions and emission analysis</p>
            </div> */}

            <div className="p-4">
              <div className="grid gap-4">
                {Object.entries(groupedRecommendations).map(([key, blend], index) => {
                  // Define colors for different coals
                  const coalColors = [
                    "bg-blue-500",
                    "bg-green-500",
                    "bg-purple-500",
                    "bg-orange-500",
                    "bg-red-500",
                    "bg-indigo-500",
                    "bg-pink-500",
                    "bg-teal-500",
                  ];

                  return (
                    <div
                      key={key}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Blend Header */}
                      <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{index + 1}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-800">
                              Blend {index + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Total:</span>
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                              {blend.coals.reduce((sum, coal) => sum + coal.percentage, 0)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Split Layout: Coal Composition (Left) + Emissions (Right) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                        {/* Left Half: Coal Composition with Colors */}
                        <div className="p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-green-400 rounded"></div>
                            Coal Composition
                          </h4>

                          {/* Visual Coal Bar */}
                          <div className="mb-3">
                            <div className="flex h-8 rounded-lg overflow-hidden border border-gray-200">
                              {blend.coals.map((coal, coalIndex) => (
                                <div
                                  key={coalIndex}
                                  className={`${
                                    coalColors[coalIndex % coalColors.length]
                                  } flex items-center justify-center text-white text-xs font-medium transition-all duration-300 hover:opacity-80`}
                                  style={{ width: `${coal.percentage}%` }}
                                  title={`${coal.name}: ${coal.percentage}%`}
                                >
                                  {coal.percentage >= 15 && `${coal.percentage}%`}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Coal Details */}
                          <div className="space-y-2">
                            {blend.coals.map((coal, coalIndex) => (
                              <div
                                key={coalIndex}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-3 h-3 ${
                                      coalColors[coalIndex % coalColors.length]
                                    } rounded-full`}
                                  ></div>
                                  <span className="text-sm font-medium text-gray-800 truncate">
                                    {coal.name}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  {coal.percentage}%
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Predicted Properties (Compact) */}
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <h5 className="text-xs font-medium text-gray-600 mb-2">
                              Predicted Properties
                            </h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                <div className="text-xs text-blue-600">Ash</div>
                                <div className="text-sm font-bold text-blue-800">
                                  {blend.predicted.ash_final}%
                                </div>
                              </div>
                              <div className="bg-green-50 p-2 rounded border border-green-100">
                                <div className="text-xs text-green-600">VM</div>
                                <div className="text-sm font-bold text-green-800">
                                  {blend.predicted.vm_final}%
                                </div>
                              </div>
                              <div className="bg-purple-50 p-2 rounded border border-purple-100">
                                <div className="text-xs text-purple-600">CRI</div>
                                <div className="text-sm font-bold text-purple-800">
                                  {blend.predicted.cri}%
                                </div>
                              </div>
                              <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                <div className="text-xs text-orange-600">CSR</div>
                                <div className="text-sm font-bold text-orange-800">
                                  {blend.predicted.csr}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Half: Emissions */}
                        <div className="p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-orange-400 rounded"></div>
                            Emission Analysis
                          </h4>

                          {/* Primary Emissions */}
                          <div className="mb-4">
                            <h5 className="text-xs font-medium text-gray-600 mb-2">
                              Primary Emissions
                            </h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-red-50 p-2 rounded border border-red-100">
                                <div className="text-xs text-red-600">CO₂</div>
                                <div className="text-sm font-bold text-red-800">
                                  {blend.CO2_Emissions ? blend.CO2_Emissions.toFixed(2) : "N/A"}
                                </div>
                              </div>
                              <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                <div className="text-xs text-orange-600">CO</div>
                                <div className="text-sm font-bold text-orange-800">
                                  {blend.CO_Emissions ? blend.CO_Emissions.toFixed(2) : "N/A"}
                                </div>
                              </div>
                              <div className="bg-yellow-50 p-2 rounded border border-yellow-100">
                                <div className="text-xs text-yellow-600">SO₂</div>
                                <div className="text-sm font-bold text-yellow-800">
                                  {blend.SO2_Emissions ? blend.SO2_Emissions.toFixed(2) : "N/A"}
                                </div>
                              </div>
                              <div className="bg-pink-50 p-2 rounded border border-pink-100">
                                <div className="text-xs text-pink-600">NO₂</div>
                                <div className="text-sm font-bold text-pink-800">
                                  {blend.NO2_Emissions ? blend.NO2_Emissions.toFixed(2) : "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Particulate Matter */}
                          <div className="mb-4">
                            <h5 className="text-xs font-medium text-gray-600 mb-2">
                              Particulate Matter
                            </h5>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-indigo-50 p-2 rounded border border-indigo-100">
                                <div className="text-xs text-indigo-600">PM Index</div>
                                <div className="text-sm font-bold text-indigo-800">
                                  {blend.PM_index ? blend.PM_index.toFixed(2) : "N/A"}
                                </div>
                              </div>
                              <div className="bg-cyan-50 p-2 rounded border border-cyan-100">
                                <div className="text-xs text-cyan-600">PM10</div>
                                <div className="text-sm font-bold text-cyan-800">
                                  {blend.PM10_Emissions ? blend.PM10_Emissions.toFixed(2) : "N/A"}
                                </div>
                              </div>
                              <div className="bg-teal-50 p-2 rounded border border-teal-100">
                                <div className="text-xs text-teal-600">PM2.5</div>
                                <div className="text-sm font-bold text-teal-800">
                                  {blend.PM25_Emissions ? blend.PM25_Emissions.toFixed(2) : "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* VOC & PAH */}
                          <div>
                            <h5 className="text-xs font-medium text-gray-600 mb-2">
                              Organic Compounds
                            </h5>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                                <div className="text-xs text-emerald-600">VOC Index</div>
                                <div className="text-sm font-bold text-emerald-800">
                                  {blend.VOC_index ? blend.VOC_index.toFixed(2) : "N/A"}
                                </div>
                              </div>
                              <div className="bg-lime-50 p-2 rounded border border-lime-100">
                                <div className="text-xs text-lime-600">VOC</div>
                                <div className="text-sm font-bold text-lime-800">
                                  {blend.VOC_Emissions ? blend.VOC_Emissions.toFixed(2) : "N/A"}
                                </div>
                              </div>
                              <div className="bg-violet-50 p-2 rounded border border-violet-100">
                                <div className="text-xs text-violet-600">PAH</div>
                                <div className="text-sm font-bold text-violet-800">
                                  {blend.PAH_Emissions ? blend.PAH_Emissions.toFixed(2) : "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default RecommendationsView;

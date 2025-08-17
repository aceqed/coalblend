import PageLayout from "../Layout/pageLayout.jsx";
import {
  Upload,
  FileText,
  File,
  CheckCircle,
  AlertCircle,
  Save,
  X,
} from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { parseCoalPdf } from "../utils/coalPdfParser";

// Coal property fields based on the CoalProperties model
const COAL_PROPERTIES = [
  { id: "coal_name", label: "Coal Name", type: "text", required: true },
  { id: "IM", label: "IM", type: "number", step: "0.01", required: true },
  { id: "Ash", label: "Ash %", type: "number", step: "0.01", required: true },
  {
    id: "VM",
    label: "Volatile Matter %",
    type: "number",
    step: "0.01",
    required: true,
  },
  {
    id: "FC",
    label: "Fixed Carbon %",
    type: "number",
    step: "0.01",
    required: true,
  },
  { id: "S", label: "Sulfur %", type: "number", step: "0.01", required: true },
  {
    id: "P",
    label: "Phosphorus %",
    type: "number",
    step: "0.01",
    required: true,
  },
  { id: "SiO2", label: "SiO2 %", type: "number", step: "0.01", required: true },
  {
    id: "Al2O3",
    label: "Al2O3 %",
    type: "number",
    step: "0.01",
    required: true,
  },
  {
    id: "Fe2O3",
    label: "Fe2O3 %",
    type: "number",
    step: "0.01",
    required: true,
  },
  { id: "CaO", label: "CaO %", type: "number", step: "0.01", required: true },
  { id: "MgO", label: "MgO %", type: "number", step: "0.01", required: true },
  { id: "Na2O", label: "Na2O %", type: "number", step: "0.01", required: true },
  { id: "K2O", label: "K2O %", type: "number", step: "0.01", required: true },
  { id: "TiO2", label: "TiO2 %", type: "number", step: "0.01", required: true },
  {
    id: "Mn3O4",
    label: "Mn3O4 %",
    type: "number",
    step: "0.01",
    required: true,
  },
  { id: "SO3", label: "SO3 %", type: "number", step: "0.01", required: true },
  { id: "P2O5", label: "P2O5 %", type: "number", step: "0.01", required: true },
  { id: "CRI", label: "CRI", type: "number", step: "0.01", required: true },
  { id: "CSR", label: "CSR", type: "number", step: "0.01", required: true },
  {
    id: "N",
    label: "Nitrogen %",
    type: "number",
    step: "0.01",
    required: true,
  },
  { id: "vendor_name", label: "Vendor Name", type: "text" },
  { id: "vendor_email", label: "Vendor Email", type: "email" },
];

function VendorDataUpload() {
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isManualEntry, setIsManualEntry] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || "" : value,
    }));
  };
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setIsLoading(true);
      setMessage({ type: "info", text: "Parsing PDF..." });

      try {
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    } else {
      setMessage({
        type: "error",
        text: "Please upload a valid PDF file",
      });
      setFile(null);
    }
  };

  // Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const formDataToSend = new FormData();

      // Add all form data (only non-null/undefined values)
      Object.entries(formData).forEach(([key, value]) => {
        if (value != null) {
          formDataToSend.append(key, value);
        }
      });

      // Add the file if it exists
      if (file) {
        formDataToSend.append("file", file);
      }

      console.log("Sending form data:", Object.fromEntries(formDataToSend));

      const response = await axios.post(
        "http://localhost:8000/api/vendor/coal/upload",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setMessage({
          type: "success",
          text:
            response.data.message ||
            "Vendor data uploaded successfully and is pending approval",
        });
        setFormData({});
        setFile(null);
      } else {
        throw new Error(response.data.error || "Failed to process data");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        "Failed to save data";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleManualEntry = () => {
    setIsManualEntry(!isManualEntry);
    setMessage({ type: "", text: "" });
    setFile(null);
    setFormData({});
  };

  return (
    <PageLayout title="Vendor Data Upload">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold mb-6">Add New Coal Data</h2>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => toggleManualEntry()}
              className={`px-4 py-2 rounded-md ${
                !isManualEntry ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
            >
              Upload PDF
            </button>
            <button
              onClick={() => toggleManualEntry()}
              className={`px-4 py-2 rounded-md ${
                isManualEntry ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
            >
              Manual Entry
            </button>
          </div>

          {message.text && (
            <div
              className={`p-3 mb-6 rounded-md ${
                message.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {isManualEntry ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COAL_PROPERTIES.map((prop) => (
                  <div key={prop.id} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {prop.label}{" "}
                      {prop.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={prop.type}
                      name={prop.id}
                      value={formData[prop.id] || ""}
                      onChange={handleInputChange}
                      step={prop.step}
                      required={prop.required}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setFormData({})}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <X className="inline mr-1 h-4 w-4" /> Clear
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="inline mr-1 h-4 w-4" /> Save Coal Data
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                Upload a PDF containing coal property data
              </p>
              <p className="text-gray-500 text-sm mb-4">
                The PDF should contain a table with coal properties in a
                standardized format
              </p>

              <div className="flex flex-col items-center">
                <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span>Select PDF File</span>
                </label>

                {file && (
                  <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md inline-flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    {file.name}
                  </div>
                )}

                <button
                  onClick={async () => {
                    if (!file) {
                      setMessage({
                        type: "error",
                        text: "Please select a PDF file to upload",
                      });
                      return;
                    }

                    setIsLoading(true);
                    setMessage({
                      type: "info",
                      text: "Uploading and parsing PDF...",
                    });

                    try {
                      const formData = new FormData();
                      formData.append("file", file);

                      const response = await fetch(
                        "http://localhost:8000/api/coal/upload",
                        {
                          method: "POST",
                          body: formData,
                          credentials: "include",
                        }
                      );

                      if (!response.ok) {
                        throw new Error(`Server error: ${response.status}`);
                      }

                      const result = await response.json();

                      if (!result.success) {
                        throw new Error(
                          result.error || "Failed to process PDF"
                        );
                      }

                      // Clean up null/undefined values
                      const parsedData = result.data || {};
                      const validData = Object.fromEntries(
                        Object.entries(parsedData).filter(([_, v]) => v != null)
                      );

                      setFormData((prev) => ({
                        ...prev,
                        ...validData,
                        coal_name:
                          validData.coal_name ||
                          prev.coal_name ||
                          file.name.replace(/\.pdf$/i, "").trim(),
                      }));

                      setMessage({
                        type: "success",
                        text: "PDF processed successfully",
                      });
                    } catch (error) {
                      console.error("Error uploading PDF:", error);
                      setMessage({
                        type: "error",
                        text:
                          error.message ||
                          "Failed to process PDF. Please try again.",
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={!file || isLoading}
                  className={`mt-6 px-4 py-2 rounded-md flex items-center ${
                    !file || isLoading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" /> Upload and Extract
                      Data
                    </>
                  )}
                </button>
              </div>

              <div className="mt-8 text-left bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">Expected PDF Format:</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>Single page PDF with a clear table of coal properties</li>
                  <li>First column should contain property names</li>
                  <li>Second column should contain corresponding values</li>
                  <li>
                    Include all required properties: Ash, VM, FC, S, P, etc.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default VendorDataUpload;

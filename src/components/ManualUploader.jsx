import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const ManualUploader = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState("idle"); // idle, uploading, success, error
    const [message, setMessage] = useState("");

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus("idle");
            setMessage("");
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus("uploading");
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Endpoint del servidor Node.js
            const response = await fetch("http://localhost:3001/upload-pdf", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                setStatus("success");
                setMessage("¡Éxito! El manual ha sido procesado y guardado en la memoria.");
                setFile(null);
            } else {
                throw new Error("Error en el servidor n8n");
            }
        } catch (error) {
            console.error(error);
            setStatus("error");
            setMessage("Error: Asegúrate de que n8n esté corriendo y el workflow 'Subir PDFs' esté ACTIVO.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
                <div className="bg-blue-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Upload className="text-blue-600 w-10 h-10" />
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">Alimentar Cerebro</h1>
                <p className="text-gray-500 mb-8">
                    Sube el manual de Audaces (PDF) para entrenar a la IA.
                </p>

                <div className="space-y-4">
                    <div className={`border-2 border-dashed rounded-xl p-6 transition-colors ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                        <input
                            type="file"
                            id="pdfFile"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label htmlFor="pdfFile" className="cursor-pointer flex flex-col items-center gap-2">
                            {file ? (
                                <>
                                    <FileText className="text-blue-600 w-8 h-8" />
                                    <span className="text-sm font-medium text-gray-700">{file.name}</span>
                                    <span className="text-xs text-blue-500">Cambiar archivo</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="text-gray-400 w-8 h-8" />
                                    <span className="text-sm font-medium text-gray-600">Haz clic para seleccionar PDF</span>
                                </>
                            )}
                        </label>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || status === "uploading"}
                        className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 ${!file || status === "uploading"
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30"
                            }`}
                    >
                        {status === "uploading" ? (
                            <>
                                <Loader2 className="animate-spin w-5 h-5" />
                                Procesando...
                            </>
                        ) : status === "success" ? (
                            "Subido Correctamente"
                        ) : (
                            "Subir Manual al Cerebro"
                        )}
                    </button>

                    {message && (
                        <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManualUploader;

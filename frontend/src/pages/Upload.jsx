import { useState } from "react";

function Upload() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("Ready to upload");

    const handleUpload = async () => {
        console.log("Upload button clicked");

        if (!file) {
            setMessage("Please select an image first.");
            return;
        }

        setMessage("Uploading...");

        const formData = new FormData();
        formData.append("user_id", "1");
        formData.append("file", file);

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/inspections/upload?user_id=1",
                {
                    method: "POST",
                    body: formData,
                }
            );

            console.log("Response received:", response.status);

            const data = await response.json();

            console.log("Backend response:", data);

            if (!response.ok) {
                console.log("FULL RESPONSE:", data);
                setMessage(
                    "❌ Upload failed: " + JSON.stringify(data)
                );
                return;
            }

            setMessage(
                "✅ Upload successful! Inspection ID: " + data.inspection_id
            );
        } catch (error) {
            console.error("Upload error:", error);
            setMessage("❌ Could not connect to backend.");
        }
    };

    return (
        <div style={{ padding: "40px" }}>
            <h1>Upload Inspection</h1>

            <p>Select a manufacturing image.</p>

            <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(event) => {
                    const selectedFile = event.target.files[0];

                    if (selectedFile) {
                        setFile(selectedFile);
                        setMessage("Image selected: " + selectedFile.name);
                    }
                }}
            />

            <br />
            <br />

            <button onClick={handleUpload}>
                Upload Image
            </button>

            <br />
            <br />

            <p>{message}</p>
        </div>
    );
}

export default Upload;
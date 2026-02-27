import { useRef, useState } from "react";

/**
 * useBase64Image
 *
 * Handles image file selection and converts it to a base64 data-URI string
 * so it can be sent as plain JSON (no FormData / multipart needed).
 *
 * Returned object shape (matches DoctorProfileSetup usage):
 *   - base64      {string|null}  Full data-URI ready to POST
 *   - preview     {string|null}  Same value — used as <img src>
 *   - inputRef    {React.Ref}    Attach to <input type="file" ref={...} />
 *   - handleFileChange  {fn}    Attach to <input onChange={...} />
 *   - triggerPicker     {fn}    Call on button click to open file dialog
 *   - loading     {boolean}     True while FileReader is processing
 *   - error       {string}      Validation / read error message
 *   - reset       {fn}          Clear state back to null
 *
 * @param {object} options
 * @param {number} [options.maxSizeMB=2]  Maximum file size in MB
 */
export function useBase64Image({ maxSizeMB = 2 } = {}) {
  const inputRef = useRef(null);
  const [base64, setBase64] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, or WebP images are allowed.");
      return;
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`Image is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    setError("");
    setLoading(true);

    const reader = new FileReader();

    reader.onload = () => {
      const dataUri = reader.result;
      setBase64(dataUri);
      setPreview(dataUri);
      setLoading(false);
    };

    reader.onerror = () => {
      setError("Failed to read the image file. Please try again.");
      setLoading(false);
    };

    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected if needed
    e.target.value = "";
  };

  const triggerPicker = () => {
    inputRef.current?.click();
  };

  const reset = () => {
    setBase64(null);
    setPreview(null);
    setError("");
    setLoading(false);
  };

  return { base64, preview, inputRef, handleFileChange, triggerPicker, loading, error, reset };
}

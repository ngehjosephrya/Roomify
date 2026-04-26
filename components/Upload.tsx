import { CheckCircle2, ImageIcon, UploadIcon } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import {
  PROGRESS_INCREMENT,
  PROGRESS_INTERVAL_MS,
  REDIRECT_DELAY_MS,
} from "../lib/constants";

interface UploadProps {
  onComplete: (base64: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<number | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  const { isSignedIn } = useOutletContext<AuthContext>();

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
      }
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);
  const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
  const ALLOWED_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/jpg"]);

  const processFile = useCallback(
    (selectedFile: File) => {
      if (!isSignedIn) return;

      if (!ALLOWED_UPLOAD_TYPES.has(selectedFile.type)) {
        console.error("Only JPG, PNG and JPEG files are supported.");
        return;
      }

      if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
        console.error("File exceeds 50MB limit.");
        return;
      }

      setFile(selectedFile);
      setProgress(0);
      setFile(selectedFile);
      setProgress(0);

      const reader = new FileReader();

      reader.onload = (event) => {
        const base64 = event.target?.result;
        if (typeof base64 !== "string") {
          console.error("Unable to read file as Base64.");
          return;
          setFile(null);
          setProgress(0);
        }

        if (progressIntervalRef.current !== null) {
          window.clearInterval(progressIntervalRef.current);
        }

        progressIntervalRef.current = window.setInterval(() => {
          setProgress((current) => {
            const nextProgress = Math.min(current + PROGRESS_INCREMENT, 100);

            if (nextProgress === 100 && progressIntervalRef.current !== null) {
              window.clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
              if(redirectTimeoutRef.current !== null){
                window.clearTimeout(redirectTimeoutRef.current);
              }
              redirectTimeoutRef.current = window.setTimeout(() => {
                onComplete(base64);
              }, REDIRECT_DELAY_MS);
            }

            return nextProgress;
          });
        }, PROGRESS_INTERVAL_MS);
      };

      reader.onerror = () => {
        console.error("FileReader failed to read the file.");
        setFile(null);
        setProgress(0);
      };

      reader.readAsDataURL(selectedFile);
    },
    [isSignedIn, onComplete],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSignedIn) {
      return;
    }

    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }

    event.target.value = "";
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isSignedIn) {
      return;
    }
    setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isSignedIn) {
      return;
    }
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (!isSignedIn) {
      return;
    }

    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  return (
    <div className="upload">
      {!file ? (
        <div
          className={`dropzone ${isDragging ? "is-dragging" : ""}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="drop-input"
            accept=".jpg, .jpeg, .png"
            disabled={!isSignedIn}
            onChange={handleFileChange}
          />

          <div className="drop-content">
            <div className="drop-icon">
              <UploadIcon size={20} />
            </div>

            <p>
              {isSignedIn
                ? "Click to upload or just drag and drop"
                : "Sign in or Sign up with Puter to upload"}
            </p>

            <p className="help">Maximum file size 50MB.</p>
          </div>
        </div>
      ) : (
        <div className="upload-status">
          <div className="status-content">
            <div className="status-icon">
              {progress === 100 ? (
                <CheckCircle2 className="check" />
              ) : (
                <ImageIcon className="image" />
              )}
            </div>

            <h3>{file.name}</h3>

            <div className="progress">
              <div className="bar" style={{ width: `${progress}%` }} />
              <p className="status-text">
                {progress < 100 ? "Analyzing Floor Plan..." : "Redirecting..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;

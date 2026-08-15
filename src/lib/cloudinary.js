/**
 * Cloudinary Secure Upload Helper (Signed Uploads via Server API)
 */
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Cloudinary upload failed");
  }

  return data.url;
};

export const isCloudinaryConfigured = () => {
  return !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
};

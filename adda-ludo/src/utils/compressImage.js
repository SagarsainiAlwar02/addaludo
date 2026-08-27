/**
 * Compress an image File on the client-side using the Canvas API.
 *
 * @param {File} file          – the original image File
 * @param {Object} opts
 * @param {number} opts.maxWidth   – max pixel width (default 1200)
 * @param {number} opts.maxHeight  – max pixel height (default 1200)
 * @param {number} opts.quality    – JPEG quality 0-1 (default 0.7)
 * @param {number} opts.maxSizeKB  – target max size in KB (default 800). If
 *                                   the compressed blob is still larger we
 *                                   re-encode at a lower quality iteratively.
 * @returns {Promise<File>}        – the (possibly compressed) File
 */
export default function compressImage(
  file,
  { maxWidth = 1200, maxHeight = 1200, quality = 0.7, maxSizeKB = 800 } = {}
) {
  return new Promise((resolve, reject) => {
    // If the file is already small enough, skip compression
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.onload = () => {
        try {
          // Calculate scaled dimensions
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Iterative quality reduction to meet target size
          let currentQuality = quality;
          const minQuality = 0.3;
          const step = 0.1;

          const tryCompress = (q) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(file); // fallback to original
                  return;
                }
                if (blob.size > maxSizeKB * 1024 && q > minQuality) {
                  tryCompress(q - step);
                } else {
                  // Create a new File from the compressed blob
                  const ext = file.name.split(".").pop() || "jpg";
                  const compressedFile = new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                }
              },
              "image/jpeg",
              q
            );
          };

          tryCompress(currentQuality);
        } catch (e) {
          resolve(file); // fallback to original on any error
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

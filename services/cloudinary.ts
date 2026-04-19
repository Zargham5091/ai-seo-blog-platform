import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(
  dataUri: string,
  folder = "seo-platform",
  publicId?: string
): Promise<{ url: string; publicId: string; width: number; height: number }> {
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    public_id: publicId,
    overwrite: !!publicId,
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export async function generateSignedUrl(publicId: string): Promise<string> {
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    transformation: [{ quality: "auto" }],
  });
}

export { cloudinary };

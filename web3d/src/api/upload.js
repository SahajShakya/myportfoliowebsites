import { privateAgent } from "./authRequest";
import { routesName } from "../constants/routesName";

export const uploadFiles = async (files, basePath = "") => {
  const formData = new FormData();
  formData.append("basePath", basePath);

  let hasFiles = false;
  for (const fileObj of files) {
    const file = fileObj.file;
    if (!file || !file.name) {
      console.error("Invalid file detected. Skipping.", fileObj);
      continue;
    }
    formData.append("files[]", file);
    hasFiles = true;
  }

  if (!hasFiles) {
    throw new Error("No valid files to upload");
  }

  const response = await privateAgent.post(routesName.UploadRoute().upload, formData);
  const data = response.data;

  if (data.error) {
    throw new Error(data.error);
  }

  const uploaded = (data.files || []).map(f => ({
    url: f.url,
    path: f.path,
    file_name: f.file_name,
    original_name: f.original_name,
    mime_type: f.mime_type,
    file_size: f.file_size,
    absolute_path: f.absolute_path,
    document_id: f.document_id || null,
  }));

  if (uploaded.length === 0) {
    throw new Error("Upload returned no files");
  }

  const missingDocId = uploaded.find(f => !f.document_id);
  if (missingDocId) {
    console.warn("Upload succeeded but document_id is missing for:", missingDocId);
  }

  return uploaded;
};

export const uploadFilesToSupabase = uploadFiles;

export const deleteFile = async (fileUrl) => {
  try {
    const url =
      typeof fileUrl === "string"
        ? fileUrl
        : fileUrl.publicUrl || fileUrl.url || fileUrl;
    await privateAgent.delete(routesName.UploadRoute().upload, { data: { path: url } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error.message);
    return { success: false, message: error.message };
  }
};

export const deleteFilesFromSupabase = async (fileUrls) => {
  try {
    const urls = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
    for (const fileObj of urls) {
      if (typeof fileObj === "object" && fileObj.publicUrl) {
        await deleteFile(fileObj.publicUrl);
      } else if (typeof fileObj === "string") {
        await deleteFile(fileObj);
      }
    }
    return { success: true, message: "Files deleted successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};